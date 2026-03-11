import * as assert from 'assert';
import {
    stripCommentsAndCDATA,
    stripCommentsAndCodeContent,
    offsetToRange,
    escapeRegex,
} from '../src/utils/textUtils';

suite('textUtils', () => {

    // -------------------------------------------------------------------------
    suite('stripCommentsAndCDATA', () => {

        test('strips inline XML comment content', () => {
            const input = '<p><!-- comment -->text</p>';
            const result = stripCommentsAndCDATA(input);
            // Comment markers and content are replaced by spaces, non-newline chars
            assert.ok(!result.includes('comment'));
            assert.ok(result.includes('text'));
        });

        test('preserves line count after stripping comment', () => {
            const input = '<p>\n<!-- line one\nline two\n-->\ntext</p>';
            const result = stripCommentsAndCDATA(input);
            assert.strictEqual(
                result.split('\n').length,
                input.split('\n').length,
                'line count must be preserved'
            );
        });

        test('strips CDATA section content', () => {
            const input = 'before<![CDATA[<em>raw xml</em>]]>after';
            const result = stripCommentsAndCDATA(input);
            assert.ok(!result.includes('raw xml'));
            assert.ok(result.includes('before'));
            assert.ok(result.includes('after'));
        });

        test('preserves line count after stripping CDATA', () => {
            const input = 'a\n<![CDATA[\nsome\ncdata\n]]>\nb';
            const result = stripCommentsAndCDATA(input);
            assert.strictEqual(
                result.split('\n').length,
                input.split('\n').length
            );
        });

        test('strips both comment and CDATA in same string', () => {
            const input = '<!-- note --><![CDATA[data]]>content';
            const result = stripCommentsAndCDATA(input);
            assert.ok(!result.includes('note'));
            assert.ok(!result.includes('data'));
            assert.ok(result.includes('content'));
        });

        test('leaves ordinary text unchanged', () => {
            const input = '<topic id="t1"><title>Hello</title></topic>';
            assert.strictEqual(stripCommentsAndCDATA(input), input);
        });
    });

    // -------------------------------------------------------------------------
    suite('stripCommentsAndCodeContent', () => {

        test('blanks content inside codeblock', () => {
            const input = '<codeblock>int x = 1;</codeblock>';
            const result = stripCommentsAndCodeContent(input);
            assert.ok(!result.includes('int x'));
            // Opening and closing tags must be preserved
            assert.ok(result.includes('<codeblock>'));
            assert.ok(result.includes('</codeblock>'));
        });

        test('blanks content inside pre', () => {
            const input = '<pre>some preformatted text</pre>';
            const result = stripCommentsAndCodeContent(input);
            assert.ok(!result.includes('preformatted'));
            assert.ok(result.includes('<pre>'));
            assert.ok(result.includes('</pre>'));
        });

        test('blanks content inside screen', () => {
            const input = '<screen>$ ls -la</screen>';
            const result = stripCommentsAndCodeContent(input);
            assert.ok(!result.includes('ls -la'));
            assert.ok(result.includes('<screen>'));
            assert.ok(result.includes('</screen>'));
        });

        test('blanks content inside msgblock', () => {
            const input = '<msgblock>Error: file not found</msgblock>';
            const result = stripCommentsAndCodeContent(input);
            assert.ok(!result.includes('Error'));
            assert.ok(result.includes('<msgblock>'));
            assert.ok(result.includes('</msgblock>'));
        });

        test('preserves text outside code elements', () => {
            // The word "code" appears in the tag names <codeblock>/</codeblock> which are
            // preserved; only the inner content is blanked.
            const input = '<p>normal text</p><codeblock>inner content</codeblock><p>more</p>';
            const result = stripCommentsAndCodeContent(input);
            assert.ok(result.includes('normal text'));
            assert.ok(result.includes('more'));
            assert.ok(!result.includes('inner content'));
            assert.ok(result.includes('<codeblock>'));
            assert.ok(result.includes('</codeblock>'));
        });

        test('preserves attributes on opening tag', () => {
            const input = '<codeblock outputclass="language-java">int x;</codeblock>';
            const result = stripCommentsAndCodeContent(input);
            assert.ok(result.includes('outputclass="language-java"'));
            assert.ok(!result.includes('int x'));
        });

        test('backreference: does not match mismatched closing tag', () => {
            // The regex uses a backreference \2 so only the matching close tag
            // terminates each element. Each element's inner content is blanked
            // independently; the tag names in <codeblock>/</codeblock> are preserved.
            const input = '<codeblock>secret1</codeblock> <pre>secret2</pre>';
            const result = stripCommentsAndCodeContent(input);
            assert.ok(!result.includes('secret1'));
            assert.ok(!result.includes('secret2'));
            assert.ok(result.includes('<codeblock>'));
            assert.ok(result.includes('</codeblock>'));
            assert.ok(result.includes('<pre>'));
            assert.ok(result.includes('</pre>'));
        });

        test('preserves line count when blanking multiline codeblock', () => {
            const input = '<codeblock>\nline one\nline two\n</codeblock>';
            const result = stripCommentsAndCodeContent(input);
            assert.strictEqual(
                result.split('\n').length,
                input.split('\n').length
            );
        });

        test('also strips XML comments (inherits stripCommentsAndCDATA)', () => {
            const input = '<!-- hidden --><p>visible</p>';
            const result = stripCommentsAndCodeContent(input);
            assert.ok(!result.includes('hidden'));
            assert.ok(result.includes('visible'));
        });
    });

    // -------------------------------------------------------------------------
    suite('offsetToRange', () => {

        test('single-line range', () => {
            const text = 'hello world';
            const range = offsetToRange(text, 6, 11);
            assert.strictEqual(range.start.line, 0);
            assert.strictEqual(range.start.character, 6);
            assert.strictEqual(range.end.line, 0);
            assert.strictEqual(range.end.character, 11);
        });

        test('range spanning two lines (LF)', () => {
            // "abc\ndef"  — start at 0, end at 7 (past the 'd')
            const text = 'abc\ndef';
            const range = offsetToRange(text, 0, 4);
            assert.strictEqual(range.start.line, 0);
            assert.strictEqual(range.start.character, 0);
            assert.strictEqual(range.end.line, 1);
            assert.strictEqual(range.end.character, 0);
        });

        test('CRLF: start offset lands on \\n of \\r\\n pair (line 59 branch)', () => {
            // Build: "ab\r\ncd"
            //  offsets: a=0, b=1, \r=2, \n=3, c=4, d=5
            // Setting start=3 (the \n) triggers line 59: after consuming \r at i=2,
            // i is incremented to 3, which equals safeStart, so startLine/startChar
            // are recorded at the beginning of line 1 (char=0).
            // end=5 is offset of 'd'; after \r\n resets char=0, 'c' at i=4 bumps
            // char to 1, so endChar is 1 when the loop hits i=5.
            const text = 'ab\r\ncd';
            const range = offsetToRange(text, 3, 5);
            assert.strictEqual(range.start.line, 1);
            assert.strictEqual(range.start.character, 0);
            assert.strictEqual(range.end.line, 1);
            assert.strictEqual(range.end.character, 1);
        });

        test('CRLF: end offset lands on \\n of \\r\\n pair (line 60 branch)', () => {
            // Build: "ab\r\ncd"
            //  offsets: a=0, b=1, \r=2, \n=3, c=4, d=5
            // Setting end=3 (the \n) should trigger line 60:
            //   after incrementing i past \r, i becomes 3 which equals safeEnd,
            //   so endLine/endChar are recorded and the loop breaks.
            const text = 'ab\r\ncd';
            const range = offsetToRange(text, 0, 3);
            assert.strictEqual(range.start.line, 0);
            assert.strictEqual(range.start.character, 0);
            assert.strictEqual(range.end.line, 1);
            assert.strictEqual(range.end.character, 0);
        });

        test('CRLF: both start and end on \\n of \\r\\n pair (lines 59 and 60)', () => {
            // "a\r\n\r\nb" — offsets: a=0, \r=1, \n=2, \r=3, \n=4, b=5
            // start=2 (\n of first CRLF) → triggers line 59
            // end=4   (\n of second CRLF) → triggers line 60
            const text = 'a\r\n\r\nb';
            const range = offsetToRange(text, 2, 4);
            assert.strictEqual(range.start.line, 1);
            assert.strictEqual(range.start.character, 0);
            assert.strictEqual(range.end.line, 2);
            assert.strictEqual(range.end.character, 0);
        });

        test('offsets beyond text length are clamped', () => {
            const text = 'hi';
            const range = offsetToRange(text, 0, 999);
            assert.strictEqual(range.end.line, 0);
            assert.strictEqual(range.end.character, 2);
        });

        test('zero-length range (start === end)', () => {
            const text = 'abc';
            const range = offsetToRange(text, 2, 2);
            assert.strictEqual(range.start.line, 0);
            assert.strictEqual(range.start.character, 2);
            assert.strictEqual(range.end.line, 0);
            assert.strictEqual(range.end.character, 2);
        });
    });

    // -------------------------------------------------------------------------
    suite('escapeRegex', () => {

        test('escapes opening and closing brackets', () => {
            assert.strictEqual(escapeRegex('[a]'), '\\[a\\]');
        });

        test('escapes dot', () => {
            assert.strictEqual(escapeRegex('.'), '\\.');
        });

        test('escapes asterisk', () => {
            assert.strictEqual(escapeRegex('*'), '\\*');
        });

        test('escapes plus', () => {
            assert.strictEqual(escapeRegex('+'), '\\+');
        });

        test('escapes question mark', () => {
            assert.strictEqual(escapeRegex('?'), '\\?');
        });

        test('escapes caret', () => {
            assert.strictEqual(escapeRegex('^'), '\\^');
        });

        test('escapes dollar sign', () => {
            assert.strictEqual(escapeRegex('$'), '\\$');
        });

        test('escapes curly braces', () => {
            assert.strictEqual(escapeRegex('{2}'), '\\{2\\}');
        });

        test('escapes pipe', () => {
            assert.strictEqual(escapeRegex('a|b'), 'a\\|b');
        });

        test('escapes parentheses', () => {
            assert.strictEqual(escapeRegex('(group)'), '\\(group\\)');
        });

        test('escapes backslash', () => {
            assert.strictEqual(escapeRegex('a\\b'), 'a\\\\b');
        });

        test('passes through plain alphanumeric strings unchanged', () => {
            assert.strictEqual(escapeRegex('hello123'), 'hello123');
        });

        test('escaped result works as a literal regex pattern', () => {
            const input = 'price: $1.99 (sale)';
            const pattern = new RegExp(escapeRegex(input));
            assert.ok(pattern.test(input));
        });
    });
});
