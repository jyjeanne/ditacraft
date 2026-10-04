/**
 * Visual Editor "Replace with copy" Test Suite (spec §13.7).
 *
 * A reuse element is resolved as the preview resolves it, its copy is built by the host
 * (DITA's conref attribute rules, references rewritten for the new place, ids that would be
 * duplicates dropped), and the page puts the copy in place as new content: written
 * canonically, everything else byte for byte, reading back as the edited document.
 */

import * as assert from 'assert';
import * as os from 'os';
import * as path from 'path';
import { Fragment, type Node as PMNode } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';
import { parse } from '../../shared/cst/parse';
import { findElements } from '../../shared/cst/query';
import type { ElementNode } from '../../shared/cst/types';
import { DitaCommands } from '../../shared/editor/commands';
import { buildEditorSchema, type EditorSchema } from '../../shared/editor/schema';
import { buildDocument, buildFragment, type Base } from '../../shared/editor/toProseMirror';
import { serializeDocument } from '../../shared/editor/toSource';
import type { Grammar } from '../../shared/grammar/types';
import { rebase, resolvedAttributes, reuseCopy } from '../../editor/reuseCopy';
import { ReferenceResolver } from '../../preview/resolver';
import { readingSignature } from './editorHelpers';
import { ditabaseGrammar } from './helpers';

const ROOT = path.resolve(os.tmpdir(), 'ditacraft-reuse-fixture');
const p = (...parts: string[]) => path.join(ROOT, ...parts);
const MAIN = p('topics', 'main.dita');
const LIB = p('shared', 'lib.dita');

const LIB_SRC = [
    '<topic id="lib">',
    '  <title>Library</title>',
    '  <body>',
    '    <p id="intro" audience="admin" outputclass="lib">Reused <xref href="other.dita#o/x"/> text,',
    '       see <xref href="#lib/second"/> and <xref href="#./second"/>, <xref href="https://example.com/a"/>.</p>',
    '    <p id="second">Second <ph id="dup">phrase</ph> &amp; more.</p>',
    '    <note id="warn" type="caution">Careful <!-- why --> now.</note>',
    '    <ul id="list">',
    '      <li id="l1">one</li>',
    '      <!-- between -->',
    '      <li id="l2">two <image href="images/a b.png"/></li>',
    '      <li id="l3">three</li>',
    '    </ul>',
    '    <p id="chain" conref="#lib/second"/>',
    '  </body>',
    '</topic>',
].join('\n');

const MAIN_SRC = [
    '<topic id="main">',
    '  <title>Main</title>',
    '  <body>',
    '    <p conref="../shared/lib.dita#lib/intro" outputclass="local"/>',
    '    <p id="dup">Local paragraph with <ph conref="../shared/lib.dita#lib/dup"/> inside.</p>',
    '    <note conref="../shared/lib.dita#lib/warn" type="-dita-use-conref-target"/>',
    '    <ul>',
    '      <li conref="../shared/lib.dita#lib/l1" conrefend="../shared/lib.dita#lib/l3"/>',
    '    </ul>',
    '    <p conref="../shared/lib.dita#lib/chain"/>',
    '    <p conref="#main/local"/>',
    '    <p id="local">Same <b>file</b> <xref href="#./dup"/>.</p>',
    '    <p>Bold <b><ph conref="../shared/lib.dita#lib/dup"/></b> end.</p>',
    '  </body>',
    '</topic>',
].join('\n');

/** The n-th reuse element of MAIN_SRC, in document order. */
enum Reuse { Intro, Phrase, Note, Range, Chain, SameFile, InBold }

let grammar: Grammar;
let es: EditorSchema;
let cmds: DitaCommands;

function resolver(files: Record<string, string> = { [path.resolve(LIB)]: LIB_SRC }): ReferenceResolver {
    return new ReferenceResolver({
        files: { readText: async (file) => files[path.resolve(file)] ?? null },
        classOf: (name) => grammar.elements[name]?.class,
    });
}

function reuseElements(r: ReferenceResolver, source: string): { doc: ReturnType<typeof parse>; els: ElementNode[] } {
    const doc = parse(source);
    return { doc, els: r.collect(doc).filter((q) => q.kind === 'reuse').map((q) => q.el) };
}

async function copyOf(which: Reuse, source = MAIN_SRC): Promise<string> {
    const r = resolver();
    const { doc, els } = reuseElements(r, source);
    const el = els[which];
    const res = await r.resolveReuseOf(el, doc, MAIN);
    assert.ok(!res.unresolved, res.unresolved ?? '');
    return reuseCopy({
        doc, docPath: MAIN, el, parts: res.conrefRange ?? [res.conrefTarget!],
        sourceDoc: res.sourceDoc!, sourcePath: res.sourcePath ?? res.path!, tokensOf: (e) => r.tokens(e),
    });
}

