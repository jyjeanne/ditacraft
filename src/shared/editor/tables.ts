/**
 * Table editing for the visual editor (spec §13.5): rows, columns, merged cells and header
 * rows of CALS tables (`table/tgroup/colspec/thead/tbody/row/entry`) and simple tables
 * (`simpletable/sthead/strow/stentry`).
 *
 * The commands work on the CALS grid itself — spans are `namest`/`nameend` (named
 * colspecs) and `morerows` — rather than on an HTML-like table model, so the document keeps
 * its DITA structure: `@cols` and the colspec list (`colname`, `colnum`) follow column
 * changes, spans crossing an inserted or deleted row/column grow or shrink, merged cells
 * use colspec names. Each command rebuilds only the affected tgroup (or simple table),
 * reusing unchanged rows and cells as the same objects, so the writer changes only the
 * bytes of what actually changed. Cells' rendered spans (`attrs.view`) are recomputed.
 *
 * Every command is a ProseMirror command (dry-run without dispatch, for menus); elements
 * are recognized by class token, so specializations of tables work too.
 *
 * Environment-neutral.
 */

import { Fragment, type Node as PMNode, type NodeType } from 'prosemirror-model';
import { type Command, type EditorState, Selection, type Transaction } from 'prosemirror-state';
import { withAttribute, type AttributePairs } from '../cst/openTag';
import { tgroupWidths } from './columnWidths';
import { SYNTHETIC, type EditorSchema } from './schema';

const FRESH = { src: null, xml: [], view: null };

interface Cell {
    node: PMNode;
    row: number;
    colStart: number;
    colEnd: number;
    rowSpan: number;
}

interface Row {
    node: PMNode;
    cells: Cell[];
}

interface Section {
    kind: 'thead' | 'tbody';
    node: PMNode;
    rows: Row[];
}

interface Colspec {
    node: PMNode;
    name?: string;
    num: number;
}

/** A CALS tgroup as a grid. */
interface Grid {
    tgroup: PMNode;
    pos: number;
    cols: number;
    colspecs: Colspec[];
    numByName: Map<string, number>;
    sections: Section[];
}

/** Where the cursor is in a table. */
interface CellRef {
    grid: Grid;
    section: number;
    row: number;
    cell: Cell;
}

export class TableCommands {
    constructor(private readonly es: EditorSchema) {}

    // -- recognition ------------------------------------------------------------------------

    private tokens(node: PMNode): string[] {
        const element = this.es.role(node.type)?.element;
        return element ? (this.es.facts(element)?.tokens ?? []) : [];
    }

    private is(node: PMNode, token: string): boolean {
        return this.tokens(node).includes(token);
    }

    private attr(node: PMNode, name: string): string | undefined {
        return (node.attrs.xml as AttributePairs | undefined)?.find(([n]) => n === name)?.[1];
    }

    private withAttr(node: PMNode, name: string, value: string | null): PMNode {
        const xml = node.attrs.xml as AttributePairs | undefined;
        if (!xml || (value === null ? this.attr(node, name) === undefined : this.attr(node, name) === value)) {
            return node;
        }
        return node.type.create({ ...node.attrs, xml: withAttribute(xml, name, value) }, node.content, node.marks);
    }

    /** An empty cell of the same element as `like` (a plain textblock, so the cursor can enter). */
    private emptyCell(like: PMNode | undefined, element = 'entry'): PMNode {
        const name = (like && this.es.role(like.type)?.element) || element;
        const type = this.es.nodeType(name, 'block', 'text') ?? this.es.nodeType(name, 'block')!;
        return type.create(FRESH);
    }

    // -- CALS grid ------------------------------------------------------------------------------

    private grid(tgroup: PMNode, pos: number): Grid {
        const colspecs: Colspec[] = [];
        const sections: Section[] = [];
        tgroup.forEach((child) => {
            if (this.is(child, 'topic/colspec')) {
                const num = Number(this.attr(child, 'colnum')) || colspecs.length + 1;
                colspecs.push({ node: child, name: this.attr(child, 'colname'), num });
            } else if (this.is(child, 'topic/thead') || this.is(child, 'topic/tbody')) {
                const rows: Row[] = [];
                child.forEach((row) => {
                    if (this.is(row, 'topic/row')) {
                        rows.push({ node: row, cells: [] });
                    }
                });
                sections.push({ kind: this.is(child, 'topic/thead') ? 'thead' : 'tbody', node: child, rows });
            }
        });
        const numByName = new Map<string, number>();
        for (const c of colspecs) {
            if (c.name) {
                numByName.set(c.name, c.num);
            }
        }
        let widest = 0;
        for (const section of sections) {
            const occupied = new Set<string>();
            section.rows.forEach((row, r) => {
                let col = 1;
                row.node.forEach((entry) => {
                    if (!this.is(entry, 'topic/entry')) {
                        return;
                    }
                    while (occupied.has(`${r},${col}`)) {
                        col++;
                    }
                    const namest = this.attr(entry, 'namest');
                    const nameend = this.attr(entry, 'nameend');
                    const colname = this.attr(entry, 'colname');
                    let start = col;
                    let end = col;
                    if (namest && nameend && numByName.has(namest) && numByName.has(nameend)) {
                        start = numByName.get(namest)!;
                        end = numByName.get(nameend)!;
                    } else if (colname && numByName.has(colname)) {
                        start = end = numByName.get(colname)!;
                    }
                    const rowSpan = (Number(this.attr(entry, 'morerows')) || 0) + 1;
                    row.cells.push({ node: entry, row: r, colStart: start, colEnd: end, rowSpan });
                    for (let rr = r; rr < r + rowSpan; rr++) {
                        for (let cc = start; cc <= end; cc++) {
                            occupied.add(`${rr},${cc}`);
                        }
                    }
                    col = end + 1;
                    widest = Math.max(widest, end);
                });
            });
        }
        const cols = Number(this.attr(tgroup, 'cols')) || colspecs.length || widest;
        return { tgroup, pos, cols, colspecs, numByName, sections };
    }

