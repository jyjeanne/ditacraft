/* eslint-disable no-throw-literal */
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { setupCSpellCommand } from '../../commands/cspellSetupCommand';

suite('cSpell Setup Command Tests', () => {

    let sandbox: sinon.SinonSandbox;
    let showErrorMessageStub: sinon.SinonStub;
    let showInformationMessageStub: sinon.SinonStub;
    let executeCommandStub: sinon.SinonStub;
    let openTextDocumentStub: sinon.SinonStub;
    let showTextDocumentStub: sinon.SinonStub;

    setup(() => {
        sandbox = sinon.createSandbox();

        // Ensure test-workspace directory exists
        const testWorkspacePath = path.join(__dirname, '..', '..', '..', 'test-workspace');
        if (!fs.existsSync(testWorkspacePath)) {
            fs.mkdirSync(testWorkspacePath, { recursive: true });
        }

        // Stub VS Code methods
        showErrorMessageStub = sandbox.stub(vscode.window, 'showErrorMessage');
        showInformationMessageStub = sandbox.stub(vscode.window, 'showInformationMessage');
        executeCommandStub = sandbox.stub(vscode.commands, 'executeCommand');
        openTextDocumentStub = sandbox.stub(vscode.workspace, 'openTextDocument');
        showTextDocumentStub = sandbox.stub(vscode.window, 'showTextDocument');

        // Mock workspace folders
        sandbox.stub(vscode.workspace, 'workspaceFolders').value([{
            uri: { fsPath: testWorkspacePath },
            name: 'test-workspace',
            index: 0
        }]);
    });

    teardown(() => {
        sandbox.restore();

        // Clean up test files
        const testConfigPath = path.join(__dirname, '..', '..', '..', 'test-workspace', '.cspellrc.json');
        if (fs.existsSync(testConfigPath)) {
            fs.unlinkSync(testConfigPath);
        }
    });

    suite('No Existing Config Tests', () => {

        test('should create cSpell config when none exists', async () => {
            // Mock user choice to select 'Done'
            showInformationMessageStub.onFirstCall().resolves('Done');

            await setupCSpellCommand();

            // Verify config was created
            const testConfigPath = path.join(__dirname, '..', '..', '..', 'test-workspace', '.cspellrc.json');
            assert.ok(fs.existsSync(testConfigPath), 'cSpell config should be created');

            // Verify success message was shown
            assert.ok(showInformationMessageStub.calledWithMatch('cSpell configuration created'), 
                     'Should show success message');
        });

        test('should handle Install cSpell choice', async () => {
            // Mock user choice to select 'Install cSpell'
            showInformationMessageStub.onFirstCall().resolves('Install cSpell');

            await setupCSpellCommand();

            // Verify config was created
            const testConfigPath = path.join(__dirname, '..', '..', '..', 'test-workspace', '.cspellrc.json');
            assert.ok(fs.existsSync(testConfigPath), 'cSpell config should be created');

            // Verify install command was executed
            assert.ok(executeCommandStub.calledWithMatch('workbench.extensions.installExtension'), 
                     'Should attempt to install cSpell extension');
        });

        test('should handle Open Config File choice', async () => {
            // Mock user choice to select 'Open Config File'
            showInformationMessageStub.onFirstCall().resolves('Open Config File');

            // Mock document opening
            const mockDocument = { uri: { fsPath: 'test-path' } };
            openTextDocumentStub.resolves(mockDocument as any);

            await setupCSpellCommand();

            // Verify config was created
            const testConfigPath = path.join(__dirname, '..', '..', '..', 'test-workspace', '.cspellrc.json');
            assert.ok(fs.existsSync(testConfigPath), 'cSpell config should be created');

            // Verify document was opened
            assert.ok(openTextDocumentStub.called, 'Should open the config file');
            assert.ok(showTextDocumentStub.called, 'Should show the config file');
        });
    });

    suite('Existing Config Tests', () => {

        setup(() => {
            // Create a test config file before each test
            const testConfigPath = path.join(__dirname, '..', '..', '..', 'test-workspace', '.cspellrc.json');
            fs.writeFileSync(testConfigPath, '{"version": "0.2", "language": "en"}');
        });

        test('should handle Keep Current choice', async () => {
            // Mock user choice to select 'Keep Current'
            showInformationMessageStub.onFirstCall().resolves('Keep Current');

            await setupCSpellCommand();

            // Verify no changes were made to existing config
            const testConfigPath = path.join(__dirname, '..', '..', '..', 'test-workspace', '.cspellrc.json');
            const content = fs.readFileSync(testConfigPath, 'utf-8');
            assert.strictEqual(content, '{"version": "0.2", "language": "en"}', 
                             'Existing config should not be modified');
        });

        test('should handle Replace with DitaCraft Config choice', async () => {
            // Mock user choice to select 'Replace with DitaCraft Config'
            showInformationMessageStub.onFirstCall().resolves('Replace with DitaCraft Config');

            await setupCSpellCommand();

            // Verify config was replaced
            const testConfigPath = path.join(__dirname, '..', '..', '..', 'test-workspace', '.cspellrc.json');
            const content = fs.readFileSync(testConfigPath, 'utf-8');
            const config = JSON.parse(content);

            // Should contain DITA-related words
            assert.ok(config.words && config.words.includes('dita'),
                     'Config should contain DITA vocabulary');
        });

        test('should handle Open Existing File choice', async () => {
            // Mock user choice to select 'Open Existing File'
            showInformationMessageStub.onFirstCall().resolves('Open Existing File');

            // Mock document opening
            const mockDocument = { uri: { fsPath: 'test-path' } };
            openTextDocumentStub.resolves(mockDocument as any);

            await setupCSpellCommand();

            // Verify document was opened
            assert.ok(openTextDocumentStub.called, 'Should open the existing config file');
            assert.ok(showTextDocumentStub.called, 'Should show the existing config file');
        });
    });

    suite('Error Handling Tests', () => {

        test('should handle no workspace folders', async () => {
            // Mock no workspace folders
            sandbox.stub(vscode.workspace, 'workspaceFolders').value(undefined);

            await setupCSpellCommand();

            // Verify error message was shown
            assert.ok(showErrorMessageStub.calledWithMatch('No workspace folder open'), 
                     'Should show error when no workspace is open');
        });

        // Skip tests that require stubbing non-configurable fs methods
        // These tests would require dependency injection or module mocking
        test.skip('should handle file system errors', async () => {
            // Note: fs.existsSync is non-configurable in modern Node.js
            // This test would require refactoring the command to use injectable fs
        });

        test.skip('should handle template file not found', async () => {
            // Note: fs.readFileSync is non-configurable in modern Node.js
            // This test would require refactoring the command to use injectable fs
        });
    });

    suite('Configuration Content Tests', () => {

        test('should create config with DITA vocabulary', async () => {
            // Mock user choice to select 'Done'
            showInformationMessageStub.onFirstCall().resolves('Done');

            await setupCSpellCommand();

            // Verify config content
            const testConfigPath = path.join(__dirname, '..', '..', '..', 'test-workspace', '.cspellrc.json');
            const content = fs.readFileSync(testConfigPath, 'utf-8');
            const config = JSON.parse(content);

            // Should have basic structure
            assert.ok(config.version, 'Config should have version');
            assert.ok(config.language, 'Config should have language');
            assert.ok(config.words, 'Config should have words array');

            // Should contain DITA-specific words (lowercase in template)
            const words = config.words;
            assert.ok(words.includes('dita'), 'Should include dita');
            assert.ok(words.includes('ditamap'), 'Should include ditamap');
            assert.ok(words.includes('bookmap'), 'Should include bookmap');
        });

        test('should create config with proper structure', async () => {
            // Mock user choice to select 'Done'
            showInformationMessageStub.onFirstCall().resolves('Done');

            await setupCSpellCommand();

            // Verify config structure
            const testConfigPath = path.join(__dirname, '..', '..', '..', 'test-workspace', '.cspellrc.json');
            const content = fs.readFileSync(testConfigPath, 'utf-8');
            const config = JSON.parse(content);

            // Should be valid JSON
            assert.doesNotThrow(() => JSON.parse(content), 'Config should be valid JSON');

            // Should have expected properties
            assert.ok(config.version === '0.2', 'Should have correct version');
            assert.ok(config.language === 'en', 'Should have English language');
        });
    });
});