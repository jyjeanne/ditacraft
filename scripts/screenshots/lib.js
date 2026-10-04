/**
 * Screenshot tooling: drive a real VS Code window over the Chrome DevTools Protocol (CDP), and
 * run code in its extension host through the small driver extension in ./driver.
 *
 * Used by ./shoot.js; see ./README.md.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** A CDP connection (Node's global WebSocket, Node 22+). */
class Cdp {
    constructor(url) {
        this.ws = new WebSocket(url);
        this.seq = 0;
        this.pending = new Map();
        this.listeners = [];
        this.ws.addEventListener('message', (e) => {
            const msg = JSON.parse(e.data);
            if (msg.id && this.pending.has(msg.id)) {
                const { resolve, reject } = this.pending.get(msg.id);
                this.pending.delete(msg.id);
                if (msg.error) {
                    reject(new Error(`${msg.error.message} ${msg.error.data ?? ''}`));
                } else {
                    resolve(msg.result);
                }
            } else {
                for (const listener of this.listeners) {
                    listener(msg);
                }
            }
        });
        this.open = new Promise((resolve, reject) => {
            this.ws.addEventListener('open', resolve);
            this.ws.addEventListener('error', reject);
        });
    }

    send(method, params = {}, sessionId) {
        const id = ++this.seq;
        this.ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
        return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
    }

    close() {
        this.ws.close();
    }
}

/**
 * Start VS Code on `folder` with the extension at `extension` and the driver extension, a fresh
 * user data folder with `settings`, and CDP on `port`. Resolves once the driver is ready.
 */
async function launch({ code, extension, folder, work, settings, port }) {
    const userData = path.join(work, 'user-data');
    const extensions = path.join(work, 'extensions');
    const ctl = path.join(work, 'ctl');
    for (const dir of [userData, ctl]) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
    fs.mkdirSync(path.join(userData, 'User'), { recursive: true });
    fs.mkdirSync(extensions, { recursive: true });
    fs.mkdirSync(ctl, { recursive: true });
    fs.writeFileSync(path.join(userData, 'User', 'settings.json'), JSON.stringify(settings, null, 2));
    const args = [
        folder,
        `--extensionDevelopmentPath=${extension}`,
        `--extensionDevelopmentPath=${path.join(__dirname, 'driver')}`,
        `--user-data-dir=${userData}`,
        `--extensions-dir=${extensions}`,
        `--remote-debugging-port=${port}`,
        '--disable-workspace-trust', '--skip-welcome', '--skip-release-notes', '--disable-telemetry', '--new-window',
    ];
    const child = spawn(code, args, { env: { ...process.env, DITACRAFT_SHOT_CTL: ctl }, stdio: 'ignore' });
    let target;
    for (let i = 0; i < 240 && !target; i++) {
        await sleep(500);
        try {
            const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
            target = list.find((t) => t.type === 'page' && /workbench/.test(t.url));
        } catch {
            // VS Code is starting.
        }
    }
    if (!target) {
        child.kill();
        throw new Error('VS Code did not open a workbench window with remote debugging');
    }
    const cdp = new Cdp(target.webSocketDebuggerUrl);
    await cdp.open;
    for (let i = 0; i < 480 && !fs.existsSync(path.join(ctl, 'ready')); i++) {
        await sleep(250);
    }
    if (!fs.existsSync(path.join(ctl, 'ready'))) {
        child.kill();
        throw new Error('the driver extension did not start');
    }
    return { child, cdp, ctl };
}

let hostSeq = 0;

/** Run `code` — an async function body with `vscode` and `require` in scope — in the extension host. */
async function host(ctl, code, timeoutMs = 30000) {
    const n = ++hostSeq;
    fs.writeFileSync(path.join(ctl, `cmd-${n}.js`), code);
    const result = path.join(ctl, `res-${n}.json`);
    const started = Date.now();
    while (!fs.existsSync(result)) {
        if (Date.now() - started > timeoutMs) {
            throw new Error(`extension host step timed out: ${code.trim().split('\n')[0].slice(0, 160)}`);
        }
        await sleep(100);
    }
    await sleep(30);
    const out = JSON.parse(fs.readFileSync(result, 'utf8'));
    if (!out.ok) {
        throw new Error(out.error);
    }
    return out.value;
}

/** Evaluate an expression in the workbench page. */
async function page(cdp, expression) {
    const r = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) {
        throw new Error(JSON.stringify(r.exceptionDetails));
    }
    return r.result.value;
}

/** Sessions of the frames VS Code opens (webviews are out-of-process iframes). */
const sessions = new Map();

