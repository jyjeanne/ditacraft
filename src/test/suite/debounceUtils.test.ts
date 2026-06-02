import * as assert from 'assert';
import { createDebounced, createDebouncedMap, createDebouncedSet } from '../../utils/debounceUtils';

suite('Debounce Utilities', () => {

    suite('createDebounced', () => {

        test('should call handler after delay', (done) => {
            let called = false;
            const debounced = createDebounced<string>(async (_value) => {
                called = true;
            }, 50);

            debounced.schedule('test');
            assert.strictEqual(debounced.isPending(), true);

            setTimeout(() => {
                assert.strictEqual(called, true);
                assert.strictEqual(debounced.isPending(), false);
                debounced.dispose();
                done();
            }, 100);
        });

        test('should replace pending call with new schedule', (done) => {
            const calls: string[] = [];
            const debounced = createDebounced<string>(async (value) => {
                calls.push(value);
            }, 50);

            debounced.schedule('first');
            debounced.schedule('second');
            assert.strictEqual(debounced.isPending(), true);

            setTimeout(() => {
                assert.strictEqual(calls.length, 1);
                assert.strictEqual(calls[0], 'second');
                debounced.dispose();
                done();
            }, 100);
        });

        test('cancel should prevent handler from being called', (done) => {
            let called = false;
            const debounced = createDebounced<string>(async (_value) => {
                called = true;
            }, 50);

            debounced.schedule('test');
            debounced.cancel();
            assert.strictEqual(debounced.isPending(), false);

            setTimeout(() => {
                assert.strictEqual(called, false);
                debounced.dispose();
                done();
            }, 100);
        });

        test('isPending should return false when nothing scheduled', () => {
            const debounced = createDebounced<string>(async (_value) => {}, 50);
            assert.strictEqual(debounced.isPending(), false);
            debounced.dispose();
        });

        test('dispose should clear pending timer', (done) => {
            let called = false;
            const debounced = createDebounced<string>(async (_value) => {
                called = true;
            }, 50);

            debounced.schedule('test');
            debounced.dispose();
            assert.strictEqual(debounced.isPending(), false);

            setTimeout(() => {
                assert.strictEqual(called, false);
                done();
            }, 100);
        });

        test('handler error should not propagate', (done) => {
            const debounced = createDebounced<string>(async (_value) => {
                throw new Error('handler error');
            }, 50);

            debounced.schedule('test');

            setTimeout(() => {
                // Should not have thrown — handler errors are caught
                debounced.dispose();
                done();
            }, 100);
        });

    });

    suite('createDebouncedMap', () => {

        test('should call handler per key after delay', (done) => {
            const calls: Array<{ key: string; value: string }> = [];
            const debounced = createDebouncedMap<string, string>(async (key, value) => {
                calls.push({ key, value });
            }, 50);

            debounced.schedule('a', 'val-a');
            debounced.schedule('b', 'val-b');
            assert.strictEqual(debounced.pendingCount(), 2);

            setTimeout(() => {
                assert.strictEqual(calls.length, 2);
                debounced.dispose();
                done();
            }, 100);
        });

        test('should replace same-key pending call', (done) => {
            const calls: string[] = [];
            const debounced = createDebouncedMap<string, string>(async (_key, value) => {
                calls.push(value);
            }, 50);

            debounced.schedule('a', 'first');
            debounced.schedule('a', 'second');
            assert.strictEqual(debounced.pendingCount(), 1);

            setTimeout(() => {
                assert.strictEqual(calls.length, 1);
                assert.strictEqual(calls[0], 'second');
                debounced.dispose();
                done();
            }, 100);
        });

        test('cancel should remove pending call for key', (done) => {
            const calls: string[] = [];
            const debounced = createDebouncedMap<string, string>(async (_key, value) => {
                calls.push(value);
            }, 50);

            debounced.schedule('a', 'val-a');
            debounced.schedule('b', 'val-b');
            debounced.cancel('a');
            assert.strictEqual(debounced.pendingCount(), 1);

            setTimeout(() => {
                assert.strictEqual(calls.length, 1);
                assert.strictEqual(calls[0], 'val-b');
                debounced.dispose();
                done();
            }, 100);
        });

        test('pendingCount should return 0 when nothing scheduled', () => {
            const debounced = createDebouncedMap<string, string>(async () => {}, 50);
            assert.strictEqual(debounced.pendingCount(), 0);
            debounced.dispose();
        });

        test('dispose should clear all pending timers', (done) => {
            let called = false;
            const debounced = createDebouncedMap<string, string>(async () => {
                called = true;
            }, 50);

            debounced.schedule('a', 'val-a');
            debounced.dispose();
            assert.strictEqual(debounced.pendingCount(), 0);

            setTimeout(() => {
                assert.strictEqual(called, false);
                done();
            }, 100);
        });

    });

    suite('createDebouncedSet', () => {

        test('should batch multiple adds into single call', (done) => {
            const calls: string[][] = [];
            const debounced = createDebouncedSet<string>(async (values) => {
                calls.push(Array.from(values));
            }, 50);

            debounced.add('a');
            debounced.add('b');
            debounced.add('c');
            assert.strictEqual(debounced.pendingCount(), 3);

            setTimeout(() => {
                assert.strictEqual(calls.length, 1);
                const batch = calls[0];
                assert.ok(batch.includes('a'));
                assert.ok(batch.includes('b'));
                assert.ok(batch.includes('c'));
                assert.strictEqual(debounced.pendingCount(), 0);
                debounced.dispose();
                done();
            }, 100);
        });

        test('add after timeout creates new batch', (done) => {
            const calls: string[][] = [];
            const debounced = createDebouncedSet<string>(async (values) => {
                calls.push(Array.from(values));
            }, 40);

            debounced.add('a');

            setTimeout(() => {
                debounced.add('b');
                setTimeout(() => {
                    assert.strictEqual(calls.length, 2);
                    assert.deepStrictEqual(calls[0], ['a']);
                    assert.deepStrictEqual(calls[1], ['b']);
                    debounced.dispose();
                    done();
                }, 80);
            }, 80);
        });

        test('cancel should clear pending values', (done) => {
            const calls: string[][] = [];
            const debounced = createDebouncedSet<string>(async (values) => {
                calls.push(Array.from(values));
            }, 50);

            debounced.add('a');
            debounced.add('b');
            debounced.cancel();
            assert.strictEqual(debounced.pendingCount(), 0);

            setTimeout(() => {
                assert.strictEqual(calls.length, 0);
                debounced.dispose();
                done();
            }, 100);
        });

        test('pendingCount returns count of collected values', () => {
            const debounced = createDebouncedSet<string>(async () => {}, 100);
            assert.strictEqual(debounced.pendingCount(), 0);
            debounced.add('a');
            assert.strictEqual(debounced.pendingCount(), 1);
            debounced.add('b');
            assert.strictEqual(debounced.pendingCount(), 2);
            debounced.dispose();
        });

        test('dispose should clear values and prevent calls', (done) => {
            let called = false;
            const debounced = createDebouncedSet<string>(async () => {
                called = true;
            }, 50);

            debounced.add('a');
            debounced.dispose();
            assert.strictEqual(debounced.pendingCount(), 0);

            setTimeout(() => {
                assert.strictEqual(called, false);
                done();
            }, 100);
        });

    });

});
