/**
 * Visual Editor resolved references Test Suite: reused content shown in its box (spec §13.7),
 * keys' texts, link targets' titles and key images.
 *
 * The host's items (each reuse element rendered as the preview renders it, nested reuse and
 * keys resolved; each key and empty link resolved; or why not), and the page's mapping of
 * their offsets to the elements kept whole of a document edited since it was built.
 */

import * as assert from 'assert';
import * as os from 'os';
import * as path from 'path';
import type { Node as PMNode } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';
import { parse } from '../../shared/cst/parse';
import { isReuseNode, resolvedTargets, type ResolvedItem } from '../../shared/editor/reused';
import { buildEditorSchema, type EditorSchema } from '../../shared/editor/schema';
import { buildDocument } from '../../shared/editor/toProseMirror';
import { serializeDocument } from '../../shared/editor/toSource';
import type { Grammar } from '../../shared/grammar/types';
import { labelsFor } from '../../shared/render/labels';
import { resolvedItems } from '../../editor/reusedContent';
import { ReferenceResolver } from '../../preview/resolver';
import { ditabaseGrammar } from './helpers';

let grammar: Grammar;
let es: EditorSchema;

const ROOT = path.resolve(os.tmpdir(), 'ditacraft-reused-fixture');
const MAIN = path.join(ROOT, 'topics', 'main.dita');
const LIB = path.join(ROOT, 'shared', 'lib.dita');
const LIB_SRC = '<topic id="lib"><title>Library</title><body>'
    + '<note id="warn" type="caution">Lock out <ph conref="#lib/pump"/> first.</note>'
    + '<p id="pump-p">The <ph id="pump">P-100 pump</ph>.</p>'
    + '<ul><li id="l1">one</li><li id="l2">two</li></ul></body></topic>';
const MAIN_SRC = [
    '<topic id="main">',
    '  <title>Main</title>',
    '  <body>',
    '    <note conref="../shared/lib.dita#lib/warn"/>',
    '    <p>Uses the <ph conref="../shared/lib.dita#lib/pump"/> daily.</p>',
    '    <ul><li conref="../shared/lib.dita#lib/l1" conrefend="../shared/lib.dita#lib/l2"/></ul>',
    '    <p conkeyref="product/pump-p"/>',
    '    <p conref="../shared/lib.dita#lib/missing"/>',
    '  </body>',
    '</topic>',
].join('\n');

const LOGO = path.join(ROOT, 'images', 'logo.png');
const KEYS: Record<string, { keyName: string; targetFile?: string; inlineContent?: string }> = {
    product: { keyName: 'product', targetFile: LIB },
    'product-name': { keyName: 'product-name', inlineContent: 'DitaCraft Pro' },
    logo: { keyName: 'logo', targetFile: LOGO },
};

async function resolve(source = MAIN_SRC): Promise<ResolvedItem[]> {
    const resolver = new ReferenceResolver({
        files: { readText: async (file) => (path.resolve(file) === path.resolve(LIB) ? LIB_SRC : null) },
        keys: { resolveKey: async (name) => KEYS[name] ?? null },
        classOf: (name) => grammar.elements[name]?.class,
    });
    const doc = parse(source);
    const outcome = await resolver.resolve(doc, MAIN);
    return resolvedItems(doc, resolver, outcome.resolutions, { classOf: (name: string) => grammar.elements[name]?.class, labels: labelsFor('en') },
        (file) => `webview://${path.basename(file)}`);
}

