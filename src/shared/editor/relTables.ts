/**
 * Relationship tables in the visual editor (spec §13.8, M3). A `<reltable>` is shown as a table:
 * its `<relheader>`'s `<relcolspec>`s are the column headers (their `@type`), each `<relrow>` a row
 * of `<relcell>`s holding references (rows, see maps.ts). These commands keep it a grid: a new row
 * has a cell per column, a new column a header and a cell in every row, a column is deleted with
 * its header and its cells. Cells are selected as wholes (a NodeSelection), the keyboard moves
 * between them.
 *
 * Elements are recognized by class (`map/reltable`, `map/relrow`…), so specializations work too.
 *
 * Environment-neutral.
 */

import { Fragment, type Node as PMNode, type NodeType } from 'prosemirror-model';
import { type Command, type EditorState, NodeSelection, type Transaction } from 'prosemirror-state';
import type { DitaCommands } from './commands';
import type { EditorSchema } from './schema';

const FRESH = { src: null, xml: [], view: null };

export const RELTABLE = 'map/reltable';
const RELHEADER = 'map/relheader';
const RELCOLSPEC = 'map/relcolspec';
const RELROW = 'map/relrow';
const RELCELL = 'map/relcell';

/** A relationship table around the selection, and where the selection is in it. */
export interface RelGrid {
    pos: number;
    table: PMNode;
    header?: { pos: number; node: PMNode };
    rows: { pos: number; node: PMNode }[];
    /** The row of the selection: -1 for the header row. */
    row: number;
    /** The column of the selection's cell. */
    col: number;
    /** Columns: the header's, or the most cells in a row. */
    cols: number;
}

export class RelTableCommands {
    constructor(private readonly es: EditorSchema, private readonly cmds: DitaCommands) {}

    private tokens(node: PMNode): string[] {
        const element = this.es.role(node.type)?.element;
        return (element ? this.es.facts(element)?.tokens : undefined) ?? [];
    }

    private is(node: PMNode, token: string): boolean {
        return this.tokens(node).includes(token);
    }

    /** A cell of a relationship table: a body cell or a column header. */
    isCell(node: PMNode): boolean {
        return this.is(node, RELCELL) || this.is(node, RELCOLSPEC);
    }

    /** A part of a table's grid (rows, cells, the header): moved and deleted with the table's commands only. */
    isGridPart(node: PMNode): boolean {
        return [RELHEADER, RELCOLSPEC, RELROW, RELCELL].some((t) => this.is(node, t));
    }

    /** An element that is a part of a table's grid (inserted with the table's commands only). */
    isGridElement(name: string): boolean {
        const tokens = this.es.facts(name)?.tokens ?? [];
        return [RELHEADER, RELCOLSPEC, RELROW, RELCELL].some((t) => tokens.includes(t));
    }

    /** The cell selected (a NodeSelection on a cell). */
    selectedCell(state: EditorState): { pos: number; node: PMNode } | undefined {
        const sel = state.selection;
        return sel instanceof NodeSelection && this.isCell(sel.node) ? { pos: sel.from, node: sel.node } : undefined;
    }

    /** The element names of this document type for a table's parts (by class). */
    private typeOf(token: string): NodeType | undefined {
        // The base element first: `relrow` rather than a specialization of it.
        const base = token.split('/')[1];
        const names = [base, ...Object.keys(this.es.grammar.elements).filter((n) => n !== base)];
        for (const name of names) {
            const tokens = this.es.facts(name)?.tokens;
            if (tokens && tokens[tokens.length - 1] === token) {
                return this.es.nodeType(name, 'block');
            }
        }
        return undefined;
    }

