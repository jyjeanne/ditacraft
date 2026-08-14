/**
 * XML Element Scanner Test Suite (§4.5 Piece 2)
 * Pure-function tests for findProfiledElements — no VS Code API surface
 * involved, so these don't need the extension host at all.
 */

import * as assert from 'assert';
import { findProfiledElements } from '../../utils/xmlElementScanner';

const ATTRS = ['audience', 'platform', 'product', 'otherprops', 'props', 'rev'] as const;

suite('XML Element Scanner Test Suite', () => {
    test('Should find nothing when no element has a profiling attribute', () => {
        const content = '<topic id="t1"><title>Title</title><body><p>Text</p></body></topic>';
        assert.deepStrictEqual(findProfiledElements(content, ATTRS), []);
    });

    test('Should find a self-closing element with a profiling attribute', () => {
        const content = '<body><image href="x.png" audience="internal"/></body>';
        const elements = findProfiledElements(content, ATTRS);
        assert.strictEqual(elements.length, 1);
        assert.strictEqual(elements[0].attrs.audience, 'internal');
        assert.strictEqual(content.slice(elements[0].start, elements[0].end), '<image href="x.png" audience="internal"/>');
    });

    test('Should compute the full range of a non-self-closing element, including its children', () => {
        const content = '<body><p audience="internal">Some <b>bold</b> text</p></body>';
        const elements = findProfiledElements(content, ATTRS);
        assert.strictEqual(elements.length, 1);
        assert.strictEqual(
            content.slice(elements[0].start, elements[0].end),
            '<p audience="internal">Some <b>bold</b> text</p>'
        );
    });

    test('Should correctly match the closing tag past a same-named nested element (depth tracking)', () => {
        const content = '<body><section audience="internal">outer<section>inner</section>after</section></body>';
        const elements = findProfiledElements(content, ATTRS);
        assert.strictEqual(elements.length, 1);
        assert.strictEqual(
            content.slice(elements[0].start, elements[0].end),
            '<section audience="internal">outer<section>inner</section>after</section>'
        );
    });

    test('Should find multiple independent profiled elements', () => {
        const content =
            '<body>' +
            '<p audience="internal">A</p>' +
            '<p platform="windows">B</p>' +
            '<p>C</p>' +
            '</body>';
        const elements = findProfiledElements(content, ATTRS);
        assert.strictEqual(elements.length, 2);
        assert.strictEqual(elements[0].attrs.audience, 'internal');
        assert.strictEqual(elements[1].attrs.platform, 'windows');
    });

    test('Should never treat <prop> itself as a highlighting target', () => {
        // Not realistic DITA content (prop belongs in .ditaval, not topics),
        // but guards the deliberate exclusion in findProfiledElements.
        const content = '<val><prop action="exclude" audience="internal"/></val>';
        assert.deepStrictEqual(findProfiledElements(content, ATTRS), []);
    });

    test('Should fall back to just the opening tag range when no closing tag is found (malformed/truncated document)', () => {
        const content = '<body><section audience="internal">unterminated';
        const elements = findProfiledElements(content, ATTRS);
        assert.strictEqual(elements.length, 1);
        assert.strictEqual(content.slice(elements[0].start, elements[0].end), '<section audience="internal">');
    });

    test('Should parse space-separated multi-value profiling attributes without splitting them', () => {
        const content = '<p audience="internal external">Text</p>';
        const elements = findProfiledElements(content, ATTRS);
        assert.strictEqual(elements.length, 1);
        assert.strictEqual(elements[0].attrs.audience, 'internal external');
    });

    test('Should not match an attribute whose name merely contains a profiling attribute as a substring', () => {
        // e.g. a hypothetical "myaudience" attribute must not be mistaken for "audience".
        const content = '<p myaudience="internal">Text</p>';
        assert.deepStrictEqual(findProfiledElements(content, ATTRS), []);
    });
});
