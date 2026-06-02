import * as assert from 'assert';
import * as vscode from 'vscode';

// Test the KEYREF_PATTERN regex exported from keyUsageScanner
const KEYREF_PATTERN = /\b(?:keyref|conkeyref)\s*=\s*["']([^"']+)["']/g;
const COMMENT_REGEX = /<!--[\s\S]*?-->/g;

suite('Key Usage Scanner', () => {

    suite('KEYREF_PATTERN', () => {

        test('matches keyref with double quotes', () => {
            const text = '<xref keyref="product-name"/>';
            const matches = Array.from(text.matchAll(KEYREF_PATTERN));
            assert.strictEqual(matches.length, 1);
            assert.strictEqual(matches[0][1], 'product-name');
        });

        test('matches keyref with single quotes', () => {
            const text = "<xref keyref='product-name'/>";
            const matches = Array.from(text.matchAll(KEYREF_PATTERN));
            assert.strictEqual(matches.length, 1);
            assert.strictEqual(matches[0][1], 'product-name');
        });

        test('matches conkeyref with double quotes', () => {
            const text = '<ph conkeyref="product-name/desc"/>';
            const matches = Array.from(text.matchAll(KEYREF_PATTERN));
            assert.strictEqual(matches.length, 1);
            assert.strictEqual(matches[0][1], 'product-name/desc');
        });

        test('matches conkeyref with single quotes', () => {
            const text = "<ph conkeyref='product-name/desc'/>";
            const matches = Array.from(text.matchAll(KEYREF_PATTERN));
            assert.strictEqual(matches.length, 1);
            assert.strictEqual(matches[0][1], 'product-name/desc');
        });

        test('matches multiple keyrefs in one line', () => {
            const text = '<xref keyref="a"/> and <xref keyref="b"/>';
            const matches = Array.from(text.matchAll(KEYREF_PATTERN));
            assert.strictEqual(matches.length, 2);
            assert.strictEqual(matches[0][1], 'a');
            assert.strictEqual(matches[1][1], 'b');
        });

        test('ignores href attribute', () => {
            const text = '<xref href="topic.dita"/>';
            const matches = Array.from(text.matchAll(KEYREF_PATTERN));
            assert.strictEqual(matches.length, 0);
        });

        test('ignores conref attribute', () => {
            const text = '<ph conref="topic.dita#id"/>';
            const matches = Array.from(text.matchAll(KEYREF_PATTERN));
            assert.strictEqual(matches.length, 0);
        });

        test('handles empty value (should not match — empty keyref is not a valid ref)', () => {
            const text = '<xref keyref=""/>';
            const matches = Array.from(text.matchAll(KEYREF_PATTERN));
            assert.strictEqual(matches.length, 0);
        });

        test('handles whitespace around equals', () => {
            const text = '<xref keyref = "test"/>';
            const matches = Array.from(text.matchAll(KEYREF_PATTERN));
            assert.strictEqual(matches.length, 1);
            assert.strictEqual(matches[0][1], 'test');
        });

    });

    suite('COMMENT_REGEX', () => {

        test('matches single-line comment', () => {
            const text = '<!-- comment -->';
            const replaced = text.replace(COMMENT_REGEX, '');
            assert.strictEqual(replaced.trim(), '');
        });

        test('matches multi-line comment', () => {
            const text = '<!-- line 1\nline 2\nline 3 -->';
            const replaced = text.replace(COMMENT_REGEX, '');
            assert.strictEqual(replaced.trim(), '');
        });

        test('does not affect text outside comments', () => {
            const text = '<topic id="t1"><!-- comment --><title>Test</title></topic>';
            const replaced = text.replace(COMMENT_REGEX, '');
            assert.strictEqual(replaced.trim(), '<topic id="t1"><title>Test</title></topic>');
        });

        test('removes keyref inside comments', () => {
            const text = '<!-- keyref="should-be-ignored" --> <xref keyref="real-key"/>';
            const replaced = text.replace(COMMENT_REGEX, '');
            const matches = Array.from(replaced.matchAll(KEYREF_PATTERN));
            assert.strictEqual(matches.length, 1);
            assert.strictEqual(matches[0][1], 'real-key');
        });

    });

    suite('offsetToPosition', () => {

        // Test the offset-to-position logic (replicated for testing since it's internal)
        function offsetToPosition(text: string, offset: number): vscode.Position {
            let line = 0;
            let character = 0;
            for (let i = 0; i < offset && i < text.length; i++) {
                if (text[i] === '\n') {
                    line++;
                    character = 0;
                } else if (text[i] === '\r') {
                    // Skip \r
                } else {
                    character++;
                }
            }
            return new vscode.Position(line, character);
        }

        test('offset 0 returns line 0, char 0', () => {
            const pos = offsetToPosition('hello world', 0);
            assert.strictEqual(pos.line, 0);
            assert.strictEqual(pos.character, 0);
        });

        test('offset in middle of first line', () => {
            const pos = offsetToPosition('hello world', 6);
            assert.strictEqual(pos.line, 0);
            assert.strictEqual(pos.character, 6);
        });

        test('offset after newline', () => {
            const pos = offsetToPosition('line1\nline2', 7);
            assert.strictEqual(pos.line, 1);
            assert.strictEqual(pos.character, 1);
        });

        test('offset with CRLF line endings', () => {
            const pos = offsetToPosition('line1\r\nline2', 8);
            assert.strictEqual(pos.line, 1);
            assert.strictEqual(pos.character, 1);
        });

        test('offset clamped to text length', () => {
            const pos = offsetToPosition('short', 100);
            assert.strictEqual(pos.line, 0);
            assert.strictEqual(pos.character, 5);
        });

        test('multiple lines with mixed endings', () => {
            const text = 'a\nb\r\nc\nd';
            let pos = offsetToPosition(text, 0);
            assert.strictEqual(pos.line, 0); assert.strictEqual(pos.character, 0);
            pos = offsetToPosition(text, 2);
            assert.strictEqual(pos.line, 1); assert.strictEqual(pos.character, 0);
            pos = offsetToPosition(text, 5);
            assert.strictEqual(pos.line, 2); assert.strictEqual(pos.character, 0);
        });

    });

});