    /** The table around the selection (its innermost), with the selection's row and column. */
    gridAt(state: EditorState): RelGrid | undefined {
        const sel = state.selection;
        const $from = sel.$from;
        // The nodes from the selection up: the selected node itself first.
        const chain: { node: PMNode; pos: number }[] = [];
        if (sel instanceof NodeSelection) {
            chain.push({ node: sel.node, pos: sel.from });
        }
        for (let d = $from.depth; d > 0; d--) {
            chain.push({ node: $from.node(d), pos: $from.before(d) });
        }
        const tableAt = chain.findIndex((c) => this.is(c.node, RELTABLE));
        if (tableAt === -1) {
            return undefined;
        }
        const grid = this.gridOf(chain[tableAt].node, chain[tableAt].pos);
        const inside = chain.slice(0, tableAt);
        const cell = inside.find((c) => this.isCell(c.node));
        const line = inside.find((c) => this.is(c.node, RELROW) || this.is(c.node, RELHEADER));
        if (line) {
            grid.row = this.is(line.node, RELHEADER) ? -1 : grid.rows.findIndex((r) => r.pos === line.pos);
            line.node.forEach((_child, offset, k) => {
                if (cell && line.pos + 1 + offset === cell.pos) {
                    grid.col = k;
                }
            });
        }
        return grid;
    }

    /** The grid of the table `table` at `pos` (its place: the first row, first column). */
    private gridOf(table: PMNode, pos: number): RelGrid {
        let header: RelGrid['header'];
        const rows: RelGrid['rows'] = [];
        table.forEach((child, offset) => {
            const at = pos + 1 + offset;
            if (this.is(child, RELHEADER)) {
                header = { pos: at, node: child };
            } else if (this.is(child, RELROW)) {
                rows.push({ pos: at, node: child });
            }
        });
        const cols = Math.max(header?.node.childCount ?? 0, ...rows.map((r) => r.node.childCount), 1);
        return { pos, table, header, rows, row: rows.length > 0 ? 0 : -1, col: 0, cols };
    }

    /** Whether the selection is in a relationship table. */
    inRelTable(state: EditorState): boolean {
        return this.gridAt(state) !== undefined;
    }

    /** The position of the cell at (`row`, `col`) of `grid` (row -1: the header), if it exists. */
    cellPos(grid: RelGrid, row: number, col: number): number | undefined {
        const line = row === -1 ? grid.header : grid.rows[row];
        return line ? childPos(line, col) : undefined;
    }

    private newRow(cols: number): PMNode | undefined {
        const row = this.typeOf(RELROW);
        const cell = this.typeOf(RELCELL);
        return row && cell ? row.create(FRESH, Array.from({ length: cols }, () => cell.create(FRESH))) : undefined;
    }

    /** Select the cell at (`row`, `col`) — or the nearest one — of the table at `tablePos` in `tr`'s document. */
    private selectCell(tr: Transaction, tablePos: number, row: number, col: number): Transaction {
        const table = tr.doc.nodeAt(tablePos);
        if (!table || !this.is(table, RELTABLE)) {
            return tr;
        }
        const grid = this.gridOf(table, tablePos);
        const r = Math.min(row, grid.rows.length - 1);
        const at = this.cellPos(grid, r, Math.max(0, col)) ?? this.cellPos(grid, r, 0);
        return at === undefined ? tr : tr.setSelection(NodeSelection.create(tr.doc, at));
    }

    // -- the table ----------------------------------------------------------------------------------