    /** The CALS cell around the selection, with its grid. */
    private cellAt(state: EditorState): CellRef | undefined {
        const $from = state.selection.$from;
        let entryDepth = -1;
        for (let d = $from.depth; d > 0; d--) {
            if (this.is($from.node(d), 'topic/entry')) {
                entryDepth = d;
                break;
            }
        }
        if (entryDepth < 3) {
            return undefined;
        }
        const tgroupDepth = entryDepth - 3; // entry < row < thead/tbody < tgroup
        if (!this.is($from.node(tgroupDepth), 'topic/tgroup')) {
            return undefined;
        }
        const grid = this.grid($from.node(tgroupDepth), $from.before(tgroupDepth));
        const entry = $from.node(entryDepth);
        for (let s = 0; s < grid.sections.length; s++) {
            for (let r = 0; r < grid.sections[s].rows.length; r++) {
                const cell = grid.sections[s].rows[r].cells.find((c) => c.node === entry);
                if (cell) {
                    return { grid, section: s, row: r, cell };
                }
            }
        }
        return undefined;
    }

    /**
     * Colspec names usable by spans: every colspec named (new names where missing); a table
     * without colspecs gets one per column.
     */
    private namedColspecs(grid: Grid): { colspecs: PMNode[]; names: string[] } | undefined {
        if (grid.colspecs.length === 0) {
            const type = this.es.nodeType('colspec', 'block');
            if (!type) {
                return undefined;
            }
            const names = Array.from({ length: grid.cols }, (_, i) => `c${i + 1}`);
            return { colspecs: names.map((name, i) => type.create({ ...FRESH, xml: [['colname', name], ['colnum', String(i + 1)]] })), names };
        }
        if (grid.colspecs.length !== grid.cols) {
            return undefined; // spans need one colspec per column
        }
        const used = new Set(grid.colspecs.map((c) => c.name).filter((n): n is string => !!n));
        const names: string[] = [];
        const colspecs = grid.colspecs.map((c, i) => {
            if (c.name) {
                names.push(c.name);
                return c.node;
            }
            const name = freshName(used, i + 1);
            names.push(name);
            return this.withAttr(c.node, 'colname', name);
        });
        return { colspecs, names };
    }

    /**
     * Rebuild a tgroup from its parts: `colspecs` replace the colspecs (in place), `rows` the
     * rows of each section (an empty section is dropped; a new `thead` is created when
     * `rows.thead` has rows and there was none).
     */
    private rebuild(grid: Grid, colspecs: PMNode[], rows: Record<'thead' | 'tbody', PMNode[]>, cols: number): PMNode {
        const children: PMNode[] = [];
        let colspecsDone = false;
        let sectionsDone = false;
        const sectionNode = (kind: 'thead' | 'tbody'): PMNode | undefined => {
            const existing = grid.sections.find((s) => s.kind === kind)?.node;
            if (rows[kind].length === 0) {
                return undefined;
            }
            const same = existing && existing.childCount === rows[kind].length && rows[kind].every((r, i) => existing.child(i) === r);
            if (same) {
                return existing;
            }
            const type = existing?.type ?? this.es.nodeType(kind, 'block');
            return type!.create(existing?.attrs ?? FRESH, rows[kind]);
        };
        const sections = (): void => {
            if (!sectionsDone) {
                sectionsDone = true;
                for (const kind of ['thead', 'tbody'] as const) {
                    const node = sectionNode(kind);
                    if (node) {
                        children.push(node);
                    }
                }
            }
        };
        grid.tgroup.forEach((child) => {
            if (this.is(child, 'topic/colspec')) {
                if (!colspecsDone) {
                    colspecsDone = true;
                    children.push(...colspecs);
                }
            } else if (this.is(child, 'topic/thead') || this.is(child, 'topic/tbody')) {
                if (!colspecsDone) {
                    colspecsDone = true;
                    children.push(...colspecs);
                }
                sections();
            } else {
                children.push(child);
            }
        });
        if (!colspecsDone) {
            children.unshift(...colspecs);
        }
        sections();
        const tgroup = this.withAttr(grid.tgroup, 'cols', String(cols));
        return this.withViews(tgroup.type.create(tgroup.attrs, children, tgroup.marks), grid.pos);
    }

    /** Cells' rendered spans and the tgroup's column widths (attrs.view) from the grid; unchanged cells stay the same objects. */
    private withViews(group: PMNode, pos: number): PMNode {
        const tgroup = this.withWidthsView(group);
        const grid = this.grid(tgroup, pos);
        const spans = new Map<PMNode, { colspan: number; rowspan: number }>();
        for (const section of grid.sections) {
            for (const row of section.rows) {
                for (const c of row.cells) {
                    spans.set(c.node, { colspan: c.colEnd - c.colStart + 1, rowspan: c.rowSpan });
                }
            }
        }
        const fix = (node: PMNode): PMNode => {
            const span = spans.get(node);
            if (span) {
                const view = node.attrs.view as { colspan?: number; rowspan?: number } | null;
                if ((view?.colspan ?? 1) === span.colspan && (view?.rowspan ?? 1) === span.rowspan) {
                    return node;
                }
                return node.type.create({ ...node.attrs, view: span }, node.content, node.marks);
            }
            if (node.isTextblock || node.isAtom) {
                return node;
            }
            let changed = false;
            const children: PMNode[] = [];
            node.forEach((child) => {
                const next = fix(child);
                changed = changed || next !== child;
                children.push(next);
            });
            return changed ? node.copy(Fragment.from(children)) : node;
        };
        return fix(tgroup);
    }

