/**
 * Properties pane Test Suite (spec §13.4): the attribute model from the grammar, value checks,
 * DITA id scoping, and attribute edits made in place in the start tag.
 */

import * as assert from 'assert';
import { EditorState } from 'prosemirror-state';
import { rewriteOpenTag, withAttribute, type AttributePairs } from '../../shared/cst/openTag';
import { parse } from '../../shared/cst/parse';
import { findElements, rootElement } from '../../shared/cst/query';
import type { ElementNode } from '../../shared/cst/types';
import { minimalEdit } from '../../shared/editor/minimalEdit';
import { checkValue, idConflict, profilingAttributes, propertiesOf } from '../../shared/editor/properties';
import { buildEditorSchema } from '../../shared/editor/schema';
import { buildDocument } from '../../shared/editor/toProseMirror';
import { serializeDocument } from '../../shared/editor/toSource';
import type { Grammar } from '../../shared/grammar/types';
import { decodeXmlText } from '../../shared/render/html';
import { ditabaseGrammar } from './helpers';

const pairs = (el: ElementNode): AttributePairs => el.attrs.map((a) => [a.name, decodeXmlText(a.value)]);

/** The source with `el`'s start tag rewritten from its attributes to `next`. */
function rewrite(source: string, pick: (doc: ReturnType<typeof parse>) => ElementNode, change: (xml: AttributePairs) => AttributePairs, rename?: string): string {
    const doc = parse(source);
    const el = pick(doc);
    const tag = rewriteOpenTag(source, el, pairs(el), change(pairs(el)), rename);
    return source.slice(0, el.openTagRange.start) + tag + source.slice(el.openTagRange.end);
}

