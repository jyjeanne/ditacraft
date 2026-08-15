import * as assert from 'assert';
import { findElementExtentById, getElementInnerContent } from '../src/utils/elementExtent';

suite('findElementExtentById', () => {
    test('finds a simple element by id and returns its full span', () => {
        const content = '<topic id="t"><body><p id="target">Hello world.</p></body></topic>';
        const extent = findElementExtentById(content, 'target');
        assert.ok(extent);
        assert.strictEqual(extent!.tagName, 'p');
        assert.strictEqual(content.slice(extent!.start, extent!.end), '<p id="target">Hello world.</p>');
    });

    test('returns undefined when no element has the given id', () => {
        const content = '<topic id="t"><body><p>No id here.</p></body></topic>';
        assert.strictEqual(findElementExtentById(content, 'target'), undefined);
    });

    test('handles a self-closing element', () => {
        const content = '<topic id="t"><body><image id="target" href="x.png"/></body></topic>';
        const extent = findElementExtentById(content, 'target');
        assert.ok(extent);
        assert.strictEqual(extent!.tagName, 'image');
        assert.strictEqual(content.slice(extent!.start, extent!.end), '<image id="target" href="x.png"/>');
    });

    test('depth-tracks correctly through nested elements of the same tag name', () => {
        const content = '<topic id="t"><body><ul id="target"><li><ul><li>Nested</li></ul></li></ul></body></topic>';
        const extent = findElementExtentById(content, 'target');
        assert.ok(extent);
        assert.strictEqual(content.slice(extent!.start, extent!.end), '<ul id="target"><li><ul><li>Nested</li></ul></li></ul>');
    });

    test('depth-tracks correctly through sibling elements with the same tag name', () => {
        const content = '<body><p id="target">First.</p><p>Second.</p></body>';
        const extent = findElementExtentById(content, 'target');
        assert.ok(extent);
        assert.strictEqual(content.slice(extent!.start, extent!.end), '<p id="target">First.</p>');
    });

    test('returns undefined for malformed/unclosed content', () => {
        const content = '<topic id="t"><body><p id="target">Unclosed paragraph</body></topic>';
        assert.strictEqual(findElementExtentById(content, 'target'), undefined);
    });

    test('does not match an id inside a comment', () => {
        const content = '<body><!-- <p id="target">Fake</p> --><p>Real.</p></body>';
        assert.strictEqual(findElementExtentById(content, 'target'), undefined);
    });

    test('supports single-quoted id attribute values', () => {
        const content = "<body><p id='target'>Quoted.</p></body>";
        const extent = findElementExtentById(content, 'target');
        assert.ok(extent);
        assert.strictEqual(content.slice(extent!.start, extent!.end), "<p id='target'>Quoted.</p>");
    });

    test('preserves multi-line element content verbatim', () => {
        const content = '<body><section id="target">\n  <title>T</title>\n  <p>Body.</p>\n</section></body>';
        const extent = findElementExtentById(content, 'target');
        assert.ok(extent);
        const extracted = content.slice(extent!.start, extent!.end);
        assert.ok(extracted.includes('<title>T</title>'));
        assert.ok(extracted.includes('<p>Body.</p>'));
        assert.ok(extracted.endsWith('</section>'));
    });
});

suite('getElementInnerContent', () => {
    test('returns the content between the opening and closing tags', () => {
        const content = '<p id="target">Hello world.</p>';
        const extent = findElementExtentById(content, 'target');
        assert.strictEqual(getElementInnerContent(content, extent!), 'Hello world.');
    });

    test('returns an empty string for a self-closing element', () => {
        const content = '<image id="target" href="x.png"/>';
        const extent = findElementExtentById(content, 'target');
        assert.strictEqual(getElementInnerContent(content, extent!), '');
    });

    test('returns nested markup verbatim, not just text content', () => {
        const content = '<p id="target">Text with <b>bold</b> and <i>italic</i>.</p>';
        const extent = findElementExtentById(content, 'target');
        assert.strictEqual(getElementInnerContent(content, extent!), 'Text with <b>bold</b> and <i>italic</i>.');
    });

    test('returns an empty string for an element with no content between its tags', () => {
        const content = '<p id="target"></p>';
        const extent = findElementExtentById(content, 'target');
        assert.strictEqual(getElementInnerContent(content, extent!), '');
    });
});
