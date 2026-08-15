/**
 * Extract Topic From Section — Pure Extraction Helper Tests (§5.4)
 * No VS Code API surface involved, so these don't need the extension
 * host at all.
 */

import * as assert from 'assert';
import { findEnclosingSection } from '../../utils/sectionExtractor';

suite('Section Extractor Test Suite', () => {
    suite('findEnclosingSection', () => {
        test('Should find a section containing the given offset', () => {
            const text = '<concept id="t"><conbody><section><title>Sec</title><p>Body text.</p></section></conbody></concept>';
            const offset = text.indexOf('Body text');
            const result = findEnclosingSection(text, offset);
            assert.ok(result);
            assert.strictEqual(text.slice(result!.start, result!.end), '<section><title>Sec</title><p>Body text.</p></section>');
        });

        test('Should return undefined when the offset is outside any section', () => {
            const text = '<concept id="t"><conbody><p>No section here.</p></conbody></concept>';
            const offset = text.indexOf('No section');
            assert.strictEqual(findEnclosingSection(text, offset), undefined);
        });

        test('Should extract the section\'s title as plain text', () => {
            const text = '<section><title>My <b>Bold</b> Title</title><p>Body.</p></section>';
            const result = findEnclosingSection(text, text.indexOf('Body'));
            assert.strictEqual(result!.title, 'My Bold Title');
        });

        test('Should leave title undefined when the section has none', () => {
            const text = '<section><p>Just a paragraph.</p></section>';
            const result = findEnclosingSection(text, text.indexOf('Just'));
            assert.strictEqual(result!.title, undefined);
            assert.strictEqual(result!.bodyContent, '<p>Just a paragraph.</p>');
        });

        test('Should strip the leading <title> from bodyContent, keeping the rest', () => {
            const text = '<section><title>T</title><p>One.</p><p>Two.</p></section>';
            const result = findEnclosingSection(text, text.indexOf('One'));
            assert.strictEqual(result!.bodyContent, '<p>One.</p><p>Two.</p>');
        });

        test('Should extract the section\'s own id attribute', () => {
            const text = '<section id="my-sec"><title>T</title><p>Body.</p></section>';
            const result = findEnclosingSection(text, text.indexOf('Body'));
            assert.strictEqual(result!.id, 'my-sec');
        });

        test('Should leave id undefined when the section has none', () => {
            const text = '<section><title>T</title><p>Body.</p></section>';
            const result = findEnclosingSection(text, text.indexOf('Body'));
            assert.strictEqual(result!.id, undefined);
        });

        test('Should match when the offset falls exactly on the opening or closing tag', () => {
            const text = '<section><title>T</title><p>Body.</p></section>';
            assert.ok(findEnclosingSection(text, 0));
            assert.ok(findEnclosingSection(text, text.length));
        });

        test('Should not match a <section>-looking fragment inside a comment', () => {
            const text = '<conbody><!-- <section><title>Fake</title></section> --><p>Real content.</p></conbody>';
            const offset = text.indexOf('Real content');
            assert.strictEqual(findEnclosingSection(text, offset), undefined);
        });

        test('Should pick the correct section when the document has multiple, disjoint sections', () => {
            const text = '<conbody>'
                + '<section><title>First</title><p>Alpha.</p></section>'
                + '<section><title>Second</title><p>Beta.</p></section>'
                + '</conbody>';
            const result = findEnclosingSection(text, text.indexOf('Beta'));
            assert.strictEqual(result!.title, 'Second');
        });

        test('Should preserve multi-element body content verbatim', () => {
            const text = '<section><title>T</title><ul><li>One</li><li>Two</li></ul></section>';
            const result = findEnclosingSection(text, text.indexOf('One'));
            assert.strictEqual(result!.bodyContent, '<ul><li>One</li><li>Two</li></ul>');
        });
    });
});
