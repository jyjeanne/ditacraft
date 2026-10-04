// Renders the user guide's cover image (docs/user-guide/front_page_picture.png) from cover.html:
// 595 × 842 CSS px — A4's proportions, the guide's page size — at 2x, with headless Chrome over CDP.
// The logo is resources/ditacraft-logo.svg (traced from the 256 × 256 PNG by trace-logo.js: crisp
// edges at the cover's size); the page background is the PNG logo's own #070B16.
//
// Usage: node scripts/cover/render.js [out.png] [--logo=<image>]
// Then rebuild the user guide (HTML5 and PDF) so the new image is used.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { Cdp, sleep } = require('../screenshots/lib');

const REPO = path.resolve(__dirname, '..', '..');
const args = process.argv.slice(2);
const logoArg = args.find((a) => a.startsWith('--logo='));
const out = path.resolve(args.find((a) => !a.startsWith('--')) || path.join(REPO, 'docs', 'user-guide', 'front_page_picture.png'));
const logoFile = logoArg ? path.resolve(logoArg.slice('--logo='.length)) : path.join(REPO, 'resources', 'ditacraft-logo.svg');
const PORT = 9447;

function chromePath() {
    const candidates = process.platform === 'win32'
        ? [process.env.ProgramFiles, process.env['ProgramFiles(x86)'], process.env.LOCALAPPDATA]
            .filter(Boolean).map((dir) => path.join(dir, 'Google', 'Chrome', 'Application', 'chrome.exe'))
        : process.platform === 'darwin'
            ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
            : ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
    const found = candidates.find((c) => fs.existsSync(c));
    if (!found) {
        throw new Error(`Chrome not found (looked in: ${candidates.join(', ')})`);
    }
    return found;
}

(async () => {
    const work = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-cover-'));
    const logo = 'file:///' + logoFile.replace(/\\/g, '/').replace(/^\//, '');
    const page = path.join(work, 'cover.html');
    fs.writeFileSync(page, fs.readFileSync(path.join(__dirname, 'cover.html'), 'utf8').replace('LOGO_URL', logo));
    const chrome = spawn(chromePath(), ['--headless=new', '--disable-gpu', '--allow-file-access-from-files',
        `--remote-debugging-port=${PORT}`, `--user-data-dir=${path.join(work, 'profile')}`, 'about:blank'], { stdio: 'ignore' });
    try {
        let target;
        for (let i = 0; i < 80 && !target; i++) {
            await sleep(250);
            try { target = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find((t) => t.type === 'page'); } catch { /* starting */ }
        }
        if (!target) {
            throw new Error('headless Chrome did not start');
        }
        const cdp = new Cdp(target.webSocketDebuggerUrl);
        await cdp.open;
        await cdp.send('Page.enable');
        await cdp.send('Emulation.setDeviceMetricsOverride', { width: 595, height: 842, deviceScaleFactor: 2, mobile: false });
        await cdp.send('Page.navigate', { url: 'file:///' + page.replace(/\\/g, '/').replace(/^\//, '') });
        await sleep(1000);
        const logoWidth = (await cdp.send('Runtime.evaluate', {
            expression: `(async () => { await document.fonts.ready; const i = document.querySelector('.logo'); if (!i.complete) { await new Promise((r) => i.onload = r); } return i.naturalWidth; })()`,
            awaitPromise: true, returnByValue: true,
        })).result.value;
        if (!logoWidth) {
            throw new Error('the logo did not load');
        }
        const shot = await cdp.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 595, height: 842, scale: 1 } });
        fs.writeFileSync(out, Buffer.from(shot.data, 'base64'));
        cdp.close();
        console.log(`Cover written: ${out} (1190 × 1684)`);
    } finally {
        chrome.kill();
        await sleep(500);
        fs.rmSync(work, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    }
})().catch((e) => { console.error(e.message || e); process.exit(1); });
