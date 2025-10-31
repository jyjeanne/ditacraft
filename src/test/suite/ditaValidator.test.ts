/**
 * Unit Tests for DitaValidator
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { DitaValidator } from '../../providers/ditaValidator';

suite('DitaValidator Test Suite', () => {
    let validator: DitaValidator;
    const fixturesPath = path.join(__dirname, '..', 'fixtures');

    suiteSetup(async () => {
        // Configure to use built-in validation for tests
        // (xmllint may not be available or properly configured in CI)
        const config = vscode.workspace.getConfiguration('ditacraft');
        await config.update('validationEngine', 'built-in', vscode.ConfigurationTarget.Global);

        validator = new DitaValidator();
    });

    suiteTeardown(() => {
        validator.dispose();
    });

    suite('Valid DITA Files', () => {
        test('Should validate a valid DITA topic', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'valid-topic.dita'));
            const result = await validator.validateFile(fileUri);

            assert.strictEqual(result.valid, true, 'Topic should be valid');
            assert.strictEqual(result.errors.length, 0, 'Should have no errors');
        });

        test('Should validate a valid DITA map', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'valid-map.ditamap'));
            const result = await validator.validateFile(fileUri);

            assert.strictEqual(result.valid, true, 'Map should be valid');
            assert.strictEqual(result.errors.length, 0, 'Should have no errors');
        });

        test('Should validate a valid bookmap', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'valid-bookmap.bookmap'));
            const result = await validator.validateFile(fileUri);

            assert.strictEqual(result.valid, true, 'Bookmap should be valid');
            assert.strictEqual(result.errors.length, 0, 'Should have no errors');
        });
    });

    suite('Invalid XML', () => {
        test('Should detect XML syntax errors', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'invalid-xml.dita'));
            const result = await validator.validateFile(fileUri);

            assert.strictEqual(result.valid, false, 'Should be invalid');
            assert.ok(result.errors.length > 0, 'Should have at least one error');
        });

        test('Should report non-existent file', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'non-existent.dita'));
            const result = await validator.validateFile(fileUri);

            assert.strictEqual(result.valid, false, 'Should be invalid');
            assert.strictEqual(result.errors.length, 1, 'Should have one error');
            assert.ok(result.errors[0].message.includes('does not exist'), 'Error should mention file does not exist');
        });
    });

    suite('DITA-Specific Validation', () => {
        test('Should warn about missing DOCTYPE', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'no-doctype.dita'));
            const result = await validator.validateFile(fileUri);

            const doctypeWarning = result.warnings.find(w =>
                w.message.includes('DOCTYPE')
            );
            assert.ok(doctypeWarning, 'Should have DOCTYPE warning');
        });

        test('Should warn about empty elements', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'empty-elements.dita'));
            const result = await validator.validateFile(fileUri);

            const emptyWarnings = result.warnings.filter(w =>
                w.message.includes('Empty')
            );
            assert.ok(emptyWarnings.length > 0, 'Should have empty element warnings');
        });
    });

    suite('Diagnostic Collection', () => {
        test('Should update diagnostics for errors', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'invalid-xml.dita'));
            await validator.validateFile(fileUri);

            const diagnostics = vscode.languages.getDiagnostics(fileUri);
            assert.ok(diagnostics.length > 0, 'Should have diagnostics');
        });

        test('Should clear diagnostics for valid files', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'valid-topic.dita'));
            await validator.validateFile(fileUri);

            // Valid file should have no error diagnostics, only warnings if any
            const diagnostics = vscode.languages.getDiagnostics(fileUri);
            const errors = diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Error);
            assert.strictEqual(errors.length, 0, 'Should have no error diagnostics');
        });

        test('Should clear diagnostics manually', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'invalid-xml.dita'));
            await validator.validateFile(fileUri);

            validator.clearDiagnostics(fileUri);
            const diagnostics = vscode.languages.getDiagnostics(fileUri);
            assert.strictEqual(diagnostics.length, 0, 'Diagnostics should be cleared');
        });
    });

    suite('Validation Error Structure', () => {
        test('Validation errors should have required fields', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'invalid-xml.dita'));
            const result = await validator.validateFile(fileUri);

            if (result.errors.length > 0) {
                const error = result.errors[0];
                assert.ok(typeof error.line === 'number', 'Error should have line number');
                assert.ok(typeof error.column === 'number', 'Error should have column number');
                assert.ok(error.severity, 'Error should have severity');
                assert.ok(error.message, 'Error should have message');
                assert.ok(error.source, 'Error should have source');
            }
        });

        test('Warnings should have correct severity', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'no-doctype.dita'));
            const result = await validator.validateFile(fileUri);

            const warnings = result.warnings.filter(w => w.severity === 'warning');
            assert.ok(warnings.length > 0, 'Should have warnings with warning severity');
        });
    });

    suite('DITA Topic Validation', () => {
        test('Should accept valid topic root elements', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'valid-topic.dita'));
            const result = await validator.validateFile(fileUri);

            const rootError = result.errors.find(e =>
                e.message.includes('root element')
            );
            assert.strictEqual(rootError, undefined, 'Should not have root element error');
        });
    });

    suite('DITA Map Validation', () => {
        test('Should validate map structure', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'valid-map.ditamap'));
            const result = await validator.validateFile(fileUri);

            const mapError = result.errors.find(e =>
                e.message.includes('<map> root element')
            );
            assert.strictEqual(mapError, undefined, 'Should not have map root error');
        });
    });

    suite('DITA Bookmap Validation', () => {
        test('Should validate bookmap structure', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'valid-bookmap.bookmap'));
            const result = await validator.validateFile(fileUri);

            const bookmapError = result.errors.find(e =>
                e.message.includes('<bookmap> root element')
            );
            assert.strictEqual(bookmapError, undefined, 'Should not have bookmap root error');

            const booktitleWarning = result.warnings.find(w =>
                w.message.includes('<booktitle>')
            );
            assert.strictEqual(booktitleWarning, undefined, 'Should not have booktitle warning for valid bookmap');
        });
    });

    suite('Performance', () => {
        test('Should validate within reasonable time', async function() {
            this.timeout(5000); // 5 second timeout

            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'valid-topic.dita'));
            const startTime = Date.now();

            await validator.validateFile(fileUri);

            const duration = Date.now() - startTime;
            assert.ok(duration < 1000, `Validation should complete in less than 1 second (took ${duration}ms)`);
        });
    });

    suite('Multiple Validations', () => {
        test('Should handle multiple validations in sequence', async () => {
            const files = [
                'valid-topic.dita',
                'valid-map.ditamap',
                'valid-bookmap.bookmap'
            ];

            for (const file of files) {
                const fileUri = vscode.Uri.file(path.join(fixturesPath, file));
                const result = await validator.validateFile(fileUri);
                assert.strictEqual(result.valid, true, `${file} should be valid`);
            }
        });
    });
});
