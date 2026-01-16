/**
 * DITA-OT Error Parser Tests
 */

import * as assert from 'assert';
import { parseDitaOtOutput } from '../../utils/ditaOtErrorParser';

suite('DITA-OT Error Parser Test Suite', () => {

    suite('Error Pattern Matching', () => {

        test('Should parse DITA-OT error code format', () => {
            const output = '[DOTX001E][ERROR] File not found: missing.dita';
            const result = parseDitaOtOutput(output);

            assert.strictEqual(result.errors.length, 1);
            assert.strictEqual(result.errors[0].code, 'DOTX001E');
            assert.strictEqual(result.errors[0].severity, 'error');
            assert.ok(result.errors[0].message.includes('File not found'));
        });

        test('Should parse DITA-OT warning code format', () => {
            const output = '[DOTX013W][WARN] Image file not found: image.png';
            const result = parseDitaOtOutput(output);

            assert.strictEqual(result.warnings.length, 1);
            assert.strictEqual(result.warnings[0].code, 'DOTX013W');
            assert.strictEqual(result.warnings[0].severity, 'warning');
        });

        test('Should parse file path with line number', () => {
            const output = '[DOTX001E][ERROR] Invalid element at c:/project/topic.dita:15:20';
            const result = parseDitaOtOutput(output);

            assert.strictEqual(result.errors.length, 1);
            assert.strictEqual(result.errors[0].line, 15);
            assert.strictEqual(result.errors[0].column, 20);
        });

        test('Should parse GNU error format', () => {
            const output = 'topic.dita:42:10: error: unexpected element';
            const result = parseDitaOtOutput(output);

            assert.strictEqual(result.errors.length, 1);
            assert.strictEqual(result.errors[0].line, 42);
            assert.strictEqual(result.errors[0].column, 10);
            assert.ok(result.errors[0].filePath?.endsWith('topic.dita'));
        });

        test('Should parse Java SEVERE format', () => {
            const output = 'SEVERE: Failed to process topic';
            const result = parseDitaOtOutput(output);

            assert.strictEqual(result.errors.length, 1);
            assert.strictEqual(result.errors[0].severity, 'error');
        });

        test('Should parse Java WARNING format', () => {
            const output = 'WARNING: Deprecated element usage';
            const result = parseDitaOtOutput(output);

            assert.strictEqual(result.warnings.length, 1);
            assert.strictEqual(result.warnings[0].severity, 'warning');
        });

        test('Should parse XSLT task format', () => {
            const output = '[xslt] topic.dita:25: element not allowed here';
            const result = parseDitaOtOutput(output);

            assert.strictEqual(result.errors.length, 1);
            assert.strictEqual(result.errors[0].line, 25);
        });
    });

    suite('Build Status Detection', () => {

        test('Should detect BUILD SUCCESSFUL', () => {
            const output = `[echo] Processing topics...
[pipeline] Starting pipeline
BUILD SUCCESSFUL
Total time: 5 seconds`;
            const result = parseDitaOtOutput(output);

            assert.strictEqual(result.buildSuccessful, true);
            assert.ok(result.summary.includes('successful'));
        });

        test('Should detect BUILD FAILED', () => {
            const output = `[echo] Processing topics...
[DOTX001E][ERROR] File not found
BUILD FAILED`;
            const result = parseDitaOtOutput(output);

            assert.strictEqual(result.buildSuccessful, false);
            assert.ok(result.summary.includes('failed'));
        });
    });

    suite('Multiple Errors', () => {

        test('Should parse multiple errors', () => {
            const output = `[DOTX001E][ERROR] First error
[DOTX002E][ERROR] Second error
[DOTX003W][WARN] A warning`;
            const result = parseDitaOtOutput(output);

            assert.strictEqual(result.errors.length, 2);
            assert.strictEqual(result.warnings.length, 1);
        });

        test('Should generate correct summary', () => {
            // Note: BUILD FAILED is also parsed as an error (intentional)
            const output = `[DOTX001E][ERROR] Error 1
[DOTX002E][ERROR] Error 2
[DOTX003W][WARN] Warning 1`;
            const result = parseDitaOtOutput(output);

            assert.ok(result.summary.includes('2 errors'), `Expected summary to include '2 errors', got: ${result.summary}`);
            assert.ok(result.summary.includes('1 warning'), `Expected summary to include '1 warning', got: ${result.summary}`);
        });
    });

    suite('Edge Cases', () => {

        test('Should handle empty output', () => {
            const result = parseDitaOtOutput('');

            assert.strictEqual(result.errors.length, 0);
            assert.strictEqual(result.warnings.length, 0);
            assert.strictEqual(result.buildSuccessful, false);
        });

        test('Should handle output with no errors', () => {
            const output = `[echo] Starting build
[pipeline] Processing
BUILD SUCCESSFUL`;
            const result = parseDitaOtOutput(output);

            assert.strictEqual(result.errors.length, 0);
            assert.strictEqual(result.warnings.length, 0);
            assert.strictEqual(result.buildSuccessful, true);
        });

        test('Should skip non-error lines', () => {
            const output = `[echo] Processing topic.dita
[info] Loading DTD
[debug] Cache hit for key space`;
            const result = parseDitaOtOutput(output);

            assert.strictEqual(result.errors.length, 0);
            assert.strictEqual(result.warnings.length, 0);
        });

        test('Should not create false positives from regular content', () => {
            // Lines that contain "error" or "warning" as part of content, not as markers
            const output = `[echo] This feature handles error recovery gracefully
[info] Processing warning-message.dita
[debug] The error handler is initialized
[echo] Checking errorCode configuration`;
            const result = parseDitaOtOutput(output);

            assert.strictEqual(result.errors.length, 0,
                'Should not match "error" as part of content');
            assert.strictEqual(result.warnings.length, 0,
                'Should not match "warning" in filenames');
        });

        test('Should match actual error markers', () => {
            const output = `[ERROR] This is a real error
WARNING: This is a real warning
ERROR: Another real error`;
            const result = parseDitaOtOutput(output);

            // Should match at least some of these real error patterns
            assert.ok(result.errors.length + result.warnings.length > 0,
                'Should match actual error/warning markers');
        });

        test('Should handle Windows paths', () => {
            const output = '[DOTX001E][ERROR] File not found at C:\\project\\topic.dita:10:5';
            const result = parseDitaOtOutput(output);

            assert.strictEqual(result.errors.length, 1);
        });

        test('Should handle Unix paths', () => {
            const output = '/home/user/project/topic.dita:15:1: error: missing title';
            const result = parseDitaOtOutput(output);

            assert.strictEqual(result.errors.length, 1);
            assert.strictEqual(result.errors[0].line, 15);
        });
    });

    suite('Severity Mapping', () => {

        test('Should map ERROR to error severity', () => {
            const output = '[DOTX001E][ERROR] Test error';
            const result = parseDitaOtOutput(output);
            assert.strictEqual(result.errors[0].severity, 'error');
        });

        test('Should map FATAL to error severity', () => {
            const output = '[DOTJ001F][FATAL] Test fatal';
            const result = parseDitaOtOutput(output);
            assert.strictEqual(result.errors[0].severity, 'error');
        });

        test('Should map WARN to warning severity', () => {
            const output = '[DOTX001W][WARN] Test warning';
            const result = parseDitaOtOutput(output);
            assert.strictEqual(result.warnings[0].severity, 'warning');
        });

        test('Should map INFO to info severity', () => {
            const output = '[DOTX001I][INFO] Test info';
            const result = parseDitaOtOutput(output);
            assert.strictEqual(result.infos[0].severity, 'info');
        });
    });
});
