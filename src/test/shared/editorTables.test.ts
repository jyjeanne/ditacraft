/**
 * Visual Editor table commands Test Suite (spec §13.5).
 *
 * Every command runs on a CALS table with a vertical span (`morerows`) and a horizontal span
 * (`namest`/`nameend`), or on a simple table, and is checked through the source it writes:
 * the result must still be a valid CALS grid (each slot covered exactly once — checked with
 * the CST's own grid, independent of the commands' code), `@cols` and the colspecs must
 * follow, and spans must grow and shrink as expected.
 */

import * as assert from 'assert';
import type { Node as PMNode } from 'prosemirror-model';
import { type Command, EditorState, TextSelection } from 'prosemirror-state';
import { parse } from '../../shared/cst/parse';
import { attr, childrenNamed, findElements } from '../../shared/cst/query';
import { computeGrid, isGridValid } from '../../shared/cst/tableGrid';
import { DitaCommands } from '../../shared/editor/commands';
import { buildEditorSchema, type EditorSchema } from '../../shared/editor/schema';
import { TableCommands } from '../../shared/editor/tables';
import { buildDocument } from '../../shared/editor/toProseMirror';
import { serializeDocument } from '../../shared/editor/toSource';
import { readingSignature } from './editorHelpers';
import { ditabaseGrammar } from './helpers';

let es: EditorSchema;
let tables: TableCommands;
let cmds: DitaCommands;

const CALS = [
    '<topic id="t">',
    '  <title>T</title>',
    '  <body>',
    '    <table id="tb">',
    '      <tgroup cols="3">',
    '        <colspec colname="c1" colnum="1" colwidth="1*"/>',
    '        <colspec colname="c2" colnum="2" colwidth="2*"/>',
    '        <colspec colname="c3" colnum="3" colwidth="1*"/>',
    '        <thead>',
    '          <row><entry>A</entry><entry>B</entry><entry>C</entry></row>',
    '        </thead>',
    '        <tbody>',
    '          <row><entry morerows="1">R1</entry><entry>x</entry><entry>y</entry></row>',
    '          <row><entry>z</entry><entry>w</entry></row>',
    '          <row><entry namest="c1" nameend="c2">wide</entry><entry>end</entry></row>',
    '        </tbody>',
    '      </tgroup>',
    '    </table>',
    '  </body>',
    '</topic>',
].join('\n');

const SIMPLE = '<topic id="s"><title>S</title><body><simpletable relcolwidth="1* 2*">'
    + '<sthead><stentry>H1</stentry><stentry>H2</stentry></sthead>'
    + '<strow><stentry>a</stentry><stentry>b</stentry></strow>'
    + '<strow><stentry>c</stentry><stentry>d</stentry></strow>'
    + '</simpletable></body></topic>';

function textPos(doc: PMNode, text: string): number {
    let found = -1;
    doc.descendants((node, pos) => {
        if (found === -1 && node.isText && node.text === text) {
            found = pos;
        }
        return found === -1;
    });
    assert.notStrictEqual(found, -1, `"${text}" not found`);
    return found;
}

interface Outcome {
    out: string;
    applied: boolean;
    state: EditorState;
}

function run(source: string, cell: string, command: Command): Outcome {
    const { doc, base } = buildDocument(parse(source), es);
    let state = EditorState.create({ doc, selection: TextSelection.create(doc, textPos(doc, cell)) });
    const applied = command(state, (tr) => {
        state = state.apply(tr);
    });
    const fix = cmds.normalize(state);
    if (fix) {
        state = state.apply(fix);
    }
    return { out: serializeDocument(state.doc, base), applied, state };
}

/** The tgroup of the written source: its grid must be valid, @cols must match. */
function check(out: string): { cols: number; rows: string[][]; colspecs: string[] } {
    const doc = parse(out);
    const tgroup = findElements(doc, 'tgroup')[0];
    const grid = computeGrid(tgroup);
    assert.ok(isGridValid(grid), `invalid grid:\n${out}`);
    const rows = grid.cells.reduce<Record<string, string[]>>((acc, c) => {
        const key = `${c.section}${c.row}`;
        (acc[key] ??= []).push(`${c.colStart}-${c.colEnd}x${c.rowSpan}`);
        return acc;
    }, {});
    const colspecs = childrenNamed(tgroup, 'colspec').map((c) => `${attr(c, 'colname')}/${attr(c, 'colnum')}`);
    assert.strictEqual(Number(attr(tgroup, 'cols')), grid.cols);
    return { cols: grid.cols, rows: Object.values(rows), colspecs };
}

