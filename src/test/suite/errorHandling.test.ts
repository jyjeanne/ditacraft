/* eslint-disable no-throw-literal */
import * as assert from 'assert';
import { fireAndForget, getErrorMessage, tryAsync, isFileNotFoundError, formatErrorMessage, formatDitaError, createEnhancedError } from '../../utils/errorUtils';
import { logger } from '../../utils/logger';

suite('Error Handling Utility Tests', () => {
    
    setup(() => {
        // Clear any previous logs
        logger.clear();
    });

    suite('fireAndForget Tests', () => {
        
        test('fireAndForget should handle promise rejections without crashing', (done) => {
            let errorLogged = false;
            
            // Override logger.error to track calls
            const originalError = logger.error;
            logger.error = (message: string, error?: unknown) => {
                errorLogged = true;
                assert.ok(message.includes('Fire-and-forget error'), 'Error message should indicate fire-and-forget');
                originalError.call(logger, message, error);
            };

            // Create a promise that rejects
            const failingPromise = Promise.reject(new Error('Test error'));
            
            // Use fireAndForget
            fireAndForget(failingPromise, 'test-context');

            // Give it time to execute
            setTimeout(() => {
                assert.ok(errorLogged, 'Error should have been logged');
                logger.error = originalError; // Restore
                done();
            }, 100);
        });

        test('fireAndForget should handle promise rejections with context', (done) => {
            let errorLogged = false;
            
            // Override logger.error to track calls
            const originalError = logger.error;
            logger.error = (message: string, error?: unknown) => {
                errorLogged = true;
                assert.ok(message.includes('[test-context]'), 'Error message should include context');
                assert.ok(message.includes('Fire-and-forget error'), 'Error message should indicate fire-and-forget');
                originalError.call(logger, message, error);
            };

            // Create a promise that rejects
            const failingPromise = Promise.reject(new Error('Test error with context'));
            
            // Use fireAndForget with context
            fireAndForget(failingPromise, 'test-context');

            // Give it time to execute
            setTimeout(() => {
                assert.ok(errorLogged, 'Error should have been logged');
                logger.error = originalError; // Restore
                done();
            }, 100);
        });

        test('fireAndForget should handle non-Error objects', (done) => {
            let errorLogged = false;
            
            // Override logger.error to track calls
            const originalError = logger.error;
            logger.error = (message: string, error?: unknown) => {
                errorLogged = true;
                assert.ok(message.includes('Custom error message'), 'Error message should be extracted from object');
                originalError.call(logger, message, error);
            };

            // Create a promise that rejects with a custom object
            const failingPromise = Promise.reject({ message: 'Custom error message', code: 123 });
            
            // Use fireAndForget
            fireAndForget(failingPromise, 'test-context');

            // Give it time to execute
            setTimeout(() => {
                assert.ok(errorLogged, 'Error should have been logged');
                logger.error = originalError; // Restore
                done();
            }, 100);
        });

        test('fireAndForget should handle string errors', (done) => {
            let errorLogged = false;
            
            // Override logger.error to track calls
            const originalError = logger.error;
            logger.error = (message: string, error?: unknown) => {
                errorLogged = true;
                assert.ok(message.includes('String error message'), 'Error message should be the string itself');
                originalError.call(logger, message, error);
            };

            // Create a promise that rejects with a string (testing string error handling)
            // This is intentional for testing purposes - we want to test how the error handler
            // processes non-Error objects
            const failingPromise = Promise.reject('String error message');
            
            // Use fireAndForget
            fireAndForget(failingPromise, 'test-context');

            // Give it time to execute
            setTimeout(() => {
                assert.ok(errorLogged, 'Error should have been logged');
                logger.error = originalError; // Restore
                done();
            }, 100);
        });

        test('fireAndForget should handle successful promises without errors', (done) => {
            let errorLogged = false;
            
            // Override logger.error to track calls
            const originalError = logger.error;
            logger.error = (message: string, error?: unknown) => {
                errorLogged = true;
                originalError.call(logger, message, error);
            };

            // Create a promise that resolves
            const successfulPromise = Promise.resolve('Success');
            
            // Use fireAndForget
            fireAndForget(successfulPromise, 'test-context');

            // Give it time to execute
            setTimeout(() => {
                assert.ok(!errorLogged, 'No error should have been logged');
                logger.error = originalError; // Restore
                done();
            }, 100);
        });
    });

    suite('getErrorMessage Tests', () => {
        
        test('getErrorMessage should handle Error objects', () => {
            const error = new Error('Test error message');
            const message = getErrorMessage(error);
            assert.strictEqual(message, 'Test error message');
        });

        test('getErrorMessage should handle objects with message property', () => {
            const error = { message: 'Custom error message', code: 123 };
            const message = getErrorMessage(error);
            assert.strictEqual(message, 'Custom error message');
        });

        test('getErrorMessage should handle objects with msg property', () => {
            const error = { msg: 'Parser error message', code: 456 };
            const message = getErrorMessage(error);
            assert.strictEqual(message, 'Parser error message');
        });

        test('getErrorMessage should handle nested error objects', () => {
            const error = { error: { message: 'Nested error message' } };
            const message = getErrorMessage(error);
            assert.strictEqual(message, 'Nested error message');
        });

        test('getErrorMessage should handle string errors', () => {
            const error = 'String error message';
            const message = getErrorMessage(error);
            assert.strictEqual(message, 'String error message');
        });

        test('getErrorMessage should handle null and undefined', () => {
            const nullMessage = getErrorMessage(null);
            const undefinedMessage = getErrorMessage(undefined);
            assert.strictEqual(nullMessage, 'Unknown error');
            assert.strictEqual(undefinedMessage, 'Unknown error');
        });

        test('getErrorMessage should handle objects without message property', () => {
            const error = { code: 789, details: 'Some details' };
            const message = getErrorMessage(error);
            assert.strictEqual(message, 'Unknown error');
        });

        test('getErrorMessage should use default message when provided', () => {
            const error = {};
            const message = getErrorMessage(error, 'Custom default message');
            assert.strictEqual(message, 'Custom default message');
        });
    });

    suite('tryAsync Tests', () => {
        
        test('tryAsync should return operation result on success', async () => {
            const result = await tryAsync(
                async () => 'success result',
                'default value'
            );
            assert.strictEqual(result, 'success result');
        });

        test('tryAsync should return default value on error', async () => {
            const result = await tryAsync(
                async () => { throw new Error('Test error'); },
                'default value'
            );
            assert.strictEqual(result, 'default value');
        });

        test('tryAsync should handle non-Error exceptions', async () => {
            const result = await tryAsync(
                async () => { throw 'String error'; },
                'default value'
            );
            assert.strictEqual(result, 'default value');
        });

        test('tryAsync should handle complex default values', async () => {
            const defaultObj = { value: 'default', nested: { data: 123 } };
            const result = await tryAsync(
                async () => { throw new Error('Test error'); },
                defaultObj
            );
            assert.deepStrictEqual(result, defaultObj);
        });

        test('tryAsync should handle async errors', async () => {
            const result = await tryAsync(
                async () => {
                    await new Promise(resolve => setTimeout(resolve, 10));
                    throw new Error('Async error');
                },
                'default value'
            );
            assert.strictEqual(result, 'default value');
        });
    });

    suite('Integration Tests', () => {
        
        test('fireAndForget with async operations should not crash', (done) => {
            let errorLogged = false;
            
            // Override logger.error to track calls
            const originalError = logger.error;
            logger.error = (message: string, error?: unknown) => {
                errorLogged = true;
                originalError.call(logger, message, error);
            };

            // Create an async operation that fails
            const asyncOperation = (async () => {
                await new Promise(resolve => setTimeout(resolve, 50));
                throw new Error('Async operation failed');
            })();
            
            // Use fireAndForget
            fireAndForget(asyncOperation, 'async-test');

            // Give it time to execute
            setTimeout(() => {
                assert.ok(errorLogged, 'Async error should have been logged');
                logger.error = originalError; // Restore
                done();
            }, 200);
        });

        test('Multiple fireAndForget calls should handle errors independently', (done) => {
            let errorCount = 0;
            
            // Override logger.error to track calls
            const originalError = logger.error;
            logger.error = (message: string, error?: unknown) => {
                errorCount++;
                originalError.call(logger, message, error);
            };

            // Create multiple failing promises
            const promise1 = Promise.reject(new Error('Error 1'));
            const promise2 = Promise.reject(new Error('Error 2'));
            const promise3 = Promise.resolve('Success 3');
            
            // Use fireAndForget for all
            fireAndForget(promise1, 'test-1');
            fireAndForget(promise2, 'test-2');
            fireAndForget(promise3, 'test-3');

            // Give it time to execute
            setTimeout(() => {
                assert.strictEqual(errorCount, 2, 'Should have logged 2 errors');
                logger.error = originalError; // Restore
                done();
            }, 100);
        });
    });

    suite('isFileNotFoundError Tests', () => {

        test('returns true for Node.js ENOENT error', () => {
            const error = Object.assign(new Error('file not found'), { code: 'ENOENT' });
            assert.strictEqual(isFileNotFoundError(error), true);
        });

        test('returns true for object with ENOENT code', () => {
            assert.strictEqual(isFileNotFoundError({ code: 'ENOENT', message: 'test' }), true);
        });

        test('returns true for message containing "file not found"', () => {
            assert.strictEqual(isFileNotFoundError(new Error('Error: file not found at path')), true);
        });

        test('returns true for message containing "no such file"', () => {
            assert.strictEqual(isFileNotFoundError(new Error('no such file or directory')), true);
        });

        test('returns true for message containing "does not exist"', () => {
            assert.strictEqual(isFileNotFoundError(new Error('path does not exist')), true);
        });

        test('returns false for generic error', () => {
            assert.strictEqual(isFileNotFoundError(new Error('something went wrong')), false);
        });

        test('returns false for null', () => {
            assert.strictEqual(isFileNotFoundError(null), false);
        });

        test('returns false for undefined', () => {
            assert.strictEqual(isFileNotFoundError(undefined), false);
        });

        test('returns false for string error', () => {
            assert.strictEqual(isFileNotFoundError('random string'), false);
        });

    });

    suite('formatErrorMessage Tests', () => {

        test('includes context in formatted output', () => {
            const result = formatErrorMessage(new Error('test error'), 'Validation');
            assert.ok(result.includes('🚨 Validation Error'));
            assert.ok(result.includes('test error'));
        });

        test('includes suggestions when provided', () => {
            const result = formatErrorMessage(new Error('test'), 'Preview', ['Try again', 'Check settings']);
            assert.ok(result.includes('Try again'));
            assert.ok(result.includes('Check settings'));
        });

        test('includes error code when available', () => {
            const error = Object.assign(new Error('test'), { code: 'ERR-001' });
            const result = formatErrorMessage(error, 'Test');
            assert.ok(result.includes('ERR-001'));
        });

        test('does not include suggestions section when empty', () => {
            const result = formatErrorMessage(new Error('test'), 'Test');
            assert.ok(!result.includes('Suggestions'));
        });

        test('handles non-Error objects', () => {
            const result = formatErrorMessage('plain string error', 'General');
            assert.ok(result.includes('plain string error'));
        });

    });

    suite('formatDitaError Tests', () => {

        test('validation error with DOCTYPE message adds suggestions', () => {
            const result = formatDitaError(new Error('missing DOCTYPE'), 'validation');
            assert.ok(result.includes('DOCTYPE declaration'));
        });

        test('validation error with id attribute message adds suggestions', () => {
            const result = formatDitaError(new Error('missing id attribute'), 'validation');
            assert.ok(result.includes('unique id attribute'));
        });

        test('validation error with title message adds suggestions', () => {
            const result = formatDitaError(new Error('missing title'), 'validation');
            assert.ok(result.includes('<title> element'));
        });

        test('publishing error with DITA-OT message adds suggestions', () => {
            const result = formatDitaError(new Error('DITA-OT failed'), 'publishing');
            assert.ok(result.includes('DITA-OT is properly installed'));
        });

        test('publishing error with timeout message adds suggestions', () => {
            const result = formatDitaError(new Error('timeout exceeded'), 'publishing');
            assert.ok(result.includes('Increase the DITA-OT timeout'));
        });

        test('preview error with HTML file message adds suggestions', () => {
            const result = formatDitaError(new Error('HTML file not generated'), 'preview');
            assert.ok(result.includes('regenerating the preview'));
        });

        test('general error adds common suggestions', () => {
            const result = formatDitaError(new Error('unknown error'), 'general');
            assert.ok(result.includes('output channel'));
        });

        test('formatDitaError without specific keywords adds common suggestions only', () => {
            const result = formatDitaError(new Error('some other error'), 'publishing');
            assert.ok(result.includes('DITA specification'));
        });

    });

    suite('createEnhancedError Tests', () => {

        test('creates error with context prefix', () => {
            const result = createEnhancedError(new Error('original'), 'MyContext');
            assert.ok(result.message.startsWith('[MyContext]'));
            assert.ok(result.message.includes('original'));
        });

        test('preserves stack from original Error', () => {
            const original = new Error('test');
            const result = createEnhancedError(original, 'Ctx');
            assert.strictEqual(result.stack, original.stack);
        });

        test('handles non-Error input', () => {
            const result = createEnhancedError('plain text', 'Ctx');
            assert.ok(result.message.includes('[Ctx]'));
            assert.ok(result.message.includes('plain text'));
        });

        test('attaches metadata when provided', () => {
            const result = createEnhancedError(new Error('test'), 'Ctx', { file: 'test.dita', line: 42 }) as Error & Record<string, unknown>;
            assert.strictEqual(result['file'], 'test.dita');
            assert.strictEqual(result['line'], 42);
        });

        test('returns Error instance', () => {
            const result = createEnhancedError(new Error('test'), 'Ctx');
            assert.ok(result instanceof Error);
        });

    });
});