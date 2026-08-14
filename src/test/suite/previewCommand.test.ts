/**
 * Preview Command Test Suite
 * Tests for HTML5 preview command functionality
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as sinon from 'sinon';
import {
    validateFilePath,
    findMainHtmlFile,
    initializePreview,
    shouldAutoRefreshPreview,
    computeFilterSuffix,
    pickPreviewFilterCommand,
    getActiveDitavalPath
} from '../../commands/previewCommand';
import { DitaPreviewPanel } from '../../providers/previewPanel';

suite('Preview Command Test Suite', () => {
    const fixturesPath = path.join(__dirname, '..', '..', '..', 'src', 'test', 'fixtures');

    suiteSetup(async () => {
        // Get and activate extension
        const extension = vscode.extensions.getExtension('JeremyJeanne.ditacraft');
        if (!extension) {
            throw new Error('Extension not found');
        }

        if (!extension.isActive) {
            await extension.activate();
        }
    });

    teardown(async () => {
        // Close all editors after each test
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });

    suite('Command Registration', () => {
        test('Should have previewHTML5 command registered', async function() {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(
                commands.includes('ditacraft.previewHTML5'),
                'ditacraft.previewHTML5 command should be registered'
            );
        });

        test('Should have previewFilter command registered', async function() {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(
                commands.includes('ditacraft.previewFilter'),
                'ditacraft.previewFilter command should be registered'
            );
        });

        test('Should have showBuildOutput command registered', async function() {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(
                commands.includes('ditacraft.showBuildOutput'),
                'ditacraft.showBuildOutput command should be registered'
            );
        });
    });

    suite('validateFilePath Function', () => {

        test('Should accept valid file paths with extensions', () => {
            assert.doesNotThrow(() => validateFilePath('/path/to/file.dita'));
            assert.doesNotThrow(() => validateFilePath('/path/to/file.ditamap'));
            assert.doesNotThrow(() => validateFilePath('/path/to/file.bookmap'));
            assert.doesNotThrow(() => validateFilePath('C:\\path\\to\\file.dita'));
        });

        test('Should throw for empty file path', () => {
            assert.throws(() => validateFilePath(''), /Invalid file path/);
        });

        test('Should throw for whitespace-only file path', () => {
            assert.throws(() => validateFilePath('   '), /Invalid file path/);
        });

        test('Should throw for path ending with directory separator (Unix)', () => {
            assert.throws(() => validateFilePath('/path/to/directory/'), /directory/i);
        });

        test('Should throw for path ending with directory separator (Windows)', () => {
            assert.throws(() => validateFilePath('C:\\path\\to\\directory\\'), /directory/i);
        });

        test('Should throw for path without extension', () => {
            assert.throws(() => validateFilePath('/path/to/filename'), /file/i);
        });
    });

    suite('findMainHtmlFile Function', () => {

        test('Should find HTML file by base name', async () => {
            // Create a temp directory structure for testing
            const tempDir = path.join(fixturesPath, 'html-test-temp');
            const testHtmlFile = path.join(tempDir, 'test-topic.html');

            // Create temp directory and file
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            fs.writeFileSync(testHtmlFile, '<html></html>');

            try {
                const result = await findMainHtmlFile(tempDir, 'test-topic');
                assert.ok(result !== null, 'Should find the HTML file');
                assert.ok(result!.endsWith('test-topic.html'), 'Should return correct file');
            } finally {
                // Cleanup
                fs.unlinkSync(testHtmlFile);
                fs.rmdirSync(tempDir);
            }
        });

        test('Should find index.html as fallback', async () => {
            const tempDir = path.join(fixturesPath, 'html-test-temp2');
            const indexFile = path.join(tempDir, 'index.html');

            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            fs.writeFileSync(indexFile, '<html></html>');

            try {
                const result = await findMainHtmlFile(tempDir, 'nonexistent');
                assert.ok(result !== null, 'Should find index.html');
                assert.ok(result!.endsWith('index.html'), 'Should return index.html');
            } finally {
                fs.unlinkSync(indexFile);
                fs.rmdirSync(tempDir);
            }
        });

        test('Should find any HTML file as last resort', async () => {
            const tempDir = path.join(fixturesPath, 'html-test-temp3');
            const anyHtmlFile = path.join(tempDir, 'some-random.html');

            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            fs.writeFileSync(anyHtmlFile, '<html></html>');

            try {
                const result = await findMainHtmlFile(tempDir, 'different-name');
                assert.ok(result !== null, 'Should find some HTML file');
                assert.ok(result!.endsWith('.html'), 'Should return an HTML file');
            } finally {
                fs.unlinkSync(anyHtmlFile);
                fs.rmdirSync(tempDir);
            }
        });

        test('Should return null for non-existent directory', async () => {
            const result = await findMainHtmlFile('/non/existent/path', 'test');
            assert.strictEqual(result, null, 'Should return null for non-existent directory');
        });

        test('Should return null for empty directory', async () => {
            const tempDir = path.join(fixturesPath, 'html-test-empty');

            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            try {
                const result = await findMainHtmlFile(tempDir, 'test');
                assert.strictEqual(result, null, 'Should return null for empty directory');
            } finally {
                fs.rmdirSync(tempDir);
            }
        });

        test('Should return null for directory with no HTML files', async () => {
            const tempDir = path.join(fixturesPath, 'html-test-nohtml');
            const txtFile = path.join(tempDir, 'readme.txt');

            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            fs.writeFileSync(txtFile, 'text content');

            try {
                const result = await findMainHtmlFile(tempDir, 'test');
                assert.strictEqual(result, null, 'Should return null when no HTML files');
            } finally {
                fs.unlinkSync(txtFile);
                fs.rmdirSync(tempDir);
            }
        });
    });

    suite('initializePreview Function', () => {

        test('Should accept extension context without throwing', () => {
            // Create a minimal mock context
            const mockContext = {
                extensionUri: vscode.Uri.file(fixturesPath),
                subscriptions: [],
                workspaceState: {} as vscode.Memento,
                globalState: {} as vscode.Memento & { setKeysForSync: (keys: readonly string[]) => void },
                extensionPath: fixturesPath,
                storagePath: undefined,
                globalStoragePath: fixturesPath,
                logPath: fixturesPath,
                extensionMode: vscode.ExtensionMode.Test,
                storageUri: undefined,
                globalStorageUri: vscode.Uri.file(fixturesPath),
                logUri: vscode.Uri.file(fixturesPath),
                secrets: {} as vscode.SecretStorage,
                extension: {} as vscode.Extension<unknown>,
                environmentVariableCollection: {} as vscode.GlobalEnvironmentVariableCollection,
                asAbsolutePath: (p: string) => path.join(fixturesPath, p),
                languageModelAccessInformation: {} as any
            } as vscode.ExtensionContext;

            assert.doesNotThrow(() => initializePreview(mockContext));
        });
    });

    suite('Preview Command - No Active Editor', () => {
        test('Should handle no active editor gracefully', async function() {
            this.timeout(5000);

            await vscode.commands.executeCommand('workbench.action.closeAllEditors');

            try {
                await vscode.commands.executeCommand('ditacraft.previewHTML5');
            } catch (_error) {
                // Expected - no file open
                assert.ok(true, 'Command handled error gracefully');
            }
        });
    });

    suite('Preview Configuration', () => {
        test('previewAutoRefresh configuration should exist', function() {
            const config = vscode.workspace.getConfiguration('ditacraft');
            const autoRefresh = config.get<boolean>('previewAutoRefresh');

            assert.ok(autoRefresh !== undefined, 'previewAutoRefresh should be defined');
            assert.strictEqual(typeof autoRefresh, 'boolean', 'previewAutoRefresh should be boolean');
        });

        test('previewTheme configuration should exist', function() {
            const config = vscode.workspace.getConfiguration('ditacraft');
            const theme = config.get<string>('previewTheme');

            assert.ok(theme !== undefined, 'previewTheme should be defined');
            assert.ok(['auto', 'light', 'dark'].includes(theme!), 'previewTheme should be valid');
        });

        test('previewScrollSync configuration should exist', function() {
            const config = vscode.workspace.getConfiguration('ditacraft');
            const scrollSync = config.get<boolean>('previewScrollSync');

            assert.ok(scrollSync !== undefined, 'previewScrollSync should be defined');
            assert.strictEqual(typeof scrollSync, 'boolean', 'previewScrollSync should be boolean');
        });

        test('previewCustomCss configuration should exist', function() {
            const config = vscode.workspace.getConfiguration('ditacraft');
            const customCss = config.get<string>('previewCustomCss');

            assert.ok(customCss !== undefined, 'previewCustomCss should be defined');
            assert.strictEqual(typeof customCss, 'string', 'previewCustomCss should be string');
        });
    });

    suite('Auto-Refresh on Save (issue #96)', () => {
        const savedFile = path.join('C:', 'docs', 'topic.dita');

        test('Should refresh when enabled and saved file is the previewed source', function() {
            assert.strictEqual(
                shouldAutoRefreshPreview(savedFile, true, savedFile),
                true
            );
        });

        test('Should not refresh when the setting is disabled', function() {
            assert.strictEqual(
                shouldAutoRefreshPreview(savedFile, false, savedFile),
                false
            );
        });

        test('Should not refresh when no preview panel is open (no source file)', function() {
            assert.strictEqual(
                shouldAutoRefreshPreview(savedFile, true, undefined),
                false
            );
        });

        test('Should not refresh when a different file is saved', function() {
            const otherFile = path.join('C:', 'docs', 'other.dita');
            assert.strictEqual(
                shouldAutoRefreshPreview(otherFile, true, savedFile),
                false
            );
        });

        test('Should match paths that differ only by normalization', function() {
            const a = path.join('C:', 'docs', 'topic.dita');
            const b = path.join('C:', 'docs', '.', 'sub', '..', 'topic.dita');
            assert.strictEqual(
                shouldAutoRefreshPreview(a, true, b),
                true
            );
        });

        test('Should match case-insensitively on Windows/macOS (drive-letter casing)', function() {
            if (process.platform !== 'win32' && process.platform !== 'darwin') {
                this.skip();
                return;
            }
            const previewed = path.join('C:', 'Docs', 'Topic.dita');
            const saved = path.join('c:', 'docs', 'topic.dita');
            assert.strictEqual(
                shouldAutoRefreshPreview(saved, true, previewed),
                true
            );
        });
    });

    suite('computeFilterSuffix (§4.5 DITAVAL preview filtering)', () => {
        test('Should return an empty string when there is no active filter', () => {
            assert.strictEqual(computeFilterSuffix(undefined), '');
        });

        test('Should return a stable, deterministic suffix for a given .ditaval path', () => {
            const a = computeFilterSuffix(path.join(path.sep, 'workspace', 'production.ditaval'));
            const b = computeFilterSuffix(path.join(path.sep, 'workspace', 'production.ditaval'));
            assert.strictEqual(a, b, 'the same filter path should always map to the same cache suffix');
            assert.match(a, /^__filter-[0-9a-f]{8}$/);
        });

        test('Should return different suffixes for different .ditaval paths (regression: cache must not collide across filters)', () => {
            const production = computeFilterSuffix(path.join(path.sep, 'workspace', 'production.ditaval'));
            const draft = computeFilterSuffix(path.join(path.sep, 'workspace', 'draft.ditaval'));
            assert.notStrictEqual(
                production,
                draft,
                'two different filters must not resolve to the same output directory'
            );
        });
    });

    suite('pickPreviewFilterCommand (§4.5 orchestration)', () => {
        let sandbox: sinon.SinonSandbox;

        setup(() => {
            sandbox = sinon.createSandbox();
        });

        teardown(async () => {
            // Restore whatever this test itself stubbed FIRST — reusing the
            // same sandbox to stub showQuickPick again below, before this
            // restore, throws "already wrapped" (a test body's own stub is
            // still in place), which would abort the teardown before
            // reaching sandbox.restore() and leak a wrapped showQuickPick
            // into every later test in the run (regression: this is exactly
            // what broke CI the first time this suite was added).
            sandbox.restore();

            // Reset the module-level "active filter" back to none so later
            // tests (in this file and others sharing the extension host)
            // don't observe a filter left over from a prior test. Uses its
            // own throwaway sandbox rather than the (now-restored, but
            // still test-scoped) one above, to keep this reset independent
            // of whatever the test body did.
            const resetSandbox = sinon.createSandbox();
            resetSandbox.stub(vscode.window, 'showQuickPick').resolves({ label: '$(circle-slash) No filter', value: '' } as unknown as vscode.QuickPickItem);
            await pickPreviewFilterCommand();
            resetSandbox.restore();
        });

        test('Should leave the active filter unchanged when the picker is cancelled', async () => {
            sandbox.stub(vscode.window, 'showQuickPick').resolves(undefined);
            const before = getActiveDitavalPath();

            await pickPreviewFilterCommand();

            assert.strictEqual(getActiveDitavalPath(), before, 'a cancelled picker must not change the active filter');
        });

        test('Should clear the active filter when "No filter" is chosen', async () => {
            sandbox.stub(vscode.window, 'showQuickPick').resolves({ label: '$(circle-slash) No filter', value: '' } as unknown as vscode.QuickPickItem);

            await pickPreviewFilterCommand();

            assert.strictEqual(getActiveDitavalPath(), undefined);
        });

        test('Should set the active filter to the browsed .ditaval file\'s resolved path', async () => {
            const fixturesPath = path.join(__dirname, '..', '..', '..', 'src', 'test', 'fixtures');
            const ditavalFile = vscode.Uri.file(path.join(fixturesPath, 'test.ditaval'));

            sandbox.stub(vscode.window, 'showQuickPick').resolves(
                { label: '$(folder-opened) Browse for .ditaval file...', value: 'browse' } as unknown as vscode.QuickPickItem
            );
            sandbox.stub(vscode.window, 'showOpenDialog').resolves([ditavalFile]);

            await pickPreviewFilterCommand();

            assert.strictEqual(getActiveDitavalPath(), ditavalFile.fsPath);
        });

        test('Should not attempt to re-run the preview when no preview panel is currently open', async () => {
            // previewHTML5Command swallows every internal error itself
            // (handlePreviewError), so it never rejects regardless of
            // whether it actually ran — doesNotReject alone can't tell "ran
            // and failed silently" apart from "correctly skipped". Instead,
            // rely on the fact that any attempted run reaches
            // handlePreviewError -> showErrorMessage for a nonexistent
            // source file, while a correctly-skipped run never calls it.
            DitaPreviewPanel.currentPanel = undefined;
            const errorStub = sandbox.stub(vscode.window, 'showErrorMessage');
            sandbox.stub(vscode.window, 'showQuickPick').resolves({ label: '$(circle-slash) No filter', value: '' } as unknown as vscode.QuickPickItem);

            await pickPreviewFilterCommand();

            assert.strictEqual(errorStub.called, false, 'no refresh attempt should be made when no preview panel is open');
        });

        test('Should attempt to re-run the preview when a panel is already open (regression)', async () => {
            // A fake panel whose source file doesn't exist on disk — any
            // attempt to refresh it necessarily fails somewhere inside
            // previewHTML5Command's pipeline (DITA-OT not configured, or the
            // file not found), and that failure always surfaces through
            // handlePreviewError -> showErrorMessage. Its absence is what
            // the previous test guards; its presence here guards the
            // opposite regression — silently dropping the refresh entirely.
            const fakeSourceFile = path.join(fixturesPath, 'does-not-exist-preview-filter-regression.dita');
            DitaPreviewPanel.currentPanel = { getSourceFile: () => fakeSourceFile } as unknown as DitaPreviewPanel;
            const errorStub = sandbox.stub(vscode.window, 'showErrorMessage').resolves(undefined);
            sandbox.stub(vscode.window, 'showQuickPick').resolves({ label: '$(circle-slash) No filter', value: '' } as unknown as vscode.QuickPickItem);

            await pickPreviewFilterCommand();

            assert.strictEqual(errorStub.called, true, 'an open preview panel should trigger a refresh attempt');
            DitaPreviewPanel.currentPanel = undefined;
        });
    });
});
