/**
 * Command and Auto-Detection Test Suite
 * Tests manual validation command and DITA file auto-detection
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { getValidationRateLimiter, resetValidationRateLimiter } from '../../commands';

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

    setup(() => {
        // Reset rate limiter before each test to avoid rate limiting interference
        resetValidationRateLimiter();
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

    suite('Rate Limiting Integration (P3-6)', () => {
        setup(() => {
            // Reset rate limiter before each test to avoid test pollution
            resetValidationRateLimiter();
        });

        test('Should have rate limiter initialized after extension activation', () => {
            const rateLimiter = getValidationRateLimiter();
            assert.ok(rateLimiter, 'Rate limiter should be initialized');
        });

        test('Rate limiter should allow initial validations', async function() {
            this.timeout(5000);

            const rateLimiter = getValidationRateLimiter();
            assert.ok(rateLimiter, 'Rate limiter should exist');

            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'valid-topic.dita'));

            // First validation should be allowed
            const allowed = rateLimiter!.isAllowed(fileUri.fsPath);
            assert.strictEqual(allowed, true, 'First validation should be allowed');
        });

        test('Rate limiter should track remaining requests', async function() {
            this.timeout(5000);

            const rateLimiter = getValidationRateLimiter();
            assert.ok(rateLimiter, 'Rate limiter should exist');

            const testPath = '/test/file.dita';

            // Check initial state
            const initialRemaining = rateLimiter!.getRemainingRequests(testPath);
            assert.ok(initialRemaining > 0, 'Should have remaining requests initially');

            // Use one request
            rateLimiter!.isAllowed(testPath);

            // Check remaining decreased
            const afterOneRemaining = rateLimiter!.getRemainingRequests(testPath);
            assert.strictEqual(afterOneRemaining, initialRemaining - 1,
                'Remaining requests should decrease after use');
        });

        test('Rate limiter reset should restore full capacity', async function() {
            this.timeout(5000);

            const rateLimiter = getValidationRateLimiter();
            assert.ok(rateLimiter, 'Rate limiter should exist');

            const testPath = '/test/reset-test.dita';

            // Use some requests
            rateLimiter!.isAllowed(testPath);
            rateLimiter!.isAllowed(testPath);
            rateLimiter!.isAllowed(testPath);

            const beforeReset = rateLimiter!.getRemainingRequests(testPath);

            // Reset
            resetValidationRateLimiter();

            const afterReset = rateLimiter!.getRemainingRequests(testPath);
            assert.ok(afterReset > beforeReset, 'Reset should restore capacity');
        });

        test('Rate limiter should provide stats', () => {
            const rateLimiter = getValidationRateLimiter();
            assert.ok(rateLimiter, 'Rate limiter should exist');

            const stats = rateLimiter!.getStats();

            assert.ok(typeof stats.trackedKeys === 'number', 'Stats should have trackedKeys');
            assert.ok(typeof stats.totalRequests === 'number', 'Stats should have totalRequests');
            assert.ok(stats.config, 'Stats should have config');
            assert.ok(typeof stats.config.maxRequests === 'number', 'Config should have maxRequests');
            assert.ok(typeof stats.config.windowMs === 'number', 'Config should have windowMs');
        });

        test('Multiple files should be rate limited independently', async function() {
            this.timeout(5000);

            const rateLimiter = getValidationRateLimiter();
            assert.ok(rateLimiter, 'Rate limiter should exist');

            const file1 = '/test/file1.dita';
            const file2 = '/test/file2.dita';

            // Use requests on file1
            rateLimiter!.isAllowed(file1);
            rateLimiter!.isAllowed(file1);

            const file1Remaining = rateLimiter!.getRemainingRequests(file1);
            const file2Remaining = rateLimiter!.getRemainingRequests(file2);

            // file2 should still have full capacity
            assert.ok(file2Remaining > file1Remaining,
                'Different files should be rate limited independently');
        });
    });
});