    /** The tgroup with its rendered column widths (attrs.view.widths) following its colspecs. */
    private withWidthsView(tgroup: PMNode): PMNode {
        const colspecs: (string | undefined)[] = [];
        tgroup.forEach((child) => {
            if (this.is(child, 'topic/colspec')) {
                colspecs.push(this.attr(child, 'colwidth'));
            }
        });
        const widths = tgroupWidths(Number(this.attr(tgroup, 'cols')) || colspecs.length, colspecs);
        const view = tgroup.attrs.view as { widths?: string[] } | null;
        if (JSON.stringify(view?.widths) === JSON.stringify(widths)) {
            return tgroup;
        }
        return tgroup.type.create({ ...tgroup.attrs, view: widths ? { ...(view ?? {}), widths } : null }, tgroup.content, tgroup.marks);
    }

    /** Replace the tgroup and put the cursor in cell (section, row, column) of the new one. */
    private commit(state: EditorState, grid: Grid, tgroup: PMNode, at: { section: 'thead' | 'tbody'; row: number; col: number } | undefined, dispatch: (tr: Transaction) => void): void {
        const tr = state.tr.replaceWith(grid.pos, grid.pos + grid.tgroup.nodeSize, tgroup);
        let target = grid.pos + 1;
        if (at) {
            const g = this.grid(tgroup, grid.pos);
            const section = g.sections.find((s) => s.kind === at.section) ?? g.sections[g.sections.length - 1];
            const row = section?.rows[Math.min(at.row, section.rows.length - 1)];
            const cell = row?.cells.find((c) => c.colStart <= at.col && at.col <= c.colEnd) ?? row?.cells[0];
            if (cell) {
                target = this.positionOf(tgroup, grid.pos, cell.node) ?? target;
            }
        }
        tr.setSelection(Selection.near(tr.doc.resolve(Math.min(target + 1, tr.doc.content.size))));
        dispatch(tr.scrollIntoView());
    }

    private positionOf(root: PMNode, rootPos: number, target: PMNode): number | undefined {
        let found: number | undefined;
        root.descendants((node, pos) => {
            if (found !== undefined) {
                return false;
            }
            if (node === target) {
                found = rootPos + 1 + pos;
                return false;
            }
            return true;
        });
        return found;
    }

    private rowsOf(grid: Grid): Record<'thead' | 'tbody', PMNode[]> {
        return {
            thead: grid.sections.find((s) => s.kind === 'thead')?.rows.map((r) => r.node) ?? [],
            tbody: grid.sections.find((s) => s.kind === 'tbody')?.rows.map((r) => r.node) ?? [],
        };
    }

    // -- rows ---------------------------------------------------------------------------------

    /** Insert a row above or below the cursor's row (spans crossing the new row grow). */
    addRow(where: 'before' | 'after'): Command {
        return (state, dispatch) => {
            const simple = this.simpleAt(state);
            if (simple) {
                return this.simpleAddRow(state, simple, where, dispatch);
            }
            const ref = this.cellAt(state);
            if (!ref) {
                return false;
            }
            if (dispatch) {
                const { grid } = ref;
                const section = grid.sections[ref.section];
                // Below a cell spanning rows, the new row goes after the span.
                const k = where === 'before' ? ref.row : ref.row + ref.cell.rowSpan;
                const grow = new Set<Cell>();
                const covered = new Set<number>();
                for (const row of section.rows) {
                    for (const c of row.cells) {
                        if (c.row < k && c.row + c.rowSpan > k) {
                            grow.add(c);
                            for (let col = c.colStart; col <= c.colEnd; col++) {
                                covered.add(col);
                            }
                        }
                    }
                }
                const entries: PMNode[] = [];
                for (let col = 1; col <= grid.cols; col++) {
                    if (!covered.has(col)) {
                        entries.push(this.emptyCell(ref.cell.node));
                    }
                }
                const rowType = section.rows[ref.row].node.type;
                const newRow = rowType.create(FRESH, entries);
                const rows = section.rows.map((row) => this.withRowCells(row, (c) => (grow.has(c) ? this.withAttr(c.node, 'morerows', String(c.rowSpan)) : c.node)));
                rows.splice(k, 0, newRow);
                const all = this.rowsOf(grid);
                all[section.kind] = rows;
                const tgroup = this.rebuild(grid, grid.colspecs.map((c) => c.node), all, grid.cols);
                this.commit(state, grid, tgroup, { section: section.kind, row: k, col: firstFree(covered, grid.cols) }, dispatch);
            }
            return true;
        };
    }

    private withRowCells(row: Row, map: (cell: Cell) => PMNode | null): PMNode {
        let changed = false;
        const children: PMNode[] = [];
        row.node.forEach((child) => {
            const cell = row.cells.find((c) => c.node === child);
            const next = cell ? map(cell) : child;
            changed = changed || next !== child;
            if (next) {
                children.push(next);
            }
        });
        return changed ? row.node.type.create(row.node.attrs, children, row.node.marks) : row.node;
    }