    /**
     * Insert a relationship table — a header of `cols` column specifications and `rows` rows of
     * empty cells — after the selected row or the cursor's block, else at the end of the map, where
     * the DTD allows it. Its first cell is selected.
     */
    insertRelTable(cols: number, rows: number): Command {
        return (state, dispatch) => {
            const [table, header, colspec] = [this.typeOf(RELTABLE), this.typeOf(RELHEADER), this.typeOf(RELCOLSPEC)];
            const row = this.newRow(cols);
            if (!table || !header || !colspec || !row) {
                return false;
            }
            const node = table.create(FRESH, [
                header.create(FRESH, Array.from({ length: cols }, () => colspec.create(FRESH))),
                ...Array.from({ length: Math.max(1, rows) }, () => this.newRow(cols)!),
            ]);
            if (!table.validContent(node.content)) {
                return false;
            }
            const fits = (parent: PMNode, index: number): boolean => parent.canReplaceWith(index, index, table) && this.cmds.allowedIn(parent, this.es.role(table)!.element!);
            let at: number | undefined;
            const point = this.cmds.insertionPointAt(state);
            if (point && fits(point.parent, point.index)) {
                at = point.pos;
            } else {
                const root = state.doc.firstChild;
                if (root && fits(root, root.childCount)) {
                    at = root.nodeSize - 1; // the end of the map
                }
            }
            if (at === undefined) {
                return false;
            }
            if (dispatch) {
                const tr = state.tr.insert(at, node);
                dispatch(this.selectCell(tr, at, 0, 0).scrollIntoView());
            }
            return true;
        };
    }

    // -- rows -------------------------------------------------------------------------------------------

    /** A row of empty cells above (`before`) or below the selection's row (below the header: the first row). */
    addRow(side: 'before' | 'after'): Command {
        return (state, dispatch) => {
            const grid = this.gridAt(state);
            const row = grid ? this.newRow(grid.cols) : undefined;
            if (!grid || !row || (grid.row === -1 && side === 'before')) {
                return false;
            }
            const current = grid.rows[grid.row];
            const at = grid.row === -1 ? grid.header!.pos + grid.header!.node.nodeSize
                : side === 'before' ? current.pos : current.pos + current.node.nodeSize;
            if (dispatch) {
                const tr = state.tr.insert(at, row);
                dispatch(this.selectCell(tr, grid.pos, grid.row === -1 ? 0 : grid.row + (side === 'after' ? 1 : 0), grid.col).scrollIntoView());
            }
            return true;
        };
    }

    /** Delete the selection's row (not the last one: a table has rows). */
    readonly deleteRow: Command = (state, dispatch) => {
        const grid = this.gridAt(state);
        if (!grid || grid.row === -1 || grid.rows.length <= 1) {
            return false;
        }
        if (dispatch) {
            const { pos, node } = grid.rows[grid.row];
            const tr = state.tr.delete(pos, pos + node.nodeSize);
            dispatch(this.selectCell(tr, grid.pos, Math.min(grid.row, grid.rows.length - 2), grid.col).scrollIntoView());
        }
        return true;
    };

    /** Move the selection's row up (-1) or down (1), among the rows (never above the header). */
    moveRow(direction: -1 | 1): Command {
        return (state, dispatch) => {
            const grid = this.gridAt(state);
            const other = grid ? grid.row + direction : -1;
            if (!grid || grid.row === -1 || other < 0 || other >= grid.rows.length) {
                return false;
            }
            if (dispatch) {
                const [first, second] = direction === -1 ? [grid.rows[other], grid.rows[grid.row]] : [grid.rows[grid.row], grid.rows[other]];
                const tr = state.tr.replaceWith(first.pos, second.pos + second.node.nodeSize, Fragment.from([second.node, first.node]));
                dispatch(this.selectCell(tr, grid.pos, other, grid.col).scrollIntoView());
            }
            return true;
        };
    }

    // -- columns -------------------------------------------------------------------------------------------

    /** A column left (`before`) or right of the selection's: a header and a cell in every row. */
    addColumn(side: 'before' | 'after'): Command {
        return (state, dispatch) => {
            const grid = this.gridAt(state);
            const [colspec, cell] = [this.typeOf(RELCOLSPEC), this.typeOf(RELCELL)];
            if (!grid || !colspec || !cell) {
                return false;
            }
            const at = grid.col + (side === 'after' ? 1 : 0);
            if (dispatch) {
                const tr = state.tr;
                // Rows from the last, so the positions before them stay right.
                const lines = [...(grid.header ? [{ ...grid.header, type: colspec }] : []), ...grid.rows.map((r) => ({ ...r, type: cell }))].reverse();
                for (const line of lines) {
                    const index = Math.min(at, line.node.childCount);
                    let pos = line.pos + 1;
                    for (let k = 0; k < index; k++) {
                        pos += line.node.child(k).nodeSize;
                    }
                    tr.insert(pos, line.type.create(FRESH));
                }
                dispatch(this.selectCell(tr, grid.pos, grid.row, at).scrollIntoView());
            }
            return true;
        };
    }