suite('Visual Editor: tables (spec §13.5)', function () {
    this.timeout(60000);

    suiteSetup(() => {
        es = buildEditorSchema(ditabaseGrammar());
        tables = new TableCommands(es);
        cmds = new DitaCommands(es);
    });

    suite('rows', () => {
        test('a row inserted under a vertical span widens the span', () => {
            const { out } = run(CALS, 'x', tables.addRow('after'));
            assert.ok(out.includes('<entry morerows="2">R1</entry>'), out);
            assert.strictEqual(check(out).rows.length, 5);
        });

        test('a header row above the first', () => {
            const { out } = run(CALS, 'A', tables.addRow('before'));
            const thead = findElements(parse(out), 'thead')[0];
            assert.strictEqual(childrenNamed(thead, 'row').length, 2);
            check(out);
        });

        test('deleting a row moves a cell that spanned down from it', () => {
            const { out } = run(CALS, 'x', tables.deleteRow);
            assert.ok(out.includes('<row><entry>R1</entry><entry>z</entry><entry>w</entry></row>'), out);
            check(out);
        });

        test('deleting a row a span crosses shrinks the span; the minimal edit spares the rest', () => {
            const { out } = run(CALS, 'z', tables.deleteRow);
            assert.ok(out.includes('<entry>R1</entry><entry>x</entry>'), out);
            assert.ok(!out.includes('<entry>z</entry>'));
            assert.ok(out.includes('<entry namest="c1" nameend="c2">wide</entry>'), 'untouched rows kept as written');
            check(out);
        });

        test('the last body row cannot be deleted', () => {
            const one = CALS.replace(/<row><entry>z<\/entry>.*<\/row>\n/, '').replace(/ {10}<row><entry namest.*<\/row>\n/, '').replace(' morerows="1"', '');
            assert.strictEqual(run(one, 'x', tables.deleteRow).applied, false);
        });

        test('header row toggles', () => {
            const { out } = run(CALS, 'A', tables.toggleHeaderRow);
            assert.ok(!out.includes('<thead>'), out);
            check(out);
            const back = run(out, 'A', tables.toggleHeaderRow);
            assert.ok(back.out.includes('<thead>'), back.out);
            check(back.out);
        });
    });

    suite('columns', () => {
        test('a column inserted after B: new colspec, colnum renumbered, @cols', () => {
            const { out } = run(CALS, 'B', tables.addColumn('after'));
            const result = check(out);
            assert.strictEqual(result.cols, 4);
            assert.deepStrictEqual(result.colspecs, ['c1/1', 'c2/2', 'c4/3', 'c3/4']);
            assert.ok(out.includes('<colspec colname="c4" colnum="3" colwidth="1*"/>'), out);
        });

        test('a column inserted inside a horizontal span widens it', () => {
            const { out } = run(CALS, 'x', tables.addColumn('before'));
            const doc = parse(out);
            const grid = computeGrid(findElements(doc, 'tgroup')[0]);
            const wide = grid.cells.find((c) => c.entry.children.some((n) => n.type === 'text' && n.raw === 'wide'))!;
            assert.deepStrictEqual([wide.colStart, wide.colEnd], [1, 3]);
            check(out);
        });

        test('deleting a column shrinks a span crossing it and removes the others', () => {
            const { out } = run(CALS, 'B', tables.deleteColumn);
            const result = check(out);
            assert.strictEqual(result.cols, 2);
            assert.deepStrictEqual(result.colspecs, ['c1/1', 'c3/2']);
            assert.ok(out.includes('<entry colname="c1">wide</entry>'), out);
            assert.ok(!out.includes('>x<') && !out.includes('>z<'), out);
        });
    });

    suite('merge and split', () => {
        test('merge right: a span by colspec names, contents joined', () => {
            const { out } = run(CALS, 'x', tables.mergeRight);
            assert.ok(out.includes('<entry namest="c2" nameend="c3">x y</entry>'), out);
            check(out);
        });

        test('merge down: morerows, contents joined; refused across different columns', () => {
            const { out } = run(CALS, 'x', tables.mergeDown);
            assert.ok(out.includes('<entry morerows="1">x z</entry>'), out);
            check(out);
            assert.strictEqual(run(CALS, 'z', tables.mergeDown).applied, false);
        });

        test('split: a merged cell becomes one cell per slot again', () => {
            let { out } = run(CALS, 'wide', tables.splitCell);
            assert.ok(out.includes('<entry colname="c1">wide</entry><entry/>'), out);
            check(out);
            out = run(CALS, 'R1', tables.splitCell).out;
            assert.ok(out.includes('<row><entry/><entry>z</entry><entry>w</entry></row>'), out);
            check(out);
        });

        test('merging in a table without colspecs creates them', () => {
            const bare = '<topic id="t"><title>T</title><body><table><tgroup cols="2"><tbody><row><entry>a</entry><entry>b</entry></row></tbody></tgroup></table></body></topic>';
            const { out } = run(bare, 'a', tables.mergeRight);
            assert.ok(out.includes('<colspec colname="c1" colnum="1"/><colspec colname="c2" colnum="2"/>'), out);
            assert.ok(out.includes('<entry namest="c1" nameend="c2">a b</entry>'), out);
            check(out);
        });
    });

    suite('navigation', () => {
        test('Tab moves to the next cell; in the last cell it adds a row', () => {
            const { state } = run(CALS, 'C', tables.goToCell(1));
            assert.strictEqual(state.selection.$from.parent.textContent, 'R1');
            const last = run(CALS, 'end', tables.goToCell(1));
            assert.strictEqual(check(last.out).rows.length, 5);
        });
    });

    suite('simple tables', () => {
        test('rows, columns, header and @relcolwidth', () => {
            let out = run(SIMPLE, 'a', tables.addColumn('after')).out;
            assert.ok(out.includes('relcolwidth="1* 1* 2*"'), out);
            assert.ok(out.includes('<strow><stentry>a</stentry><stentry/><stentry>b</stentry></strow>'), out);
            out = run(SIMPLE, 'b', tables.deleteColumn).out;
            assert.ok(out.includes('relcolwidth="1*"') && out.includes('<strow><stentry>a</stentry></strow>'), out);
            out = run(SIMPLE, 'H1', tables.addRow('after')).out;
            assert.ok(out.includes('</sthead><strow><stentry/><stentry/></strow>'), out);
            out = run(SIMPLE, 'c', tables.deleteRow).out;
            assert.ok(!out.includes('>c<'), out);
            out = run(SIMPLE, 'H1', tables.toggleHeaderRow).out;
            assert.ok(out.includes('<strow><stentry>H1</stentry>') && !out.includes('<sthead>'), out);
            assert.strictEqual(run(SIMPLE, 'H1', tables.addRow('before')).applied, false);
        });
    });

    suite('fuzz', () => {
        test('random table commands keep every grid valid', () => {
            let seed = Number(process.env.DITACRAFT_FUZZ_SEED) || 11;
            const rnd = (n: number): number => {
                seed = (seed * 1103515245 + 12345) & 0x7fffffff;
                return seed % n;
            };
            const commands: [string, Command][] = [
                ['row before', tables.addRow('before')], ['row after', tables.addRow('after')], ['delete row', tables.deleteRow],
                ['col before', tables.addColumn('before')], ['col after', tables.addColumn('after')], ['delete col', tables.deleteColumn],
                ['merge right', tables.mergeRight], ['merge down', tables.mergeDown], ['split', tables.splitCell],
                ['header', tables.toggleHeaderRow], ['tab', tables.goToCell(1)],
                ['widths', (state, dispatch) => {
                    // Random proportions for every column (colspecs created when missing).
                    const $from = state.selection.$from;
                    for (let d = $from.depth; d > 0; d--) {
                        if (es.role($from.node(d).type)?.element === 'table') {
                            const current = tables.columnWidths(state, $from.before(d));
                            return current !== undefined && tables.setColumnWidths($from.before(d), current.map(() => `${1 + rnd(9)}*`))(state, dispatch);
                        }
                    }
                    return false;
                }],
            ];
            const failures: string[] = [];
            let applied = 0;
            const runs = Number(process.env.DITACRAFT_FUZZ_RUNS) || 60;
            for (let run = 0; run < runs; run++) {
                const { doc, base } = buildDocument(parse(CALS), es);
                let state = EditorState.create({ doc });
                const ops: string[] = [];
                for (let step = 0; step < 12; step++) {
                    const cells: number[] = [];
                    state.doc.descendants((node, pos) => {
                        if (es.role(node.type)?.element === 'entry') {
                            cells.push(pos);
                            return false;
                        }
                        return true;
                    });
                    const at = cells[rnd(cells.length)];
                    state = state.apply(state.tr.setSelection(TextSelection.near(state.doc.resolve(at + 1))));
                    const [name, command] = commands[rnd(commands.length)];
                    let ok = false;
                    try {
                        ok = command(state, (tr) => {
                            state = state.apply(tr);
                        });
                    } catch (error) {
                        failures.push(`[${[...ops, name].join(', ')}] threw ${(error as Error).message}`);
                        break;
                    }
                    if (!ok) {
                        continue;
                    }
                    const fix = cmds.normalize(state);
                    if (fix) {
                        state = state.apply(fix);
                    }
                    ops.push(name);
                    applied++;
                    try {
                        const out = serializeDocument(state.doc, base);
                        check(out);
                        const reloaded = buildDocument(parse(out), es).doc;
                        assert.strictEqual(readingSignature(reloaded, es), readingSignature(state.doc, es), 'reads back differently');
                    } catch (error) {
                        failures.push(`[${ops.join(', ')}]: ${(error as Error).message.split('\n')[0]}`);
                        break;
                    }
                }
            }
            assert.ok(applied > 200, `only ${applied} commands applied`);
            assert.deepStrictEqual(failures.slice(0, 8), []);
        });
    });
});