    /** Delete the cursor's row (a cell spanning into it shrinks; one starting in it moves down). */
    readonly deleteRow: Command = (state, dispatch) => {
        const simple = this.simpleAt(state);
        if (simple) {
            return this.simpleDeleteRow(state, simple, dispatch);
        }
        const ref = this.cellAt(state);
        if (!ref) {
            return false;
        }
        const { grid } = ref;
        const section = grid.sections[ref.section];
        if (section.kind === 'tbody' && section.rows.length === 1) {
            return false; // a tbody needs a row
        }
        if (dispatch) {
            const k = ref.row;
            const moving = section.rows[k].cells.filter((c) => c.rowSpan > 1);
            const rows: PMNode[] = [];
            section.rows.forEach((row, r) => {
                if (r === k) {
                    return;
                }
                let node = this.withRowCells(row, (c) => (c.row < k && c.row + c.rowSpan > k ? this.withAttr(c.node, 'morerows', c.rowSpan > 2 ? String(c.rowSpan - 2) : null) : c.node));
                if (r === k + 1 && moving.length > 0) {
                    // Cells that spanned down from the deleted row now start here.
                    // Own cells (kept in order) and moved cells, by column.
                    const placed = [...row.cells.map((c) => ({ col: c.colStart, node: null as PMNode | null })), ...moving.map((c) => ({
                        col: c.colStart, node: this.withAttr(c.node, 'morerows', c.rowSpan > 2 ? String(c.rowSpan - 2) : null) as PMNode | null,
                    }))].sort((a, b) => a.col - b.col);
                    const children: PMNode[] = [];
                    const current: PMNode[] = [];
                    node.forEach((child) => current.push(child));
                    let i = 0;
                    for (const p of placed) {
                        if (p.node) {
                            children.push(p.node);
                        } else {
                            children.push(current[i++]);
                        }
                    }
                    while (i < current.length) {
                        children.push(current[i++]);
                    }
                    node = row.node.type.create(row.node.attrs, children, row.node.marks);
                }
                rows.push(node);
            });
            const all = this.rowsOf(grid);
            all[section.kind] = rows;
            const tgroup = this.rebuild(grid, grid.colspecs.map((c) => c.node), all, grid.cols);
            const next = rows.length > 0
                ? { section: section.kind, row: Math.min(k, rows.length - 1), col: ref.cell.colStart }
                : { section: 'tbody' as const, row: 0, col: ref.cell.colStart };
            this.commit(state, grid, tgroup, next, dispatch);
        }
        return true;
    };

    /** The first body row becomes the header row, or the header rows go back to the body. */
    readonly toggleHeaderRow: Command = (state, dispatch) => {
        const simple = this.simpleAt(state);
        if (simple) {
            return this.simpleToggleHeader(state, simple, dispatch);
        }
        const ref = this.cellAt(state);
        if (!ref) {
            return false;
        }
        const { grid } = ref;
        const all = this.rowsOf(grid);
        if (all.thead.length === 0) {
            const first = grid.sections.find((s) => s.kind === 'tbody')?.rows[0];
            if (!first || all.tbody.length < 2 || first.cells.some((c) => c.rowSpan > 1)) {
                return false; // the body keeps a row; a span would cross the sections
            }
            if (!this.es.nodeType('thead', 'block')) {
                return false;
            }
            if (dispatch) {
                all.thead = [all.tbody.shift()!];
                this.commit(state, grid, this.rebuild(grid, grid.colspecs.map((c) => c.node), all, grid.cols),
                    { section: 'thead', row: 0, col: ref.cell.colStart }, dispatch);
            }
            return true;
        }
        if (dispatch) {
            all.tbody = [...all.thead, ...all.tbody];
            all.thead = [];
            this.commit(state, grid, this.rebuild(grid, grid.colspecs.map((c) => c.node), all, grid.cols),
                { section: 'tbody', row: 0, col: ref.cell.colStart }, dispatch);
        }
        return true;
    };

    // -- columns ------------------------------------------------------------------------------

    /** Insert a column left or right of the cursor's cell (spans crossing it grow). */
    addColumn(where: 'before' | 'after'): Command {
        return (state, dispatch) => {
            const simple = this.simpleAt(state);
            if (simple) {
                return this.simpleAddColumn(state, simple, where, dispatch);
            }
            const ref = this.cellAt(state);
            if (!ref) {
                return false;
            }
            const { grid } = ref;
            const k = where === 'before' ? ref.cell.colStart : ref.cell.colEnd + 1;
            if (dispatch) {
                // Colspecs: a new one at k (named like the others), the following ones renumbered.
                const colspecs: PMNode[] = [];
                if (grid.colspecs.length > 0) {
                    const used = new Set(grid.colspecs.map((c) => c.name).filter((n): n is string => !!n));
                    const template = grid.colspecs[Math.min(k, grid.colspecs.length) - 1]?.node ?? grid.colspecs[0].node;
                    const hasNum = grid.colspecs.some((c) => this.attr(c.node, 'colnum') !== undefined);
                    const hasName = grid.colspecs.some((c) => c.name);
                    const star = grid.colspecs.every((c) => /^\s*\d*\.?\d*\*\s*$/.test(this.attr(c.node, 'colwidth') ?? ''));
                    let xml: AttributePairs = [];
                    if (hasName) {
                        xml.push(['colname', freshName(used, k, grid.colspecs.map((c) => c.name))]);
                    }
                    if (hasNum) {
                        xml.push(['colnum', String(k)]);
                    }
                    if (star) {
                        xml.push(['colwidth', '1*']);
                    }
                    xml = xml.length > 0 ? xml : [];
                    const fresh = template.type.create({ ...FRESH, xml });
                    grid.colspecs.forEach((c, i) => {
                        if (i + 1 === k) {
                            colspecs.push(fresh);
                        }
                        colspecs.push(hasNum && this.attr(c.node, 'colnum') !== undefined && c.num >= k ? this.withAttr(c.node, 'colnum', String(c.num + 1)) : c.node);
                    });
                    if (k > grid.colspecs.length) {
                        colspecs.push(fresh);
                    }
                }
                const all: Record<'thead' | 'tbody', PMNode[]> = { thead: [], tbody: [] };
                for (const section of grid.sections) {
                    // Rows where a horizontal span crosses the new column: the span widens by
                    // itself (its colspec names now enclose the new colspec); no new cell there.
                    const spanned = new Set<number>();
                    for (const row of section.rows) {
                        for (const c of row.cells) {
                            if (c.colStart < k && k <= c.colEnd) {
                                for (let r = c.row; r < c.row + c.rowSpan; r++) {
                                    spanned.add(r);
                                }
                            }
                        }
                    }
                    all[section.kind] = section.rows.map((row, r) => {
                        if (spanned.has(r)) {
                            return row.node;
                        }
                        // A new cell before the row's first own cell at or after column k.
                        const children: PMNode[] = [];
                        let inserted = false;
                        row.node.forEach((child) => {
                            const cell = row.cells.find((c) => c.node === child);
                            if (!inserted && cell && cell.colStart >= k) {
                                children.push(this.emptyCell(cell.node));
                                inserted = true;
                            }
                            children.push(child);
                        });
                        if (!inserted) {
                            children.push(this.emptyCell(row.cells[0]?.node));
                        }
                        return row.node.type.create(row.node.attrs, children, row.node.marks);
                    });
                }
                const tgroup = this.rebuild(grid, colspecs.length > 0 ? colspecs : grid.colspecs.map((c) => c.node), all, grid.cols + 1);
                this.commit(state, grid, tgroup, { section: grid.sections[ref.section].kind, row: ref.row, col: k }, dispatch);
            }
            return true;
        };
    }

