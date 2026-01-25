/**
 * Rate Limiter Tests
 * P3-6: Tests for rate limiting utility
 */

import * as assert from 'assert';
import {
    RateLimiter,
    createRateLimiter,
    createCustomRateLimiter,
    RATE_LIMIT_DEFAULTS
} from '../../utils/rateLimiter';

suite('RateLimiter Test Suite', () => {
    let rateLimiter: RateLimiter;

    teardown(() => {
        if (rateLimiter) {
            rateLimiter.dispose();
        }
    });

    suite('Basic Rate Limiting', () => {
        test('Should allow requests under limit', () => {
            rateLimiter = createCustomRateLimiter({
                maxRequests: 5,
                windowMs: 1000
            });

            // First 5 requests should be allowed
            for (let i = 0; i < 5; i++) {
                assert.strictEqual(rateLimiter.isAllowed('test-key'), true, `Request ${i + 1} should be allowed`);
            }
        });

        test('Should deny requests over limit', () => {
            rateLimiter = createCustomRateLimiter({
                maxRequests: 3,
                windowMs: 1000
            });

            // First 3 requests should be allowed
            assert.strictEqual(rateLimiter.isAllowed('test-key'), true);
            assert.strictEqual(rateLimiter.isAllowed('test-key'), true);
            assert.strictEqual(rateLimiter.isAllowed('test-key'), true);

            // 4th request should be denied
            assert.strictEqual(rateLimiter.isAllowed('test-key'), false);
        });

        test('Should track different keys independently', () => {
            rateLimiter = createCustomRateLimiter({
                maxRequests: 2,
                windowMs: 1000
            });

            // Key A uses its limit
            assert.strictEqual(rateLimiter.isAllowed('key-a'), true);
            assert.strictEqual(rateLimiter.isAllowed('key-a'), true);
            assert.strictEqual(rateLimiter.isAllowed('key-a'), false);

            // Key B should still have its full limit
            assert.strictEqual(rateLimiter.isAllowed('key-b'), true);
            assert.strictEqual(rateLimiter.isAllowed('key-b'), true);
            assert.strictEqual(rateLimiter.isAllowed('key-b'), false);
        });

        test('Should allow requests after window expires', async () => {
            rateLimiter = createCustomRateLimiter({
                maxRequests: 2,
                windowMs: 100 // 100ms window for faster test
            });

            // Use up limit
            assert.strictEqual(rateLimiter.isAllowed('test-key'), true);
            assert.strictEqual(rateLimiter.isAllowed('test-key'), true);
            assert.strictEqual(rateLimiter.isAllowed('test-key'), false);

            // Wait for window to expire
            await new Promise(resolve => setTimeout(resolve, 150));

            // Should be allowed again
            assert.strictEqual(rateLimiter.isAllowed('test-key'), true);
        });
    });

    suite('getRemainingRequests', () => {
        test('Should return max requests for new key', () => {
            rateLimiter = createCustomRateLimiter({
                maxRequests: 5,
                windowMs: 1000
            });

            assert.strictEqual(rateLimiter.getRemainingRequests('new-key'), 5);
        });

        test('Should return remaining count after usage', () => {
            rateLimiter = createCustomRateLimiter({
                maxRequests: 5,
                windowMs: 1000
            });

            rateLimiter.isAllowed('test-key');
            rateLimiter.isAllowed('test-key');

            assert.strictEqual(rateLimiter.getRemainingRequests('test-key'), 3);
        });

        test('Should return 0 when limit exhausted', () => {
            rateLimiter = createCustomRateLimiter({
                maxRequests: 2,
                windowMs: 1000
            });

            rateLimiter.isAllowed('test-key');
            rateLimiter.isAllowed('test-key');

            assert.strictEqual(rateLimiter.getRemainingRequests('test-key'), 0);
        });
    });

    suite('reset', () => {
        test('Should reset specific key', () => {
            rateLimiter = createCustomRateLimiter({
                maxRequests: 2,
                windowMs: 1000
            });

            // Use up limit
            rateLimiter.isAllowed('test-key');
            rateLimiter.isAllowed('test-key');
            assert.strictEqual(rateLimiter.isAllowed('test-key'), false);

            // Reset
            rateLimiter.reset('test-key');

            // Should be allowed again
            assert.strictEqual(rateLimiter.isAllowed('test-key'), true);
        });

        test('Should not affect other keys', () => {
            rateLimiter = createCustomRateLimiter({
                maxRequests: 2,
                windowMs: 1000
            });

            rateLimiter.isAllowed('key-a');
            rateLimiter.isAllowed('key-b');

            rateLimiter.reset('key-a');

            assert.strictEqual(rateLimiter.getRemainingRequests('key-a'), 2);
            assert.strictEqual(rateLimiter.getRemainingRequests('key-b'), 1);
        });
    });

    suite('resetAll', () => {
        test('Should reset all keys', () => {
            rateLimiter = createCustomRateLimiter({
                maxRequests: 2,
                windowMs: 1000
            });

            rateLimiter.isAllowed('key-a');
            rateLimiter.isAllowed('key-b');

            rateLimiter.resetAll();

            assert.strictEqual(rateLimiter.getRemainingRequests('key-a'), 2);
            assert.strictEqual(rateLimiter.getRemainingRequests('key-b'), 2);
        });
    });

    suite('tryExecute', () => {
        test('Should execute callback when allowed', async () => {
            rateLimiter = createCustomRateLimiter({
                maxRequests: 5,
                windowMs: 1000
            });

            let executed = false;
            const result = await rateLimiter.tryExecute('test-key', () => {
                executed = true;
                return 'success';
            });

            assert.strictEqual(executed, true);
            assert.strictEqual(result, 'success');
        });

        test('Should not execute callback when rate limited', async () => {
            rateLimiter = createCustomRateLimiter({
                maxRequests: 1,
                windowMs: 1000
            });

            // Use up limit
            await rateLimiter.tryExecute('test-key', () => 'first');

            // This should be rate limited
            let executed = false;
            const result = await rateLimiter.tryExecute('test-key', () => {
                executed = true;
                return 'second';
            });

            assert.strictEqual(executed, false);
            assert.strictEqual(result, undefined);
        });

        test('Should work with async callbacks', async () => {
            rateLimiter = createCustomRateLimiter({
                maxRequests: 5,
                windowMs: 1000
            });

            const result = await rateLimiter.tryExecute('test-key', async () => {
                await new Promise(resolve => setTimeout(resolve, 10));
                return 'async-result';
            });

            assert.strictEqual(result, 'async-result');
        });
    });

    suite('getStats', () => {
        test('Should return correct statistics', () => {
            rateLimiter = createCustomRateLimiter({
                maxRequests: 5,
                windowMs: 1000
            });

            rateLimiter.isAllowed('key-a');
            rateLimiter.isAllowed('key-a');
            rateLimiter.isAllowed('key-b');

            const stats = rateLimiter.getStats();

            assert.strictEqual(stats.trackedKeys, 2);
            assert.strictEqual(stats.totalRequests, 3);
            assert.strictEqual(stats.config.maxRequests, 5);
            assert.strictEqual(stats.config.windowMs, 1000);
        });
    });

    suite('Factory Functions', () => {
        test('createRateLimiter should use preset config', () => {
            rateLimiter = createRateLimiter('VALIDATION');

            const stats = rateLimiter.getStats();
            assert.strictEqual(stats.config.maxRequests, RATE_LIMIT_DEFAULTS.VALIDATION.maxRequests);
            assert.strictEqual(stats.config.windowMs, RATE_LIMIT_DEFAULTS.VALIDATION.windowMs);
        });

        test('createCustomRateLimiter should use custom config', () => {
            rateLimiter = createCustomRateLimiter({
                maxRequests: 100,
                windowMs: 5000,
                logExceeded: false
            });

            const stats = rateLimiter.getStats();
            assert.strictEqual(stats.config.maxRequests, 100);
            assert.strictEqual(stats.config.windowMs, 5000);
        });
    });

    suite('Dispose', () => {
        test('Should clean up on dispose', () => {
            rateLimiter = createCustomRateLimiter({
                maxRequests: 5,
                windowMs: 1000
            });

            rateLimiter.isAllowed('test-key');

            // Should not throw
            assert.doesNotThrow(() => rateLimiter.dispose());

            // Stats should show empty after dispose
            const stats = rateLimiter.getStats();
            assert.strictEqual(stats.trackedKeys, 0);
        });
    });
});