    /** Delete the selection's column: its header and its cell in every row (not the last column). */
    readonly deleteColumn: Command = (state, dispatch) => {
        const grid = this.gridAt(state);
        // A header keeps one column specification at least.
        if (!grid || grid.cols <= 1 || (grid.header && grid.header.node.childCount <= 1 && grid.col < grid.header.node.childCount)) {
            return false;
        }
        if (dispatch) {
            const tr = state.tr;
            const lines = [...(grid.header ? [grid.header] : []), ...grid.rows].reverse();
            for (const line of lines) {
                const pos = childPos(line, grid.col);
                if (pos !== undefined) {
                    tr.delete(pos, pos + line.node.child(grid.col).nodeSize);
                }
            }
            dispatch(this.selectCell(tr, grid.pos, grid.row, Math.min(grid.col, grid.cols - 2)).scrollIntoView());
        }
        return true;
    };

    // -- moving between cells ---------------------------------------------------------------------------

    /**
     * Select another cell from the selected one: `next`/`previous` in reading order (the header's
     * first), `up`/`down`/`left`/`right`. `next` past the last cell adds a row (unless `addRow` is false). False at an edge.
     */
    goToCell(direction: 'next' | 'previous' | 'up' | 'down' | 'left' | 'right', addRow = true): Command {
        return (state, dispatch) => {
            const cell = this.selectedCell(state);
            const grid = cell ? this.gridAt(state) : undefined;
            if (!cell || !grid) {
                return false;
            }
            const lines = [...(grid.header ? [-1] : []), ...grid.rows.map((_r, k) => k)];
            const li = lines.indexOf(grid.row);
            const width = (row: number): number => (row === -1 ? grid.header!.node.childCount : grid.rows[row].node.childCount);
            const { row, col } = grid;
            let target: [number, number] | undefined;
            switch (direction) {
                case 'left':
                    target = col > 0 ? [row, col - 1] : undefined;
                    break;
                case 'right':
                    target = col < width(row) - 1 ? [row, col + 1] : undefined;
                    break;
                case 'previous':
                    target = col > 0 ? [row, col - 1] : li > 0 ? [lines[li - 1], width(lines[li - 1]) - 1] : undefined;
                    break;
                case 'next':
                    if (col < width(row) - 1) {
                        target = [row, col + 1];
                    } else if (li < lines.length - 1) {
                        target = [lines[li + 1], 0];
                    } else if (addRow) {
                        // Past the last cell: a new row, its first cell selected.
                        return this.addRow('after')(state, dispatch && ((tr) => dispatch(this.selectCell(tr, grid.pos, grid.rows.length, 0))));
                    }
                    break;
                default: {
                    const to = lines[li + (direction === 'up' ? -1 : 1)];
                    target = to === undefined ? undefined : [to, Math.min(col, width(to) - 1)];
                }
            }
            const pos = target ? this.cellPos(grid, target[0], target[1]) : undefined;
            if (pos === undefined) {
                return false;
            }
            if (dispatch) {
                dispatch(state.tr.setSelection(NodeSelection.create(state.doc, pos)).scrollIntoView());
            }
            return true;
        };
    }
}

/** The position of child `index` of the node at `line.pos`, if it has one. */
function childPos(line: { pos: number; node: PMNode }, index: number): number | undefined {
    if (index < 0 || index >= line.node.childCount) {
        return undefined;
    }
    let pos = line.pos + 1;
    for (let k = 0; k < index; k++) {
        pos += line.node.child(k).nodeSize;
    }
    return pos;
}
