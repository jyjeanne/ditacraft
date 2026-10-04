/**
 * Visual Preview Integration Test Suite (spec §14 Phase 1).
 *
 * Runs inside VS Code: opens the visual preview through `DITA: Preview`, waits for the
 * webview page to acknowledge the rendered body, and checks live updates, same-file reuse
 * resolution and the follow/lock behaviour.
 *
 * The extension runs from its esbuild bundle, so the panel is observed through the internal
 * `ditacraft.visualPreview.debugState` command rather than by importing the module.
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';

interface PreviewState {
    uri?: string;
    version: number;
    grammarId?: string;
    fallback?: boolean;
    locked: boolean;
    ready: boolean;
    resolved: number;
    pageVersion?: number;
    pageElements?: number;
    text?: string;
}

async function state(): Promise<PreviewState | undefined> {
    return vscode.commands.executeCommand<PreviewState | undefined>('ditacraft.visualPreview.debugState');
}

async function waitFor(condition: (s: PreviewState | undefined) => boolean, what: string, timeoutMs = 20000): Promise<PreviewState> {
    const started = Date.now();
    for (;;) {
        const s = await state();
        if (condition(s)) {
            return s!;
        }
        if (Date.now() - started > timeoutMs) {
            throw new Error(`Timed out waiting for ${what}: ${JSON.stringify({ ...s, text: undefined })}`);
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
    }
}

suite('Visual Preview Integration Test Suite', function () {
    this.timeout(60000);

    const fixturesPath = path.join(__dirname, '..', '..', '..', 'src', 'test', 'fixtures');
    let tmp: string;
    let topicA: vscode.Uri;
    let topicB: vscode.Uri;

    suiteSetup(async () => {
        const extension = vscode.extensions.getExtension('JeremyJeanne.ditacraft');
        if (!extension) {
            throw new Error('Extension not found');
        }
        if (!extension.isActive) {
            await extension.activate();
        }
        tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-visual-preview-'));
        const valid = fs.readFileSync(path.join(fixturesPath, 'valid-topic.dita'), 'utf8');
        // Same-file reuse: a paragraph reusing the fixture's note.
        fs.writeFileSync(path.join(tmp, 'a.dita'), valid.replace('</body>', '<p conref="#valid_topic/note1"/></body>'));
        fs.writeFileSync(path.join(tmp, 'b.dita'), valid.replace('Valid Topic', 'Second Topic'));
        topicA = vscode.Uri.file(path.join(tmp, 'a.dita'));
        topicB = vscode.Uri.file(path.join(tmp, 'b.dita'));
    });

    suiteTeardown(async () => {
        await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor');
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        try {
            fs.rmSync(tmp, { recursive: true, force: true });
        } catch {
            // Windows may still hold the folder while VS Code watches it; the OS temp dir is cleaned later.
        }
    });

    test('registers the preview commands', async () => {
        const commands = await vscode.commands.getCommands(true);
        for (const id of ['ditacraft.previewHTML5', 'ditacraft.previewDitaOt', 'ditacraft.previewToggleMarkup', 'ditacraft.previewOpenSource', 'ditacraft.previewLock']) {
            assert.ok(commands.includes(id), `${id} should be registered`);
        }
    });

    test('DITA: Preview opens the visual preview and the page renders the topic', async () => {
        const doc = await vscode.workspace.openTextDocument(topicA);
        await vscode.window.showTextDocument(doc);
        await vscode.commands.executeCommand('ditacraft.previewHTML5');
        const s = await waitFor((x) => (x?.pageVersion ?? 0) > 0, 'the page to render');
        assert.strictEqual(s.uri, topicA.toString());
        assert.strictEqual(s.grammarId, 'dita-1.3/topic');
        assert.strictEqual(s.fallback, false);
        assert.ok(s.ready, 'the page script loaded and said ready');
        assert.ok((s.pageElements ?? 0) >= 8, `rendered elements: ${s.pageElements}`);
    });

    test('same-file reuse is resolved', async () => {
        await waitFor((x) => (x?.resolved ?? 0) >= 1, 'the conref to resolve');
    });

    test('edits re-render the page without saving', async () => {
        const doc = await vscode.workspace.openTextDocument(topicA);
        const editor = await vscode.window.showTextDocument(doc, vscode.ViewColumn.One);
        const at = doc.positionAt(doc.getText().indexOf('Valid Topic</title>') + 'Valid Topic'.length);
        await editor.edit((b) => b.insert(at, ' LIVE-EDIT'));
        assert.ok(doc.isDirty, 'the document is not saved');
        await waitFor((x) => !!x && (x.text ?? '').includes('LIVE-EDIT') && x.pageVersion === x.version, 'the edit to reach the page');
    });

    test('follows the active editor unless locked', async () => {
        await vscode.commands.executeCommand('ditacraft.previewLock');
        assert.strictEqual((await state())?.locked, true);
        await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(topicB), vscode.ViewColumn.One);
        await new Promise((resolve) => setTimeout(resolve, 400));
        assert.strictEqual((await state())?.uri, topicA.toString(), 'a locked preview keeps its topic');

        await vscode.commands.executeCommand('ditacraft.previewLock'); // unlocking follows the active editor again
        await waitFor((x) => x?.uri === topicB.toString(), 'the preview to follow topic B');
    });
});
