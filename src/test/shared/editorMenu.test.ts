/**
 * Visual Editor context menu Test Suite (spec §13.3).
 *
 * The DTD's child sets in the grammar, the commands the menu adds (phrase elements around the
 * selection or at the cursor; select, move, remove tags, delete), each checked through the
 * source it writes, and the menu model itself (what is offered where, grouped by domain).
 */

import * as assert from 'assert';
import type { Node as PMNode } from 'prosemirror-model';
import { type Command, EditorState, NodeSelection, TextSelection } from 'prosemirror-state';
import { parse } from '../../shared/cst/parse';
import { DitaCommands } from '../../shared/editor/commands';
import { contextMenu, findItem, groupByDomain, type MenuContext, type MenuItem } from '../../shared/editor/contextMenu';
import { buildEditorSchema, type EditorSchema } from '../../shared/editor/schema';
import { ImageCommands } from '../../shared/editor/images';
import { LinkCommands } from '../../shared/editor/links';
import { TableCommands } from '../../shared/editor/tables';
import { buildDocument } from '../../shared/editor/toProseMirror';
import { serializeDocument } from '../../shared/editor/toSource';
import type { Grammar } from '../../shared/grammar/types';
import { readingSignature } from './editorHelpers';
import { ditabaseGrammar } from './helpers';

let grammar: Grammar;
let es: EditorSchema;
let cmds: DitaCommands;
let tables: TableCommands;

const wrap = (body: string) => `<topic id="t">\n  <title>The title</title>\n  <body>\n${body}\n  </body>\n</topic>`;

function textPos(doc: PMNode, text: string, after = 0): number {
    let found = -1;
    doc.descendants((node, pos) => {
        if (found === -1 && node.isText && node.text!.includes(text)) {
            found = pos + node.text!.indexOf(text) + after;
        }
        return found === -1;
    });
    assert.notStrictEqual(found, -1, `"${text}" not found`);
    return found;
}

/** The state with `text` selected (or the cursor after it). */
function stateAt(source: string, text: string, select = false): { state: EditorState; base: ReturnType<typeof buildDocument>['base'] } {
    const { doc, base } = buildDocument(parse(source), es);
    const from = textPos(doc, text);
    const selection = select ? TextSelection.create(doc, from, from + text.length) : TextSelection.create(doc, from + text.length);
    return { state: EditorState.create({ doc, selection }), base };
}

/** Run `command` there; the written source (it must read back as the edited document). */
function apply(source: string, text: string, command: Command, select = false, expected = true): { out: string; state: EditorState } {
    const start = stateAt(source, text, select);
    const base = start.base;
    let state = start.state;
    const applied = command(state, (tr) => {
        state = state.apply(tr);
    });
    assert.strictEqual(applied, expected, 'command applicability');
    const fix = cmds.normalize(state);
    if (fix) {
        state = state.apply(fix);
    }
    const out = serializeDocument(state.doc, base);
    assert.strictEqual(readingSignature(buildDocument(parse(out), es).doc, es), readingSignature(state.doc, es), 'reads back as edited');
    return { out, state };
}

function ctxFor(reuse = false): MenuContext {
    return { es, cmds, tables, images: new ImageCommands(es, cmds), links: new LinkCommands(es, cmds), editable: true, reuse };
}

function ids(items: MenuItem[]): string[] {
    return items.flatMap((i) => (i.kind === 'item' || i.kind === 'submenu' ? [i.id] : []));
}

