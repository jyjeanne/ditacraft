import * as assert from 'assert';
import { resyncStackToMatch } from '../src/utils/tagStack';

interface Entry {
    name: string;
}

suite('resyncStackToMatch', () => {
    test('matches the topmost entry and truncates through it', () => {
        const stack: Entry[] = [{ name: 'a' }, { name: 'b' }, { name: 'c' }];
        const matchIdx = resyncStackToMatch(stack, 'c', e => e.name);
        assert.strictEqual(matchIdx, 2);
        assert.deepStrictEqual(stack, [{ name: 'a' }, { name: 'b' }]);
    });

    test('matches an entry deeper in the stack and discards intervening entries', () => {
        const stack: Entry[] = [{ name: 'a' }, { name: 'b' }, { name: 'c' }, { name: 'd' }];
        const matchIdx = resyncStackToMatch(stack, 'b', e => e.name);
        assert.strictEqual(matchIdx, 1);
        assert.deepStrictEqual(stack, [{ name: 'a' }], 'stack must be truncated through and including the match');
    });

    test('returns -1 and leaves the stack untouched when nothing matches', () => {
        const stack: Entry[] = [{ name: 'a' }, { name: 'b' }];
        const matchIdx = resyncStackToMatch(stack, 'z', e => e.name);
        assert.strictEqual(matchIdx, -1);
        assert.deepStrictEqual(stack, [{ name: 'a' }, { name: 'b' }]);
    });

    test('invokes onDiscard for every discarded entry from top down, flagging only the match', () => {
        const stack: Entry[] = [{ name: 'a' }, { name: 'b' }, { name: 'c' }, { name: 'd' }];
        const calls: { name: string; index: number; isMatch: boolean }[] = [];

        resyncStackToMatch(stack, 'b', e => e.name, (entry, index, isMatch) => {
            calls.push({ name: entry.name, index, isMatch });
        });

        assert.deepStrictEqual(calls, [
            { name: 'd', index: 3, isMatch: false },
            { name: 'c', index: 2, isMatch: false },
            { name: 'b', index: 1, isMatch: true },
        ]);
    });

    test('does not invoke onDiscard when nothing matches', () => {
        const stack: Entry[] = [{ name: 'a' }];
        let called = false;
        resyncStackToMatch(stack, 'z', e => e.name, () => { called = true; });
        assert.strictEqual(called, false);
    });

    test('works with a plain string[] stack via the identity name accessor', () => {
        const stack: string[] = ['a', 'b', 'c'];
        const matchIdx = resyncStackToMatch(stack, 'a', name => name);
        assert.strictEqual(matchIdx, 0);
        assert.deepStrictEqual(stack, []);
    });
});