    /** Delete the cursor's column (cells spanning across it shrink). */
    readonly deleteColumn: Command = (state, dispatch) => {
        const simple = this.simpleAt(state);
        if (simple) {
            return this.simpleDeleteColumn(state, simple, dispatch);
        }
        const ref = this.cellAt(state);
        if (!ref || ref.grid.cols < 2) {
            return false;
        }
        const { grid } = ref;
        const k = ref.cell.colStart;
        if (dispatch) {
            const named = grid.colspecs.length > 0;
            const nameOf = (num: number) => grid.colspecs.find((c) => c.num === num)?.name;
            const colspecs = grid.colspecs
                .filter((c) => c.num !== k)
                .map((c) => (c.num > k && this.attr(c.node, 'colnum') !== undefined ? this.withAttr(c.node, 'colnum', String(c.num - 1)) : c.node));
            const all: Record<'thead' | 'tbody', PMNode[]> = { thead: [], tbody: [] };
            for (const section of grid.sections) {
                all[section.kind] = section.rows.map((row) => this.withRowCells(row, (c) => {
                    if (c.colStart === k && c.colEnd === k) {
                        return null; // the cell was only in this column
                    }
                    if (c.colStart <= k && k <= c.colEnd && named) {
                        const start = c.colStart === k ? c.colStart + 1 : c.colStart;
                        const end = c.colEnd === k ? c.colEnd - 1 : c.colEnd;
                        let node = c.node;
                        if (start === end) {
                            node = this.withAttr(this.withAttr(node, 'namest', null), 'nameend', null);
                            const name = nameOf(start);
                            node = name ? this.withAttr(node, 'colname', name) : node;
                        } else {
                            node = this.withAttr(this.withAttr(node, 'namest', nameOf(start) ?? null), 'nameend', nameOf(end) ?? null);
                        }
                        return node;
                    }
                    return c.node;
                }));
            }
            const tgroup = this.rebuild(grid, colspecs, all, grid.cols - 1);
            this.commit(state, grid, tgroup, { section: grid.sections[ref.section].kind, row: ref.row, col: Math.min(k, grid.cols - 1) }, dispatch);
        }
        return true;
    };

    // -- merge and split -------------------------------------------------------------------------

    /** Merge the cursor's cell with the cell to its right (same rows). */
    readonly mergeRight: Command = (state, dispatch) => {
        const ref = this.cellAt(state);
        if (!ref) {
            return false;
        }
        const { grid, cell } = ref;
        const row = grid.sections[ref.section].rows[ref.row];
        const right = row.cells.find((c) => c.colStart === cell.colEnd + 1);
        const named = this.namedColspecs(grid);
        if (!right || right.rowSpan !== cell.rowSpan || !named) {
            return false;
        }
        if (dispatch) {
            let merged = this.mergeContent(cell.node, right.node);
            merged = this.withAttr(merged, 'colname', null);
            merged = this.withAttr(merged, 'namest', named.names[cell.colStart - 1]);
            merged = this.withAttr(merged, 'nameend', named.names[right.colEnd - 1]);
            const all = this.rowsOf(grid);
            all[grid.sections[ref.section].kind][ref.row] = this.withRowCells(row, (c) => (c === cell ? merged : c === right ? null : c.node));
            const tgroup = this.rebuild(grid, named.colspecs, all, grid.cols);
            this.commit(state, grid, tgroup, { section: grid.sections[ref.section].kind, row: ref.row, col: cell.colStart }, dispatch);
        }
        return true;
    };

    /** Merge the cursor's cell with the cell below it (same columns). */
    readonly mergeDown: Command = (state, dispatch) => {
        const ref = this.cellAt(state);
        if (!ref) {
            return false;
        }
        const { grid, cell } = ref;
        const section = grid.sections[ref.section];
        const belowRow = section.rows[ref.row + cell.rowSpan];
        const below = belowRow?.cells.find((c) => c.colStart === cell.colStart && c.colEnd === cell.colEnd);
        if (!below) {
            return false;
        }
        if (dispatch) {
            const merged = this.withAttr(this.mergeContent(cell.node, below.node), 'morerows', String(cell.rowSpan + below.rowSpan - 1));
            const all = this.rowsOf(grid);
            const rows = all[section.kind];
            rows[ref.row] = this.withRowCells(section.rows[ref.row], (c) => (c === cell ? merged : c.node));
            rows[ref.row + cell.rowSpan] = this.withRowCells(belowRow, (c) => (c === below ? null : c.node));
            const tgroup = this.rebuild(grid, grid.colspecs.map((c) => c.node), all, grid.cols);
            this.commit(state, grid, tgroup, { section: section.kind, row: ref.row, col: cell.colStart }, dispatch);
        }
        return true;
    };

