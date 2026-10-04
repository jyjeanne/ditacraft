/**
 * Screenshots of the visual editor and the visual preview, taken in a real VS Code window, for
 * the README (docs/images/) and the DITA user guide (docs/user-guide/images/).
 *
 * Usage: node scripts/screenshots/shoot.js [--out=<folder>] [shot…]
 *   shot     one or more of the names below (default: all)
 *   --out    write the PNGs there only (to review them) instead of docs/images and
 *            docs/user-guide/images
 *
 * Needs the extension built (`npm run compile`) and Node 22+. VS Code is the build the
 * integration tests use (@vscode/test-electron, cached in .vscode-test/); set
 * DITACRAFT_SHOTS_CODE to use another executable. See README.md next to this script.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const L = require('./lib');

const REPO = path.resolve(__dirname, '..', '..');
const WIDTH = 1400;
const HEIGHT = 860;
const SCALE = 1.5;
const PORT = Number(process.env.DITACRAFT_SHOTS_PORT) || 9333;

const SETTINGS = {
    'workbench.colorTheme': 'Default Dark Modern',
    'workbench.startupEditor': 'none',
    'workbench.tips.enabled': false,
    'window.titleBarStyle': 'native', // the title bar is not in the page: no "[Extension Development Host]" in the shots
    'window.customTitleBarVisibility': 'never',
    'window.restoreWindows': 'none',
    'window.commandCenter': false,
    'workbench.layoutControl.enabled': false,
    'workbench.secondarySideBar.defaultVisibility': 'hidden',
    'telemetry.telemetryLevel': 'off',
    'update.mode': 'none',
    'extensions.ignoreRecommendations': true,
    'security.workspace.trust.enabled': false,
    'git.enabled': false,
    'chat.commandCenter.enabled': false,
    'chat.disableAIFeatures': true,
    'editor.minimap.enabled': false,
    'editor.fontSize': 13,
    'editor.wordWrap': 'on',
    'breadcrumbs.enabled': false,
    'files.simpleDialog.enable': true, // VS Code's own file dialog, which the script can type in
    'ditacraft.previewTheme': 'light',
    'ditacraft.rootMap': 'sync-client.ditamap',
    'ditacraft.ai.enabled': false,
};

/** The VS Code executable: DITACRAFT_SHOTS_CODE, else the integration tests' build. */
async function codeExecutable() {
    if (process.env.DITACRAFT_SHOTS_CODE) {
        return process.env.DITACRAFT_SHOTS_CODE;
    }
    const { downloadAndUnzipVSCode } = require(path.join(REPO, 'node_modules', '@vscode', 'test-electron'));
    return downloadAndUnzipVSCode({ cachePath: path.join(REPO, '.vscode-test') });
}

async function main() {
    const args = process.argv.slice(2);
    const outArg = args.find((a) => a.startsWith('--out='));
    const wanted = args.filter((a) => !a.startsWith('--'));
    const unknown = wanted.filter((name) => !SHOTS.some((s) => s.name === name));
    if (unknown.length > 0) {
        throw new Error(`unknown shot ${unknown.join(', ')}; shots: ${SHOTS.map((s) => s.name).join(', ')}`);
    }
    for (const built of ['out/extension.js', 'out/webview/editor.js']) {
        if (!fs.existsSync(path.join(REPO, built))) {
            throw new Error(`${built} is missing: run npm run compile first`);
        }
    }
    const outDirs = outArg ? [path.resolve(outArg.slice('--out='.length))] : [path.join(REPO, 'docs', 'images'), path.join(REPO, 'docs', 'user-guide', 'images')];
    for (const dir of outDirs) {
        fs.mkdirSync(dir, { recursive: true });
    }

    // A copy of the demo project: the shots never touch the one in the repository.
    const work = path.join(os.tmpdir(), 'ditacraft-screenshots');
    const demo = path.join(work, 'demo');
    fs.rmSync(demo, { recursive: true, force: true });
    fs.cpSync(path.join(__dirname, 'demo'), demo, { recursive: true });

    const code = await codeExecutable();
    console.log(`VS Code: ${code}`);
    const { child, cdp, ctl } = await L.launch({ code, extension: REPO, folder: demo, work, settings: SETTINGS, port: PORT });
    const s = shotContext(cdp, ctl, demo, outDirs);
    try {
        await L.trackFrames(cdp);
        await cdp.send('Page.enable');
        await cdp.send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: HEIGHT, deviceScaleFactor: SCALE, mobile: false });
        await L.sleep(2500);
        await s.clear();
        for (const shot of SHOTS.filter((x) => wanted.length === 0 || wanted.includes(x.name))) {
            await s.fresh();
            await shot.take(s);
        }
    } finally {
        cdp.close();
        child.kill();
    }
}