async function trackFrames(cdp) {
    cdp.listeners.push((msg) => {
        if (msg.method === 'Target.attachedToTarget') {
            const { sessionId, targetInfo } = msg.params;
            sessions.set(sessionId, targetInfo);
            cdp.send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: false, flatten: true }, sessionId).catch(() => {});
            cdp.send('Runtime.runIfWaitingForDebugger', {}, sessionId).catch(() => {});
        }
        if (msg.method === 'Target.detachedFromTarget') {
            sessions.delete(msg.params.sessionId);
        }
    });
    await cdp.send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: false, flatten: true });
}

/**
 * The visible webview whose content has `marker` (a CSS selector): where its content starts in
 * the workbench (x, y), its frame's box, and `eval(expression)` in its content (`w` the
 * content window, `d` its document).
 */
async function webview(cdp, marker) {
    for (const [sessionId] of sessions) {
        let r;
        try {
            r = await cdp.send('Runtime.evaluate', {
                expression: `(() => { const f = document.getElementById('active-frame'); const d = f && f.contentDocument;
                    if (!d || !d.querySelector(${JSON.stringify(marker)})) return null;
                    const fr = f.getBoundingClientRect(); return { id: new URLSearchParams(location.search).get('id'), fx: fr.left, fy: fr.top }; })()`,
                returnByValue: true,
            }, sessionId);
        } catch {
            continue;
        }
        const v = r.result && r.result.value;
        if (!v) {
            continue;
        }
        const box = await page(cdp, `(() => { const f = [...document.querySelectorAll('iframe')].find((i) => (i.src || '').includes(${JSON.stringify(v.id)}));
            if (!f) return null; const r = f.getBoundingClientRect(); return r.width > 0 ? { x: r.left, y: r.top, w: r.width, h: r.height } : null; })()`);
        if (!box) {
            continue;
        }
        return {
            sessionId,
            x: box.x + v.fx,
            y: box.y + v.fy,
            box,
            eval: async (expression) => {
                const out = await cdp.send('Runtime.evaluate', {
                    expression: `(async () => { const frame = document.getElementById('active-frame'); const w = frame.contentWindow; const d = w.document; return (${expression}); })()`,
                    returnByValue: true,
                    awaitPromise: true,
                }, sessionId);
                if (out.exceptionDetails) {
                    throw new Error(JSON.stringify(out.exceptionDetails).slice(0, 600));
                }
                return out.result.value;
            },
        };
    }
    throw new Error(`no visible webview with ${marker}`);
}

/** A PNG of the window, or of `clip` ({ x, y, width, height } in CSS pixels). */
async function shot(cdp, file, clip) {
    const r = await cdp.send('Page.captureScreenshot', { format: 'png', ...(clip ? { clip: { ...clip, scale: 1 } } : {}) });
    fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
}

async function mouse(cdp, type, x, y, button = 'left', clickCount = 1) {
    await cdp.send('Input.dispatchMouseEvent', { type, x, y, button, clickCount, buttons: type === 'mousePressed' ? (button === 'right' ? 2 : 1) : 0 });
}

async function click(cdp, x, y, button = 'left') {
    await mouse(cdp, 'mouseMoved', x, y, 'none');
    await mouse(cdp, 'mousePressed', x, y, button);
    await mouse(cdp, 'mouseReleased', x, y, button);
}

/** Ctrl, or Cmd on macOS (as ProseMirror's and VS Code's `Mod`). */
const MOD = process.platform === 'darwin' ? 4 : 2;

const KEYS = {
    Enter: { code: 'Enter', keyCode: 13 },
    Escape: { code: 'Escape', keyCode: 27 },
    ArrowRight: { code: 'ArrowRight', keyCode: 39 },
    ArrowDown: { code: 'ArrowDown', keyCode: 40 },
    '.': { code: 'Period', keyCode: 190 },
};

/** A key press sent to the focused frame (`modifiers`: 1 Alt, 2 Ctrl, 4 Meta, 8 Shift). */
async function key(cdp, k, modifiers = 0) {
    const def = KEYS[k] ?? { code: `Key${k.toUpperCase()}`, keyCode: k.toUpperCase().charCodeAt(0) };
    const base = { key: k, code: def.code, windowsVirtualKeyCode: def.keyCode, nativeVirtualKeyCode: def.keyCode, modifiers };
    await cdp.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...base });
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', ...base });
}

module.exports = { Cdp, launch, host, page, trackFrames, webview, shot, mouse, click, key, sleep, MOD };
