/**
 * Screenshot driver: runs JavaScript sent by scripts/screenshots/shoot.js in the extension host
 * (with `vscode` and `require` in scope), through files in the folder DITACRAFT_SHOT_CTL:
 * cmd-<n>.js in, res-<n>.json out ({ ok, value } or { ok: false, error }).
 *
 * Does nothing unless DITACRAFT_SHOT_CTL is set (shoot.js sets it for the VS Code it starts).
 */

const fs = require('fs');
const path = require('path');
const vscode = require('vscode');

let timer;

exports.activate = function activate() {
    const dir = process.env.DITACRAFT_SHOT_CTL;
    if (!dir) {
        return;
    }
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'ready'), 'ready');
    const done = new Set();
    timer = setInterval(async () => {
        for (const name of fs.readdirSync(dir)) {
            const m = /^cmd-(\d+)\.js$/.exec(name);
            if (!m || done.has(name)) {
                continue;
            }
            done.add(name);
            const code = fs.readFileSync(path.join(dir, name), 'utf8');
            let out;
            try {
                const step = new Function('vscode', 'require', `return (async () => { ${code} })();`);
                out = { ok: true, value: await step(vscode, require) };
            } catch (error) {
                out = { ok: false, error: String((error && error.stack) || error) };
            }
            fs.writeFileSync(path.join(dir, `res-${m[1]}.json`), JSON.stringify(out));
        }
    }, 100);
};

exports.deactivate = function deactivate() {
    clearInterval(timer);
};
