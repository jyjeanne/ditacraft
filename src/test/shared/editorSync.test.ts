/**
 * Visual Editor sync Test Suite (spec §13.1): one edit in flight, coalescing, versions,
 * and external changes.
 */

import * as assert from 'assert';
import { applySpanEdit } from '../../shared/editor/minimalEdit';
import { EditSync } from '../../shared/editor/sync';

suite('Visual Editor: edit sync (spec §13.1)', () => {
    test('one edit at a time; typing during the round trip is sent as one coalesced edit', () => {
        const sync = new EditSync('<p>Hello</p>', 4);
        const first = sync.local('<p>Hello!</p>');
        assert.deepStrictEqual(first, { type: 'edit', baseVersion: 4, start: 8, end: 8, text: '!' });
        assert.strictEqual(sync.busy, true);
        assert.strictEqual(sync.local('<p>Hello!!</p>'), undefined);
        assert.strictEqual(sync.local('<p>Hello!!!</p>'), undefined);
        const second = sync.ack(5);
        assert.deepStrictEqual(second, { type: 'edit', baseVersion: 5, start: 9, end: 9, text: '!!' });
        assert.strictEqual(sync.ack(6), undefined);
        assert.strictEqual(sync.busy, false);
        assert.strictEqual(sync.documentVersion, 6);
    });

    test('edits replay onto the host text in order', () => {
        let host = 'abc';
        const sync = new EditSync(host, 1);
        const e1 = sync.local('abXc')!;
        sync.local('aYbXcZ');
        host = applySpanEdit(host, e1);
        const e2 = sync.ack(2)!;
        host = applySpanEdit(host, e2);
        sync.ack(3);
        assert.strictEqual(host, 'aYbXcZ');
    });

    test('no change, no edit', () => {
        const sync = new EditSync('x', 1);
        assert.strictEqual(sync.local('x'), undefined);
    });

    test('an external change wins over anything in flight and asks for a rebuild', () => {
        const sync = new EditSync('one', 1);
        sync.local('one two');
        sync.local('one two three');
        assert.strictEqual(sync.external(2, 'uno'), true);
        assert.strictEqual(sync.busy, false);
        assert.strictEqual(sync.latest, 'uno');
        // The next local change is computed against the host's text.
        assert.deepStrictEqual(sync.local('unos'), { type: 'edit', baseVersion: 2, start: 3, end: 3, text: 's' });
    });

    test('an external change to the text the editor already shows needs no rebuild', () => {
        const sync = new EditSync('same', 1);
        assert.strictEqual(sync.external(2, 'same'), false);
    });
});
