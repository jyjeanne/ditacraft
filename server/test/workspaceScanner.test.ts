import * as assert from 'assert';
import { offsetToPosition } from '../src/utils/workspaceScanner';

suite('offsetToPosition', () => {
    test('offset 0 is line 0 character 0', () => {
        const pos = offsetToPosition('hello', 0);
        assert.strictEqual(pos.line, 0);
        assert.strictEqual(pos.character, 0);
    });

    test('character on first line', () => {
        const pos = offsetToPosition('hello', 3);
        assert.strictEqual(pos.line, 0);
        assert.strictEqual(pos.character, 3);
    });

    test('multiple lines with LF', () => {
        const text = 'line1\nline2\nline3';
        const pos = offsetToPosition(text, 8); // "ne2" -> line 1, char 2
        assert.strictEqual(pos.line, 1);
        assert.strictEqual(pos.character, 2);
    });

    test('start of second line', () => {
        const text = 'line1\nline2';
        const pos = offsetToPosition(text, 6); // "l" of line2
        assert.strictEqual(pos.line, 1);
        assert.strictEqual(pos.character, 0);
    });

    test('Windows line endings (CRLF)', () => {
        const text = 'line1\r\nline2\r\nline3';
        const pos = offsetToPosition(text, 9); // "ne2" -> line 1, char 2
        assert.strictEqual(pos.line, 1);
        assert.strictEqual(pos.character, 2);
    });

    test('empty string', () => {
        const pos = offsetToPosition('', 0);
        assert.strictEqual(pos.line, 0);
        assert.strictEqual(pos.character, 0);
    });

    test('offset at end of text', () => {
        const text = 'ab\ncd';
        const pos = offsetToPosition(text, 5); // past "d"
        assert.strictEqual(pos.line, 1);
        assert.strictEqual(pos.character, 2);
    });

    test('third line', () => {
        const text = 'a\nb\nc';
        const pos = offsetToPosition(text, 4); // "c"
        assert.strictEqual(pos.line, 2);
        assert.strictEqual(pos.character, 0);
    });
});