    /** A merged cell becomes one cell per column and row again (the content stays in the first). */
    readonly splitCell: Command = (state, dispatch) => {
        const ref = this.cellAt(state);
        if (!ref) {
            return false;
        }
        const { grid, cell } = ref;
        if (cell.colStart === cell.colEnd && cell.rowSpan === 1) {
            return false;
        }
        if (dispatch) {
            const section = grid.sections[ref.section];
            const nameOf = (num: number) => grid.colspecs.find((c) => c.num === num)?.name;
            let first = this.withAttr(this.withAttr(this.withAttr(cell.node, 'namest', null), 'nameend', null), 'morerows', null);
            if (this.attr(cell.node, 'namest') !== undefined) {
                // It was placed by its span: keep it in its column.
                const name = nameOf(cell.colStart);
                first = name ? this.withAttr(first, 'colname', name) : first;
            }
            const all = this.rowsOf(grid);
            const rows = all[section.kind];
            for (let r = cell.row; r < cell.row + cell.rowSpan; r++) {
                const row = section.rows[r];
                const extra: PMNode[] = [];
                for (let col = cell.colStart; col <= cell.colEnd; col++) {
                    if (r !== cell.row || col !== cell.colStart) {
                        extra.push(this.emptyCell(cell.node));
                    }
                }
                const children: PMNode[] = [];
                let placed = false;
                row.node.forEach((child) => {
                    const c = row.cells.find((x) => x.node === child);
                    if (c === cell) {
                        children.push(first, ...extra);
                        placed = true;
                        return;
                    }
                    if (!placed && r !== cell.row && c && c.colStart > cell.colEnd) {
                        children.push(...extra);
                        placed = true;
                    }
                    children.push(child);
                });
                if (!placed) {
                    children.push(...extra);
                }
                rows[r] = row.node.type.create(row.node.attrs, children, row.node.marks);
            }
            const tgroup = this.rebuild(grid, grid.colspecs.map((c) => c.node), all, grid.cols);
            this.commit(state, grid, tgroup, { section: section.kind, row: ref.row, col: cell.colStart }, dispatch);
        }
        return true;
    };

    private mergeContent(a: PMNode, b: PMNode): PMNode {
        if (b.content.size === 0) {
            return a;
        }
        if (a.content.size === 0) {
            return a.type === b.type ? a.type.create(a.attrs, b.content, a.marks) : b.type.create(a.attrs, b.content, a.marks);
        }
        if (a.isTextblock && b.isTextblock) {
            return a.type.create(a.attrs, a.content.append(Fragment.from(this.es.schema.text(' '))).append(b.content), a.marks);
        }
        const element = this.es.role(a.type)?.element ?? 'entry';
        const container = this.es.nodeType(element, 'block', 'main')!;
        const textrun = this.es.schema.nodes[SYNTHETIC.textrun];
        const blocks = (n: PMNode): PMNode[] => {
            if (n.isTextblock) {
                return [textrun.create(null, n.content)];
            }
            const out: PMNode[] = [];
            n.forEach((c) => out.push(c));
            return out;
        };
        return container.create(a.attrs, [...blocks(a), ...blocks(b)], a.marks);
    }

    // -- navigation ---------------------------------------------------------------------------

    /** Tab / Shift+Tab: the next or previous cell; Tab in the last cell adds a row. */
    goToCell(direction: 1 | -1): Command {
        return (state, dispatch, view) => {
            const cell = this.cellNode(state);
            if (!cell) {
                return false;
            }
            const table = cell.table;
            const cells: number[] = [];
            table.node.descendants((node, pos) => {
                if (this.is(node, 'topic/entry') || this.is(node, 'topic/stentry')) {
                    cells.push(table.pos + 1 + pos);
                    return false;
                }
                return true;
            });
            const index = cells.indexOf(cell.pos);
            const next = cells[index + direction];
            if (next === undefined) {
                if (direction === 1) {
                    return this.addRow('after')(state, dispatch, view);
                }
                return true; // stay in the first cell
            }
            if (dispatch) {
                dispatch(state.tr.setSelection(Selection.near(state.doc.resolve(next + 1))).scrollIntoView());
            }
            return true;
        };
    }

    private cellNode(state: EditorState): { pos: number; table: { node: PMNode; pos: number } } | undefined {
        const $from = state.selection.$from;
        for (let d = $from.depth; d > 0; d--) {
            const node = $from.node(d);
            if (this.is(node, 'topic/entry') || this.is(node, 'topic/stentry')) {
                for (let t = d - 1; t > 0; t--) {
                    const table = $from.node(t);
                    if (this.is(table, 'topic/table') || this.is(table, 'topic/simpletable')) {
                        return { pos: $from.before(d), table: { node: table, pos: $from.before(t) } };
                    }
                }
            }
        }
        return undefined;
    }

    /** True when the selection is in a table cell (menus). */
    inTable(state: EditorState): boolean {
        return this.cellNode(state) !== undefined;
    }

    // -- column widths ---------------------------------------------------------------------------

    /** The (first) tgroup of the CALS table at `tablePos`, and its position. */
    private firstTgroup(table: PMNode, tablePos: number): { node: PMNode; pos: number } | undefined {
        let found: { node: PMNode; pos: number } | undefined;
        table.forEach((child, offset) => {
            if (!found && this.is(child, 'topic/tgroup')) {
                found = { node: child, pos: tablePos + 1 + offset };
            }
        });
        return found;
    }

