/**
 * Dragging table column borders on the visual editor's page (spec §13.5).
 *
 * Near a border between two columns (±4px) the cursor becomes a resize cursor; dragging shows
 * a guide line with the two new widths, and releasing writes them (`@colwidth` of the colspecs,
 * a simple table's `@relcolwidth`) as one change — undone with Ctrl+Z on the page. Escape
 * cancels. The widths are computed by src/shared/editor/columnWidths.ts.
 *
 * Borders are measured on the page (a row with one cell per column), so they are where the
 * author sees them, whatever the table's widths are.
 */

import type { Node as PMNode } from 'prosemirror-model';
import { Plugin } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { columnPixels, parseColumnWidth, resizedColumnWidths } from '../../src/shared/editor/columnWidths';
import type { EditorSchema } from '../../src/shared/editor/schema';
import type { TableCommands } from '../../src/shared/editor/tables';

const GRAB = 4;
const MIN_COLUMN = 24;

export interface ColumnResizeContext {
    es: EditorSchema;
    tables: TableCommands;
    editable(): boolean;
}

/** A border under the mouse: the table, its column widths as written, and the border's place. */
interface Border {
    tablePos: number;
    table: HTMLElement;
    raws: (string | undefined)[];
    /** x of each column's left edge, then the table's right edge (n + 1 values). */
    edges: number[];
    /** The border on the right of column `left`. */
    left: number;
}

function isTable(es: EditorSchema, node: PMNode | null | undefined): boolean {
    const element = node ? es.role(node.type)?.element : undefined;
    const tokens = element ? es.facts(element)?.tokens ?? [] : [];
    return tokens.includes('topic/table') || tokens.includes('topic/simpletable');
}

/** The table node of a `<table>` element of the page, and its position. */
function tableNode(view: EditorView, es: EditorSchema, el: HTMLElement): number | undefined {
    let pos: number;
    try {
        pos = view.posAtDOM(el, 0);
    } catch {
        return undefined;
    }
    const $pos = view.state.doc.resolve(pos);
    if (isTable(es, $pos.nodeAfter)) {
        return pos;
    }
    for (let d = $pos.depth; d > 0; d--) {
        if (isTable(es, $pos.node(d))) {
            return $pos.before(d);
        }
    }
    return undefined;
}

/** Column edges as shown: from a row with one cell per column, else from the widths. */
function measureEdges(table: HTMLElement, raws: (string | undefined)[]): number[] {
    const rect = table.getBoundingClientRect();
    const n = raws.length;
    for (const row of table.querySelectorAll<HTMLTableRowElement>('tr')) {
        if (row.closest('table') !== table) {
            continue; // a nested table's row
        }
        const cells = [...row.children].filter((c): c is HTMLElement => c instanceof HTMLElement && (c.tagName === 'TD' || c.tagName === 'TH'));
        if (cells.length === n && cells.every((c) => (c as HTMLTableCellElement).colSpan <= 1)) {
            const edges = cells.map((c) => c.getBoundingClientRect().left);
            edges.push(cells[n - 1].getBoundingClientRect().right);
            return edges;
        }
    }
    const px = columnPixels(raws.map(parseColumnWidth), rect.width);
    const edges = [rect.left];
    px.forEach((w) => edges.push(edges[edges.length - 1] + w));
    return edges;
}

export function columnResizing(ctx: () => ColumnResizeContext | undefined): Plugin {
    let hover: Border | undefined;
    let dragging = false;

    const setHover = (view: EditorView, border: Border | undefined): void => {
        hover = border;
        view.dom.classList.toggle('dc-col-resize', border !== undefined);
    };

    const borderAt = (view: EditorView, event: MouseEvent): Border | undefined => {
        const c = ctx();
        const table = (event.target as Element | null)?.closest?.('table.table, table.simpletable') as HTMLElement | null;
        if (!c || !c.editable() || !table || !view.dom.contains(table)) {
            return undefined;
        }
        const tablePos = tableNode(view, c.es, table);
        const raws = tablePos === undefined ? undefined : c.tables.columnWidths(view.state, tablePos);
        if (tablePos === undefined || !raws || raws.length < 2) {
            return undefined;
        }
        const rect = table.getBoundingClientRect();
        if (event.clientY < rect.top || event.clientY > rect.bottom) {
            return undefined;
        }
        const edges = measureEdges(table, raws);
        for (let k = 1; k < raws.length; k++) {
            if (Math.abs(event.clientX - edges[k]) <= GRAB) {
                return { tablePos, table, raws, edges, left: k - 1 };
            }
        }
        return undefined;
    };

    const drag = (view: EditorView, start: MouseEvent, border: Border): void => {
        dragging = true;
        const rect = border.table.getBoundingClientRect();
        const x0 = border.edges[border.left + 1];
        const min = border.edges[border.left] + MIN_COLUMN;
        const max = border.edges[border.left + 2] - MIN_COLUMN;
        // Widths as shown: a table without widths of its own is laid out by the browser.
        const shown = border.edges.slice(1).map((e, i) => e - border.edges[i]);
        const raws = border.raws.every((r) => r === undefined) ? shown.map((w) => `${w}*`) : border.raws;
        const guide = Object.assign(document.createElement('div'), { className: 'dc-col-guide' });
        const label = Object.assign(document.createElement('div'), { className: 'dc-col-guide-label' });
        guide.style.top = `${rect.top}px`;
        guide.style.height = `${rect.height}px`;
        document.body.append(guide, label);
        let delta = 0;
        const place = (clientX: number): void => {
            const x = Math.min(Math.max(clientX, min), max);
            delta = x - x0;
            guide.style.left = `${x - 1}px`;
            const next = resizedColumnWidths(raws, border.left, delta, rect.width, MIN_COLUMN);
            label.textContent = next ? `${next[border.left] ?? ''} | ${next[border.left + 1] ?? ''}` : '';
            label.style.left = `${x + 6}px`;
            label.style.top = `${Math.max(4, rect.top - 22)}px`;
        };
        place(start.clientX);
        const end = (commit: boolean): void => {
            window.removeEventListener('mousemove', move, true);
            window.removeEventListener('mouseup', up, true);
            window.removeEventListener('keydown', key, true);
            guide.remove();
            label.remove();
            dragging = false;
            setHover(view, undefined);
            const c = ctx();
            const next = commit && c ? resizedColumnWidths(raws, border.left, delta, rect.width, MIN_COLUMN) : undefined;
            if (c && next) {
                c.tables.setColumnWidths(border.tablePos, next)(view.state, view.dispatch);
            }
        };
        const move = (e: MouseEvent): void => {
            e.preventDefault();
            place(e.clientX);
        };
        const up = (e: MouseEvent): void => {
            e.preventDefault();
            place(e.clientX);
            end(true);
        };
        const key = (e: KeyboardEvent): void => {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                end(false);
            }
        };
        window.addEventListener('mousemove', move, true);
        window.addEventListener('mouseup', up, true);
        window.addEventListener('keydown', key, true);
    };

    return new Plugin({
        props: {
            handleDOMEvents: {
                mousemove: (view, event) => {
                    if (!dragging) {
                        setHover(view, borderAt(view, event));
                    }
                    return false;
                },
                mouseleave: (view) => {
                    if (!dragging) {
                        setHover(view, undefined);
                    }
                    return false;
                },
                mousedown: (view, event) => {
                    const border = event.button === 0 ? hover ?? borderAt(view, event) : undefined;
                    if (!border || dragging) {
                        return false;
                    }
                    event.preventDefault();
                    drag(view, event, border);
                    return true;
                },
            },
        },
    });
}
