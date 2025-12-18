/* eslint-disable no-throw-literal */
import * as assert from 'assert';
import { fireAndForget, getErrorMessage, tryAsync } from '../../utils/errorUtils';
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
});