    /**
     * The column widths of the table at `tablePos` as written (`@colwidth` of each column's
     * colspec, or the items of a simple table's `@relcolwidth`; undefined: none). Undefined when
     * its widths cannot be set per column (colspecs that do not match the columns).
     */
    columnWidths(state: EditorState, tablePos: number): (string | undefined)[] | undefined {
        const table = state.doc.nodeAt(tablePos);
        if (!table) {
            return undefined;
        }
        if (this.is(table, 'topic/simpletable')) {
            const rows: PMNode[] = [];
            table.forEach((c) => {
                if (this.is(c, 'topic/sthead') || this.is(c, 'topic/strow')) {
                    rows.push(c);
                }
            });
            const items = (this.attr(table, 'relcolwidth') ?? '').trim().split(/\s+/).filter(Boolean);
            return Array.from({ length: this.simpleWidth(rows) }, (_, i) => items[i]);
        }
        const tgroup = this.is(table, 'topic/table') ? this.firstTgroup(table, tablePos) : undefined;
        if (!tgroup) {
            return undefined;
        }
        const grid = this.grid(tgroup.node, tgroup.pos);
        if (grid.colspecs.length === 0) {
            return Array.from({ length: grid.cols }, () => undefined);
        }
        return grid.colspecs.length === grid.cols ? grid.colspecs.map((c) => this.attr(c.node, 'colwidth')) : undefined;
    }

    /** Set the column widths of the table at `tablePos` (colspecs created where there are none). */
    setColumnWidths(tablePos: number, widths: (string | undefined)[]): Command {
        return (state, dispatch) => {
            const current = this.columnWidths(state, tablePos);
            const table = state.doc.nodeAt(tablePos);
            if (!current || !table || current.length !== widths.length) {
                return false;
            }
            if (!dispatch) {
                return true;
            }
            const tr = state.tr;
            if (this.is(table, 'topic/simpletable')) {
                const value = widths.map((w) => w ?? '1*').join(' ');
                tr.setNodeMarkup(tablePos, undefined, { ...table.attrs, xml: withAttribute(table.attrs.xml as AttributePairs, 'relcolwidth', value) });
                dispatch(tr);
                return true;
            }
            const tgroup = this.firstTgroup(table, tablePos)!;
            const grid = this.grid(tgroup.node, tgroup.pos);
            if (grid.colspecs.length === 0) {
                const type = this.es.nodeType('colspec', 'block');
                if (!type) {
                    return false;
                }
                const colspecs = widths.map((w, i) => type.create({ ...FRESH, xml: [['colname', `c${i + 1}`], ['colnum', String(i + 1)], ...(w ? [['colwidth', w]] : [])] }));
                tr.insert(tgroup.pos + 1, colspecs);
            } else {
                let offset = 0;
                const positions: number[] = [];
                tgroup.node.forEach((child) => {
                    if (this.is(child, 'topic/colspec')) {
                        positions.push(tgroup.pos + 1 + offset);
                    }
                    offset += child.nodeSize;
                });
                positions.forEach((pos, i) => {
                    const colspec = tr.doc.nodeAt(pos)!;
                    if (this.attr(colspec, 'colwidth') !== widths[i]) {
                        tr.setNodeMarkup(pos, undefined, { ...colspec.attrs, xml: withAttribute(colspec.attrs.xml as AttributePairs, 'colwidth', widths[i] ?? null) });
                    }
                });
            }
            const group = tr.doc.nodeAt(tgroup.pos)!;
            const shown = this.withWidthsView(group);
            if (shown !== group) {
                tr.setNodeMarkup(tgroup.pos, undefined, shown.attrs);
            }
            dispatch(tr);
            return true;
        };
    }

    // -- simple tables -------------------------------------------------------------------------

    private simpleAt(state: EditorState): { table: PMNode; pos: number; rows: PMNode[]; row: number; col: number; entry: PMNode } | undefined {
        const $from = state.selection.$from;
        for (let d = $from.depth; d > 2; d--) {
            const entry = $from.node(d);
            if (!this.is(entry, 'topic/stentry')) {
                continue;
            }
            const table = $from.node(d - 2);
            if (!this.is(table, 'topic/simpletable')) {
                return undefined;
            }
            const rows: PMNode[] = [];
            table.forEach((child) => {
                if (this.is(child, 'topic/sthead') || this.is(child, 'topic/strow')) {
                    rows.push(child);
                }
            });
            const rowNode = $from.node(d - 1);
            const entries: PMNode[] = [];
            rowNode.forEach((c) => {
                if (this.is(c, 'topic/stentry')) {
                    entries.push(c);
                }
            });
            return { table, pos: $from.before(d - 2), rows, row: rows.indexOf(rowNode), col: entries.indexOf(entry), entry };
        }
        return undefined;
    }

    private simpleCommit(state: EditorState, s: { table: PMNode; pos: number }, table: PMNode, row: number, col: number, dispatch: (tr: Transaction) => void): void {
        const tr = state.tr.replaceWith(s.pos, s.pos + s.table.nodeSize, table);
        const rows: PMNode[] = [];
        table.forEach((child) => {
            if (this.is(child, 'topic/sthead') || this.is(child, 'topic/strow')) {
                rows.push(child);
            }
        });
        const target = rows[Math.max(0, Math.min(row, rows.length - 1))];
        let entry: PMNode | undefined;
        let i = 0;
        target?.forEach((c) => {
            if (this.is(c, 'topic/stentry') && i++ === col) {
                entry = c;
            }
        });
        const pos = entry ? this.positionOf(table, s.pos, entry) : undefined;
        tr.setSelection(Selection.near(tr.doc.resolve(Math.min((pos ?? s.pos) + 1, tr.doc.content.size))));
        dispatch(tr.scrollIntoView());
    }

    private replaceRows(table: PMNode, rows: PMNode[], relcol?: string | null): PMNode {
        const children: PMNode[] = [];
        let done = false;
        table.forEach((child) => {
            if (this.is(child, 'topic/sthead') || this.is(child, 'topic/strow')) {
                if (!done) {
                    done = true;
                    children.push(...rows);
                }
            } else {
                children.push(child);
            }
        });
        const out = table.type.create(table.attrs, children, table.marks);
        return relcol === undefined ? out : this.withAttr(out, 'relcolwidth', relcol);
    }