/** What the shots use: the extension host, the page, the demo files, saving. */
function shotContext(cdp, ctl, demo, outDirs) {
    const host = (code) => L.host(ctl, code);
    const run = (command, ...args) => host(`return await vscode.commands.executeCommand(${JSON.stringify(command)}, ...${JSON.stringify(args)});`);
    const file = (rel) => path.join(demo, ...rel.split('/'));
    const s = {
        cdp,
        host,
        run,
        file,
        /** No notifications, no panel. */
        clear: async () => {
            await run('notifications.clearAll');
            await run('workbench.action.closePanel');
        },
        /** No editors, no side bar, and the files as written (a shot may have changed one). */
        fresh: async () => {
            await host(`for (const d of vscode.workspace.textDocuments.filter((x) => x.isDirty)) {
                const original = require('fs').readFileSync(d.uri.fsPath, 'utf8');
                const e = new vscode.WorkspaceEdit(); e.replace(d.uri, new vscode.Range(0, 0, d.lineCount, 0), original);
                await vscode.workspace.applyEdit(e); await d.save(); } return 1;`);
            await run('workbench.action.closeAllEditors');
            await run('workbench.action.closeSidebar');
            await L.sleep(500);
        },
        openVisual: async (rel, column = 1) => {
            await host(`await vscode.commands.executeCommand('vscode.openWith', vscode.Uri.file(${JSON.stringify(file(rel))}), 'ditacraft.visualEditor', { viewColumn: ${column} }); return 1;`);
            await L.sleep(4000);
        },
        openText: async (rel, column = 1, preserveFocus = false) => {
            await host(`const doc = await vscode.workspace.openTextDocument(${JSON.stringify(file(rel))});
                await vscode.window.showTextDocument(doc, { viewColumn: ${column}, preserveFocus: ${preserveFocus} }); return 1;`);
        },
        setting: (key, value) => host(`await vscode.workspace.getConfiguration().update(${JSON.stringify(key)}, ${JSON.stringify(value)}, vscode.ConfigurationTarget.Global); return 1;`),
        /** DITA: Set Preview DITAVAL Filter — to the demo file `rel`, or none. */
        previewFilter: async (rel) => {
            await host(`vscode.commands.executeCommand('ditacraft.previewFilter'); return 1;`);
            await L.sleep(1000);
            if (!rel) {
                await L.key(cdp, 'Enter'); // No filter
                await L.sleep(800);
                return;
            }
            await L.key(cdp, 'ArrowDown'); // Browse for .ditaval file...
            await L.key(cdp, 'Enter');
            await L.sleep(1200);
            await L.page(cdp, `(document.querySelector('.quick-input-widget input').select(), true)`);
            await cdp.send('Input.insertText', { text: file(rel) });
            await L.sleep(500);
            await L.key(cdp, 'Enter');
            await L.sleep(1500);
        },
        editor: () => L.webview(cdp, '.ProseMirror'),
        /** Where character `k` of the first text containing `needle` is, in the window. */
        charAt: async (view, needle, k = 0) => {
            const r = await view.eval(`(() => { const root = d.querySelector('.ProseMirror'); const tw = d.createTreeWalker(root, w.NodeFilter.SHOW_TEXT); let n;
                while ((n = tw.nextNode())) { const i = n.data.indexOf(${JSON.stringify(needle)}); if (i >= 0) { const r = d.createRange(); r.setStart(n, i + ${k}); r.setEnd(n, i + ${k} + 1);
                const b = r.getBoundingClientRect(); return { x: b.left, y: b.top + b.height / 2, w: b.width }; } } return null; })()`);
            if (!r) {
                throw new Error(`text "${needle}" not found on the page`);
            }
            return { x: view.x + r.x, y: view.y + r.y, w: r.w };
        },
        /** The box of the first element matching `selector` in the page, in the window. */
        rectOf: async (view, selector) => {
            const r = await view.eval(`(() => { const e = d.querySelector(${JSON.stringify(selector)}); if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; })()`);
            if (!r) {
                throw new Error(`${selector} not found on the page`);
            }
            return { x: view.x + r.x, y: view.y + r.y, w: r.w, h: r.h };
        },
        /** The DitaCraft side bar: the map expanded in DITA Explorer, Properties given most of the height. */
        sidebarLayout: async () => {
            const twistie = await L.page(cdp, `(() => { const row = [...document.querySelectorAll('.monaco-list-row')].find((r) => r.textContent.includes('sync-client.ditamap'));
                if (!row) return null; const t = row.querySelector('.monaco-tl-twistie'); const b = (t || row).getBoundingClientRect();
                return { x: b.left + b.width / 2, y: b.top + b.height / 2, expanded: row.getAttribute('aria-expanded') }; })()`);
            if (twistie && twistie.expanded !== 'true') {
                await L.click(cdp, twistie.x, twistie.y);
                await L.sleep(800);
            }
            const header = await L.page(cdp, `(() => { const h = [...document.querySelectorAll('.pane-header')].find((e) => /Properties/.test(e.textContent));
                if (!h) return null; const b = h.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top }; })()`);
            if (header) {
                // Drag the sash above Properties up, under the expanded map.
                const target = 268;
                await L.mouse(cdp, 'mouseMoved', header.x, header.y - 1, 'none');
                await L.mouse(cdp, 'mousePressed', header.x, header.y - 1);
                for (let k = 1; k <= 10; k++) {
                    await L.mouse(cdp, 'mouseMoved', header.x, header.y - 1 + ((target - header.y) * k) / 10, 'left');
                    await L.sleep(30);
                }
                await L.mouse(cdp, 'mouseReleased', header.x, target);
                await L.mouse(cdp, 'mouseMoved', WIDTH - 40, HEIGHT - 60, 'none'); // off the sash: no hover highlight
                await L.sleep(500);
            }
        },
        /** The editor's webview only (the page and its toolbar). */
        editorClip: (view) => ({ x: view.box.x, y: view.box.y, width: view.box.w, height: view.box.h }),
        save: async (name, clip) => {
            const first = path.join(outDirs[0], `${name}.png`);
            await L.shot(cdp, first, clip);
            for (const dir of outDirs.slice(1)) {
                fs.copyFileSync(first, path.join(dir, `${name}.png`));
            }
            console.log(`saved ${name}.png`);
        },
    };
    return s;
}

