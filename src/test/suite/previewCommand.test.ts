/**
 * Preview Command Test Suite
 * Tests for HTML5 preview command functionality
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import {
    validateFilePath,
    findMainHtmlFile,
    initializePreview
} from '../../commands/previewCommand';

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
                languageModelAccessInformation: {} as vscode.LanguageModelAccessInformation
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
});