/** Put the copy of reuse element `which` in place on the page, as the editor does. */
async function replaced(which: Reuse): Promise<{ out: string; state: EditorState; base: Base }> {
    const xml = await copyOf(which);
    const { doc, base } = buildDocument(parse(MAIN_SRC), es);
    const atoms: { node: PMNode; pos: number }[] = [];
    doc.descendants((node, pos) => {
        const xmlAttrs = node.attrs.xml as [string, string][] | undefined;
        if (node.isAtom && xmlAttrs?.some(([n]) => n === 'conref')) {
            atoms.push({ node, pos });
        }
        return !node.isAtom;
    });
    const { node, pos } = atoms[which];
    const $pos = doc.resolve(pos);
    let nodes = buildFragment(xml, es, node.isInline ? 'inline' : 'block');
    if (node.isInline) {
        nodes = nodes.map((n) => n.mark(node.marks.reduce((set, m) => m.addToSet(set), n.marks)));
    }
    assert.ok($pos.parent.canReplace($pos.index(), $pos.index() + 1, Fragment.from(nodes)), 'the copy fits');
    let state = EditorState.create({ doc });
    state = state.apply(state.tr.replaceWith(pos, pos + node.nodeSize, nodes));
    const fix = cmds.normalize(state);
    if (fix) {
        state = state.apply(fix);
    }
    const out = serializeDocument(state.doc, base);
    const reloaded = buildDocument(parse(out), es).doc;
    assert.strictEqual(readingSignature(reloaded, es), readingSignature(state.doc, es), 'reads back as the edited document');
    return { out, state, base };
}

