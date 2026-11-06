/**
 * Malformed markup (manual test plan §12.4): the editing features keep working on a
 * document that is being typed, with unclosed tags, unquoted or malformed attributes,
 * or a file cut in the middle of a tag. `|` marks the cursor in each case.
 */

import * as assert from 'assert';
import { handleCompletion } from '../src/features/completion';
import { handleHover } from '../src/features/hover';
import { handleDefinition } from '../src/features/definition';
import { computeFoldingRanges } from '../src/features/folding';
import { handleDocumentSymbol } from '../src/features/symbols';
import { formatXML } from '../src/features/formatting';
import { createDoc, createDocs } from './helper';

const URI = 'file:///malformed.dita';

/** The document without the `|` cursor mark, and the request parameters at the mark. */
function at(marked: string) {
    const offset = marked.indexOf('|');
    const text = marked.slice(0, offset) + marked.slice(offset + 1);
    const doc = createDoc(text, URI);
    return { text, doc, docs: createDocs(doc), params: { textDocument: { uri: URI }, position: doc.positionAt(offset) } };
}

async function completionLabels(marked: string): Promise<string[]> {
    const { docs, params } = at(marked);
    return (await handleCompletion(params, docs)).map(item => item.label);
}

suite('Malformed markup (manual test plan §12.4)', () => {
    suite('completion', () => {
        test('inside an element never closed, the same elements as once it is closed (§12.4.1)', async () => {
            const cases: Array<[string, string]> = [
                [
                    '<topic id="t1">\n  <title>T</title>\n  <body>\n    <section>text, no end tag\n    <|',
                    '<topic id="t1">\n  <title>T</title>\n  <body>\n    <section>text, no end tag\n    <|</section></body></topic>',
                ],
                [
                    '<topic id="t1"><body><ul><li>first item\n<|',
                    '<topic id="t1"><body><ul><li>first item\n<|</li></ul></body></topic>',
                ],
            ];
            for (const [unclosed, closed] of cases) {
                const labels = await completionLabels(unclosed);
                assert.ok(labels.length > 0, unclosed);
                assert.deepStrictEqual(labels, await completionLabels(closed), unclosed);
            }
        });

        test('offers attributes and elements around malformed attributes', async () => {
            const cases: Array<[string, string, string[]]> = [
                ['unquoted attribute value (§12.4.2)', '<topic id="t1"><body><p class=foo |>text</p></body></topic>', ['id', 'outputclass']],
                ['attribute without a value (§12.4.3)', '<topic id="t1"><body><p attr=>text</p><|', ['p', 'note']],
            ];
            for (const [name, marked, expected] of cases) {
                const labels = await completionLabels(marked);
                for (const label of expected) assert.ok(labels.includes(label), `${name}: ${label} in ${labels.join(' ')}`);
            }
        });

        test('works in a file cut short: a started element name, an attribute value at the end of the file', async () => {
            assert.ok((await completionLabels('<topic id="t1">\n<title>Hello</title>\n<body>\n<section>\n<ti|')).includes('title'));
            const noteTypes = await completionLabels('<topic id="t1"><body><note type="|');
            for (const type of ['note', 'tip', 'warning']) assert.ok(noteTypes.includes(type), type);
        });
    });

    suite('hover', () => {
        test('documents the element under the cursor in a malformed document', async () => {
            const cases: Array<[string, string]> = [
                ['<topic id="t1"><body><se|ction>', 'section'],                     // never closed
                ['<topic id="t1"><body><p attr=>text</p><no|te>', 'note'],          // after a malformed attribute
                ['<topic id="t1">\n<title>T</title>\n<bo|dy', 'body'],              // file cut inside the tag
            ];
            for (const [marked, element] of cases) {
                const { docs, params } = at(marked);
                const hover = await handleHover(params, docs);
                const value = hover && typeof hover.contents === 'object' && 'value' in hover.contents ? hover.contents.value : '';
                assert.ok(value.startsWith(`**\`<${element}>\`**`), `${marked}: ${value}`);
            }
        });
    });

    suite('go to definition', () => {
        test('reaches the element with the id despite unclosed tags or a malformed attribute', async () => {
            const cases: Array<[string, string]> = [
                ['<topic id="t1"><body><p id="target">x</p><xref href="#t1/tar|get"/>\n<p>never closed', 'target'],
                ['<topic id="t1"><body><p>never closed <xref href="#t1/s|1"/><section id="s1">', 's1'],
                ['<topic id="t1"><body><p attr=>x</p><p id="src">text</p><p conref="#t1/s|rc"/>', 'src'],
            ];
            for (const [marked, id] of cases) {
                const { text, doc, docs, params } = at(marked);
                const location = await handleDefinition(params, docs);
                assert.ok(location, marked);
                assert.strictEqual(location.uri, URI);
                const element = text.lastIndexOf('<', text.indexOf(`id="${id}"`));
                assert.strictEqual(doc.offsetAt(location.range.start), element, marked);
            }
        });
    });

    suite('folding, outline and formatting (§12.4.3)', () => {
        const text = [
            '<topic id="t1">',
            '<title>Malformed</title>',
            '<body>',
            '<p attr=>text</p>',
            '<section id="s1">',
            '<title>Section</title>',
            '<p>ok</p>',
            '</section>',
            '</body>',
            '</topic>',
            '',
        ].join('\n');

        test('folds the well-formed elements around a malformed attribute', () => {
            assert.deepStrictEqual(computeFoldingRanges(text).map(r => `${r.startLine}-${r.endLine}`), ['4-7', '2-8', '0-9']);
        });

        test('builds the outline around a malformed attribute', () => {
            const doc = createDoc(text, URI);
            const names = (symbols: ReturnType<typeof handleDocumentSymbol>): string =>
                symbols.map(s => s.name + (s.children?.length ? `[${names(s.children)}]` : '')).join(', ');
            assert.strictEqual(names(handleDocumentSymbol({ textDocument: { uri: URI } }, createDocs(doc))), 'Malformed[body[Section]]');
        });

        test('indents the document and keeps the malformed line as written', () => {
            assert.strictEqual(formatXML(text, 2, true), [
                '<topic id="t1">',
                '  <title>Malformed</title>',
                '  <body>',
                '    <p attr=>text</p>',
                '    <section id="s1">',
                '      <title>Section</title>',
                '      <p>ok</p>',
                '    </section>',
                '  </body>',
                '</topic>',
                '',
            ].join('\n'));
        });
    });
});
