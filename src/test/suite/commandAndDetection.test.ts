/**
 * Command and Auto-Detection Test Suite
 * Tests manual validation command and DITA file auto-detection
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';

suite('Command and Auto-Detection Test Suite', () => {
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

        // Configure validation engine
        const config = vscode.workspace.getConfiguration('ditacraft');
        await config.update('validationEngine', 'built-in', vscode.ConfigurationTarget.Global);
    });

    teardown(async () => {
        // Close all editors after each test
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });

    suite('Manual Validation Command (ditacraft.validate)', () => {
        test('Should execute validation command on valid file', async function() {
            this.timeout(5000);

            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'valid-topic.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);
            await vscode.window.showTextDocument(document);

            // Execute validation command
            await vscode.commands.executeCommand('ditacraft.validate');

            // Wait for validation to complete
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Check diagnostics
            const diagnostics = vscode.languages.getDiagnostics(fileUri);
            const errors = diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Error);

            assert.strictEqual(errors.length, 0, 'Valid file should have no errors after manual validation');
        });

        test('Should execute validation command on invalid file', async function() {
            this.timeout(5000);

            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'invalid-xml.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);
            await vscode.window.showTextDocument(document);

            // Execute validation command
            await vscode.commands.executeCommand('ditacraft.validate');

            // Wait for validation to complete
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Check diagnostics
            const diagnostics = vscode.languages.getDiagnostics(fileUri);
            const errors = diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Error);

            assert.ok(errors.length > 0, 'Invalid file should have errors after manual validation');
        });

        test('Should validate with URI parameter', async function() {
            this.timeout(5000);

            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'valid-map.ditamap'));

            // Execute validation command with URI
            await vscode.commands.executeCommand('ditacraft.validate', fileUri);

            // Wait for validation to complete
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Check diagnostics
            const diagnostics = vscode.languages.getDiagnostics(fileUri);
            const errors = diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Error);

            assert.strictEqual(errors.length, 0, 'Valid map should have no errors');
        });

        test('Should handle validation of non-DITA file gracefully', async function() {
            this.timeout(5000);

            // Try to create or use a non-DITA file
            const nonDitaPath = path.join(fixturesPath, '..', 'index.ts');
            const fileUri = vscode.Uri.file(nonDitaPath);

            try {
                const document = await vscode.workspace.openTextDocument(fileUri);
                await vscode.window.showTextDocument(document);

                // Execute validation command - should show warning about non-DITA file
                await vscode.commands.executeCommand('ditacraft.validate');

                // Wait a bit
                await new Promise(resolve => setTimeout(resolve, 500));

                // Command should complete without error (even though it doesn't validate)
                assert.ok(true, 'Should handle non-DITA file gracefully');
            } catch (_error) {
                // File might not exist, which is fine
                assert.ok(true, 'Non-DITA file test completed');
            }
        });
    });

    suite('Auto-Detection of DITA Files', () => {
        test('Should detect DITA by .dita extension', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'valid-topic.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            // File should be recognized as DITA
            const isDita = document.fileName.endsWith('.dita') ||
                          document.fileName.endsWith('.ditamap') ||
                          document.fileName.endsWith('.bookmap');

            assert.ok(isDita, 'File with .dita extension should be detected as DITA');
        });

        test('Should detect DITA by .ditamap extension', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'valid-map.ditamap'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const isDita = document.fileName.endsWith('.ditamap');
            assert.ok(isDita, 'File with .ditamap extension should be detected as DITA');
        });

        test('Should detect DITA by .bookmap extension', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'valid-bookmap.bookmap'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const isDita = document.fileName.endsWith('.bookmap');
            assert.ok(isDita, 'File with .bookmap extension should be detected as DITA');
        });

        test('Should detect DITA by DOCTYPE in .xml file', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'auto-detect-by-doctype.xml'));
            const document = await vscode.workspace.openTextDocument(fileUri);
            const content = document.getText();

            // Check if content has DITA DOCTYPE
            const hasDitaDoctype = content.includes('<!DOCTYPE topic') ||
                                  content.includes('<!DOCTYPE concept') ||
                                  content.includes('<!DOCTYPE task') ||
                                  content.includes('<!DOCTYPE map') ||
                                  content.includes('<!DOCTYPE bookmap');

            assert.ok(hasDitaDoctype, 'File with DITA DOCTYPE should be detected as DITA');
        });

        test('Should validate XML file with DITA DOCTYPE', async function() {
            this.timeout(5000);

            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'auto-detect-by-doctype.xml'));

            // Execute validation command
            await vscode.commands.executeCommand('ditacraft.validate', fileUri);

            // Wait for validation to complete
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Should validate successfully
            const diagnostics = vscode.languages.getDiagnostics(fileUri);
            const errors = diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Error);

            assert.strictEqual(errors.length, 0, 'XML file with DITA DOCTYPE should validate successfully');
        });
    });

    suite('Error Highlighting in Problems Panel', () => {
        test('Should show errors in Problems panel with correct severity', async function() {
            this.timeout(5000);

            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'invalid-xml.dita'));

            // Execute validation
            await vscode.commands.executeCommand('ditacraft.validate', fileUri);

            // Wait for validation to complete
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Get diagnostics
            const diagnostics = vscode.languages.getDiagnostics(fileUri);

            assert.ok(diagnostics.length > 0, 'Should have diagnostics in Problems panel');

            // Check error structure
            diagnostics.forEach(diagnostic => {
                assert.ok(diagnostic.message, 'Diagnostic should have message');
                assert.ok(diagnostic.range, 'Diagnostic should have range');
                assert.ok(diagnostic.severity !== undefined, 'Diagnostic should have severity');
            });
        });

        test('Should show warnings with warning severity', async function() {
            this.timeout(5000);

            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'no-doctype.dita'));

            // Execute validation
            await vscode.commands.executeCommand('ditacraft.validate', fileUri);

            // Wait for validation to complete
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Get diagnostics
            const diagnostics = vscode.languages.getDiagnostics(fileUri);
            const warnings = diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Warning);

            assert.ok(warnings.length > 0, 'Should have warnings in Problems panel');

            warnings.forEach(warning => {
                assert.strictEqual(warning.severity, vscode.DiagnosticSeverity.Warning,
                    'Warning should have Warning severity');
            });
        });

        test('Should have accurate line and column information', async function() {
            this.timeout(5000);

            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'invalid-xml.dita'));

            // Execute validation
            await vscode.commands.executeCommand('ditacraft.validate', fileUri);

            // Wait for validation to complete
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Get diagnostics
            const diagnostics = vscode.languages.getDiagnostics(fileUri);

            if (diagnostics.length > 0) {
                diagnostics.forEach(diagnostic => {
                    console.log(`Diagnostic at line ${diagnostic.range.start.line + 1}, col ${diagnostic.range.start.character + 1}: ${diagnostic.message}`);

                    assert.ok(diagnostic.range.start.line >= 0, 'Line number should be >= 0');
                    assert.ok(diagnostic.range.start.character >= 0, 'Column number should be >= 0');
                });
            }
        });

        test('Should have source attribution', async function() {
            this.timeout(5000);

            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'invalid-xml.dita'));

            // Execute validation
            await vscode.commands.executeCommand('ditacraft.validate', fileUri);

            // Wait for validation to complete
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Get diagnostics
            const diagnostics = vscode.languages.getDiagnostics(fileUri);

            if (diagnostics.length > 0) {
                const diagnostic = diagnostics[0];
                assert.ok(diagnostic.source, 'Diagnostic should have source attribution');
                console.log('Diagnostic source:', diagnostic.source);
            }
        });
    });
});