suite('Properties pane (spec §13.4)', function () {
    this.timeout(60000);
    let grammar: Grammar;

    suiteSetup(() => {
        grammar = ditabaseGrammar();
    });

    suite('attribute edits in place', () => {
        const SOURCE = '<topic id="t">\n  <p id="a"\n     outputclass=\'x &amp; y\'\n     audience="admin">Text</p>\n</topic>';
        const p = (doc: ReturnType<typeof parse>) => findElements(doc, 'p')[0];

        test('a changed value is replaced inside its own quotes; the layout stays', () => {
            const out = rewrite(SOURCE, p, (xml) => withAttribute(xml, 'audience', 'admin user'));
            assert.strictEqual(out, SOURCE.replace('audience="admin"', 'audience="admin user"'));
            const quoted = rewrite(SOURCE, p, (xml) => withAttribute(xml, 'outputclass', "it's & <b>"));
            assert.ok(quoted.includes("outputclass='it&apos;s &amp; &lt;b>'"), quoted);
        });

        test('a removed attribute goes with the whitespace before it; an entity elsewhere is kept as written', () => {
            const out = rewrite(SOURCE, p, (xml) => withAttribute(xml, 'audience', null));
            assert.strictEqual(out, SOURCE.replace('\n     audience="admin"', ''));
            assert.ok(out.includes("'x &amp; y'"));
        });

        test('a new attribute is appended before the end of the tag', () => {
            assert.strictEqual(rewrite(SOURCE, p, (xml) => withAttribute(xml, 'platform', 'linux')),
                SOURCE.replace('audience="admin">', 'audience="admin" platform="linux">'));
            const empty = '<topic id="t"><image href="a.png" /></topic>';
            assert.strictEqual(rewrite(empty, (d) => findElements(d, 'image')[0], (xml) => withAttribute(xml, 'alt', 'A')),
                '<topic id="t"><image href="a.png" alt="A" /></topic>');
        });

        test('renaming keeps the attributes', () => {
            assert.strictEqual(rewrite('<p a="1">x</p>', (d) => rootElement(d)!, (xml) => xml, 'note'), '<note a="1">x</p>');
        });

        test('the visual editor writes an attribute change as a change of that value only', () => {
            const es = buildEditorSchema(grammar);
            const { doc, base } = buildDocument(parse(SOURCE), es);
            let pos = -1;
            doc.descendants((node, at) => {
                if (pos === -1 && es.role(node.type)?.element === 'p') {
                    pos = at;
                }
                return pos === -1;
            });
            const node = doc.nodeAt(pos)!;
            const tr = EditorState.create({ doc }).tr.setNodeMarkup(pos, undefined, {
                ...node.attrs, xml: withAttribute(node.attrs.xml as AttributePairs, 'audience', 'expert'),
            });
            const out = serializeDocument(tr.doc, base);
            assert.deepStrictEqual(minimalEdit(SOURCE, out), { start: SOURCE.indexOf('admin'), end: SOURCE.indexOf('admin') + 5, text: 'expert' });
        });
    });

    suite('model', () => {
        test('fields come from the grammar, grouped, with types, enumerations and defaults', () => {
            const fields = propertiesOf(grammar, 'note', [['type', 'caution'], ['id', 'n1'], ['data-x', '1']]);
            const byName = new Map(fields.map((f) => [f.name, f]));
            assert.strictEqual(byName.get('id')?.group, 'identity');
            assert.strictEqual(byName.get('id')?.type, 'NMTOKEN'); // DITA: only a topic's @id is an XML ID
            assert.strictEqual(propertiesOf(grammar, 'topic', []).find((f) => f.name === 'id')?.type, 'ID');
            assert.strictEqual(byName.get('audience')?.group, 'profiling');
            assert.strictEqual(byName.get('outputclass')?.group, 'common');
            assert.strictEqual(byName.get('type')?.group, 'element');
            assert.strictEqual(byName.get('type')?.value, 'caution');
            assert.ok(byName.get('type')?.values?.includes('danger'));
            assert.ok(!byName.get('type')?.values?.includes('-dita-use-conref-target'));
            assert.strictEqual(byName.get('class')?.readOnly, true);
            assert.strictEqual(byName.get('class')?.group, 'architecture');
            assert.strictEqual(byName.get('data-x')?.declared, false);
            // Groups in order: identity first, architecture last.
            assert.strictEqual(fields[0].name, 'id');
            assert.strictEqual(fields[fields.length - 1].group, 'architecture');
        });

        test('profiling attributes include the props specializations of the document type', () => {
            const profiling = profilingAttributes(grammar);
            assert.ok(profiling.has('audience') && profiling.has('deliveryTarget'), [...profiling].join(','));
        });

        test('values are checked by type', () => {
            const fields = new Map(propertiesOf(grammar, 'note', []).map((f) => [f.name, f]));
            const topicId = propertiesOf(grammar, 'topic', []).find((f) => f.name === 'id')!;
            assert.match(checkValue(fields.get('id')!, 'two words') ?? '', /single token/);
            assert.strictEqual(checkValue(fields.get('id')!, '9lives'), undefined, 'an element id is an NMTOKEN');
            assert.match(checkValue(topicId, '9lives') ?? '', /ID/, 'a topic id is an XML name');
            assert.strictEqual(checkValue(fields.get('id')!, 'ok_id'), undefined);
            assert.match(checkValue(fields.get('id')!, 'taken', (id) => id === 'taken') ?? '', /already/);
            assert.match(checkValue(fields.get('type')!, 'shout') ?? '', /One of/);
            assert.strictEqual(checkValue(fields.get('audience')!, 'admin expert'), undefined);
            assert.match(checkValue(fields.get('class')!, 'x') ?? '', /not editable/);
        });

        test('ids are unique by DITA scope: topics in the document, elements in their topic', () => {
            const doc = parse('<dita><topic id="a"><title>A</title><body><p id="x"/><p id="y"/></body>'
                + '<topic id="b"><title>B</title><body><p id="z"/></body></topic></topic></dita>');
            const classOf = (n: string) => grammar.elements[n]?.class;
            const [px, , pz] = findElements(doc, 'p');
            const [ta] = findElements(doc, 'topic');
            assert.strictEqual(idConflict(doc.children, px, 'y', classOf), true, 'same topic');
            assert.strictEqual(idConflict(doc.children, px, 'z', classOf), false, 'nested topic is another scope');
            assert.strictEqual(idConflict(doc.children, pz, 'x', classOf), false, 'parent topic is another scope');
            assert.strictEqual(idConflict(doc.children, ta, 'b', classOf), true, 'topic ids are document-wide');
            assert.strictEqual(idConflict(doc.children, ta, 'x', classOf), false, 'element ids do not clash with topic ids');
            assert.strictEqual(idConflict(doc.children, undefined, 'z', classOf), true);
        });
    });
});