/** The shots, in order: a name to pick them by, and how to take one. */
const SHOTS = [
    {
        // The README's first image: the page and its XML side by side, the cursors on the same word.
        name: 'hero',
        take: async (s) => {
            await s.setting('ditacraft.previewPageWidth', 560);
            await s.openVisual('topics/create-profile.dita', 1);
            await s.openText('topics/create-profile.dita', 2, true);
            await L.sleep(2500);
            const view = await s.editor();
            const at = await s.charAt(view, 'short, unique', 9);
            await L.click(s.cdp, at.x, at.y);
            await L.sleep(1500);
            await s.clear();
            await s.save('visual-editor');
            await s.setting('ditacraft.previewPageWidth', 760);
        },
    },
    {
        // The DitaCraft side bar (DITA Explorer, Properties) and an image given by a key, selected:
        // its resize handle on the page, its attributes in Properties.
        name: 'properties',
        take: async (s) => {
            await s.run('workbench.view.extension.ditacraft-explorer');
            await s.openVisual('topics/create-profile.dita');
            await s.sidebarLayout();
            const view = await s.editor();
            await view.eval(`(w.scrollTo(0, d.querySelector('.ProseMirror img').getBoundingClientRect().top + w.scrollY - 260), true)`);
            await L.sleep(500);
            const img = await s.rectOf(view, '.ProseMirror img');
            await L.click(s.cdp, img.x + img.w / 2, img.y + img.h / 2);
            await L.sleep(1500);
            await s.clear();
            await s.save('visual-editor-properties');
        },
    },
    {
        // Right-click on selected words: Wrap in, with the phrase elements the DTD allows.
        name: 'menu',
        take: async (s) => {
            await s.openVisual('topics/create-profile.dita');
            const view = await s.editor();
            const a = await s.charAt(view, 'which folders', 0);
            const b = await s.charAt(view, 'which folders', 12);
            await L.mouse(s.cdp, 'mouseMoved', a.x + 1, a.y, 'none');
            await L.mouse(s.cdp, 'mousePressed', a.x + 1, a.y);
            await L.mouse(s.cdp, 'mouseMoved', b.x + b.w, b.y, 'left');
            await L.mouse(s.cdp, 'mouseReleased', b.x + b.w, b.y);
            await L.sleep(400);
            await L.click(s.cdp, b.x + b.w - 2, b.y, 'right');
            await L.sleep(600);
            const sub = await s.rectOf(view, '.dc-menu [data-id="inline"]');
            await L.mouse(s.cdp, 'mouseMoved', sub.x + sub.w / 2, sub.y + sub.h / 2, 'none');
            await L.sleep(700);
            await s.clear();
            await s.save('visual-editor-context-menu', s.editorClip(view));
            await L.key(s.cdp, 'Escape');
            await L.key(s.cdp, 'Escape');
        },
    },
    {
        // A CALS table, a column border being dragged: the guide shows the new widths.
        name: 'table',
        take: async (s) => {
            await s.openVisual('topics/sync-options.dita');
            const view = await s.editor();
            const cell = await s.rectOf(view, '.ProseMirror table thead tr > *:first-child');
            const x = cell.x + cell.w - 1;
            const y = cell.y + cell.h / 2;
            await L.mouse(s.cdp, 'mouseMoved', x - 3, y, 'none');
            await L.sleep(300);
            await L.mouse(s.cdp, 'mouseMoved', x, y, 'none');
            await L.sleep(300);
            await L.mouse(s.cdp, 'mousePressed', x, y);
            for (let dx = 10; dx <= 70; dx += 10) {
                await L.mouse(s.cdp, 'mouseMoved', x + dx, y, 'left');
                await L.sleep(40);
            }
            await L.sleep(400);
            await s.clear();
            await s.save('visual-editor-table', s.editorClip(view));
            await L.key(s.cdp, 'Escape');
            await L.mouse(s.cdp, 'mouseReleased', x + 70, y);
        },
    },
    {
        // Reused content in its box, selected: Open source, Replace with copy.
        name: 'reuse',
        take: async (s) => {
            await s.openVisual('topics/create-profile.dita');
            const view = await s.editor();
            const box = await s.rectOf(view, '.dc-reuse');
            await L.click(s.cdp, box.x + box.w - 30, box.y + box.h - 12);
            await L.sleep(800);
            await s.clear();
            await s.save('visual-editor-reuse', s.editorClip(view));
        },
    },
    {
        // A problem marked on the page (the status icons image has no alternative text), its quick fixes.
        name: 'fix',
        take: async (s) => {
            await s.openVisual('topics/sync-options.dita');
            const view = await s.editor();
            await L.sleep(3000); // the language server's diagnostics
            const at = await s.charAt(view, 'every profile: ', 14);
            await L.click(s.cdp, at.x + at.w - 1, at.y);
            await L.sleep(600);
            await L.key(s.cdp, '.', L.MOD);
            await L.sleep(1500);
            await s.clear();
            await s.save('visual-editor-quick-fix', s.editorClip(view));
            await L.key(s.cdp, 'Escape');
        },
    },
    {
        // Ctrl+K: the link target picker.
        name: 'link',
        take: async (s) => {
            await s.openVisual('topics/create-profile.dita');
            const view = await s.editor();
            const at = await s.charAt(view, 'A profile pairs', 0);
            await L.click(s.cdp, at.x, at.y);
            await L.sleep(400);
            await L.key(s.cdp, 'k', L.MOD);
            await L.sleep(2000);
            await s.clear();
            await s.save('visual-editor-link-picker');
            await L.key(s.cdp, 'Escape');
        },
    },
    {
        // The text editor and the visual preview beside it.
        name: 'preview',
        take: async (s) => {
            await s.openText('topics/create-profile.dita', 1);
            await L.sleep(1000);
            await s.setting('ditacraft.previewPageWidth', 560);
            await s.run('ditacraft.previewHTML5');
            await L.sleep(5000);
            await s.clear();
            await s.save('visual-preview');
            await s.setting('ditacraft.previewPageWidth', 760);
        },
    },
    {
        // A map in the visual editor, its XML beside: rows with their targets' titles, keys and
        // kinds; a row selected (the XML follows).
        name: 'map',
        take: async (s) => {
            await s.setting('ditacraft.previewPageWidth', 560);
            await s.openVisual('sync-client.ditamap', 1);
            await s.openText('sync-client.ditamap', 2, true);
            await L.sleep(2500);
            const view = await s.editor();
            const row = await view.eval(`(() => { const h = [...d.querySelectorAll('.dc-maprow-head')].find((e) => e.textContent.includes('Creating a sync profile'));
                if (!h) return null; const b = h.querySelector('.dc-maprow-label').getBoundingClientRect(); return { x: b.left + 20, y: b.top + b.height / 2 }; })()`);
            if (!row) {
                throw new Error('the row "Creating a sync profile" is not on the page');
            }
            await L.click(s.cdp, view.x + row.x, view.y + row.y);
            await L.sleep(1500);
            await s.clear();
            await s.save('visual-editor-map');
            await s.setting('ditacraft.previewPageWidth', 760);
        },
    },
    {
        // The demo map's relationship table: a cell right-clicked, the table's commands open.
        name: 'reltable',
        take: async (s) => {
            await s.openVisual('sync-client.ditamap');
            const view = await s.editor();
            await view.eval(`(d.querySelector('table.reltable').scrollIntoView({ block: 'center' }), true)`);
            await L.sleep(600);
            const cell = await s.rectOf(view, 'table.reltable td.relcell:nth-child(2)');
            await L.click(s.cdp, cell.x + cell.w - 20, cell.y + cell.h - 8, 'right');
            await L.sleep(700);
            const sub = await s.rectOf(view, '.dc-menu [data-id="reltable"]');
            await L.mouse(s.cdp, 'mouseMoved', sub.x + sub.w / 2, sub.y + sub.h / 2, 'none');
            await L.sleep(700);
            await s.clear();
            await s.save('visual-editor-reltable', s.editorClip(view));
            await L.key(s.cdp, 'Escape');
            await L.key(s.cdp, 'Escape');
        },
    },
    {
        // Condition highlighting: a task in the text editor with a DITAVAL filter (other platforms
        // excluded, an audience and a revision flagged, conditions the filter does not name flagged
        // by its filter-wide rule), the visual preview of the same task beside it.
        name: 'flags',
        take: async (s) => {
            await s.openText('topics/install-client.dita', 1);
            await s.previewFilter('filters/windows.ditaval');
            await s.setting('ditacraft.previewPageWidth', 560);
            await s.openText('topics/install-client.dita', 1);
            await s.run('ditacraft.previewHTML5');
            await L.sleep(5000);
            await s.clear();
            await s.save('condition-highlighting');
            await s.setting('ditacraft.previewPageWidth', 760);
            await s.previewFilter('');
        },
    },
    {
        // The page following a dark VS Code theme.
        name: 'dark',
        take: async (s) => {
            await s.setting('ditacraft.previewTheme', 'auto');
            await s.openVisual('topics/create-profile.dita');
            await s.clear();
            await s.save('visual-editor-dark');
            await s.setting('ditacraft.previewTheme', 'light');
        },
    },
];

main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