suite('Visual Editor: Replace with copy (spec §13.7)', function () {
    this.timeout(120000);

    suiteSetup(() => {
        grammar = ditabaseGrammar();
        es = buildEditorSchema(grammar);
        cmds = new DitaCommands(es);
    });

    suite('the copy (host)', () => {
        test('the referencing element\'s attributes win, the reused @id goes, references are rewritten for the new place', async () => {
            assert.strictEqual(await copyOf(Reuse.Intro), [
                '<p audience="admin" outputclass="local">Reused <xref href="../shared/other.dita#o/x"/> text,',
                '       see <xref href="../shared/lib.dita#lib/second"/> and <xref href="../shared/lib.dita#lib/second"/>, <xref href="https://example.com/a"/>.</p>',
            ].join('\n'));
        });

        test('-dita-use-conref-target takes the reused value; comments and layout are copied', async () => {
            assert.strictEqual(await copyOf(Reuse.Note), '<note type="caution">Careful <!-- why --> now.</note>');
        });

        test('a conrefend range copies every element; ids are kept unless the topic already uses them', async () => {
            assert.strictEqual(await copyOf(Reuse.Range), [
                '<li>one</li>',
                '      <!-- between -->',
                '      <li id="l2">two <image href="../shared/images/a%20b.png"/></li>',
                '      <li id="l3">three</li>',
            ].join('\n'));
        });

        test('an id the destination topic already uses is dropped; entities stay as written', async () => {
            assert.strictEqual(await copyOf(Reuse.Chain), '<p>Second <ph>phrase</ph> &amp; more.</p>', 'chained reuse copies what it finally reuses');
            assert.strictEqual(await copyOf(Reuse.Phrase), '<ph>phrase</ph>');
        });

        test('reuse within the same topic keeps same-topic references', async () => {
            assert.strictEqual(await copyOf(Reuse.SameFile), '<p>Same <b>file</b> <xref href="#./dup"/>.</p>');
        });

        test('a renamed copy (generalized reference) keeps its close tag in step', async () => {
            const source = '<topic id="t"><title>T</title><body><p><ph conref="#t/k"/> <keyword id="k">Name</keyword></p></body></topic>';
            const r = resolver({});
            const doc = parse(source);
            const el = r.collect(doc).find((q) => q.kind === 'reuse')!.el;
            const res = await r.resolveReuseOf(el, doc, MAIN);
            const out = reuseCopy({ doc, docPath: MAIN, el, parts: [res.conrefTarget!], sourceDoc: res.sourceDoc!, sourcePath: res.sourcePath!, tokensOf: (e) => r.tokens(e) });
            assert.strictEqual(out, '<ph>Name</ph>');
        });

        test('resolvedAttributes follows DITA 1.3 §2.4.2.2', () => {
            assert.deepStrictEqual(resolvedAttributes(
                [['conref', 'x.dita#t/n'], ['type', '-dita-use-conref-target'], ['audience', 'a']],
                [['id', 'n'], ['type', 'note'], ['audience', 'b'], ['class', '- topic/note '], ['platform', 'p']],
            ), [['audience', 'a'], ['type', 'note'], ['platform', 'p']]);
        });

        test('rebase: relative paths move, URIs, same-folder and same-topic references stay', () => {
            const from = p('shared', 'lib.dita');
            const to = p('topics', 'main.dita');
            assert.strictEqual(rebase('a.dita', from, to, false, 'lib'), '../shared/a.dita');
            assert.strictEqual(rebase('sub/a%20b.dita#t/e', from, to, false, 'lib'), '../shared/sub/a%20b.dita#t/e');
            assert.strictEqual(rebase('#lib/e', from, to, false, 'lib'), '../shared/lib.dita#lib/e');
            assert.strictEqual(rebase('#./e', from, to, false, 'lib'), '../shared/lib.dita#lib/e');
            assert.strictEqual(rebase('#./e', from, from, true, undefined), '#./e');
            assert.strictEqual(rebase('#./e', from, from, true, 'lib'), '#lib/e');
            assert.strictEqual(rebase('mailto:a@b.c', from, to, false, 'lib'), 'mailto:a@b.c');
            assert.strictEqual(rebase('./a.dita', from, p('shared', 'other.dita'), false, 'lib'), './a.dita');
        });

        test('pushes and circular reuse are refused', async () => {
            const r = resolver({});
            const doc = parse('<topic id="t"><title>T</title><body><p id="s" conref="#t/s"/>'
                + '<p conref="#t/x" conaction="pushreplace">new</p><p id="x">x</p></body></topic>');
            const [self, push] = findElements(doc, 'p');
            assert.strictEqual((await r.resolveReuseOf(self, doc, MAIN)).unresolved, 'circular reuse');
            assert.strictEqual((await r.resolveReuseOf(push, doc, MAIN)).unresolved, 'not reused content');
        });
    });

    suite('the copy in place (page)', () => {
        test('a block copy is written as new content; the rest of the file is unchanged', async () => {
            const { out } = await replaced(Reuse.Intro);
            const copy = '<p audience="admin" outputclass="local">Reused <xref href="../shared/other.dita#o/x"/> text, '
                + 'see <xref href="../shared/lib.dita#lib/second"/> and <xref href="../shared/lib.dita#lib/second"/>, <xref href="https://example.com/a"/>.</p>';
            assert.strictEqual(out, MAIN_SRC.replace('<p conref="../shared/lib.dita#lib/intro" outputclass="local"/>', copy));
        });

        test('a range becomes several elements in place', async () => {
            const { out } = await replaced(Reuse.Range);
            assert.ok(out.includes('<li>one</li>'), out);
            assert.ok(out.includes('<li id="l2">two <image href="../shared/images/a%20b.png"/></li>'), out);
            assert.ok(out.includes('<li id="l3">three</li>'), out);
            assert.ok(!out.includes('conrefend'), out);
            assert.strictEqual(out.slice(0, out.indexOf('<ul>')), MAIN_SRC.slice(0, MAIN_SRC.indexOf('<ul>')));
        });

        test('an inline copy replaces the phrase inside its paragraph, formatting included', async () => {
            const { out } = await replaced(Reuse.Phrase);
            assert.strictEqual(out, MAIN_SRC.replace('<ph conref="../shared/lib.dita#lib/dup"/> inside', '<ph>phrase</ph> inside'));
            const bold = await replaced(Reuse.InBold);
            assert.strictEqual(bold.out, MAIN_SRC.replace('<b><ph conref="../shared/lib.dita#lib/dup"/></b>', '<b><ph>phrase</ph></b>'));
        });

        test('elements kept as written in the copy follow later attribute changes', async () => {
            const { state, out, base } = await replaced(Reuse.Intro);
            let xrefPos = -1;
            state.doc.descendants((node, pos) => {
                if (xrefPos === -1 && node.isAtom && typeof node.attrs.raw === 'string' && String(node.attrs.raw).includes('other.dita')) {
                    xrefPos = pos;
                }
                return xrefPos === -1;
            });
            assert.notStrictEqual(xrefPos, -1, 'the copied xref is kept as written');
            const xref = state.doc.nodeAt(xrefPos)!;
            const next = state.apply(state.tr.setNodeMarkup(xrefPos, undefined, { ...xref.attrs, xml: [['href', 'moved.dita'], ['scope', 'local']] }));
            const written = serializeDocument(next.doc, base);
            assert.ok(written.includes('<xref href="moved.dita" scope="local"/>'), written);
            assert.ok(out.includes('<xref href="../shared/other.dita#o/x"/>'), out);
        });

        test('a pasted element kept as written loses its @id with the paste', () => {
            const { doc, base } = buildDocument(parse('<topic id="t"><title>T</title><body><p>a</p></body></topic>'), es);
            const type = es.nodeType('xref', 'inline', 'opaque')!;
            const atom = type.create({ src: null, xml: [['href', 'a.dita']], view: null, raw: '<xref id="x1" href="a.dita"/>' });
            let state = EditorState.create({ doc });
            let end = -1;
            doc.descendants((node, pos) => {
                if (node.isText && node.text === 'a') {
                    end = pos + 1;
                }
            });
            state = state.apply(state.tr.insert(end, atom));
            assert.ok(serializeDocument(state.doc, base).includes('<p>a<xref href="a.dita"/></p>'));
        });
    });
});
