/**
 * Properties pane Integration Test Suite (spec §13.4).
 *
 * Runs inside VS Code: the pane follows the text editor's cursor and the visual editor's
 * selection, and a change made in the pane reaches the document as a minimal edit of the
 * element's start tag. Observed through internal commands (`ditacraft.properties.debugState`,
 * `…debugAction`), as the extension runs from its bundle.
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';

interface PaneState {
    source: 'visual' | 'text' | 'none';
    chain: { name: string; editable: boolean }[];
    selected: number;
    element?: { name: string };
    fields: { name: string; value?: string; group: string }[];
    message?: string;
}

const state = () => vscode.commands.executeCommand<PaneState | undefined>('ditacraft.properties.debugState');
const act = (action: unknown) => vscode.commands.executeCommand<string | undefined>('ditacraft.properties.debugAction', action);

async function waitFor<T>(probe: () => Promise<T | undefined | false>, what: string, timeoutMs = 20000): Promise<T> {
    const started = Date.now();
    for (;;) {
        const value = await probe();
        if (value !== undefined && value !== false) {
            return value;
        }
        if (Date.now() - started > timeoutMs) {
            throw new Error(`Timed out waiting for ${what}: ${JSON.stringify(await state())}`);
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
    }
}

const SOURCE = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">',
    '<topic id="props">',
    '  <title>Properties</title>',
    '  <body>',
    '    <p id="first"',
    '       audience="admin">First paragraph.</p>',
    '    <p>Second paragraph.</p>',
    '  </body>',
    '</topic>',
    '',
].join('\n');

suite('Properties Pane Integration Test Suite', function () {
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
        tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-properties-'));
        fs.writeFileSync(path.join(tmp, 'props.dita'), SOURCE);
        uri = vscode.Uri.file(path.join(tmp, 'props.dita'));
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

    test('registers the pane and its command', async () => {
        const commands = await vscode.commands.getCommands(true);
        assert.ok(commands.includes('ditacraft.showProperties'));
        await vscode.commands.executeCommand('ditacraft.showProperties');
    });

    test('follows the text editor: the element at the cursor and its ancestors', async () => {
        const editor = await vscode.window.showTextDocument(uri);
        const at = editor.document.positionAt(SOURCE.indexOf('Second'));
        editor.selection = new vscode.Selection(at, at);
        const s = await waitFor(async () => {
            await act({ type: 'refresh' });
            const now = await state();
            return now?.element?.name === 'p' && now.source === 'text' ? now : undefined;
        }, 'the pane to show the paragraph');
        assert.deepStrictEqual(s.chain.map((e) => e.name), ['p', 'body', 'topic']);
        const names = s.fields.map((f) => f.name);
        assert.ok(names.includes('id') && names.includes('outputclass') && names.includes('audience'), names.join(','));
    });

    test('setting and removing attributes edits only the start tag', async () => {
        assert.strictEqual(await act({ type: 'set', index: 0, element: 'p', name: 'outputclass', value: 'lead' }), undefined);
        let after = await waitFor(async () => text()?.includes('<p outputclass="lead">') ? text() : undefined, 'the attribute');
        assert.strictEqual(after, SOURCE.replace('<p>Second', '<p outputclass="lead">Second'));
        await act({ type: 'refresh' });
        assert.strictEqual(await act({ type: 'set', index: 0, element: 'p', name: 'outputclass', value: null }), undefined);
        after = await waitFor(async () => text()?.includes('<p>Second') ? text() : undefined, 'the removal');
        assert.strictEqual(after, SOURCE);
    });

    test('a duplicate or malformed id is refused with the reason', async () => {
        await act({ type: 'refresh' });
        const duplicate = await act({ type: 'set', index: 0, element: 'p', name: 'id', value: 'first' });
        assert.match(duplicate ?? '', /already has id "first"/);
        const malformed = await act({ type: 'set', index: 0, element: 'p', name: 'id', value: 'two words' });
        assert.match(malformed ?? '', /single token/);
        assert.strictEqual(text(), SOURCE);
    });

    test('an ancestor can be edited too, a multi-line start tag keeps its layout', async () => {
        const editor = await vscode.window.showTextDocument(uri);
        const at = editor.document.positionAt(SOURCE.indexOf('First'));
        editor.selection = new vscode.Selection(at, at);
        await waitFor(async () => {
            await act({ type: 'refresh' });
            return (await state())?.fields.find((f) => f.name === 'id')?.value === 'first' || undefined;
        }, 'the first paragraph');
        assert.strictEqual(await act({ type: 'set', index: 0, element: 'p', name: 'audience', value: 'expert' }), undefined);
        await waitFor(async () => text()?.includes('audience="expert"') || undefined, 'the change');
        assert.strictEqual(text(), SOURCE.replace('audience="admin"', 'audience="expert"'));
        assert.strictEqual(await act({ type: 'set', index: 2, element: 'topic', name: 'outputclass', value: 'concept-like' }), undefined);
        await waitFor(async () => text()?.includes('<topic id="props" outputclass="concept-like">') || undefined, 'the topic change');
        await vscode.commands.executeCommand('workbench.action.files.revert');
    });

    test('follows the visual editor: a change goes through the page', async () => {
        await vscode.commands.executeCommand('ditacraft.openVisualEditor', uri);
        // Move the page's cursor into the second paragraph (typing there), then use the pane.
        await waitFor(async () => {
            const editors = await vscode.commands.executeCommand<{ uri: string; ready: boolean }[]>('ditacraft.visualEditor.debugState');
            return editors?.some((e) => e.uri === uri.toString() && e.ready) || undefined;
        }, 'the visual editor');
        await vscode.commands.executeCommand('ditacraft.visualEditor.debugPost', uri.toString(), { type: 'debug', action: 'insertAfter', search: 'Second', text: '!' });
        const s = await waitFor(async () => {
            await act({ type: 'refresh' });
            const now = await state();
            return now?.source === 'visual' && now.element?.name === 'p' && !now.fields.some((f) => f.name === 'id' && f.value) ? now : undefined;
        }, 'the pane to follow the page');
        assert.strictEqual(s.chain[0].name, 'p');
        assert.strictEqual(await act({ type: 'set', index: s.selected, element: 'p', name: 'outputclass', value: 'from-pane' }), undefined);
        const after = await waitFor(async () => text()?.includes('outputclass="from-pane"') ? text() : undefined, 'the change through the page');
        assert.ok(after.includes('<p outputclass="from-pane">Second! paragraph.</p>'), after);
    });
});
