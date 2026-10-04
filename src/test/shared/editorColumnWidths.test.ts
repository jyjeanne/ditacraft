/**
 * Visual Editor column widths Test Suite (spec §13.5: dragging column borders).
 *
 * `@colwidth` parsing and display, the widths a drag gives (proportions as whole numbers out
 * of 100, fixed units kept, minimum widths), and the table commands that write them — checked
 * through the source they write.
 */

import * as assert from 'assert';
import type { DOMOutputSpec, Node as PMNode } from 'prosemirror-model';
import { EditorState, TextSelection } from 'prosemirror-state';
import { parse } from '../../shared/cst/parse';
import { DitaCommands } from '../../shared/editor/commands';
import { columnPixels, cssColumnWidths, parseColumnWidth, resizedColumnWidths } from '../../shared/editor/columnWidths';
import { buildEditorSchema, type EditorSchema } from '../../shared/editor/schema';
import { TableCommands } from '../../shared/editor/tables';
import { buildDocument } from '../../shared/editor/toProseMirror';
import { serializeDocument } from '../../shared/editor/toSource';
import { readingSignature } from './editorHelpers';
import { ditabaseGrammar } from './helpers';

let es: EditorSchema;
let tables: TableCommands;

const wrap = (body: string) => `<topic id="t">\n  <title>T</title>\n  <body>\n${body}\n  </body>\n</topic>`;

const CALS = wrap([
    '    <table>',
    '      <tgroup cols="3">',
    '        <colspec colname="c1" colwidth="1*"/>',
    '        <colspec colname="c2" colwidth="2*"/>',
    '        <colspec colname="c3" colwidth="1*"/>',
    '        <tbody><row><entry>a</entry><entry>b</entry><entry>c</entry></row></tbody>',
    '      </tgroup>',
    '    </table>',
].join('\n'));

const BARE = wrap([
    '    <table>',
    '      <tgroup cols="2">',
    '        <tbody><row><entry>a</entry><entry>b</entry></row></tbody>',
    '      </tgroup>',
    '    </table>',
].join('\n'));

const SIMPLE = wrap('    <simpletable><strow><stentry>a</stentry><stentry>b</stentry></strow></simpletable>');

function tablePos(doc: PMNode): number {
    let pos = -1;
    doc.descendants((node, p) => {
        const element = es.role(node.type)?.element;
        if (pos === -1 && (element === 'table' || element === 'simpletable')) {
            pos = p;
        }
        return pos === -1;
    });
    return pos;
}

function set(source: string, widths: (string | undefined)[]): { out: string; state: EditorState } {
    const { doc, base } = buildDocument(parse(source), es);
    let state = EditorState.create({ doc });
    const cursor = state.doc.resolve(4).pos;
    state = state.apply(state.tr.setSelection(TextSelection.near(state.doc.resolve(cursor))));
    const at = (s: EditorState) => `${s.selection.$from.parent.textContent}|${s.selection.$from.parentOffset}`;
    const before = at(state);
    assert.ok(tables.setColumnWidths(tablePos(state.doc), widths)(state, (tr) => {
        state = state.apply(tr);
    }));
    assert.strictEqual(at(state), before, 'the cursor stays where it was in the text');
    const out = serializeDocument(state.doc, base);
    assert.strictEqual(readingSignature(buildDocument(parse(out), es).doc, es), readingSignature(state.doc, es));
    return { out, state };
}

function tgroupDom(doc: PMNode): DOMOutputSpec {
    let found: PMNode | undefined;
    doc.descendants((node) => {
        if (!found && es.role(node.type)?.element === 'tgroup') {
            found = node;
        }
        return !found;
    });
    return found!.type.spec.toDOM!(found!);
}

