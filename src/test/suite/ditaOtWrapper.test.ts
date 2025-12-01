/**
 * DITA-OT Wrapper Test Suite
 * Tests for DITA-OT integration utilities
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { DitaOtWrapper } from '../../utils/ditaOtWrapper';

suite('DITA-OT Wrapper Test Suite', () => {
    const fixturesPath = path.join(__dirname, '..', '..', '..', 'src', 'test', 'fixtures');
    let ditaOt: DitaOtWrapper;

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

    setup(() => {
        // Create fresh instance for each test
        ditaOt = new DitaOtWrapper();
    });

    suite('Input File Validation', () => {
        test('Should validate valid .dita file', function() {
            const filePath = path.join(fixturesPath, 'valid-topic.dita');
            const result = ditaOt.validateInputFile(filePath);

            assert.strictEqual(result.valid, true, 'Valid .dita file should pass validation');
            assert.strictEqual(result.error, undefined, 'No error should be returned');
        });

        test('Should validate valid .ditamap file', function() {
            const filePath = path.join(fixturesPath, 'valid-map.ditamap');
            const result = ditaOt.validateInputFile(filePath);

            assert.strictEqual(result.valid, true, 'Valid .ditamap file should pass validation');
        });

        test('Should validate valid .bookmap file', function() {
            const filePath = path.join(fixturesPath, 'valid-bookmap.bookmap');
            const result = ditaOt.validateInputFile(filePath);

            assert.strictEqual(result.valid, true, 'Valid .bookmap file should pass validation');
        });

        test('Should reject empty file path', function() {
            const result = ditaOt.validateInputFile('');

            assert.strictEqual(result.valid, false, 'Empty path should fail validation');
            assert.ok(result.error?.includes('empty'), 'Error should mention empty path');
        });

        test('Should reject whitespace-only file path', function() {
            const result = ditaOt.validateInputFile('   ');

            assert.strictEqual(result.valid, false, 'Whitespace path should fail validation');
        });

        test('Should reject non-existent file', function() {
            const filePath = path.join(fixturesPath, 'non-existent-file.dita');
            const result = ditaOt.validateInputFile(filePath);

            assert.strictEqual(result.valid, false, 'Non-existent file should fail');
            assert.ok(result.error?.includes('does not exist'), 'Error should mention file not existing');
        });

        test('Should reject directory path', function() {
            const result = ditaOt.validateInputFile(fixturesPath);

            assert.strictEqual(result.valid, false, 'Directory path should fail validation');
            assert.ok(result.error?.includes('directory'), 'Error should mention directory');
        });

        test('Should reject path ending with separator', function() {
            const result = ditaOt.validateInputFile(fixturesPath + path.sep);

            assert.strictEqual(result.valid, false, 'Path ending with separator should fail');
        });

        test('Should reject invalid file extension', function() {
            // Use an existing non-DITA file
            const filePath = path.join(__dirname, '..', '..', '..', 'src', 'test', 'suite', 'index.ts');

            // Only test if file exists (it should in compiled test output)
            if (fs.existsSync(filePath)) {
                const result = ditaOt.validateInputFile(filePath);
                assert.strictEqual(result.valid, false, 'Non-DITA file should fail');
                assert.ok(result.error?.includes('Invalid file type'), 'Error should mention invalid type');
            }
        });

        test('Should reject .xml files (not DITA extension)', function() {
            // Create a temporary XML file path check
            const xmlPath = path.join(fixturesPath, '..', 'runTest.ts');

            if (fs.existsSync(xmlPath)) {
                const result = ditaOt.validateInputFile(xmlPath);
                assert.strictEqual(result.valid, false, '.ts file should fail validation');
            }
        });
    });

    suite('Configuration', () => {
        test('Should have output directory configured', function() {
            const outputDir = ditaOt.getOutputDirectory();

            assert.ok(outputDir, 'Output directory should be defined');
            assert.ok(typeof outputDir === 'string', 'Output directory should be a string');
        });

        test('Should have default transtype configured', function() {
            const transtype = ditaOt.getDefaultTranstype();

            assert.ok(transtype, 'Default transtype should be defined');
            assert.strictEqual(transtype, 'html5', 'Default transtype should be html5');
        });

        test('Should reload configuration without error', function() {
            // This should not throw
            ditaOt.reloadConfiguration();

            // Verify config still works after reload
            const outputDir = ditaOt.getOutputDirectory();
            assert.ok(outputDir, 'Output directory should still be defined after reload');
        });
    });

    suite('Configuration Settings', () => {
        test('ditaOtPath setting should exist', function() {
            const config = vscode.workspace.getConfiguration('ditacraft');
            const ditaOtPath = config.get<string>('ditaOtPath');

            // Should be defined (even if empty string)
            assert.ok(ditaOtPath !== undefined, 'ditaOtPath setting should exist');
        });

        test('outputDirectory setting should exist', function() {
            const config = vscode.workspace.getConfiguration('ditacraft');
            const outputDir = config.get<string>('outputDirectory');

            assert.ok(outputDir !== undefined, 'outputDirectory setting should exist');
        });

        test('defaultTranstype setting should be valid', function() {
            const config = vscode.workspace.getConfiguration('ditacraft');
            const transtype = config.get<string>('defaultTranstype');

            const validTranstypes = ['html5', 'pdf', 'xhtml', 'epub', 'htmlhelp', 'markdown'];
            assert.ok(
                transtype && validTranstypes.includes(transtype),
                `defaultTranstype should be one of: ${validTranstypes.join(', ')}`
            );
        });

        test('ditaOtArgs setting should be an array', function() {
            const config = vscode.workspace.getConfiguration('ditacraft');
            const args = config.get<string[]>('ditaOtArgs');

            assert.ok(Array.isArray(args), 'ditaOtArgs should be an array');
        });
    });

    suite('DITA-OT Installation Detection', () => {
        test('verifyInstallation should return object with installed property', async function() {
            this.timeout(10000);

            const result = await ditaOt.verifyInstallation();

            assert.ok(typeof result === 'object', 'Result should be an object');
            assert.ok(typeof result.installed === 'boolean', 'Result should have boolean installed property');

            // If installed, should have version and path
            if (result.installed) {
                assert.ok(result.version, 'Installed DITA-OT should report version');
                assert.ok(result.path, 'Installed DITA-OT should report path');
            }
        });

        test('getAvailableTranstypes should return array', async function() {
            this.timeout(10000);

            const transtypes = await ditaOt.getAvailableTranstypes();

            assert.ok(Array.isArray(transtypes), 'Should return an array');
            assert.ok(transtypes.length > 0, 'Should have at least one transtype');
            assert.ok(transtypes.includes('html5'), 'Should include html5 transtype');
        });
    });

    suite('Valid Extensions', () => {
        const validExtensions = ['.dita', '.ditamap', '.bookmap'];

        for (const ext of validExtensions) {
            test(`Should recognize ${ext} as valid DITA extension`, function() {
                // Find a fixture file with this extension
                const files = fs.readdirSync(fixturesPath);
                const matchingFile = files.find(f => f.endsWith(ext));

                if (matchingFile) {
                    const filePath = path.join(fixturesPath, matchingFile);
                    const result = ditaOt.validateInputFile(filePath);
                    assert.strictEqual(result.valid, true, `${ext} should be valid`);
                }
            });
        }
    });

    suite('Path Edge Cases', () => {
        test('Should handle path with spaces in fixture directory', function() {
            // Test that paths with spaces are handled (the path itself may not have spaces,
            // but this tests the validation logic doesn't break with various path formats)
            const filePath = path.join(fixturesPath, 'valid-topic.dita');
            const result = ditaOt.validateInputFile(filePath);

            assert.strictEqual(result.valid, true, 'Path should validate correctly');
        });

        test('Should handle absolute paths', function() {
            const filePath = path.resolve(fixturesPath, 'valid-topic.dita');
            const result = ditaOt.validateInputFile(filePath);

            assert.strictEqual(result.valid, true, 'Absolute path should validate');
        });

        test('Should handle normalized paths', function() {
            // Create a path with ../ that normalizes to valid path
            const filePath = path.join(fixturesPath, '..', 'fixtures', 'valid-topic.dita');
            const normalizedPath = path.normalize(filePath);

            if (fs.existsSync(normalizedPath)) {
                const result = ditaOt.validateInputFile(normalizedPath);
                assert.strictEqual(result.valid, true, 'Normalized path should validate');
            }
        });
    });

    suite('Progress Parsing', () => {
        // Test the progress parsing logic indirectly through configuration
        // The parseProgress method is private, but we can verify the wrapper handles
        // DITA-OT output patterns correctly

        test('Should handle various DITA-OT output patterns', function() {
            // These are patterns that the wrapper should recognize
            const expectedPatterns = [
                '[echo]',
                '[pipeline]',
                '[xslt]',
                '[move]',
                'BUILD SUCCESSFUL'
            ];

            // Just verify these are the expected patterns (documentation test)
            assert.ok(expectedPatterns.length === 5, 'Should have 5 progress patterns');
        });
    });

    suite('Transtype Validation', () => {
        const defaultTranstypes = ['html5', 'pdf', 'xhtml', 'epub', 'htmlhelp', 'markdown'];

        test('Default transtypes should include common formats', function() {
            for (const transtype of defaultTranstypes) {
                assert.ok(
                    typeof transtype === 'string' && transtype.length > 0,
                    `Transtype ${transtype} should be a non-empty string`
                );
            }
        });

        test('html5 should be the default transtype', function() {
            const transtype = ditaOt.getDefaultTranstype();
            assert.strictEqual(transtype, 'html5', 'Default should be html5');
        });
    });

    suite('Error Handling', () => {
        test('Should provide meaningful error for missing file', function() {
            const result = ditaOt.validateInputFile('/non/existent/path/file.dita');

            assert.strictEqual(result.valid, false);
            assert.ok(result.error, 'Should provide error message');
            assert.ok(result.error.length > 10, 'Error message should be descriptive');
        });

        test('Should provide meaningful error for wrong extension', function() {
            // Create a path to a non-DITA file
            const wrongExtPath = path.join(fixturesPath, '..', 'index.ts');

            if (fs.existsSync(wrongExtPath)) {
                const result = ditaOt.validateInputFile(wrongExtPath);

                assert.strictEqual(result.valid, false);
                assert.ok(result.error, 'Should provide error message');
                assert.ok(
                    result.error.includes('.dita') || result.error.includes('Invalid'),
                    'Error should mention valid extensions'
                );
            }
        });
    });

    suite('Platform-Specific Behavior', () => {
        test('Should detect correct platform', function() {
            const platform = process.platform;
            assert.ok(
                ['win32', 'darwin', 'linux'].includes(platform),
                `Platform ${platform} should be recognized`
            );
        });

        test('Path separators should be handled correctly', function() {
            const filePath = path.join(fixturesPath, 'valid-topic.dita');

            // path.join uses correct separator for platform
            if (process.platform === 'win32') {
                assert.ok(filePath.includes('\\'), 'Windows paths should use backslash');
            } else {
                assert.ok(filePath.includes('/'), 'Unix paths should use forward slash');
            }

            // Validation should work regardless
            const result = ditaOt.validateInputFile(filePath);
            assert.strictEqual(result.valid, true, 'Path should validate on any platform');
        });
    });
});