function text(html: string | undefined): string {
    return (html ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

suite('Visual Editor: resolved references (reused content, keys, links)', function () {
    this.timeout(60000);

    suiteSetup(() => {
        grammar = ditabaseGrammar();
        es = buildEditorSchema(grammar);
    });

    test('each reuse element, rendered as the preview renders it: nested reuse, ranges and keys resolved', async () => {
        const result = await resolve();
        assert.deepStrictEqual(result.map((i) => i.offset), [
            MAIN_SRC.indexOf('<note conref'), MAIN_SRC.indexOf('<ph conref'), MAIN_SRC.indexOf('<li conref'),
            MAIN_SRC.indexOf('<p conkeyref'), MAIN_SRC.indexOf('<p conref'),
        ]);
        assert.ok(/class="[^"]*note[^"]*"/.test(result[0].html!) && text(result[0].html).includes('Lock out P-100 pump first.'), result[0].html ?? '');
        assert.strictEqual(text(result[1].html), 'P-100 pump');
        assert.ok(text(result[2].html).includes('one') && text(result[2].html).includes('two'), 'a conrefend range: every element');
        assert.strictEqual(text(result[3].html), 'The P-100 pump.');
        assert.strictEqual(result[0].from, 'lib.dita#lib/warn');
        assert.ok(result[4].error && /not found/.test(result[4].error), JSON.stringify(result[4]));
        assert.strictEqual(result[4].html, undefined);
    });

    test('the page puts each item in its box, also after edits', async () => {
        const result = await resolve();
        const { doc, base } = buildDocument(parse(MAIN_SRC), es);
        // Edit the page: type before the second paragraph's reuse, delete the note box.
        let state = EditorState.create({ doc });
        let notePos = -1;
        state.doc.descendants((n, p) => {
            if (notePos === -1 && isReuseNode(n) && n.isBlock) {
                notePos = p;
            }
            return notePos === -1;
        });
        const edited = state.tr.delete(notePos, notePos + state.doc.nodeAt(notePos)!.nodeSize);
        state = state.apply(edited);
        const usesAt = (d: PMNode): number => {
            let found = -1;
            d.descendants((n, p) => {
                if (found === -1 && n.isText && n.text!.includes('Uses the')) {
                    found = p + 'Uses the'.length;
                }
                return found === -1;
            });
            return found;
        };
        state = state.apply(state.tr.insertText(' new', usesAt(state.doc)));
        const text2 = serializeDocument(state.doc, base);
        // The host resolves the new text: its offsets are those of the edited text.
        const fresh = await resolve(text2);
        const targets = resolvedTargets(state.doc, buildDocument(parse(text2), es), fresh, es);
        assert.strictEqual(targets.length, 4, 'every remaining box gets its content');
        for (const { pos, item } of targets) {
            const node = state.doc.nodeAt(pos)!;
            assert.ok(isReuseNode(node));
            const ref = (node.attrs.xml as [string, string][]).find(([n]) => n === 'conref' || n === 'conkeyref')![1];
            assert.ok(text2.slice(item.offset).startsWith(`<${es.role(node.type)!.element}`), `${ref} ↔ ${text2.slice(item.offset, item.offset + 30)}`);
        }
        assert.strictEqual(text(targets.find((t) => state.doc.nodeAt(t.pos)!.isInline)!.item.html), 'P-100 pump');
        assert.strictEqual(result.length, 5, 'five before the note box was deleted');
    });

    test('offsets of another text find no box (stale items are not attached)', () => {
        const { doc } = buildDocument(parse(MAIN_SRC), es);
        const other = MAIN_SRC.replace('<note conref="../shared/lib.dita#lib/warn"/>', '<p>No more reuse here at all.</p>');
        const fresh = buildDocument(parse(other), es);
        const targets = resolvedTargets(doc, fresh, [{ offset: other.indexOf('<p>No more'), kind: 'reuse', html: '<p>x</p>' }], es);
        assert.deepStrictEqual(targets, []);
    });

    suite('keys and links', () => {
        const TOPIC = [
            '<topic id="main">',
            '  <title>Main</title>',
            '  <body>',
            '    <p>Welcome to <keyword keyref="product-name"/>, see <xref href="../shared/lib.dita#lib/pump-p"/>.</p>',
            '    <p>Logo: <image keyref="logo"/>, and <keyword keyref="nokey"/>.</p>',
            '    <p>Own text: <xref keyref="product">the library</xref>.</p>',
            '  </body>',
            '</topic>',
        ].join('\n');

        test('a key\'s text, a link target\'s title, a key image\'s file; an undefined key says so', async () => {
            const items = await resolve(TOPIC);
            const at = (needle: string) => items.find((i) => i.offset === TOPIC.indexOf(needle));
            assert.deepStrictEqual(at('<keyword keyref="product-name"'), { offset: TOPIC.indexOf('<keyword keyref="product-name"'), kind: 'key', text: 'DitaCraft Pro', from: 'product-name' });
            assert.strictEqual(at('<xref href=')?.kind, 'link');
            assert.strictEqual(at('<xref href=')?.from, 'lib.dita#lib/pump-p');
            assert.ok(at('<xref href=')?.text?.startsWith('The'), JSON.stringify(at('<xref href=')));
            assert.deepStrictEqual(at('<image keyref'), { offset: TOPIC.indexOf('<image keyref'), kind: 'key', src: 'webview://logo.png', from: 'logo → logo.png' });
            assert.ok(at('<keyword keyref="nokey"')?.error?.includes('nokey'));
        });

        test('only elements kept whole take them: a link with its own text keeps it', async () => {
            const items = await resolve(TOPIC);
            const { doc } = buildDocument(parse(TOPIC), es);
            const targets = resolvedTargets(doc, buildDocument(parse(TOPIC), es), items, es);
            const names = targets.map(({ pos }) => es.role(doc.nodeAt(pos)!.type)!.element);
            assert.deepStrictEqual(names, ['keyword', 'xref', 'image', 'keyword']);
            assert.ok(targets.every(({ pos }) => doc.nodeAt(pos)!.isAtom));
        });
    });
});