    private simpleWidth(rows: PMNode[]): number {
        let width = 0;
        for (const row of rows) {
            let n = 0;
            row.forEach((c) => {
                if (this.is(c, 'topic/stentry')) {
                    n++;
                }
            });
            width = Math.max(width, n);
        }
        return width;
    }

    private simpleAddRow(state: EditorState, s: NonNullable<ReturnType<TableCommands['simpleAt']>>, where: 'before' | 'after', dispatch?: (tr: Transaction) => void): boolean {
        const isHead = this.is(s.rows[s.row], 'topic/sthead');
        const strow = this.es.nodeType('strow', 'block');
        if (!strow || (isHead && where === 'before')) {
            return false; // nothing goes above the header row
        }
        if (dispatch) {
            const width = this.simpleWidth(s.rows);
            const type = isHead ? strow : s.rows[s.row].type;
            const row = type.create(FRESH, Array.from({ length: width }, () => this.emptyCell(s.entry, 'stentry')));
            const rows = [...s.rows];
            const k = where === 'before' ? s.row : s.row + 1;
            rows.splice(k, 0, row);
            this.simpleCommit(state, s, this.replaceRows(s.table, rows), k, 0, dispatch);
        }
        return true;
    }

    private simpleDeleteRow(state: EditorState, s: NonNullable<ReturnType<TableCommands['simpleAt']>>, dispatch?: (tr: Transaction) => void): boolean {
        const bodyRows = s.rows.filter((r) => this.is(r, 'topic/strow'));
        if (this.is(s.rows[s.row], 'topic/strow') && bodyRows.length === 1) {
            return false; // a simple table needs a row
        }
        if (dispatch) {
            const rows = s.rows.filter((_, i) => i !== s.row);
            this.simpleCommit(state, s, this.replaceRows(s.table, rows), Math.min(s.row, rows.length - 1), s.col, dispatch);
        }
        return true;
    }

    private simpleToggleHeader(state: EditorState, s: NonNullable<ReturnType<TableCommands['simpleAt']>>, dispatch?: (tr: Transaction) => void): boolean {
        const sthead = this.es.nodeType('sthead', 'block');
        const strow = this.es.nodeType('strow', 'block');
        if (!sthead || !strow) {
            return false;
        }
        const first = s.rows[0];
        const hasHead = this.is(first, 'topic/sthead');
        if (!hasHead && s.rows.length < 2) {
            return false;
        }
        if (dispatch) {
            const rows = [...s.rows];
            rows[0] = (hasHead ? strow : sthead).create(first.attrs, first.content, first.marks);
            this.simpleCommit(state, s, this.replaceRows(s.table, rows), s.row, s.col, dispatch);
        }
        return true;
    }

    private relcol(table: PMNode, change: (widths: string[]) => string[]): string | null | undefined {
        const value = this.attr(table, 'relcolwidth');
        if (value === undefined) {
            return undefined;
        }
        const widths = change(value.trim().split(/\s+/).filter(Boolean));
        return widths.length > 0 ? widths.join(' ') : null;
    }

    private simpleAddColumn(state: EditorState, s: NonNullable<ReturnType<TableCommands['simpleAt']>>, where: 'before' | 'after', dispatch?: (tr: Transaction) => void): boolean {
        if (dispatch) {
            const k = where === 'before' ? s.col : s.col + 1;
            const rows = s.rows.map((row) => {
                const children: PMNode[] = [];
                let i = 0;
                let inserted = false;
                row.forEach((c) => {
                    if (this.is(c, 'topic/stentry')) {
                        if (i === k) {
                            children.push(this.emptyCell(c, 'stentry'));
                            inserted = true;
                        }
                        i++;
                    }
                    children.push(c);
                });
                if (!inserted) {
                    children.push(this.emptyCell(s.entry, 'stentry'));
                }
                return row.type.create(row.attrs, children, row.marks);
            });
            const relcol = this.relcol(s.table, (w) => {
                const out = [...w];
                out.splice(Math.min(k, out.length), 0, '1*');
                return out;
            });
            this.simpleCommit(state, s, this.replaceRows(s.table, rows, relcol), s.row, k, dispatch);
        }
        return true;
    }

    private simpleDeleteColumn(state: EditorState, s: NonNullable<ReturnType<TableCommands['simpleAt']>>, dispatch?: (tr: Transaction) => void): boolean {
        if (this.simpleWidth(s.rows) < 2) {
            return false;
        }
        if (dispatch) {
            const rows = s.rows.map((row) => {
                const children: PMNode[] = [];
                let i = 0;
                row.forEach((c) => {
                    if (this.is(c, 'topic/stentry') && i++ === s.col) {
                        return;
                    }
                    children.push(c);
                });
                return row.type.create(row.attrs, children, row.marks);
            });
            const relcol = this.relcol(s.table, (w) => w.filter((_, i) => i !== s.col));
            this.simpleCommit(state, s, this.replaceRows(s.table, rows, relcol), s.row, Math.max(0, s.col - 1), dispatch);
        }
        return true;
    }
}

/** A colspec name not in `used`, following the naming pattern of `existing` (c1, col1, COLSPEC0…). */
function freshName(used: Set<string>, num: number, existing: (string | undefined)[] = []): string {
    const sample = existing.find((n) => n && /^\D*\d+$/.test(n));
    const prefix = sample ? /^(\D*)/.exec(sample)![1] : 'c';
    let n = num;
    let name = `${prefix}${n}`;
    while (used.has(name)) {
        n++;
        name = `${prefix}${n}`;
    }
    used.add(name);
    return name;
}

function firstFree(covered: Set<number>, cols: number): number {
    for (let c = 1; c <= cols; c++) {
        if (!covered.has(c)) {
            return c;
        }
    }
    return 1;
}

/** Node type helper for callers that need the textblock type of cells. */
export function cellType(es: EditorSchema, element: string): NodeType | undefined {
    return es.nodeType(element, 'block', 'text') ?? es.nodeType(element, 'block');
}
