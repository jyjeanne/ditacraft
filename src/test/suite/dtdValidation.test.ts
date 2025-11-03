/**
 * DTD Validation Test Suite
 * Tests DTD resolution and DTD-based validation
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { DitaValidator } from '../../providers/ditaValidator';
import { DtdResolver } from '../../utils/dtdResolver';

suite('DTD Validation Test Suite', () => {
    let validator: DitaValidator;
    let dtdResolver: DtdResolver;
    const fixturesPath = path.join(__dirname, '..', '..', '..', 'src', 'test', 'fixtures');
    let extensionContext: vscode.ExtensionContext;

    suiteSetup(async () => {
        // Get extension context
        const extension = vscode.extensions.getExtension('JeremyJeanne.ditacraft');
        if (!extension) {
            throw new Error('Extension not found');
        }

        // Activate extension if not already activated
        if (!extension.isActive) {
            await extension.activate();
        }

        extensionContext = extension.exports?.context || {
            extensionPath: path.join(__dirname, '..', '..', '..')
        } as vscode.ExtensionContext;

        // Configure to use built-in validation (which includes DTD validation)
        const config = vscode.workspace.getConfiguration('ditacraft');
        await config.update('validationEngine', 'built-in', vscode.ConfigurationTarget.Global);

        validator = new DitaValidator(extensionContext);
        dtdResolver = new DtdResolver(extensionContext.extensionPath);
    });

    suiteTeardown(() => {
        validator.dispose();
    });

    suite('DTD Resolution', () => {
        test('Should load bundled DTD files from extension', () => {
            const available = dtdResolver.areDtdsAvailable();
            assert.strictEqual(available, true, 'DTDs should be available');
        });

        test('Should resolve DITA 1.3 Concept PUBLIC ID', () => {
            const publicId = '-//OASIS//DTD DITA 1.3 Concept//EN';
            const resolved = dtdResolver.resolvePublicId(publicId);

            assert.ok(resolved, 'Should resolve concept DTD');
            assert.ok(resolved?.includes('concept.dtd'), 'Should point to concept.dtd');
        });

        test('Should resolve DITA 1.3 Task PUBLIC ID', () => {
            const publicId = '-//OASIS//DTD DITA 1.3 Task//EN';
            const resolved = dtdResolver.resolvePublicId(publicId);

            assert.ok(resolved, 'Should resolve task DTD');
            assert.ok(resolved?.includes('task.dtd'), 'Should point to task.dtd');
        });

        test('Should resolve DITA 1.3 Topic PUBLIC ID', () => {
            const publicId = '-//OASIS//DTD DITA 1.3 Topic//EN';
            const resolved = dtdResolver.resolvePublicId(publicId);

            assert.ok(resolved, 'Should resolve topic DTD');
            assert.ok(resolved?.includes('topic.dtd'), 'Should point to topic.dtd');
        });

        test('Should resolve DITA Map PUBLIC ID', () => {
            const publicId = '-//OASIS//DTD DITA 1.3 Map//EN';
            const resolved = dtdResolver.resolvePublicId(publicId);

            assert.ok(resolved, 'Should resolve map DTD');
            assert.ok(resolved?.includes('map.dtd'), 'Should point to map.dtd');
        });

        test('Should resolve DITA BookMap PUBLIC ID', () => {
            const publicId = '-//OASIS//DTD DITA 1.3 BookMap//EN';
            const resolved = dtdResolver.resolvePublicId(publicId);

            assert.ok(resolved, 'Should resolve bookmap DTD');
            assert.ok(resolved?.includes('bookmap.dtd'), 'Should point to bookmap.dtd');
        });

        test('Should return null for unknown PUBLIC ID', () => {
            const publicId = '-//UNKNOWN//DTD Test//EN';
            const resolved = dtdResolver.resolvePublicId(publicId);

            assert.strictEqual(resolved, null, 'Should return null for unknown PUBLIC ID');
        });

        test('Should get DTD content from resolved path', () => {
            const publicId = '-//OASIS//DTD DITA 1.3 Concept//EN';
            const content = dtdResolver.getDtdContent(publicId);

            assert.ok(content, 'Should get DTD content');
            assert.ok(content!.includes('concept'), 'DTD content should include concept definitions');
        });
    });

    suite('DTD-Based Validation', () => {
        test('Should validate valid DITA concept with DTD', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'dtd-valid-concept.dita'));
            const result = await validator.validateFile(fileUri);

            console.log('DTD validation result for valid concept:');
            console.log('- valid:', result.valid);
            console.log('- errors:', JSON.stringify(result.errors, null, 2));
            console.log('- warnings:', JSON.stringify(result.warnings, null, 2));

            assert.strictEqual(result.valid, true, 'Valid concept should pass DTD validation');
        });

        test('Should detect missing required ID attribute', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'dtd-invalid-missing-id.dita'));
            const result = await validator.validateFile(fileUri);

            console.log('DTD validation result for missing ID:');
            console.log('- valid:', result.valid);
            console.log('- errors:', JSON.stringify(result.errors, null, 2));

            assert.strictEqual(result.valid, false, 'Should detect missing ID attribute');
            assert.ok(result.errors.length > 0, 'Should have at least one error');

            const idError = result.errors.find(e =>
                e.message.toLowerCase().includes('id')
            );
            assert.ok(idError, 'Should have error related to missing id attribute');
        });

        test('Should detect missing required title element', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'dtd-invalid-missing-title.dita'));
            const result = await validator.validateFile(fileUri);

            console.log('DTD validation result for missing title:');
            console.log('- valid:', result.valid);
            console.log('- errors:', JSON.stringify(result.errors, null, 2));

            assert.strictEqual(result.valid, false, 'Should detect missing title element');
            assert.ok(result.errors.length > 0, 'Should have at least one error');

            const titleError = result.errors.find(e =>
                e.message.toLowerCase().includes('title')
            );
            assert.ok(titleError, 'Should have error related to missing title');
        });
    });

    suite('DTD Caching', () => {
        test('Should cache DTD content after first load', () => {
            const publicId = '-//OASIS//DTD DITA 1.3 Reference//EN';

            // First load
            const content1 = dtdResolver.getDtdContent(publicId);

            // Second load (should be from cache)
            const content2 = dtdResolver.getDtdContent(publicId);

            assert.strictEqual(content1, content2, 'Content should be the same from cache');
        });
    });

    suite('Error Reporting with Line/Column', () => {
        test('Validation errors should include line and column numbers', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'invalid-xml.dita'));
            const result = await validator.validateFile(fileUri);

            if (result.errors.length > 0) {
                const error = result.errors[0];
                assert.ok(typeof error.line === 'number', 'Error should have line number');
                assert.ok(typeof error.column === 'number', 'Error should have column number');
                assert.ok(error.line >= 0, 'Line number should be >= 0');
                assert.ok(error.column >= 0, 'Column number should be >= 0');
            }
        });

        test('Should report line numbers for DTD errors', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'dtd-invalid-missing-id.dita'));
            const result = await validator.validateFile(fileUri);

            console.log('Line/column accuracy test:');
            result.errors.forEach((error, idx) => {
                console.log(`Error ${idx + 1}: Line ${error.line + 1}, Col ${error.column + 1}: ${error.message}`);
            });

            // Errors should have valid line numbers (>= 0)
            // Note: Structural errors (like missing id) often report line 0
            // XML parsing errors typically report the actual line number
            if (result.errors.length > 0) {
                result.errors.forEach(error => {
                    assert.ok(typeof error.line === 'number', 'Error should have line number');
                    assert.ok(error.line >= 0, 'Line number should be >= 0');
                });
            }
        });
    });
});
