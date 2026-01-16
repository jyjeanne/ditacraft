/**
 * DITA-OT Output Channel Test Suite
 * Tests for syntax-highlighted output channel functionality
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import {
    DitaOtOutputChannel,
    getDitaOtOutputChannel,
    disposeDitaOtOutputChannel,
    LOG_LEVEL_PATTERNS,
    BUILD_STAGE_PATTERNS
} from '../../utils/ditaOtOutputChannel';

suite('DITA-OT Output Channel Test Suite', () => {

    suiteSetup(async () => {
        // Get and activate extension
        const extension = vscode.extensions.getExtension('JeremyJeanne.ditacraft');
        if (!extension) {
            throw new Error('Extension not found');
        }

        if (!extension.isActive) {
            await extension.activate();
        }

        // Reset any existing singleton and create a fresh one for this test suite
        disposeDitaOtOutputChannel();
        getDitaOtOutputChannel(); // Initialize the singleton
    });

    suiteTeardown(() => {
        // Clean up after all tests
        disposeDitaOtOutputChannel();
    });

    suite('Singleton Pattern', () => {

        test('getInstance should return the same instance', () => {
            const instance1 = DitaOtOutputChannel.getInstance();
            const instance2 = DitaOtOutputChannel.getInstance();

            assert.strictEqual(instance1, instance2, 'Should return the same instance');
        });

        test('getDitaOtOutputChannel should return singleton instance', () => {
            const instance1 = getDitaOtOutputChannel();
            const instance2 = DitaOtOutputChannel.getInstance();

            assert.strictEqual(instance1, instance2, 'Helper function should return same instance');
        });

        // Note: resetInstance and disposeDitaOtOutputChannel tests are handled separately
        // to avoid breaking subsequent tests that depend on a valid output channel
    });

    suite('Log Level Detection - Error Patterns', () => {

        test('Should detect [ERROR] marker', () => {
            const channel = getDitaOtOutputChannel();
            assert.strictEqual(channel.detectLogLevel('[ERROR] Something went wrong'), 'error');
            assert.strictEqual(channel.detectLogLevel('[error] lowercase error'), 'error');
        });

        test('Should detect [FATAL] marker', () => {
            const channel = getDitaOtOutputChannel();
            assert.strictEqual(channel.detectLogLevel('[FATAL] Critical failure'), 'error');
            assert.strictEqual(channel.detectLogLevel('[fatal] lowercase fatal'), 'error');
        });

        test('Should detect ERROR: prefix', () => {
            const channel = getDitaOtOutputChannel();
            assert.strictEqual(channel.detectLogLevel('ERROR: File not found'), 'error');
        });

        test('Should detect FATAL: prefix', () => {
            const channel = getDitaOtOutputChannel();
            assert.strictEqual(channel.detectLogLevel('FATAL: Cannot continue'), 'error');
        });

        test('Should detect SEVERE: prefix', () => {
            const channel = getDitaOtOutputChannel();
            assert.strictEqual(channel.detectLogLevel('SEVERE: Java exception occurred'), 'error');
        });

        test('Should detect Exception keyword', () => {
            const channel = getDitaOtOutputChannel();
            assert.strictEqual(channel.detectLogLevel('java.lang.NullPointerException'), 'error');
            assert.strictEqual(channel.detectLogLevel('Exception in thread "main"'), 'error');
        });

        test('Should detect BUILD FAILED', () => {
            const channel = getDitaOtOutputChannel();
            assert.strictEqual(channel.detectLogLevel('BUILD FAILED'), 'error');
            assert.strictEqual(channel.detectLogLevel('build failed'), 'error');
        });

        test('Should detect DITA-OT error codes (E suffix)', () => {
            const channel = getDitaOtOutputChannel();
            assert.strictEqual(channel.detectLogLevel('[DOTX001E] File not found'), 'error');
            assert.strictEqual(channel.detectLogLevel('[DOTJ015E] Java error'), 'error');
        });

        test('Should detect DITA-OT fatal codes (F suffix)', () => {
            const channel = getDitaOtOutputChannel();
            assert.strictEqual(channel.detectLogLevel('[DOTX001F] Fatal error'), 'error');
        });

        test('Should detect specific "failed to" patterns', () => {
            const channel = getDitaOtOutputChannel();
            assert.strictEqual(channel.detectLogLevel('failed to process topic.dita'), 'error');
            assert.strictEqual(channel.detectLogLevel('Failed to build output'), 'error');
            assert.strictEqual(channel.detectLogLevel('failed to transform content'), 'error');
            assert.strictEqual(channel.detectLogLevel('Failed to publish document'), 'error');
            assert.strictEqual(channel.detectLogLevel('failed to compile stylesheet'), 'error');
            assert.strictEqual(channel.detectLogLevel('Failed to load DTD'), 'error');
            assert.strictEqual(channel.detectLogLevel('failed to parse XML'), 'error');
            assert.strictEqual(channel.detectLogLevel('Failed to read file'), 'error');
            assert.strictEqual(channel.detectLogLevel('failed to write output'), 'error');
        });

        test('Should NOT detect "failed" in regular content', () => {
            const channel = getDitaOtOutputChannel();
            // These should NOT be detected as errors
            assert.notStrictEqual(channel.detectLogLevel('The test failed yesterday'), 'error');
            assert.notStrictEqual(channel.detectLogLevel('Login failed for user'), 'error');
            assert.notStrictEqual(channel.detectLogLevel('failed-tests.dita'), 'error');
        });
    });

    suite('Log Level Detection - Warning Patterns', () => {

        test('Should detect [WARN] marker', () => {
            const channel = getDitaOtOutputChannel();
            assert.strictEqual(channel.detectLogLevel('[WARN] Deprecated element'), 'warn');
            assert.strictEqual(channel.detectLogLevel('[warn] lowercase warning'), 'warn');
        });

        test('Should detect [WARNING] marker', () => {
            const channel = getDitaOtOutputChannel();
            assert.strictEqual(channel.detectLogLevel('[WARNING] Missing image'), 'warn');
        });

        test('Should detect WARN: prefix', () => {
            const channel = getDitaOtOutputChannel();
            assert.strictEqual(channel.detectLogLevel('WARN: Using default value'), 'warn');
        });

        test('Should detect WARNING: prefix', () => {
            const channel = getDitaOtOutputChannel();
            assert.strictEqual(channel.detectLogLevel('WARNING: Fallback used'), 'warn');
        });

        test('Should detect DITA-OT warning codes (W suffix)', () => {
            const channel = getDitaOtOutputChannel();
            assert.strictEqual(channel.detectLogLevel('[DOTX013W] Image not found'), 'warn');
            assert.strictEqual(channel.detectLogLevel('[DOTJ008W] Java warning'), 'warn');
        });
    });

    suite('Log Level Detection - Info Patterns', () => {

        test('Should detect [INFO] marker', () => {
            const channel = getDitaOtOutputChannel();
            assert.strictEqual(channel.detectLogLevel('[INFO] Processing started'), 'info');
            assert.strictEqual(channel.detectLogLevel('[info] lowercase info'), 'info');
        });

        test('Should detect INFO: prefix', () => {
            const channel = getDitaOtOutputChannel();
            assert.strictEqual(channel.detectLogLevel('INFO: Build starting'), 'info');
        });

        test('Should detect BUILD SUCCESSFUL', () => {
            const channel = getDitaOtOutputChannel();
            assert.strictEqual(channel.detectLogLevel('BUILD SUCCESSFUL'), 'info');
            assert.strictEqual(channel.detectLogLevel('build successful'), 'info');
        });

        test('Should detect DITA-OT info codes (I suffix)', () => {
            const channel = getDitaOtOutputChannel();
            assert.strictEqual(channel.detectLogLevel('[DOTX001I] Processing topic'), 'info');
        });
    });

    suite('Log Level Detection - Debug Patterns', () => {

        test('Should detect [DEBUG] marker', () => {
            const channel = getDitaOtOutputChannel();
            assert.strictEqual(channel.detectLogLevel('[DEBUG] Variable value'), 'debug');
            assert.strictEqual(channel.detectLogLevel('[debug] lowercase debug'), 'debug');
        });

        test('Should detect DEBUG: prefix', () => {
            const channel = getDitaOtOutputChannel();
            assert.strictEqual(channel.detectLogLevel('DEBUG: Cache hit'), 'debug');
        });

        test('Should detect Ant task markers', () => {
            const channel = getDitaOtOutputChannel();
            assert.strictEqual(channel.detectLogLevel('[echo] Processing files'), 'debug');
            assert.strictEqual(channel.detectLogLevel('[delete] Removing temp files'), 'debug');
            assert.strictEqual(channel.detectLogLevel('[mkdir] Creating directory'), 'debug');
            assert.strictEqual(channel.detectLogLevel('[copy] Copying resources'), 'debug');
            assert.strictEqual(channel.detectLogLevel('[move] Moving files'), 'debug');
        });
    });

    suite('Log Level Detection - Trace Patterns', () => {

        test('Should detect build stage markers', () => {
            const channel = getDitaOtOutputChannel();
            assert.strictEqual(channel.detectLogLevel('[pipeline] Starting preprocess'), 'trace');
            assert.strictEqual(channel.detectLogLevel('[xslt] Transforming document'), 'trace');
            assert.strictEqual(channel.detectLogLevel('[java] Running processor'), 'trace');
            assert.strictEqual(channel.detectLogLevel('[saxonxslt] Saxon transformation'), 'trace');
        });
    });

    suite('Log Level Detection - Default Behavior', () => {

        test('Should default to debug for unrecognized lines', () => {
            const channel = getDitaOtOutputChannel();
            assert.strictEqual(channel.detectLogLevel('Some random output line'), 'debug');
            assert.strictEqual(channel.detectLogLevel('Processing topic.dita'), 'debug');
            assert.strictEqual(channel.detectLogLevel('12345'), 'debug');
        });
    });

    suite('Log Level Priority', () => {

        test('Error should take priority over other levels', () => {
            const channel = getDitaOtOutputChannel();
            // Line contains both error and info markers - error should win
            assert.strictEqual(channel.detectLogLevel('[ERROR] [INFO] Mixed message'), 'error');
            assert.strictEqual(channel.detectLogLevel('[INFO] Exception occurred'), 'error');
        });

        test('Warning should take priority over info', () => {
            const channel = getDitaOtOutputChannel();
            // Line contains both warning and info
            assert.strictEqual(channel.detectLogLevel('[WARN] [INFO] Mixed message'), 'warn');
        });
    });

    suite('Pattern Exports', () => {

        test('LOG_LEVEL_PATTERNS should be exported', () => {
            assert.ok(LOG_LEVEL_PATTERNS, 'LOG_LEVEL_PATTERNS should be defined');
            assert.ok(LOG_LEVEL_PATTERNS.error, 'Should have error patterns');
            assert.ok(LOG_LEVEL_PATTERNS.warning, 'Should have warning patterns');
            assert.ok(LOG_LEVEL_PATTERNS.info, 'Should have info patterns');
            assert.ok(LOG_LEVEL_PATTERNS.debug, 'Should have debug patterns');
        });

        test('BUILD_STAGE_PATTERNS should be exported', () => {
            assert.ok(BUILD_STAGE_PATTERNS, 'BUILD_STAGE_PATTERNS should be defined');
            assert.ok(Array.isArray(BUILD_STAGE_PATTERNS), 'Should be an array');
            assert.ok(BUILD_STAGE_PATTERNS.length > 0, 'Should have patterns');
        });

        test('Error patterns should be RegExp arrays', () => {
            for (const pattern of LOG_LEVEL_PATTERNS.error) {
                assert.ok(pattern instanceof RegExp, 'Each pattern should be a RegExp');
            }
        });

        test('Warning patterns should be RegExp arrays', () => {
            for (const pattern of LOG_LEVEL_PATTERNS.warning) {
                assert.ok(pattern instanceof RegExp, 'Each pattern should be a RegExp');
            }
        });
    });

    suite('Public Methods', () => {

        test('logLine should not throw on empty string', () => {
            const channel = getDitaOtOutputChannel();
            assert.doesNotThrow(() => channel.logLine(''));
            assert.doesNotThrow(() => channel.logLine('   '));
        });

        test('logLine should not throw on valid input', () => {
            const channel = getDitaOtOutputChannel();
            assert.doesNotThrow(() => channel.logLine('[INFO] Test message'));
            assert.doesNotThrow(() => channel.logLine('[ERROR] Error message'));
        });

        test('logOutput should not throw on empty string', () => {
            const channel = getDitaOtOutputChannel();
            assert.doesNotThrow(() => channel.logOutput(''));
        });

        test('logOutput should not throw on multi-line input', () => {
            const channel = getDitaOtOutputChannel();
            const multiLine = '[INFO] Line 1\n[WARN] Line 2\n[ERROR] Line 3';
            assert.doesNotThrow(() => channel.logOutput(multiLine));
        });

        test('logOutput should handle Windows line endings', () => {
            const channel = getDitaOtOutputChannel();
            const windowsLineEndings = '[INFO] Line 1\r\n[WARN] Line 2\r\n[ERROR] Line 3';
            assert.doesNotThrow(() => channel.logOutput(windowsLineEndings));
        });

        test('logBuildStart should not throw', () => {
            const channel = getDitaOtOutputChannel();
            assert.doesNotThrow(() => channel.logBuildStart('/path/to/topic.dita', 'html5'));
        });

        test('logBuildComplete should not throw for success', () => {
            const channel = getDitaOtOutputChannel();
            assert.doesNotThrow(() => channel.logBuildComplete(true, '/path/to/output'));
        });

        test('logBuildComplete should not throw for failure', () => {
            const channel = getDitaOtOutputChannel();
            assert.doesNotThrow(() => channel.logBuildComplete(false, '/path/to/output'));
        });

        test('logBuildComplete should handle duration parameter', () => {
            const channel = getDitaOtOutputChannel();
            assert.doesNotThrow(() => channel.logBuildComplete(true, '/path/to/output', 5000));
            assert.doesNotThrow(() => channel.logBuildComplete(true, '/path/to/output', 0));
        });

        test('show should not throw', () => {
            const channel = getDitaOtOutputChannel();
            assert.doesNotThrow(() => channel.show());
            assert.doesNotThrow(() => channel.show(true));
            assert.doesNotThrow(() => channel.show(false));
        });

        test('clear should not throw', () => {
            const channel = getDitaOtOutputChannel();
            assert.doesNotThrow(() => channel.clear());
        });

        test('dispose should not throw', () => {
            const channel = getDitaOtOutputChannel();
            assert.doesNotThrow(() => channel.dispose());
            // Recreate singleton for subsequent tests
            disposeDitaOtOutputChannel();
            getDitaOtOutputChannel();
        });
    });

    suite('Edge Cases', () => {

        test('Should handle very long lines', () => {
            const channel = getDitaOtOutputChannel();
            const longLine = '[INFO] ' + 'x'.repeat(10000);
            assert.doesNotThrow(() => channel.logLine(longLine));
            assert.strictEqual(channel.detectLogLevel(longLine), 'info');
        });

        test('Should handle special characters', () => {
            const channel = getDitaOtOutputChannel();
            assert.doesNotThrow(() => channel.logLine('[INFO] Path: C:\\Users\\test\\file.dita'));
            assert.doesNotThrow(() => channel.logLine('[INFO] Unicode: \u00e9\u00e8\u00ea'));
            assert.doesNotThrow(() => channel.logLine('[INFO] Symbols: @#$%^&*()'));
        });

        test('Should handle patterns in file paths without false positives', () => {
            const channel = getDitaOtOutputChannel();
            // File paths that contain pattern-like text
            assert.notStrictEqual(channel.detectLogLevel('Processing error-handling.dita'), 'error');
            assert.notStrictEqual(channel.detectLogLevel('Loading warning-message.dita'), 'warn');
        });

        test('Should handle empty lines in multi-line output', () => {
            const channel = getDitaOtOutputChannel();
            const outputWithEmptyLines = '[INFO] Line 1\n\n\n[INFO] Line 2\n';
            assert.doesNotThrow(() => channel.logOutput(outputWithEmptyLines));
        });
    });

    suite('Real-World DITA-OT Output Samples', () => {

        test('Should correctly classify typical DITA-OT error output', () => {
            const channel = getDitaOtOutputChannel();

            const errorSamples = [
                '[DOTX001E][ERROR] Failed to load DTD',
                '[DOTJ015E] XSLT transformation failed',
                'SEVERE: org.xml.sax.SAXParseException; lineNumber: 10',
                'java.lang.NullPointerException',
                'BUILD FAILED',
                'failed to process c:/project/topic.dita'
            ];

            for (const sample of errorSamples) {
                assert.strictEqual(channel.detectLogLevel(sample), 'error',
                    `Should detect "${sample}" as error`);
            }
        });

        test('Should correctly classify typical DITA-OT warning output', () => {
            const channel = getDitaOtOutputChannel();

            const warningSamples = [
                '[DOTX013W][WARN] Image file not found: image.png',
                '[DOTX023W] Deprecated element usage',
                'WARNING: Falling back to default stylesheet'
            ];

            for (const sample of warningSamples) {
                assert.strictEqual(channel.detectLogLevel(sample), 'warn',
                    `Should detect "${sample}" as warning`);
            }
        });

        test('Should correctly classify typical DITA-OT info output', () => {
            const channel = getDitaOtOutputChannel();

            const infoSamples = [
                '[INFO] Processing topic.dita',
                'INFO: Build started',
                'BUILD SUCCESSFUL',
                '[DOTX001I] Topic processing complete'
            ];

            for (const sample of infoSamples) {
                assert.strictEqual(channel.detectLogLevel(sample), 'info',
                    `Should detect "${sample}" as info`);
            }
        });

        test('Should correctly classify typical Ant task output', () => {
            const channel = getDitaOtOutputChannel();

            const debugSamples = [
                '[echo] Processing topic files...',
                '[delete] Deleting directory out/html5',
                '[mkdir] Created dir: out/html5',
                '[copy] Copying 10 files to out/html5'
            ];

            for (const sample of debugSamples) {
                assert.strictEqual(channel.detectLogLevel(sample), 'debug',
                    `Should detect "${sample}" as debug`);
            }
        });

        test('Should correctly classify typical build stage output', () => {
            const channel = getDitaOtOutputChannel();

            const traceSamples = [
                '[pipeline] Starting preprocess',
                '[xslt] Transforming dita2html5.xsl',
                '[java] org.dita.dost.module.GenMapAndTopicListModule',
                '[saxonxslt] Running Saxon transformation'
            ];

            for (const sample of traceSamples) {
                assert.strictEqual(channel.detectLogLevel(sample), 'trace',
                    `Should detect "${sample}" as trace`);
            }
        });
    });
});
