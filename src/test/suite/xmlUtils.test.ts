/**
 * XML Text Utilities Test Suite
 * No VS Code API surface involved, so these don't need the extension
 * host at all.
 */

import * as assert from 'assert';
import { escapeXml, stripCommentsAndCDATA } from '../../utils/xmlUtils';

suite('XML Utils Test Suite', () => {
    suite('escapeXml', () => {
        test('Should escape &, <, >, and "', () => {
            assert.strictEqual(escapeXml('a & b < c > d "e"'), 'a &amp; b &lt; c &gt; d &quot;e&quot;');
        });

        test('Should leave plain text unchanged', () => {
            assert.strictEqual(escapeXml('plain text'), 'plain text');
        });
    });

    suite('stripCommentsAndCDATA', () => {
        test('Should blank a comment while preserving its length', () => {
            const text = 'before<!-- comment -->after';
            const result = stripCommentsAndCDATA(text);
            assert.strictEqual(result.length, text.length);
            assert.ok(!result.includes('comment'));
            assert.ok(result.startsWith('before'));
            assert.ok(result.endsWith('after'));
        });

        test('Should blank a CDATA section while preserving its length', () => {
            const text = 'before<![CDATA[<fake/>]]>after';
            const result = stripCommentsAndCDATA(text);
            assert.strictEqual(result.length, text.length);
            assert.ok(!result.includes('fake'));
        });

        test('Should preserve newlines inside a comment so line offsets stay valid', () => {
            const text = '<!--\nline2\nline3-->';
            const result = stripCommentsAndCDATA(text);
            assert.strictEqual(result.split('\n').length, text.split('\n').length);
        });

        test('Should leave content outside comments/CDATA untouched', () => {
            const text = '<concept id="t"><title>Real Title</title></concept>';
            assert.strictEqual(stripCommentsAndCDATA(text), text);
        });
    });
});
