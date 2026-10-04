/**
 * Visual Editor links Test Suite.
 *
 * The link commands (insert an empty link or one around the selected text, change a link's
 * target in place, remove a link), checked through the source they write; and the target
 * picker's items (this topic's elements, keys, topics and maps, web addresses).
 */

import * as assert from 'assert';
import * as os from 'os';
import * as path from 'path';
import type { Node as PMNode } from 'prosemirror-model';
import { type Command, EditorState, NodeSelection, TextSelection } from 'prosemirror-state';
import { parse } from '../../shared/cst/parse';
import { attr } from '../../shared/cst/query';
import type { ElementNode } from '../../shared/cst/types';
import { DitaCommands } from '../../shared/editor/commands';
import { LinkCommands, linkAttributes } from '../../shared/editor/links';
import { buildEditorSchema, type EditorSchema } from '../../shared/editor/schema';
import { buildDocument, type Base } from '../../shared/editor/toProseMirror';
import { serializeDocument } from '../../shared/editor/toSource';
import { classTokens } from '../../shared/grammar/classTokens';
import { fileItems, fileSummary, pickItems, targetsInDocument, webLink } from '../../editor/linkTargets';
import { readingSignature } from './editorHelpers';
import { ditabaseGrammar } from './helpers';

let es: EditorSchema;
let cmds: DitaCommands;
let links: LinkCommands;

const wrap = (body: string) => `<topic id="t">\n  <title>The title</title>\n  <body>\n${body}\n  </body>\n</topic>`;

function textPos(doc: PMNode, text: string): number {
    let found = -1;
    doc.descendants((node, pos) => {
        if (found === -1 && node.isText && node.text!.includes(text)) {
            found = pos + node.text!.indexOf(text);
        }
        return found === -1;
    });
    assert.notStrictEqual(found, -1, `"${text}" not found`);
    return found;
}

interface Run {
    state: EditorState;
    base: Base;
}

function at(source: string, text: string, how: 'after' | 'select' | 'box' = 'after'): Run {
    const { doc, base } = buildDocument(parse(source), es);
    let selection;
    if (how === 'box') {
        let pos = -1;
        doc.descendants((node, p) => {
            if (pos === -1 && node.isAtom && es.role(node.type)?.element === 'xref') {
                pos = p;
            }
            return pos === -1;
        });
        selection = NodeSelection.create(doc, pos);
    } else {
        const from = textPos(doc, text);
        selection = how === 'select' ? TextSelection.create(doc, from, from + text.length) : TextSelection.create(doc, from + text.length);
    }
    return { state: EditorState.create({ doc, selection }), base };
}

function apply(run: Run, command: Command): { out: string; state: EditorState } {
    let state = run.state;
    assert.ok(command(state, (tr) => {
        state = state.apply(tr);
    }), 'the command applies');
    const fix = cmds.normalize(state);
    if (fix) {
        state = state.apply(fix);
    }
    const out = serializeDocument(state.doc, run.base);
    assert.strictEqual(readingSignature(buildDocument(parse(out), es).doc, es), readingSignature(state.doc, es), 'reads back as edited');
    return { out, state };
}