suite('Visual Editor: column widths', function () {
    this.timeout(60000);

    suiteSetup(() => {
        es = buildEditorSchema(ditabaseGrammar());
        tables = new TableCommands(es);
        void new DitaCommands(es);
    });

    suite('widths', () => {
        test('@colwidth values: proportional, fixed in any unit, both; unreadable or none is 1*', () => {
            assert.deepStrictEqual(parseColumnWidth(undefined), { stars: 1, fixed: 0 });
            assert.deepStrictEqual(parseColumnWidth('*'), { stars: 1, fixed: 0, fixedText: undefined });
            assert.deepStrictEqual(parseColumnWidth(' 2.5* '), { stars: 2.5, fixed: 0, fixedText: undefined });
            const pt = parseColumnWidth('72pt');
            assert.strictEqual(pt.stars, 0);
            assert.strictEqual(pt.unit, 'pt');
            assert.ok(Math.abs(pt.fixed - 96) < 1e-9);
            assert.ok(Math.abs(parseColumnWidth('1in').fixed - 96) < 1e-9 && Math.abs(parseColumnWidth('2.54cm').fixed - 96) < 1e-9);
            const mixed = parseColumnWidth('2*+10pt');
            assert.strictEqual(mixed.stars, 2);
            assert.strictEqual(mixed.fixedText, '10pt');
            assert.deepStrictEqual(parseColumnWidth('wide'), { stars: 1, fixed: 0 });
            assert.strictEqual(parseColumnWidth('40').fixed, 40);
        });

        test('shown as the preview shows them', () => {
            assert.deepStrictEqual(cssColumnWidths(['1*', '2*', '1*']), ['25.00%', '50.00%', '25.00%']);
            assert.deepStrictEqual(cssColumnWidths(['72pt', '1*']), ['96px', '100.00%']);
            assert.strictEqual(cssColumnWidths([undefined, undefined]), undefined, 'no widths: the browser lays out');
            assert.deepStrictEqual(columnPixels(['1*', '1*', '100px'].map(parseColumnWidth), 500), [200, 200, 100]);
        });

        test('a drag: proportions become whole numbers out of 100, once; the other columns keep theirs', () => {
            assert.deepStrictEqual(resizedColumnWidths(['1*', '2*', '1*'], 0, 100, 400), ['50*', '25*', '25*']);
            assert.deepStrictEqual(resizedColumnWidths(['20*', '30*', '50*'], 1, 40, 400), ['20*', '40*', '40*']);
            assert.deepStrictEqual(resizedColumnWidths([undefined, undefined], 0, -100, 400), ['25*', '75*']);
        });

        test('a drag stops at a minimum width; no move, no change', () => {
            assert.deepStrictEqual(resizedColumnWidths(['50*', '50*'], 0, 1000, 400), ['94*', '6*']);
            assert.strictEqual(resizedColumnWidths(['50*', '50*'], 0, 0, 400), undefined);
            assert.strictEqual(resizedColumnWidths(['50*', '50*'], 1, 10, 400), undefined, 'no border right of the last column');
        });

        test('fixed widths keep their unit; mixed ones keep their fixed part', () => {
            assert.deepStrictEqual(resizedColumnWidths(['100px', '100px'], 0, 20, 200), ['120px', '80px']);
            assert.deepStrictEqual(resizedColumnWidths(['100', '100'], 0, 20, 200), ['120', '80']);
            assert.strictEqual(resizedColumnWidths(['72pt', '1*'], 0, 48, 400)![0], '108pt');
            assert.strictEqual(resizedColumnWidths(['1*+10pt', '1*+10pt', '72pt'], 0, 20, 500)![1]!.endsWith('*+10pt'), true);
        });
    });

    suite('in the document', () => {
        test('colspecs: only the changed @colwidth values, in place', () => {
            const { out, state } = set(CALS, ['1*', '3*', '1*']);
            assert.strictEqual(out, CALS.replace('colwidth="2*"', 'colwidth="3*"'));
            const dom = JSON.stringify(tgroupDom(state.doc));
            assert.ok(dom.includes('"width:20.00%"') && dom.includes('"width:60.00%"'), dom);
        });

        test('a table without colspecs gets them, named and numbered', () => {
            const { out } = set(BARE, ['30*', '70*']);
            assert.ok(out.includes([
                '      <tgroup cols="2">',
                '        <colspec colname="c1" colnum="1" colwidth="30*"/>',
                '        <colspec colname="c2" colnum="2" colwidth="70*"/>',
                '        <tbody>',
            ].join('\n')), out);
        });

        test('a simple table: @relcolwidth', () => {
            const { out } = set(SIMPLE, ['25*', '75*']);
            assert.ok(out.includes('<simpletable relcolwidth="25* 75*">'), out);
        });

        test('loading and table commands keep the shown widths in step', () => {
            const { doc } = buildDocument(parse(CALS), es);
            assert.ok(JSON.stringify(tgroupDom(doc)).includes('"width:50.00%"'));
            let state = EditorState.create({ doc });
            let cell = -1;
            state.doc.descendants((node, p) => {
                if (cell === -1 && node.isText && node.text === 'c') {
                    cell = p;
                }
                return cell === -1;
            });
            state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, cell)));
            assert.ok(tables.addColumn('after')(state, (tr) => {
                state = state.apply(tr);
            }));
            const shown = JSON.stringify(tgroupDom(state.doc)).match(/width:[\d.]+%/g);
            assert.strictEqual(shown?.length, 4, 'four columns shown');
        });

        test('colspecs that do not match the columns: not resizable', () => {
            const odd = CALS.replace('        <colspec colname="c3" colwidth="1*"/>\n', '');
            const state = EditorState.create({ doc: buildDocument(parse(odd), es).doc });
            assert.strictEqual(tables.columnWidths(state, tablePos(state.doc)), undefined);
        });
    });
});