suite('Visual Editor: context menu (spec §13.3)', function () {
    this.timeout(60000);

    suiteSetup(() => {
        grammar = ditabaseGrammar();
        es = buildEditorSchema(grammar);
        cmds = new DitaCommands(es);
        tables = new TableCommands(es);
    });

    suite('the DTD in the grammar', () => {
        test('mixed models keep the child elements the DTD allows', () => {
            assert.ok(grammar.childSets && grammar.childSets.length > 10);
            assert.ok(es.allows('title', 'ph') && !es.allows('title', 'xref'), 'a title takes phrases but no cross-references');
            assert.ok(es.allows('note', 'p') && !es.allows('note', 'section'), 'a note takes paragraphs but no sections');
            assert.ok(es.allows('body', 'section'), 'element-only models are left to the schema');
            assert.ok(es.allowsText('uicontrol') && !es.allowsText('menucascade') && !es.allowsText('ul'));
        });

        test('Insert and Change to follow it: no section inside a note', () => {
            const source = wrap('    <note><p>In note</p></note>\n    <p>In body</p>');
            const inNote = cmds.insertableAt(stateAt(source, 'In note').state);
            assert.ok(inNote.includes('p') && inNote.includes('ul') && !inNote.includes('section'), inNote.join(','));
            assert.ok(cmds.insertableAt(stateAt(source, 'In body').state).includes('section'));
            assert.ok(!cmds.blockTypesAt(stateAt(source, 'In note').state).includes('section'));
            apply(source, 'In note', cmds.insertBlock('section'), false, false);
        });
    });

    suite('phrase elements', () => {
        test('offered by the DTD of the element at the cursor and of its formatting', () => {
            const source = wrap('    <p>Body <b>bold</b> text</p>');
            const inP = cmds.inlineInsertableAt(stateAt(source, 'Body').state);
            for (const name of ['ph', 'xref', 'uicontrol', 'keyword', 'b', 'codeph']) {
                assert.ok(inP.includes(name), `${name} missing`);
            }
            assert.ok(!inP.includes('menucascade') && !inP.includes('image') && !inP.includes('p'), 'no text, kept whole, or a block');
            const inTitle = cmds.inlineInsertableAt(stateAt(source, 'The title').state);
            assert.ok(inTitle.includes('ph') && !inTitle.includes('xref'), inTitle.join(','));
            // Inside <b>: also what b allows.
            const inBold = cmds.inlineInsertableAt(stateAt(source, 'bold').state);
            assert.ok(inBold.includes('ph') && inBold.every((n) => es.allows('b', n) && es.allows('p', n)), inBold.join(','));
        });

        test('around a selection: only the selected text moves into the new element', () => {
            const { out } = apply(wrap('    <p id="p1">Check the seal\n       weekly.</p>'), 'seal', cmds.insertInline('uicontrol'), true);
            assert.ok(out.includes('<p id="p1">Check the <uicontrol>seal</uicontrol>\n       weekly.</p>'), out);
        });

        test('around formatted text, the formatting stays outside', () => {
            const { out } = apply(wrap('    <p>A <b>bold text</b> z</p>'), 'bold', cmds.insertInline('ph'), true);
            assert.ok(out.includes('<b><ph>bold</ph> text</b>'), out);
        });

        test('at the cursor: the element with its name as placeholder, selected to type over', () => {
            const { state } = apply(wrap('    <p>See here.</p>'), 'See ', cmds.insertInline('keyword'));
            assert.strictEqual(state.doc.textBetween(state.selection.from, state.selection.to), 'keyword');
            const typed = state.apply(state.tr.insertText('DitaCraft'));
            const base = buildDocument(parse(wrap('    <p>See here.</p>')), es).base;
            assert.ok(serializeDocument(typed.doc, base).includes('<p>See <keyword>DitaCraft</keyword>here.</p>'));
        });

        test('highlighting elements toggle as formatting', () => {
            const { out } = apply(wrap('    <p>Make this bold.</p>'), 'this', cmds.insertInline('b'), true);
            assert.ok(out.includes('<p>Make <b>this</b> bold.</p>'), out);
        });

        test('an element the DTD does not allow there is refused', () => {
            apply(wrap('    <p>x</p>'), 'The title', cmds.insertInline('xref'), false, false);
        });
    });

    suite('the element at the cursor', () => {
        const source = wrap('    <p id="a">One</p>\n    <p>Two <ph id="x">phrase</ph> end</p>\n    <section><p>Sec</p></section>\n    <note><p>Noted</p></note>\n    <ul><li>Only</li></ul>');

        test('move up and down swap blocks, each written as it was', () => {
            const { out } = apply(source, 'One', cmds.moveElement(1));
            assert.ok(out.includes('    <p>Two <ph id="x">phrase</ph> end</p>\n    <p id="a">One</p>'), out);
            const { out: up } = apply(source, 'Two', cmds.moveElement(-1));
            assert.strictEqual(up, out);
            apply(source, 'One', cmds.moveElement(-1), false, false); // first: nothing above
            apply(source, 'The title', cmds.moveElement(1), false, false); // a title stays first
        });

        test('a comment between two moved blocks stays between them', () => {
            const commented = wrap('    <p id="a">One</p>\n    <!-- about Two -->\n    <p>Two</p>');
            const { out } = apply(commented, 'One', cmds.moveElement(1));
            assert.strictEqual(out, wrap('    <p>Two</p>\n    <!-- about Two -->\n    <p id="a">One</p>'));
            // Also when the moved paragraph was edited first.
            const start = stateAt(commented, 'One');
            const base = start.base;
            let state = start.state.apply(start.state.tr.insertText('!', start.state.selection.from));
            cmds.moveElement(1)(state, (tr) => {
                state = state.apply(tr);
            });
            assert.strictEqual(serializeDocument(state.doc, base), wrap('    <p>Two</p>\n    <!-- about Two -->\n    <p id="a">One!</p>'));
        });

        test('remove tags keeps the content in place, when the parent takes it', () => {
            assert.ok(apply(source, 'phrase', cmds.unwrapElement).out.includes('<p>Two phrase end</p>'));
            assert.ok(apply(source, 'Sec', cmds.unwrapElement, false).out.includes('<section>Sec</section>'), 'the paragraph goes, its text stays in the section');
            assert.ok(apply(source, 'Noted', cmds.unwrapElement).out.includes('<note>Noted</note>'));
            apply(source, 'One', cmds.unwrapElement, false, false); // no text directly in a body
        });

        test('delete removes the element, unless the model needs it', () => {
            const { out } = apply(source, 'One', cmds.deleteElement);
            assert.ok(!out.includes('One') && out.includes('<p>Two'), out);
            apply(source, 'The title', cmds.deleteElement, false, false); // a topic needs its title
            apply(source, 'Only', cmds.deleteElement, false, false); // a list needs an item
        });

        test('select makes the element the selection', () => {
            const { state } = apply(source, 'phrase', cmds.selectElement);
            assert.ok(state.selection instanceof NodeSelection);
            assert.strictEqual(es.role((state.selection as NodeSelection).node.type)?.element, 'ph');
        });
    });

    suite('the menu', () => {
        const source = wrap('    <p>Body text here</p>\n    <table><tgroup cols="1"><tbody><row><entry>Cell</entry></row></tbody></tgroup></table>');

        test('in a paragraph: clipboard, insert, phrase elements, change to, element actions', () => {
            const { state } = stateAt(source, 'Body');
            const menu = contextMenu(state, ctxFor());
            assert.deepStrictEqual(ids(menu), [
                'cut', 'copy', 'paste', 'insert', 'inline', 'image', 'link', 'changeTo',
                'element/select', 'element/up', 'element/down', 'element/unwrap', 'element/delete', 'attributes', 'showInSource',
            ]);
            assert.strictEqual(findItem(menu, 'cut')?.enabled, false, 'nothing selected to cut');
            assert.ok(menu.some((i) => i.kind === 'heading' && i.label === '<p>'));
            assert.strictEqual(findItem(menu, 'element/up')?.enabled, false, 'the first block');
            assert.strictEqual(findItem(menu, 'element/down')?.enabled, true);
        });

        test('long lists: common elements first, then one submenu per domain', () => {
            const { state } = stateAt(source, 'Body');
            const inline = contextMenu(state, ctxFor()).find((i) => i.kind === 'submenu' && i.id === 'inline');
            assert.ok(inline && inline.kind === 'submenu');
            const top = ids(inline.items);
            assert.ok(top.includes('inline/xref') && top.includes('inline/ph'), top.join(','));
            assert.ok(top.includes('inline/@topic') && top.includes('inline/@ui-d') && top.includes('inline/@pr-d'), top.join(','));
            assert.ok(findItem(inline.items, 'inline/menucascade') === undefined);
            const ui = inline.items.find((i) => i.kind === 'submenu' && i.id === 'inline/@ui-d');
            assert.ok(ui && ui.kind === 'submenu' && ui.label === 'User interface' && ids(ui.items).includes('inline/uicontrol'));
        });

        test('with a selection, phrase elements wrap it; in a table, the table commands', () => {
            const selected = stateAt(source, 'text', true).state;
            const menu = contextMenu(selected, ctxFor());
            assert.strictEqual(findItem(menu, 'cut')?.enabled, true);
            assert.ok(menu.some((i) => i.kind === 'submenu' && i.id === 'inline' && i.label === 'Wrap in'));
            const cell = stateAt(source, 'Cell').state;
            const table = contextMenu(cell, ctxFor()).find((i) => i.kind === 'submenu' && i.id === 'table');
            assert.ok(table && table.kind === 'submenu' && findItem(table.items, 'table/rowBelow')?.enabled === true);
        });

        test('on reused content: its actions; read-only: nothing that edits', () => {
            const reused = buildDocument(parse(wrap('    <p conref="lib.dita#l/p"/>')), es).doc;
            let pos = -1;
            reused.descendants((n, p) => {
                if (pos === -1 && n.isAtom && n.isBlock) {
                    pos = p;
                }
                return pos === -1;
            });
            const state = EditorState.create({ doc: reused, selection: NodeSelection.create(reused, pos) });
            const menu = contextMenu(state, ctxFor(true));
            assert.ok(findItem(menu, 'reuse/open')?.enabled && findItem(menu, 'reuse/copy')?.enabled);
            const readOnly = contextMenu(state, { ...ctxFor(true), editable: false });
            const editing = ['cut', 'paste', 'reuse/copy', 'element/delete'].map((id) => findItem(readOnly, id)?.enabled);
            assert.deepStrictEqual(editing, [false, false, false, false]);
            assert.strictEqual(findItem(readOnly, 'copy')?.enabled, true);
        });

        test('on a problem: Quick Fix… first (Ctrl+.), not elsewhere; disabled while read only', () => {
            const { state } = stateAt(source, "Body");
            const onProblem = contextMenu(state, { ...ctxFor(), problem: true });
            assert.deepStrictEqual(onProblem.slice(0, 2).map((i) => (i.kind === 'item' ? `${i.id} ${i.detail}` : i.kind)), ['quickFix Ctrl+.', 'separator']);
            assert.strictEqual(findItem(contextMenu(state, ctxFor()), 'quickFix'), undefined);
            assert.strictEqual(findItem(contextMenu(state, { ...ctxFor(), problem: true, editable: false }), 'quickFix')?.enabled, false);
        });

        test('domains: the base vocabulary first, then by name', () => {
            const groups = groupByDomain(es, ['uicontrol', 'ph', 'codeph', 'b', 'keyword']);
            assert.deepStrictEqual(groups.map((g) => g.domain), ['topic', 'hi-d', 'pr-d', 'ui-d']);
            assert.deepStrictEqual(groups[0].names, ['keyword', 'ph']);
        });
    });
});