suite('Visual Editor: links', function () {
    this.timeout(60000);

    suiteSetup(() => {
        es = buildEditorSchema(ditabaseGrammar());
        cmds = new DitaCommands(es);
        links = new LinkCommands(es, cmds);
    });

    suite('commands', () => {
        test('at the cursor: an empty link (its text is the target\'s title when published), the cursor after it', () => {
            const { out, state } = apply(at(wrap('    <p>See now.</p>'), 'See '), links.setLink({ href: 'other.dita#other/s1', title: 'Setup' }));
            assert.ok(out.includes('<p>See <xref href="other.dita#other/s1"/>now.</p>'), out);
            const atom = state.doc.nodeAt(state.selection.from - 1)!;
            assert.strictEqual((atom.attrs.view as { text: string }).text, 'Setup', 'the page shows the title');
        });

        test('around the selected text: the text becomes the link text; web addresses are external', () => {
            const { out } = apply(at(wrap('    <p>Read the manual first.</p>'), 'the manual', 'select'), links.setLink(webLink('https://example.com/m')!));
            assert.ok(out.includes('<p>Read <xref href="https://example.com/m" scope="external" format="html">the manual</xref> first.</p>'), out);
        });

        test('a key', () => {
            const { out } = apply(at(wrap('    <p>See now.</p>'), 'See '), links.setLink({ keyref: 'product' }));
            assert.ok(out.includes('<p>See <xref keyref="product"/>now.</p>'), out);
        });

        test('on a link with text: its target changes in place, its other attributes and text stay', () => {
            const source = wrap('    <p>See <xref href="old.dita" format="dita" type="topic"\n       outputclass="x">the old topic</xref>.</p>');
            const run = at(source, 'old topic');
            assert.deepStrictEqual(links.current(run.state), { href: 'old.dita', keyref: undefined, scope: undefined, format: 'dita' });
            const { out } = apply(run, links.setLink({ href: '#t/s1' }));
            assert.ok(out.includes('<xref href="#t/s1" type="topic"\n       outputclass="x">the old topic</xref>'), out);
        });

        test('on an empty link (a box): from a file to a key', () => {
            const { out } = apply(at(wrap('    <p>See <xref href="a.dita"/> now.</p>'), '', 'box'), links.setLink({ keyref: 'k', title: 'K' }));
            assert.ok(out.includes('<p>See <xref keyref="k"/> now.</p>'), out);
        });

        test('remove: the text stays; an empty link goes', () => {
            assert.ok(apply(at(wrap('    <p>See <xref href="a.dita">this</xref> now.</p>'), 'this'), links.removeLink).out.includes('<p>See this now.</p>'));
            assert.ok(apply(at(wrap('    <p>See <xref href="a.dita"/> now.</p>'), '', 'box'), links.removeLink).out.includes('<p>See  now.</p>'));
        });

        test('not where the DTD does not allow a link', () => {
            assert.strictEqual(links.setLink()(at(wrap('    <p>x</p>'), 'The ').state), false, 'no xref in a title');
            assert.strictEqual(links.setLink()(at(wrap('    <p>x</p>'), 'x').state), true);
        });

        test('linkAttributes keeps other attributes where they are', () => {
            assert.deepStrictEqual(linkAttributes([['outputclass', 'a'], ['href', 'x'], ['scope', 'external']], { keyref: 'k' }), [['outputclass', 'a'], ['keyref', 'k']]);
        });
    });

    suite('the picker', () => {
        const tokensOf = (el: ElementNode) => classTokens(attr(el, 'class') ?? es.grammar.elements[el.name]?.class);
        const root = path.join(os.tmpdir(), 'ditacraft-links');
        const here = path.join(root, 'topics', 'pump.dita');
        const source = '<topic id="pump"><title>Pump</title><body><section id="s1"><title>Setup</title><p>x</p></section>'
            + '<fig id="f1"><title id="ft">Diagram</title></fig><p id="p1">A long paragraph</p></body>'
            + '<topic id="sub"><title>Sub topic</title><body><table id="tb"><title>Values</title><tgroup cols="1"><tbody><row><entry>v</entry></row></tbody></tgroup></table></body></topic></topic>';

        test('targets in a topic: its topics and its elements with an id, by topic', () => {
            const targets = targetsInDocument(parse(source), tokensOf);
            assert.deepStrictEqual(targets.map((t) => [t.topicId, t.elemId, t.name, t.title, t.depth]), [
                ['pump', undefined, 'topic', 'Pump', 0],
                ['pump', 's1', 'section', 'Setup', 1],
                ['pump', 'f1', 'fig', 'Diagram', 1],
                ['pump', 'p1', 'p', 'A long paragraph', 1],
                ['sub', undefined, 'topic', 'Sub topic', 1],
                ['sub', 'tb', 'table', 'Values', 2],
            ]);
        });

        test('step one: web, this topic, keys (sorted), other topics and maps', () => {
            const targets = targetsInDocument(parse(source), tokensOf);
            const items = pickItems(here, targets.slice(0, 2), [{ key: 'zeta' }, { key: 'alpha', title: 'Alpha', targetFile: path.join(root, 'a.dita') }], [
                { path: here, title: 'Pump', map: false },
                { path: path.join(root, 'topics', 'other one.dita'), title: 'Other', map: false },
                { path: path.join(root, 'main.ditamap'), title: 'Guide', map: true },
            ], { web: 'Web', thisTopic: 'Here', keys: 'Keys', topics: 'Topics' });
            assert.deepStrictEqual(items.map((i) => [i.id, i.section]), [
                ['web', undefined], ['doc:pump', 'Here'], ['doc:pump/s1', undefined],
                ['key:alpha', 'Keys'], ['key:zeta', undefined],
                ['file:../main.ditamap', 'Topics'], ['file:other%20one.dita', undefined],
            ]);
            assert.deepStrictEqual(items[2].target, { href: '#pump/s1', title: 'Setup' });
            assert.deepStrictEqual(items[3].target, { keyref: 'alpha', title: 'Alpha' });
            assert.strictEqual(items[3].description, 'Alpha — a.dita');
            assert.deepStrictEqual(items[5].target, { href: '../main.ditamap', format: 'ditamap', title: 'Guide' });
            assert.strictEqual(items[6].target, undefined, 'a topic opens step two');
        });

        test('step two: the topic itself, or one of its elements', () => {
            const file = { path: path.join(root, 'topics', 'other.dita'), title: 'Other', map: false };
            const items = fileItems(here, file, targetsInDocument(parse(source), tokensOf).slice(0, 2), 'The topic itself');
            assert.deepStrictEqual(items.map((i) => i.target?.href), ['other.dita', 'other.dita#pump', 'other.dita#pump/s1']);
        });

        test('file summaries: topics of any type, maps with a title or @title; other XML is not offered', () => {
            const standard = (el: ElementNode) => classTokens(attr(el, 'class') ?? ({ task: '- topic/topic task/task ', map: '- map/map ', title: '- topic/title ' } as Record<string, string>)[el.name]);
            assert.deepStrictEqual(fileSummary(parse('<task id="k"><title>Install</title></task>'), standard), { title: 'Install', map: false });
            assert.deepStrictEqual(fileSummary(parse('<map title="Guide"><topicref href="a.dita"/></map>'), standard), { title: 'Guide', map: true });
            assert.strictEqual(fileSummary(parse('<project/>'), standard), null);
        });

        test('web addresses', () => {
            assert.deepStrictEqual(webLink(' https://example.com/a?b=1 '), { href: 'https://example.com/a?b=1', scope: 'external', format: 'html', title: 'https://example.com/a?b=1' });
            assert.deepStrictEqual(webLink('mailto:docs@example.com'), { href: 'mailto:docs@example.com', scope: 'external', format: undefined, title: 'mailto:docs@example.com' });
            assert.strictEqual(webLink('example.com'), undefined);
        });
    });
});
