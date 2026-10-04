/**
 * Visual Editor Integration Test Suite (spec §14 Phase 2).
 *
 * Runs inside VS Code: opens a topic in the visual editor, waits for its page to start,
 * then edits through real editor transactions on the page (an internal `debug` message)
 * and checks the VS Code document: the edit arrives as a minimal text change, a change
 * made in the text reaches the page, and undo on the page undoes in the document.
 *
 * The editor is observed through internal commands (`ditacraft.visualEditor.debugState`,
 * `…debugPost`), as the extension runs from its bundle.
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';

interface EditorState {
    uri: string;
    ready: boolean;
    version: number;
    grammarId?: string;
    sent: Record<string, number>;
    applied: number;
    refused: number;
    problemMarks: number;
    selectionPath: string[];
    resolvedShown: string[];
    quickFixes: string[];
    mapContext?: string;
}

async function editorState(uri: vscode.Uri): Promise<EditorState | undefined> {
    const all = await vscode.commands.executeCommand<EditorState[]>('ditacraft.visualEditor.debugState');
    return all?.find((s) => s.uri === uri.toString());
}

async function waitFor<T>(probe: () => Promise<T | undefined> | T | undefined, what: string, timeoutMs = 20000): Promise<T> {
    const started = Date.now();
    for (;;) {
        const value = await probe();
        if (value !== undefined && value !== false) {
            return value;
        }
        if (Date.now() - started > timeoutMs) {
            throw new Error(`Timed out waiting for ${what}`);
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
    }
}

const SOURCE = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">',
    '<topic id="edit_me">',
    '  <title>Editing test</title>',
    '  <body>',
    '    <p>Hello world, this paragraph',
    '       wraps &amp; has an entity.</p>',
    '    <!-- keep me -->',
    '    <p>Second paragraph.</p>',
    '  </body>',
    '</topic>',
    '',
].join('\n');

suite('Visual Editor Integration Test Suite', function () {
    this.timeout(60000);

    let tmp: string;
    let uri: vscode.Uri;

    const text = () => vscode.workspace.textDocuments.find((d) => d.uri.toString() === uri.toString())?.getText();

    suiteSetup(async () => {
        const extension = vscode.extensions.getExtension('JeremyJeanne.ditacraft');
        if (!extension) {
            throw new Error('Extension not found');
        }
        if (!extension.isActive) {
            await extension.activate();
        }
        tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-visual-editor-'));
        fs.writeFileSync(path.join(tmp, 'edit.dita'), SOURCE);
        uri = vscode.Uri.file(path.join(tmp, 'edit.dita'));
    });

    suiteTeardown(async () => {
        await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor');
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        try {
            fs.rmSync(tmp, { recursive: true, force: true });
        } catch {
            // Windows may still hold the folder; the OS temp dir is cleaned later.
        }
    });

    test('registers the visual editor commands', async () => {
        const commands = await vscode.commands.getCommands(true);
        for (const id of ['ditacraft.openVisualEditor', 'ditacraft.openSourceEditor']) {
            assert.ok(commands.includes(id), `${id} should be registered`);
        }
    });

    test('opens a topic: the page starts with the topic\'s grammar', async () => {
        await vscode.commands.executeCommand('ditacraft.openVisualEditor', uri);
        const state = await waitFor(async () => {
            const s = await editorState(uri);
            return s?.ready && (s.sent.init ?? 0) >= 1 ? s : undefined;
        }, 'the editor page to start');
        assert.strictEqual(state.grammarId, 'dita-1.3/topic');
    });

    test('typing on the page writes exactly the typed characters into the document', async () => {
        await vscode.commands.executeCommand('ditacraft.visualEditor.debugPost', uri.toString(), { type: 'debug', action: 'insertAfter', search: 'Hello', text: ' brave' });
        const after = await waitFor(() => (text()?.includes('Hello brave world') ? text() : undefined), 'the edit to reach the document');
        assert.strictEqual(after, SOURCE.replace('Hello world', 'Hello brave world'));
        // The document changes while applyEdit is still resolving: the ack follows.
        await waitFor(async () => {
            const s = await editorState(uri);
            return s && s.applied >= 1 && (s.sent.ack ?? 0) >= 1 ? s : undefined;
        }, 'the edit to be acknowledged');
    });

    test('a change made in the text reaches the page, which keeps editing from it', async () => {
        const doc = vscode.workspace.textDocuments.find((d) => d.uri.toString() === uri.toString())!;
        const before = (await editorState(uri))?.sent.update ?? 0;
        const edit = new vscode.WorkspaceEdit();
        const at = doc.getText().indexOf('Second');
        edit.replace(uri, new vscode.Range(doc.positionAt(at), doc.positionAt(at + 'Second'.length)), 'Other');
        assert.ok(await vscode.workspace.applyEdit(edit));
        await waitFor(async () => ((await editorState(uri))?.sent.update ?? 0) > before || undefined, 'the update to reach the page');
        await vscode.commands.executeCommand('ditacraft.visualEditor.debugPost', uri.toString(), { type: 'debug', action: 'insertAfter', search: 'Other', text: ' fine' });
        const after = await waitFor(() => (text()?.includes('Other fine paragraph') ? text() : undefined), 'the second edit');
        assert.ok(after.includes('<!-- keep me -->') && after.includes('wraps &amp; has'), after);
    });

    test('undo on the page undoes in the document', async () => {
        await vscode.commands.executeCommand('ditacraft.visualEditor.debugPost', uri.toString(), { type: 'debug', action: 'undo' });
        const after = await waitFor(() => (text()?.includes('Other paragraph') ? text() : undefined), 'the undo to reach the document');
        assert.ok(!after.includes('fine'), after);
    });

    test('an edit computed against an old version is refused and the page resynced', async () => {
        const before = await editorState(uri);
        await vscode.commands.executeCommand('ditacraft.visualEditor.debugMessage', uri.toString(), { type: 'edit', baseVersion: -1, start: 0, end: 0, text: 'x' });
        const after = await editorState(uri);
        assert.strictEqual(after?.refused, (before?.refused ?? 0) + 1);
        assert.ok(!text()?.startsWith('x'));
    });

    test('right-click menu: wrap a word in a phrase element, move a paragraph down', async () => {
        const post = (message: unknown) => vscode.commands.executeCommand('ditacraft.visualEditor.debugPost', uri.toString(), message);
        await post({ type: 'debug', action: 'menu', search: 'world', select: true, id: 'inline/uicontrol' });
        await waitFor(() => (text()?.includes('<uicontrol>world</uicontrol>') ? true : undefined), 'the word wrapped');
        await waitFor(async () => ((await editorState(uri))?.sent.ack ?? 0) >= 4 || undefined, 'the edit acknowledged');
        await post({ type: 'debug', action: 'menu', search: 'brave', id: 'element/down' });
        const moved = await waitFor(() => {
            const t = text();
            return t && t.indexOf('Other paragraph') < t.indexOf('Hello brave') ? t : undefined;
        }, 'the paragraph moved down');
        assert.ok(moved.includes('<p>Hello brave <uicontrol>world</uicontrol>, this paragraph\n       wraps &amp; has an entity.</p>'), moved);
        assert.ok(moved.includes('<!-- keep me -->'), moved);
    });
});

suite('Visual Editor: problem marks (spec §11.1)', function () {
    this.timeout(90000);

    const SOURCE_WITH_PROBLEMS = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">',
        '<topic id="marks">',
        '  <title>Problems</title>',
        '  <body>',
        '    <p id="same">One.</p>',
        '    <p id="same">Two.</p>',
        '  </body>',
        '</topic>',
        '',
    ].join('\n');

    let tmp: string;
    let uri: vscode.Uri;
    let serverReady = false;

    suiteSetup(async () => {
        const extension = vscode.extensions.getExtension('JeremyJeanne.ditacraft')!;
        if (!extension.isActive) {
            await extension.activate();
        }
        const api = extension.exports as { waitForLanguageClientReady?: (timeout?: number) => Promise<boolean> } | undefined;
        serverReady = (await api?.waitForLanguageClientReady?.(20000)) ?? false;
        tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-visual-marks-'));
        fs.writeFileSync(path.join(tmp, 'marks.dita'), SOURCE_WITH_PROBLEMS);
        uri = vscode.Uri.file(path.join(tmp, 'marks.dita'));
    });

    suiteTeardown(async () => {
        await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor');
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        try {
            fs.rmSync(tmp, { recursive: true, force: true });
        } catch {
            // Windows may still hold the folder; the OS temp dir is cleaned later.
        }
    });

    test('the language server\'s diagnostics are marked on the page, and go when fixed in the text', async function () {
        if (!serverReady) {
            this.skip(); // no language server in this environment
        }
        await vscode.commands.executeCommand('ditacraft.openVisualEditor', uri);
        const errors = await waitFor(() => {
            const found = vscode.languages.getDiagnostics(uri).filter((d) => d.message.toLowerCase().includes('same') || String(typeof d.code === 'object' ? d.code.value : d.code).startsWith('DITA-ID'));
            return found.length > 0 ? found : undefined;
        }, 'the duplicate-id diagnostics', 45000);
        const marked = await waitFor(async () => {
            const s = await editorState(uri);
            return s && s.problemMarks >= errors.length ? s.problemMarks : undefined;
        }, 'the page to mark the problems', 45000);
        const doc = vscode.workspace.textDocuments.find((d) => d.uri.toString() === uri.toString())!;
        const edit = new vscode.WorkspaceEdit();
        const at = doc.getText().lastIndexOf('"same"');
        edit.replace(uri, new vscode.Range(doc.positionAt(at + 1), doc.positionAt(at + 5)), 'other');
        assert.ok(await vscode.workspace.applyEdit(edit));
        await waitFor(async () => ((await editorState(uri))?.problemMarks ?? marked) < marked || undefined, 'the marks to follow the fix', 45000);
    });
});

suite('Visual Editor: sync with the text editor (spec §11.2)', function () {
    this.timeout(60000);

    const SOURCE_TO_SYNC = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">',
        '<topic id="sync">',
        '  <title>Sync</title>',
        '  <body>',
        '    <p>First paragraph.</p>',
        '    <note>A note to find.</note>',
        '    <ul>',
        '      <li>An item to find.</li>',
        '    </ul>',
        ...Array.from({ length: 80 }, (_, k) => `    <p>Filler paragraph number ${k + 1}, long enough to fill a line of the page.</p>`),
        '    <p>Last paragraph.</p>',
        '  </body>',
        '</topic>',
        '',
    ].join('\n');

    let tmp: string;
    let uri: vscode.Uri;
    const textEditor = () => vscode.window.visibleTextEditors.find((e) => e.document.uri.toString() === uri.toString());
    const innermost = async () => (await editorState(uri))?.selectionPath[0];

    suiteSetup(async () => {
        await vscode.workspace.getConfiguration('ditacraft').update('previewScrollSync', true, vscode.ConfigurationTarget.Global);
        tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-visual-sync-'));
        fs.writeFileSync(path.join(tmp, 'sync.dita'), SOURCE_TO_SYNC);
        uri = vscode.Uri.file(path.join(tmp, 'sync.dita'));
    });

    suiteTeardown(async () => {
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        try {
            fs.rmSync(tmp, { recursive: true, force: true });
        } catch {
            // Windows may still hold the folder; the OS temp dir is cleaned later.
        }
    });

    test('Open in Visual Editor starts the page at the text cursor', async () => {
        const doc = await vscode.workspace.openTextDocument(uri);
        const editor = await vscode.window.showTextDocument(doc);
        const at = doc.positionAt(SOURCE_TO_SYNC.indexOf('note to find'));
        editor.selection = new vscode.Selection(at, at);
        await vscode.commands.executeCommand('ditacraft.openVisualEditor', uri);
        await waitFor(async () => ((await innermost()) === 'note' ? true : undefined), 'the page cursor in the note');
    });

    test('the page follows the text editor\'s cursor', async () => {
        const doc = await vscode.workspace.openTextDocument(uri);
        const editor = await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true });
        await waitFor(async () => ((await editorState(uri))?.sent.syncState ?? 0) >= 2 || undefined, 'sync to be enabled');
        const at = doc.positionAt(SOURCE_TO_SYNC.indexOf('item to find'));
        editor.selection = new vscode.Selection(at, at);
        await waitFor(async () => ((await innermost()) === 'li' ? true : undefined), 'the page cursor in the list item');
    });

    test('the text editor follows the page\'s cursor', async () => {
        await vscode.commands.executeCommand('ditacraft.visualEditor.debugPost', uri.toString(), { type: 'debug', action: 'insertAfter', search: 'First', text: ' typed' });
        const expected = SOURCE_TO_SYNC.indexOf('First') + 'First typed'.length;
        await waitFor(() => {
            const e = textEditor();
            return e && e.document.getText().includes('First typed') && e.document.offsetAt(e.selection.active) === expected ? true : undefined;
        }, 'the text cursor after the typed text');
    });

    test('the text editor follows the page\'s scrolling', async () => {
        await new Promise((r) => setTimeout(r, 400)); // past the cursor sync
        await vscode.commands.executeCommand('ditacraft.visualEditor.debugPost', uri.toString(), { type: 'debug', action: 'scroll', y: 2500 });
        await waitFor(() => ((textEditor()?.visibleRanges[0]?.start.line ?? 0) > 20 ? true : undefined), 'the text editor to scroll down');
    });

    test('Open Source reopens the text at the page cursor', async () => {
        await vscode.commands.executeCommand('ditacraft.visualEditor.debugPost', uri.toString(), { type: 'debug', action: 'insertAfter', search: 'Last', text: ' one' });
        const doc = await vscode.workspace.openTextDocument(uri);
        await waitFor(() => (doc.getText().includes('Last one') ? true : undefined), 'the edit');
        const expected = doc.getText().indexOf('Last one') + 'Last one'.length;
        await vscode.commands.executeCommand('ditacraft.openSourceEditor', uri);
        await waitFor(() => {
            const e = vscode.window.activeTextEditor;
            return e && e.document.uri.toString() === uri.toString() && e.document.offsetAt(e.selection.active) === expected ? true : undefined;
        }, 'the text cursor at the page cursor');
        await vscode.commands.executeCommand('workbench.action.files.revert');
    });
});

suite('Visual Editor: images', function () {
    this.timeout(60000);

    const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const TOPIC = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">',
        '<topic id="pump">',
        '  <title>Pump</title>',
        '  <body>',
        '    <p>First paragraph.</p>',
        '    <p>Second paragraph.</p>',
        '  </body>',
        '</topic>',
        '',
    ].join('\n');

    let tmp: string;
    let uri: vscode.Uri;
    const text = () => vscode.workspace.textDocuments.find((d) => d.uri.toString() === uri.toString())?.getText();
    const post = (message: unknown) => vscode.commands.executeCommand('ditacraft.visualEditor.debugPost', uri.toString(), message);

    suiteSetup(async () => {
        tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-visual-images-'));
        fs.mkdirSync(path.join(tmp, 'topics'));
        fs.mkdirSync(path.join(tmp, 'img'));
        fs.writeFileSync(path.join(tmp, 'img', 'pic one.png'), Buffer.from(PNG, 'base64'));
        fs.writeFileSync(path.join(tmp, 'topics', 'pump.dita'), TOPIC);
        uri = vscode.Uri.file(path.join(tmp, 'topics', 'pump.dita'));
        await vscode.commands.executeCommand('ditacraft.openVisualEditor', uri);
        await waitFor(async () => {
            const s = await editorState(uri);
            return s?.ready && (s.sent.init ?? 0) >= 1 ? s : undefined;
        }, 'the editor page to start');
    });

    suiteTeardown(async () => {
        await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor');
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        try {
            fs.rmSync(tmp, { recursive: true, force: true });
        } catch {
            // Windows may still hold the folder; the OS temp dir is cleaned later.
        }
    });

    test('Image ▸ In the text: the picked file, relative to the topic, with its alternative text', async () => {
        await vscode.commands.executeCommand('ditacraft.visualEditor.debugQueueDialog', { file: path.join(tmp, 'img', 'pic one.png') });
        await vscode.commands.executeCommand('ditacraft.visualEditor.debugQueueDialog', { text: 'The pump' });
        await post({ type: 'debug', action: 'menu', search: 'First ', id: 'image/inline' });
        const after = await waitFor(() => (text()?.includes('<image') ? text() : undefined), 'the image in the document');
        assert.ok(after.includes('<p>First <image href="../img/pic%20one.png"><alt>The pump</alt></image>paragraph.</p>'), after);
        await waitFor(async () => ((await editorState(uri))?.sent.ack ?? 0) >= 1 || undefined, 'the edit acknowledged');
    });

    test('a pasted image is saved next to the topic and inserted on its own line', async () => {
        await post({ type: 'debug', action: 'pasteImage', search: 'Second ', data: PNG, mime: 'image/png' });
        const after = await waitFor(() => (text()?.includes('images/pump-1.png') ? text() : undefined), 'the pasted image in the document');
        assert.ok(after.includes('<p>Second <image href="images/pump-1.png" placement="break"/>paragraph.</p>'), after);
        assert.deepStrictEqual(fs.readFileSync(path.join(tmp, 'topics', 'images', 'pump-1.png')), Buffer.from(PNG, 'base64'));
    });
});

suite('Visual Editor: links', function () {
    this.timeout(60000);

    const header = ['<?xml version="1.0" encoding="UTF-8"?>', '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">'];
    const PUMP = [
        ...header,
        '<topic id="pump">',
        '  <title>Pump</title>',
        '  <body>',
        '    <p>First paragraph.</p>',
        '    <p>Second paragraph.</p>',
        '    <section id="s1"><title>Maintenance</title><p>Check it.</p></section>',
        '  </body>',
        '</topic>',
        '',
    ].join('\n');
    const OTHER = [...header, '<topic id="other">', '  <title>Other</title>', '  <body>', '    <section id="setup"><title>Setup</title></section>', '  </body>', '</topic>', ''].join('\n');

    let tmp: string;
    let uri: vscode.Uri;
    const text = () => vscode.workspace.textDocuments.find((d) => d.uri.toString() === uri.toString())?.getText();
    const post = (message: unknown) => vscode.commands.executeCommand('ditacraft.visualEditor.debugPost', uri.toString(), message);
    const answer = (a: { pick?: string; text?: string }) => vscode.commands.executeCommand('ditacraft.visualEditor.debugQueueDialog', a);

    suiteSetup(async () => {
        tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-visual-links-'));
        fs.writeFileSync(path.join(tmp, 'pump.dita'), PUMP);
        fs.writeFileSync(path.join(tmp, 'other.dita'), OTHER);
        uri = vscode.Uri.file(path.join(tmp, 'pump.dita'));
        await vscode.commands.executeCommand('ditacraft.openVisualEditor', uri);
        await waitFor(async () => {
            const s = await editorState(uri);
            return s?.ready && (s.sent.init ?? 0) >= 1 ? s : undefined;
        }, 'the editor page to start');
    });

    suiteTeardown(async () => {
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        try {
            fs.rmSync(tmp, { recursive: true, force: true });
        } catch {
            // Windows may still hold the folder; the OS temp dir is cleaned later.
        }
    });

    test('Link… to an element of this topic: an empty link at the cursor', async () => {
        await answer({ pick: 'doc:pump/s1' });
        await post({ type: 'debug', action: 'menu', search: 'First ', id: 'link' });
        const after = await waitFor(() => (text()?.includes('<xref') ? text() : undefined), 'the link in the document');
        assert.ok(after.includes('<p>First <xref href="#pump/s1"/>paragraph.</p>'), after);
        await waitFor(async () => ((await editorState(uri))?.sent.ack ?? 0) >= 1 || undefined, 'the edit acknowledged');
    });

    test('the empty link shows its target\'s title on the page', async () => {
        const shown = await waitFor(async () => {
            const s = await editorState(uri);
            return s?.resolvedShown.includes('Maintenance') ? s.resolvedShown : undefined;
        }, 'the link to show its target\'s title');
        assert.deepStrictEqual(shown, ['Maintenance']);
    });

    test('Link… on selected text, to an element of another topic (two steps)', async () => {
        await answer({ pick: 'file:other.dita' });
        await answer({ pick: 'el:other/setup' });
        await post({ type: 'debug', action: 'menu', search: 'Second', select: true, id: 'link' });
        const after = await waitFor(() => (text()?.includes('other.dita') ? text() : undefined), 'the second link');
        assert.ok(after.includes('<p><xref href="other.dita#other/setup">Second</xref> paragraph.</p>'), after);
        await waitFor(async () => ((await editorState(uri))?.sent.ack ?? 0) >= 2 || undefined, 'the edit acknowledged');
    });

    test('a web address typed in the picker\'s search box makes an external link', async () => {
        await answer({ text: 'https://example.com/a' });
        await post({ type: 'debug', action: 'menu', search: 'Check it', id: 'link' });
        const after = await waitFor(() => (text()?.includes('example.com') ? text() : undefined), 'the web link');
        assert.ok(after.includes('<p>Check it<xref href="https://example.com/a" scope="external" format="html"/>.</p>'), after);
        await waitFor(async () => ((await editorState(uri))?.sent.ack ?? 0) >= 3 || undefined, 'the edit acknowledged');
    });

    test('Open link target opens the other topic at the element', async () => {
        await post({ type: 'debug', action: 'menu', search: 'Second', id: 'link/open' });
        await waitFor(() => {
            const e = vscode.window.activeTextEditor;
            return e && path.basename(e.document.uri.fsPath) === 'other.dita' && e.document.offsetAt(e.selection.active) === OTHER.indexOf('<section id="setup"') ? true : undefined;
        }, 'the other topic open at its section');
    });
});

suite('Visual Editor: reused content (spec §13.7)', function () {
    this.timeout(60000);

    const header = ['<?xml version="1.0" encoding="UTF-8"?>', '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">'];
    const LIB = [
        ...header,
        '<topic id="lib">',
        '  <title>Library</title>',
        '  <body>',
        '    <p id="intro" audience="admin">Reused <xref href="other.dita"/> text.</p>',
        '  </body>',
        '</topic>',
        '',
    ].join('\n');
    const MAIN = [
        ...header,
        '<topic id="main">',
        '  <title>Main</title>',
        '  <body>',
        '    <p conref="../shared/lib.dita#lib/intro"/>',
        '    <p>Own text.</p>',
        '  </body>',
        '</topic>',
        '',
    ].join('\n');

    let tmp: string;
    let uri: vscode.Uri;
    const text = () => vscode.workspace.textDocuments.find((d) => d.uri.toString() === uri.toString())?.getText();
    const post = (message: unknown) => vscode.commands.executeCommand('ditacraft.visualEditor.debugPost', uri.toString(), message);

    suiteSetup(async () => {
        tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-visual-reuse-'));
        fs.mkdirSync(path.join(tmp, 'topics'));
        fs.mkdirSync(path.join(tmp, 'shared'));
        fs.writeFileSync(path.join(tmp, 'shared', 'lib.dita'), LIB);
        fs.writeFileSync(path.join(tmp, 'topics', 'main.dita'), MAIN);
        uri = vscode.Uri.file(path.join(tmp, 'topics', 'main.dita'));
        await vscode.commands.executeCommand('ditacraft.openVisualEditor', uri);
        await waitFor(async () => {
            const s = await editorState(uri);
            return s?.ready && (s.sent.init ?? 0) >= 1 ? s : undefined;
        }, 'the editor page to start');
    });

    suiteTeardown(async () => {
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        try {
            fs.rmSync(tmp, { recursive: true, force: true });
        } catch {
            // Windows may still hold the folder; the OS temp dir is cleaned later.
        }
    });

    test('the box shows the reused content, and follows changes made in the reused file', async () => {
        const shownWith = (needle: string) => waitFor(async () => {
            const s = await editorState(uri);
            return s && s.resolvedShown.length === 1 && s.resolvedShown[0].includes(needle) ? s.resolvedShown[0] : undefined;
        }, `the box to show "${needle}"`);
        assert.ok((await shownWith('Reused')).includes('text.'));
        // An unsaved change in the reused file reaches the box.
        const lib = await vscode.workspace.openTextDocument(path.join(tmp, 'shared', 'lib.dita'));
        const replace = async (from: string, to: string) => {
            const at = lib.getText().indexOf(from);
            const edit = new vscode.WorkspaceEdit();
            edit.replace(lib.uri, new vscode.Range(lib.positionAt(at), lib.positionAt(at + from.length)), to);
            assert.ok(await vscode.workspace.applyEdit(edit));
        };
        await replace('Reused', 'Shared');
        await shownWith('Shared');
        await replace('Shared', 'Reused'); // as it was: the next tests copy it
        await shownWith('Reused');
    });

    test('Open source opens the reused element in its own file', async () => {
        await post({ type: 'debug', action: 'reuse', index: 0, reuse: 'open' });
        // The editor becomes active, then gets its selection: wait for both.
        const expected = LIB.indexOf('<p id="intro"');
        const editor = await waitFor(() => {
            const e = vscode.window.activeTextEditor;
            return e && path.basename(e.document.uri.fsPath) === 'lib.dita' && e.document.offsetAt(e.selection.active) === expected ? e : undefined;
        }, 'the reused file to open at the reused element');
        assert.strictEqual(editor.document.offsetAt(editor.selection.active), expected);
    });

    test('Replace with copy puts the reused content in the topic, its references rewritten', async () => {
        await post({ type: 'debug', action: 'reuse', index: 0, reuse: 'copy' });
        const after = await waitFor(() => (text()?.includes('Reused') ? text() : undefined), 'the copy to reach the document');
        assert.strictEqual(after, MAIN.replace('<p conref="../shared/lib.dita#lib/intro"/>', '<p audience="admin">Reused <xref href="../shared/other.dita"/> text.</p>'));
        await waitFor(async () => ((await editorState(uri))?.sent.ack ?? 0) >= 1 || undefined, 'the copy to be acknowledged');
    });

    test('undo on the page brings the reference back', async () => {
        await post({ type: 'debug', action: 'undo' });
        await waitFor(() => (text() === MAIN ? true : undefined), 'the undo to reach the document');
    });
});

suite('Visual Editor: quick fixes (spec §11.1)', function () {
    this.timeout(60000);

    const DOCTYPE = '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">';
    const TOPIC = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        DOCTYPE,
        '<topic id="fixes">',
        '  <title>Fixes</title>',
        '  <body>',
        '    <p>See <image href="pump.png"/> here.</p>',
        '  </body>',
        '</topic>',
        '',
    ].join('\n');
    const NO_DOCTYPE = TOPIC.replace(`${DOCTYPE}\n`, '');

    let tmp: string;
    let uri: vscode.Uri;
    const text = () => vscode.workspace.textDocuments.find((d) => d.uri.toString() === uri.toString())?.getText();
    const post = (message: unknown) => vscode.commands.executeCommand('ditacraft.visualEditor.debugPost', uri.toString(), message);

    async function open(name: string, source: string): Promise<void> {
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        fs.writeFileSync(path.join(tmp, name), source);
        uri = vscode.Uri.file(path.join(tmp, name));
        await vscode.commands.executeCommand('ditacraft.openVisualEditor', uri);
        await waitFor(async () => {
            const s = await editorState(uri);
            return s?.ready && (s.sent.init ?? 0) >= 1 ? s : undefined;
        }, 'the editor page to start');
    }

    suiteSetup(() => {
        tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-visual-fixes-'));
    });

    suiteTeardown(async () => {
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        try {
            fs.rmSync(tmp, { recursive: true, force: true });
        } catch {
            // Windows may still hold the folder; the OS temp dir is cleaned later.
        }
    });

    test('the language server\'s fix, made on the page: the document gets it, undo on the page takes it back', async () => {
        await open('fixes.dita', TOPIC);
        await waitFor(async () => ((await editorState(uri))?.problemMarks ?? 0) >= 1 || undefined, 'the missing alt text marked on the page');
        await post({ type: 'debug', action: 'quickFix', search: 'See ', title: 'Add <alt>' });
        const fixed = TOPIC.replace('<image href="pump.png"/>', '<image href="pump.png"><alt></alt></image>');
        await waitFor(() => (text() === fixed ? true : undefined), 'the fix in the document');
        assert.ok((await editorState(uri))!.quickFixes.some((t) => t.includes('Add <alt>')));
        await waitFor(async () => ((await editorState(uri))?.sent.ack ?? 0) >= 1 || undefined, 'the page\'s edit acknowledged');
        assert.strictEqual((await editorState(uri))!.sent.update ?? 0, 0, 'made by the page, not rebuilt from the document');
        await post({ type: 'debug', action: 'undo' });
        await waitFor(() => (text() === TOPIC ? true : undefined), 'the undo to reach the document');
    });

    test('a fix the page cannot make (Add DOCTYPE, outside the root element) is applied to the document', async () => {
        await open('nodoctype.dita', NO_DOCTYPE);
        await waitFor(async () => ((await editorState(uri))?.problemMarks ?? 0) >= 1 || undefined, 'the missing DOCTYPE marked on the page');
        await post({ type: 'debug', action: 'quickFix', search: 'See ', title: 'DOCTYPE' });
        await waitFor(() => (text() === TOPIC ? true : undefined), 'the DOCTYPE in the document');
        // A new DOCTYPE: the page starts again with the grammar it names.
        await waitFor(async () => ((await editorState(uri))?.sent.init ?? 0) >= 2 || undefined, 'the page restarted with the topic grammar');
    });
});

suite('Visual Editor: maps (spec §13.8)', function () {
    this.timeout(60000);

    const header = ['<?xml version="1.0" encoding="UTF-8"?>'];
    const MAP = [
        ...header,
        '<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA Map//EN" "map.dtd">',
        '<map id="guide">',
        '  <title>Field Guide</title>',
        '  <topichead navtitle="Getting started">',
        '    <topicref href="install.dita"/>',
        '    <topicref href="missing.dita"/>',
        '  </topichead>',
        '  <topicref href="setup.dita">',
        '    <topicmeta>',
        '      <navtitle>Set it up</navtitle>',
        '    </topicmeta>',
        '  </topicref>',
        '</map>',
        '',
    ].join('\n');
    const topic = (id: string, title: string) => [...header, '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">',
        `<topic id="${id}">`, `  <title>${title}</title>`, '</topic>', ''].join('\n');

    let tmp: string;
    let uri: vscode.Uri;
    const text = () => vscode.workspace.textDocuments.find((d) => d.uri.toString() === uri.toString())?.getText();
    const post = (message: unknown) => vscode.commands.executeCommand('ditacraft.visualEditor.debugPost', uri.toString(), message);
    const answer = (a: { pick?: string; text?: string }) => vscode.commands.executeCommand('ditacraft.visualEditor.debugQueueDialog', a);
    const changed = (what: string, test: (t: string) => boolean) => waitFor(() => {
        const t = text();
        return t !== undefined && test(t) ? t : undefined;
    }, what);
    const acked = async (n: number) => waitFor(async () => ((await editorState(uri))?.sent.ack ?? 0) >= n || undefined, 'the edit acknowledged');

    suiteSetup(async () => {
        tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-visual-maps-'));
        fs.writeFileSync(path.join(tmp, 'guide.ditamap'), MAP);
        fs.writeFileSync(path.join(tmp, 'install.dita'), topic('install', 'Installing the kit'));
        fs.writeFileSync(path.join(tmp, 'setup.dita'), topic('setup', 'Setup'));
        uri = vscode.Uri.file(path.join(tmp, 'guide.ditamap'));
    });

    suiteTeardown(async () => {
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        try {
            fs.rmSync(tmp, { recursive: true, force: true });
        } catch {
            // Windows may still hold the folder; the OS temp dir is cleaned later.
        }
    });

    test('a map opens in the visual editor with the map grammar; rows show their targets\' titles', async () => {
        await vscode.commands.executeCommand('ditacraft.openVisualEditor', uri);
        const state = await waitFor(async () => {
            const s = await editorState(uri);
            return s?.ready && (s.sent.init ?? 0) >= 1 ? s : undefined;
        }, 'the editor page to start');
        assert.ok(state.grammarId?.endsWith('/map'), String(state.grammarId));
        const shown = await waitFor(async () => {
            const s = await editorState(uri);
            return s?.resolvedShown.includes('Installing the kit') ? s.resolvedShown : undefined;
        }, 'the rows to show their targets\' titles');
        assert.deepStrictEqual([...shown].sort(), ['Installing the kit', 'Setup', '⚠ cannot read missing.dita'].sort());
    });

    test('a click on a row selects it: the Properties view shows the reference', async () => {
        await post({ type: 'debug', action: 'row', label: 'Installing the kit' });
        const s = await waitFor(async () => {
            const e = await editorState(uri);
            return e?.selectionPath[0] === 'topicref' ? e : undefined;
        }, 'the row selected');
        assert.deepStrictEqual(s.selectionPath, ['topicref', 'topichead', 'map']);
    });

    test('Open target opens the row\'s topic beside', async () => {
        await post({ type: 'debug', action: 'row', label: 'Installing the kit', id: 'row/open' });
        await waitFor(() => (vscode.window.visibleTextEditors.some((e) => path.basename(e.document.uri.fsPath) === 'install.dita') ? true : undefined),
            'the target topic open');
    });

    test('Insert after on a row writes a new reference after it; Move up reorders rows', async () => {
        await post({ type: 'debug', action: 'row', label: 'Set it up', id: 'insert/topicref' });
        const inserted = await waitFor(() => (text()?.includes('<topicref/>') ? text() : undefined), 'the new reference in the document');
        assert.ok(inserted.includes('    </topicmeta>\n  </topicref>\n  <topicref/>\n</map>'), inserted);
        await waitFor(async () => ((await editorState(uri))?.sent.ack ?? 0) >= 1 || undefined, 'the edit acknowledged');
        await post({ type: 'debug', action: 'row', label: 'missing.dita', id: 'element/up' });
        const moved = await waitFor(() => (text()!.indexOf('missing.dita') < text()!.indexOf('install.dita') ? text() : undefined), 'the row moved up');
        assert.ok(moved.includes('    <topicref href="missing.dita"/>\n    <topicref href="install.dita"/>'), moved);
    });

    test('Tab puts a row into the row before it; Shift+Tab takes it out again', async () => {
        await acked(2);
        await post({ type: 'debug', action: 'row', label: 'Installing the kit', key: 'Tab' });
        const nested = await changed('the row indented', (t) => t.includes('<topicref href="missing.dita">'));
        assert.ok(nested.includes('    <topicref href="missing.dita">\n      <topicref href="install.dita"/>\n    </topicref>\n  </topichead>'), nested);
        await acked(3);
        await post({ type: 'debug', action: 'row', label: 'Installing the kit', key: 'Shift-Tab' });
        const back = await changed('the row outdented', (t) => t.includes('<topicref href="missing.dita"/>'));
        assert.ok(back.includes('    <topicref href="missing.dita"/>\n    <topicref href="install.dita"/>\n  </topichead>'), back);
        await acked(4);
    });

    test('F2 edits a row\'s label on its line: the navtitle, and locktitle for a topic', async () => {
        await post({ type: 'debug', action: 'row', label: 'Set it up', key: 'F2', text: 'Set up the kit' });
        const labelled = await changed('the new navtitle', (t) => t.includes('Set up the kit'));
        assert.ok(labelled.includes('<topicref href="setup.dita" locktitle="yes">\n    <topicmeta>\n      <navtitle>Set up the kit</navtitle>'), labelled);
        await acked(5);
    });

    test('Change target… sets a row\'s target from the picker', async () => {
        await answer({ pick: 'file:install.dita' });
        await post({ type: 'debug', action: 'row', label: 'no target', id: 'row/target' });
        const targeted = await changed('the new target', (t) => !t.includes('<topicref/>'));
        assert.ok(targeted.includes('  </topicref>\n  <topicref href="install.dita"/>\n</map>'), targeted);
        await acked(6);
    });

    test('Add reference… inserts a reference to the chosen topic after the row', async () => {
        await answer({ pick: 'file:setup.dita' });
        await post({ type: 'debug', action: 'row', label: 'Set up the kit', id: 'map/reference' });
        const added = await changed('the new reference', (t) => (t.match(/href="setup\.dita"/g) ?? []).length === 2);
        assert.ok(added.includes('  </topicref>\n  <topicref href="setup.dita"/>\n  <topicref href="install.dita"/>\n</map>'), added);
        await acked(7);
    });

    test('dropping a row into another moves it there', async () => {
        await post({ type: 'debug', action: 'row', label: 'missing.dita', drop: { label: 'Set up the kit', place: 'inside' } });
        const moved = await changed('the row moved', (t) => t.indexOf('missing.dita') > t.indexOf('Set up the kit'));
        assert.ok(moved.includes('    </topicmeta>\n    <topicref href="missing.dita"/>\n  </topicref>'), moved);
        assert.ok(moved.includes('  <topichead navtitle="Getting started">\n    <topicref href="install.dita"/>\n  </topichead>'), moved);
    });

    test('Insert ▸ reltable: a relationship table with a header and a row, after the row', async () => {
        await acked(8);
        await post({ type: 'debug', action: 'row', label: 'Set up the kit', id: 'insert/reltable' });
        const table = await changed('the relationship table', (t) => t.includes('<reltable>'));
        assert.ok(table.includes(['  </topicref>', '  <reltable>', '    <relheader>', '      <relcolspec/>', '      <relcolspec/>', '      <relcolspec/>', '    </relheader>',
            '    <relrow>', '      <relcell/>', '      <relcell/>', '      <relcell/>', '    </relrow>', '  </reltable>', '  <topicref href="setup.dita"/>'].join('\n')), table);
        await acked(9);
    });

    test('a reference added into a selected cell; a column added and deleted', async () => {
        await answer({ pick: 'file:install.dita' });
        await post({ type: 'debug', action: 'cell', row: 0, col: 1, id: 'map/reference' });
        const into = await changed('the reference in the cell', (t) => t.includes('<relcell>'));
        assert.ok(into.includes(['      <relcell/>', '      <relcell>', '        <topicref href="install.dita"/>', '      </relcell>', '      <relcell/>'].join('\n')), into);
        await acked(10);
        await post({ type: 'debug', action: 'cell', row: 0, col: 1, id: 'reltable/columnRight' });
        await changed('the new column', (t) => (t.match(/<relcolspec\/>/g) ?? []).length === 4);
        await acked(11);
        await post({ type: 'debug', action: 'cell', row: 0, col: 2, id: 'reltable/deleteColumn' });
        const back = await changed('the column deleted', (t) => (t.match(/<relcolspec\/>/g) ?? []).length === 3);
        assert.strictEqual((back.match(/<relcell\/>/g) ?? []).length, 2, back);
        await acked(12);
    });

    test('Tab past the last cell adds a row; a row dropped into a cell moves there', async () => {
        await post({ type: 'debug', action: 'cell', row: 0, col: 2, key: 'Tab' });
        const rows = await changed('the new row', (t) => (t.match(/<relrow>/g) ?? []).length === 2);
        assert.ok(rows.includes(['    </relrow>', '    <relrow>', '      <relcell/>', '      <relcell/>', '      <relcell/>', '    </relrow>', '  </reltable>'].join('\n')), rows);
        await acked(13);
        await post({ type: 'debug', action: 'row', label: 'missing.dita', drop: { cell: [1, 0], place: 'inside' } });
        const dropped = await changed('the row in the cell', (t) => t.indexOf('missing.dita') > t.indexOf('<reltable>'));
        assert.ok(dropped.includes(['    <relrow>', '      <relcell>', '        <topicref href="missing.dita"/>', '      </relcell>'].join('\n')), dropped);
    });
});

suite('Visual Editor and Preview: map context (spec §13.8 M4)', function () {
    this.timeout(60000);

    const key = (text: string) => `<keydef keys="product"><topicmeta><keywords><keyword>${text}</keyword></keywords></topicmeta></keydef>`;
    const files: Record<string, string> = {
        'root.ditamap': '<map><title>Guide</title><mapref href="a.ditamap" keyscope="a"/><mapref href="b.ditamap" keyscope="b"/></map>',
        'a.ditamap': `<map>${key('Alpha')}<topichead navtitle="Alpha docs"><topicref href="shared.dita"/></topichead></map>`,
        'b.ditamap': `<map xml:lang="fr">${key('Beta')}<topicref href="shared.dita"/></map>`,
        'shared.dita': ['<?xml version="1.0" encoding="UTF-8"?>', '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">',
            '<topic id="shared"><title>Shared</title><body><p>Use <keyword keyref="product"/>.</p><note>Read this.</note></body></topic>', ''].join('\n'),
    };
    let tmp: string;
    let topic: vscode.Uri;
    const shows = (text: string, label: string) => waitFor(async () => {
        const s = await editorState(topic);
        return s?.resolvedShown.includes(text) && s.mapContext === label ? s : undefined;
    }, `the topic shown with "${text}" in "${label}"`);
    const choose = async (index: number) => {
        await vscode.commands.executeCommand('ditacraft.mapContext.debugAnswer', index);
        await vscode.commands.executeCommand('ditacraft.chooseMapContext', topic);
    };

    suiteSetup(async () => {
        tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-map-context-'));
        for (const [name, text] of Object.entries(files)) {
            fs.writeFileSync(path.join(tmp, name), text);
        }
        topic = vscode.Uri.file(path.join(tmp, 'shared.dita'));
    });

    suiteTeardown(async () => {
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        try {
            fs.rmSync(tmp, { recursive: true, force: true });
        } catch {
            // Windows may still hold the folder; the OS temp dir is cleaned later.
        }
    });

    test('a topic is shown in the first place a map gives it: that map\'s keys, its scope', async () => {
        const commands = await vscode.commands.getCommands(true);
        assert.ok(commands.includes('ditacraft.chooseMapContext'));
        await vscode.commands.executeCommand('ditacraft.openVisualEditor', topic);
        await shows('Alpha', 'Guide › Alpha docs');
    });

    test('DITA: Choose Map Context shows it in another place: the other scope\'s keys', async () => {
        await choose(2); // automatic, a, b, none
        await shows('Beta', 'Guide');
        await choose(0);
        await shows('Alpha', 'Guide › Alpha docs');
    });

    test('a topic opened from a map row is shown in that place', async () => {
        const map = vscode.Uri.file(path.join(tmp, 'b.ditamap'));
        await vscode.commands.executeCommand('vscode.openWith', map, 'ditacraft.visualEditor', vscode.ViewColumn.Two);
        await waitFor(async () => ((await editorState(map))?.resolvedShown.includes('Shared') ? true : undefined), 'the map row\'s title');
        await vscode.commands.executeCommand('ditacraft.visualEditor.debugPost', map.toString(), { type: 'debug', action: 'row', label: 'Shared', id: 'row/open' });
        await shows('Beta', 'Guide');
    });

    test('the preview shows the topic in its place: keys, and the language the map gives it', async () => {
        const doc = await vscode.workspace.openTextDocument(topic);
        await vscode.window.showTextDocument(doc, vscode.ViewColumn.One);
        await vscode.commands.executeCommand('ditacraft.previewHTML5');
        const s = await waitFor(async () => {
            const p = await vscode.commands.executeCommand<{ uri?: string; mapContext?: string; contentLang?: string; resolved: number } | undefined>('ditacraft.visualPreview.debugState');
            return p?.uri === topic.toString() && p.mapContext === 'Guide' && p.contentLang === 'fr' && p.resolved >= 1 ? p : undefined;
        }, 'the preview in the map context');
        assert.strictEqual(s.contentLang, 'fr');
    });
});
