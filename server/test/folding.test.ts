import * as assert from 'assert';
import { computeFoldingRanges } from '../src/features/folding';

suite('computeFoldingRanges', () => {
    test('multi-line element produces fold', () => {
        const text = '<topic>\n  <title>T</title>\n</topic>';
        const ranges = computeFoldingRanges(text);
        assert.ok(ranges.length >= 1);
        const topicFold = ranges.find(r => r.startLine === 0);
        assert.ok(topicFold);
        assert.strictEqual(topicFold.startLine, 0);
        assert.strictEqual(topicFold.endLine, 2);
    });

    test('single-line element produces no fold', () => {
        const text = '<p>Hello world</p>';
        const ranges = computeFoldingRanges(text);
        assert.strictEqual(ranges.length, 0);
    });

    test('nested elements produce multiple ranges', () => {
        const text = '<topic>\n  <body>\n    <p>Text</p>\n  </body>\n</topic>';
        const ranges = computeFoldingRanges(text);
        assert.ok(ranges.length >= 2);
        // topic: line 0-4, body: line 1-3
        const topicFold = ranges.find(r => r.startLine === 0);
        const bodyFold = ranges.find(r => r.startLine === 1);
        assert.ok(topicFold);
        assert.ok(bodyFold);
    });

    test('self-closing element produces no fold', () => {
        const text = '<topicref href="file.dita"/>';
        const ranges = computeFoldingRanges(text);
        assert.strictEqual(ranges.length, 0);
    });

    test('multi-line comment produces fold with comment kind', () => {
        const text = '<!--\n  This is a\n  multi-line comment\n-->';
        const ranges = computeFoldingRanges(text);
        assert.strictEqual(ranges.length, 1);
        assert.strictEqual(ranges[0].startLine, 0);
        assert.strictEqual(ranges[0].endLine, 3);
    });

    test('single-line comment produces no fold', () => {
        const text = '<!-- short comment -->';
        const ranges = computeFoldingRanges(text);
        assert.strictEqual(ranges.length, 0);
    });

    test('multi-line CDATA produces fold', () => {
        const text = '<![CDATA[\nsome\ndata\n]]>';
        const ranges = computeFoldingRanges(text);
        assert.strictEqual(ranges.length, 1);
        assert.strictEqual(ranges[0].startLine, 0);
    });

    test('empty document', () => {
        const ranges = computeFoldingRanges('');
        assert.strictEqual(ranges.length, 0);
    });

    test('deeply nested structure', () => {
        const text = [
            '<topic>',
            '  <body>',
            '    <section>',
            '      <p>Text</p>',
            '    </section>',
            '  </body>',
            '</topic>',
        ].join('\n');
        const ranges = computeFoldingRanges(text);
        assert.ok(ranges.length >= 3); // topic, body, section
    });

    test('Windows line endings (CRLF)', () => {
        const text = '<topic>\r\n  <title>T</title>\r\n</topic>';
        const ranges = computeFoldingRanges(text);
        assert.ok(ranges.length >= 1);
        const topicFold = ranges.find(r => r.startLine === 0);
        assert.ok(topicFold);
        assert.strictEqual(topicFold.endLine, 2);
    });
});
