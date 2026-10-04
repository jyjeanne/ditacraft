/**
 * Maps on the visual editor's page (spec §13.8). Each reference of the map is a row
 * (src/shared/editor/maps.ts draws it); the node view here keeps its line up to date — the label
 * follows the row's navtitle and what the host resolved its target to — and makes the line act
 * as a row: a click selects the row (the Properties view shows its attributes), its arrow folds
 * it, a double click or Ctrl+click opens its target, dragging it moves it (a line shows where it
 * goes: before, after or into a row, where the DTD allows). With a row selected, the arrow keys
 * move between rows and fold them (Left/Right), Enter opens the target, Tab / Shift+Tab move the
 * row one level in or out, F2 edits its label on the line, Ctrl+K changes its target; typing
 * does nothing (the row's text is its metadata, shown with Show markup).
 *
 * Relationship tables (M3): a click on a cell's empty space (or a column header's type) selects
 * the cell; with a cell selected, the arrow keys and Tab move between cells (Tab past the last one
 * adds a row), Enter adds a reference into it; rows are dragged into cells.
 *
 * Folds are page state: node decorations that move with their rows while editing, kept by
 * their place in the tree when the page is rebuilt from a change made elsewhere.
 */

import { DOMSerializer, type Node as PMNode } from 'prosemirror-model';
import { chainCommands } from 'prosemirror-commands';
import { keydownHandler } from 'prosemirror-keymap';
import { type Command, type EditorState, NodeSelection, Plugin, PluginKey, TextSelection } from 'prosemirror-state';
import { Decoration, DecorationSet, type EditorView, type NodeView, type NodeViewConstructor } from 'prosemirror-view';
import {
    hiddenMetadataSelection, isMapDocument, isMapRow, isMapRowElement, mapRowDom, mapRowInfo, mapRows, mapRowTarget, rowAtPath, rowPath, selectedRow,
    type MapRowTarget,
} from '../../src/shared/editor/maps';
import type { DropPlace, MapCommands } from '../../src/shared/editor/mapCommands';
import type { RelTableCommands } from '../../src/shared/editor/relTables';
import { isReuseNode } from '../../src/shared/editor/reused';
import type { EditorSchema } from '../../src/shared/editor/schema';
import type { Labels } from '../../src/shared/render/labels';
import { resolvedItemOf, ReusedView } from './reusedView';

/** What the rows need from the page. */
export interface MapPage {
    es: EditorSchema;
    labels: Labels;
    maps: MapCommands;
    rel: RelTableCommands;
    /** Open a row's target (the row at `pos`: the topic is then shown in that place of the map). */
    openTarget(target: MapRowTarget, pos?: number): void;
    /** Add a reference (the host's picker) after the selected row or into the selected cell. */
    addReference(): void;
    /** Change the selected row's target (the host's picker). */
    changeTarget(): void;
    /** Whether hidden markup (a reference's metadata) is shown. */
    showMarkup(): boolean;
    /** Whether the page may be edited now. */
    editable(): boolean;
}

// ---------------------------------------------------------------------------------------------
// Folds

const foldKey = new PluginKey<DecorationSet>('dcFolds');

function foldDecoration(pos: number, node: PMNode): Decoration {
    return Decoration.node(pos, pos + node.nodeSize, { class: 'dc-folded' }, { fold: true });
}

export function isFolded(state: EditorState, pos: number): boolean {
    return (foldKey.getState(state)?.find(pos, pos + 1) ?? []).some((d) => d.from === pos && (d.spec as { fold?: boolean }).fold === true);
}

/** Fold (`fold` true), unfold (false) or toggle (undefined) the row at `pos`. */
export function setFold(view: EditorView, pos: number, fold?: boolean): void {
    const node = view.state.doc.nodeAt(pos);
    const set = foldKey.getState(view.state) ?? DecorationSet.empty;
    if (!node) {
        return;
    }
    const folded = isFolded(view.state, pos);
    const want = fold ?? !folded;
    if (want === folded) {
        return;
    }
    const next = want
        ? set.add(view.state.doc, [foldDecoration(pos, node)])
        : set.remove(set.find(pos, pos + 1).filter((d) => d.from === pos && (d.spec as { fold?: boolean }).fold));
    let tr = view.state.tr.setMeta(foldKey, next);
    // A selection inside what folds goes to the row.
    const sel = view.state.selection;
    if (want && sel.from > pos && sel.to < pos + node.nodeSize && !(sel instanceof NodeSelection && sel.from === pos)) {
        tr = tr.setSelection(NodeSelection.create(view.state.doc, pos));
    }
    view.dispatch(tr);
}

/** Fold every row that holds rows, or unfold them all. */
export function setAllFolds(view: EditorView, es: EditorSchema, fold: boolean): void {
    const doc = view.state.doc;
    const decorations = fold
        ? mapRows(doc, es).filter(({ node }) => mapRowInfo(node, es).parent).map(({ pos, node }) => foldDecoration(pos, node))
        : [];
    let tr = view.state.tr.setMeta(foldKey, DecorationSet.create(doc, decorations));
    if (fold) {
        // The selection goes to the top-level row that holds it.
        const sel = view.state.selection;
        const top = mapRows(doc, es).find(({ pos, node }) => doc.resolve(pos).depth === 1 && sel.from > pos && sel.to < pos + node.nodeSize);
        if (top) {
            tr = tr.setSelection(NodeSelection.create(doc, top.pos));
        }
    }
    view.dispatch(tr);
}

/** The folded rows, by place in the tree (to fold them again after a rebuild). */
export function foldPaths(state: EditorState): string[] {
    return (foldKey.getState(state)?.find() ?? []).filter((d) => (d.spec as { fold?: boolean }).fold).map((d) => rowPath(state.doc, d.from));
}

export function restoreFolds(view: EditorView, paths: readonly string[], es: EditorSchema): void {
    const doc = view.state.doc;
    const decorations: Decoration[] = [];
    for (const path of paths) {
        const pos = rowAtPath(doc, path, es);
        const node = pos === undefined ? null : doc.nodeAt(pos);
        if (pos !== undefined && node && mapRowInfo(node, es).parent) {
            decorations.push(foldDecoration(pos, node));
        }
    }
    if (decorations.length > 0) {
        view.dispatch(view.state.tr.setMeta(foldKey, DecorationSet.create(doc, decorations)));
    }
}

/**
 * Run a command that moves the selected row (Tab, Shift+Tab, a drop): a folded row stays folded,
 * and the rows it went into are unfolded so that it is seen where it went.
 */
export function moveRow(view: EditorView, es: EditorSchema, command: Command): boolean {
    const before = selectedRow(view.state, es);
    const folded = before !== undefined && isFolded(view.state, before.pos);
    if (!command(view.state, view.dispatch, view)) {
        return false;
    }
    const after = selectedRow(view.state, es);
    if (!after) {
        return true;
    }
    const $pos = view.state.doc.resolve(after.pos);
    for (let d = $pos.depth; d > 0; d--) {
        if (isMapRow($pos.node(d), es) && isFolded(view.state, $pos.before(d))) {
            setFold(view, $pos.before(d), false);
        }
    }
    if (folded) {
        setFold(view, after.pos, true);
    }
    return true;
}

// ---------------------------------------------------------------------------------------------
// Selection and keys

/** The rows a reader sees (not inside a folded row). */
function visibleRows(state: EditorState, es: EditorSchema): { pos: number; node: PMNode }[] {
    return mapRows(state.doc, es, (pos) => isFolded(state, pos)).filter((r) => !r.hidden);
}

function selectRow(pos: number): Command {
    return (state, dispatch) => {
        if (dispatch) {
            dispatch(state.tr.setSelection(NodeSelection.create(state.doc, pos)).scrollIntoView());
        }
        return true;
    };
}

/** Keys on a selected row, and what the page does with typing in a map. */
export function mapPlugin(page: MapPage): Plugin[] {
    const { es } = page;
    const move = (direction: -1 | 1): Command => (state, dispatch) => {
        const row = selectedRow(state, es);
        if (!row) {
            return false;
        }
        const rows = visibleRows(state, es);
        const next = rows[rows.findIndex((r) => r.pos === row.pos) + direction];
        return next ? selectRow(next.pos)(state, dispatch) : true;
    };
    const keys: Record<string, Command> = {
        ArrowDown: move(1),
        ArrowUp: move(-1),
        ArrowRight: (state, dispatch, view) => {
            const row = selectedRow(state, es);
            if (!row || !view) {
                return false;
            }
            if (mapRowInfo(row.node, es).parent) {
                if (isFolded(state, row.pos)) {
                    setFold(view, row.pos, false);
                } else {
                    let child: number | undefined;
                    row.node.forEach((c, offset) => {
                        if (child === undefined && isMapRow(c, es)) {
                            child = row.pos + 1 + offset;
                        }
                    });
                    if (child !== undefined) {
                        selectRow(child)(state, dispatch);
                    }
                }
            }
            return true;
        },
        ArrowLeft: (state, dispatch, view) => {
            const row = selectedRow(state, es);
            if (!row || !view) {
                return false;
            }
            if (mapRowInfo(row.node, es).parent && !isFolded(state, row.pos)) {
                setFold(view, row.pos, true);
                return true;
            }
            const $pos = state.doc.resolve(row.pos);
            for (let d = $pos.depth; d > 0; d--) {
                if (isMapRow($pos.node(d), es)) {
                    return selectRow($pos.before(d))(state, dispatch);
                }
            }
            return true;
        },
        Enter: (state) => {
            const row = selectedRow(state, es);
            if (!row) {
                return false;
            }
            const target = mapRowTarget(row.node, es);
            if (target) {
                page.openTarget(target, row.pos);
            }
            return true;
        },
        // On a row, Tab is the row's (never the focus leaving the page).
        Tab: (state, _dispatch, view) => (selectedRow(state, es) !== undefined && view !== undefined
            ? (page.editable() && moveRow(view, es, page.maps.indentRow), true) : false),
        'Shift-Tab': (state, _dispatch, view) => (selectedRow(state, es) !== undefined && view !== undefined
            ? (page.editable() && moveRow(view, es, page.maps.outdentRow), true) : false),
        F2: (state, _dispatch, view) => {
            const row = selectedRow(state, es);
            if (!row || !view) {
                return false;
            }
            editRowLabel(view, row.pos);
            return true;
        },
        'Mod-k': (state) => {
            const row = selectedRow(state, es);
            if (!row) {
                return false;
            }
            if (page.editable() && page.maps.canTarget(row.node)) {
                page.changeTarget();
            }
            return true;
        },
    };
    // With a cell selected, the keys are the table's.
    const rel = page.rel;
    const onCell = (command: (editable: boolean) => Command): Command => (state, dispatch, view) => {
        if (!rel.selectedCell(state)) {
            return false;
        }
        command(page.editable())(state, dispatch, view);
        return true;
    };
    const cellKeys: Record<string, Command> = {
        ArrowDown: onCell(() => rel.goToCell('down')),
        ArrowUp: onCell(() => rel.goToCell('up')),
        ArrowLeft: onCell(() => rel.goToCell('left')),
        ArrowRight: onCell(() => rel.goToCell('right')),
        Tab: onCell((editable) => rel.goToCell('next', editable)),
        'Shift-Tab': onCell(() => rel.goToCell('previous')),
        Enter: onCell((editable) => () => (editable && page.addReference(), true)),
        // A cell is not deleted by a key (its row or column is): nothing.
        Backspace: onCell(() => () => true),
        Delete: onCell(() => () => true),
    };
    for (const [key, command] of Object.entries(cellKeys)) {
        keys[key] = keys[key] ? chainCommands(command, keys[key]) : command;
    }
    const handleKey = keydownHandler(keys);
    return [
        new Plugin({
            key: foldKey,
            state: {
                init: () => DecorationSet.empty,
                apply: (tr, set) => (tr.getMeta(foldKey) as DecorationSet | undefined) ?? set.map(tr.mapping, tr.doc),
            },
            props: {
                decorations: (state) => foldKey.getState(state),
                handleKeyDown: (view, event) => handleKey(view, event),
                // A map holds no text outside its titles and metadata: typing on a row (or between
                // rows) does nothing.
                handleTextInput: (view) => isMapDocument(view.state.doc, es) && !(view.state.selection instanceof TextSelection),
            },
            appendTransaction: (trs, _old, state) => {
                if (!trs.some((t) => t.selectionSet || t.docChanged)) {
                    return null;
                }
                const fix = page.showMarkup() ? undefined : hiddenMetadataSelection(state, es);
                return fix ? state.tr.setSelection(fix) : null;
            },
        }),
    ];
}

// ---------------------------------------------------------------------------------------------
// Rows

/** Where each row's DOM is in the document (drops, and integration tests find rows by what they show). */
const rowPositions = new WeakMap<HTMLElement, () => number | undefined>();
/** Where each relationship table cell's DOM is in the document (drops into cells). */
const cellPositions = new WeakMap<HTMLElement, () => number | undefined>();
/** The view of each row's DOM (F2 finds the line to edit). */
const rowViews = new WeakMap<HTMLElement, MapRowView>();

/** Edit the label of the row at `pos` on its line (F2, Edit label). */
export function editRowLabel(view: EditorView, pos: number): void {
    const dom = view.nodeDOM(pos);
    if (dom instanceof HTMLElement) {
        rowViews.get(dom)?.editLabel();
    }
}

/** A row: its line (drawn from the row and what its target resolved to) and the rows it holds. */
class MapRowView implements NodeView {
    dom: HTMLElement;
    contentDOM?: HTMLElement;
    private head: HTMLElement;
    private shown = '';
    private own: string[] = [];
    /** The label being edited on the line: the line is not redrawn meanwhile. */
    private editing = false;

    constructor(private node: PMNode, private readonly view: EditorView, private readonly getPos: () => number | undefined,
        private decorations: readonly Decoration[], private readonly page: MapPage) {
        const spec = this.spec(node, decorations);
        const rendered = DOMSerializer.renderSpec(document, spec.dom);
        this.dom = rendered.dom as HTMLElement;
        this.contentDOM = (rendered.contentDOM as HTMLElement | undefined) ?? undefined;
        this.head = this.dom.firstElementChild as HTMLElement;
        this.shown = spec.key;
        this.own = this.classes(this.dom.className, spec.state);
        this.dom.className = this.own.join(' ');
        rowPositions.set(this.dom, getPos);
        rowViews.set(this.dom, this);
        this.listen();
    }

    private spec(node: PMNode, decorations: readonly Decoration[]) {
        const element = this.page.es.role(node.type)?.element ?? '';
        const fact = this.page.es.facts(element)!;
        const item = resolvedItemOf(decorations);
        const resolution = item ? { text: item.text, error: item.error, from: item.from } : undefined;
        const dom = mapRowDom(fact, node, this.page.es, this.page.labels, resolution);
        const state = item ? (item.error !== undefined ? 'dc-unresolved' : 'dc-resolved') : '';
        return { dom, state, key: JSON.stringify([dom, state]) };
    }

    private classes(cls: string, state: string): string[] {
        return [...cls.split(/\s+/), state].filter(Boolean);
    }

    private listen(): void {
        // The line is the row's handle: ProseMirror does not handle its events (stopEvent).
        this.head.addEventListener('mousedown', (e) => {
            if (e.button !== 0 || (e.target as Element).closest('.dc-maprow-input')) {
                return; // the label being edited: its own caret
            }
            e.preventDefault(); // no text selection, no focus change: the row is selected instead
            const pos = this.getPos();
            if (pos === undefined) {
                return;
            }
            if ((e.target as Element).closest('.dc-maprow-twisty') && this.dom.classList.contains('dc-maprow-parent')) {
                setFold(this.view, pos);
                return;
            }
            if (!(this.view.state.selection instanceof NodeSelection && this.view.state.selection.from === pos)) {
                this.view.dispatch(this.view.state.tr.setSelection(NodeSelection.create(this.view.state.doc, pos)));
            }
            this.view.focus();
            if (e.detail === 2 || e.ctrlKey || e.metaKey) {
                const target = mapRowTarget(this.node, this.page.es);
                if (target) {
                    this.page.openTarget(target, pos);
                }
            } else if (e.detail === 1 && this.page.editable()) {
                new RowDrag(this.view, this.page, pos, e, this.head.querySelector('.dc-maprow-label')?.textContent || this.dom.dataset.dita || '');
            }
        });
        // Right-click: the row is what the menu acts on (the page opens the menu).
        this.head.addEventListener('contextmenu', () => {
            const pos = this.getPos();
            if (pos !== undefined && !(this.view.state.selection instanceof NodeSelection && this.view.state.selection.from === pos)) {
                this.view.dispatch(this.view.state.tr.setSelection(NodeSelection.create(this.view.state.doc, pos)));
            }
        });
        this.head.addEventListener('dragstart', (e) => e.preventDefault()); // rows are dragged by RowDrag
    }

    /** Edit the label on the line: Enter or leaving the field writes it, Escape cancels. */
    editLabel(): void {
        const pos = this.getPos();
        const shown = this.head.querySelector('.dc-maprow-label');
        if (this.editing || !this.contentDOM || pos === undefined || !shown || !this.page.editable()) {
            return;
        }
        const item = resolvedItemOf(this.decorations);
        const info = mapRowInfo(this.node, this.page.es, item ? { text: item.text, error: item.error } : undefined);
        // The label shown, unless it is the target as written (the field then starts empty).
        const initial = info.labelFrom === 'target' || info.labelFrom === 'none' ? '' : info.label;
        const ui = this.page.labels.ui;
        const input = Object.assign(document.createElement('input'), {
            type: 'text', className: 'dc-maprow-input', value: initial, placeholder: ui.labelHint ?? '', spellcheck: true,
        });
        input.setAttribute('aria-label', ui.editLabel ?? 'Edit label');
        this.editing = true;
        shown.replaceWith(input);
        input.focus();
        input.select();
        const finish = (commit: boolean): void => {
            if (!this.editing) {
                return;
            }
            this.editing = false;
            const value = input.value;
            this.shown = '';
            this.redraw();
            const at = this.getPos();
            if (commit && value.trim() !== initial.trim() && at !== undefined) {
                this.page.maps.setLabel(at, value)(this.view.state, this.view.dispatch);
            }
            this.view.focus();
        };
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                finish(true);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                finish(false);
            }
            e.stopPropagation(); // the field's keys (undo included) are the field's, not the page's or VS Code's
        });
        input.addEventListener('blur', () => finish(true));
    }

    private redraw(): void {
        this.update(this.node, this.decorations);
    }

    update(node: PMNode, decorations: readonly Decoration[]): boolean {
        if (node.type !== this.node.type) {
            return false;
        }
        this.node = node;
        this.decorations = decorations;
        if (this.editing) {
            return true; // the line is redrawn when the label is written or the edit cancelled
        }
        const spec = this.spec(node, decorations);
        if (spec.key === this.shown) {
            return true;
        }
        this.shown = spec.key;
        const rendered = DOMSerializer.renderSpec(document, spec.dom).dom as HTMLElement;
        const head = rendered.firstElementChild as HTMLElement;
        this.head.replaceChildren(...Array.from(head.childNodes));
        this.head.title = head.title;
        // The row's own classes change; those of decorations (fold, problem, selection) stay.
        const own = this.classes(rendered.className, spec.state);
        for (const c of this.own) {
            if (!own.includes(c)) {
                this.dom.classList.remove(c);
            }
        }
        for (const c of own) {
            this.dom.classList.add(c);
        }
        this.own = own;
        for (const name of ['data-label-from', 'lang']) {
            const value = rendered.getAttribute(name);
            if (value === null) {
                this.dom.removeAttribute(name);
            } else {
                this.dom.setAttribute(name, value);
            }
        }
        return true;
    }

    stopEvent(event: Event): boolean {
        return event.target instanceof Node && this.head.contains(event.target);
    }

    destroy(): void {
        this.editing = false;
    }

    ignoreMutation(mutation: MutationRecord | { type: 'selection'; target: Node }): boolean {
        return !this.contentDOM || this.head.contains(mutation.target) || (mutation.type === 'attributes' && mutation.target === this.dom);
    }
}

// ---------------------------------------------------------------------------------------------
// Dragging rows

/** Where a row dropped on the row at `target` goes, `place` first, by the DTD: its position, or undefined. */
export function dropTarget(view: EditorView, page: MapPage, from: number, target: number, places: DropPlace[]): { place: DropPlace; to: number } | undefined {
    const doc = view.state.doc;
    const node = doc.nodeAt(target);
    for (const place of places) {
        // Below the line of a row showing its rows: before its first row.
        if (place === 'after' && node && mapRowInfo(node, page.es).parent && !isFolded(view.state, target)) {
            let first: number | undefined;
            node.forEach((child, offset) => {
                if (first === undefined && isMapRow(child, page.es)) {
                    first = target + 1 + offset;
                }
            });
            const to = first === undefined ? undefined : page.maps.dropPosition(doc, from, first, 'before');
            if (to !== undefined) {
                return { place: 'inside', to };
            }
            continue;
        }
        const to = page.maps.dropPosition(doc, from, target, place);
        if (to !== undefined) {
            return { place, to };
        }
    }
    return undefined;
}

/** Drop the row at `from` on the row at `target` (the end of a drag): moved, selected, seen. */
export function dropRow(view: EditorView, page: MapPage, from: number, target: number, places: DropPlace[]): boolean {
    const drop = dropTarget(view, page, from, target, places);
    if (!drop) {
        return false;
    }
    view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, from)));
    return moveRow(view, page.es, page.maps.moveRow(from, drop.to));
}

/**
 * A row being dragged by its line: past a few pixels, a label follows the pointer and a line shows
 * where the row would go (before or after the row under the pointer, or into it), when the DTD
 * allows it there. Release to move it, Escape to cancel.
 */
class RowDrag {
    private started = false;
    private ghost: HTMLElement | undefined;
    private marker: HTMLElement | undefined;
    private over: HTMLElement | undefined;
    private drop: { target: number; places: DropPlace[] } | undefined;
    private readonly x0: number;
    private readonly y0: number;

    constructor(private readonly view: EditorView, private readonly page: MapPage, private readonly from: number, start: MouseEvent, private readonly label: string) {
        this.x0 = start.clientX;
        this.y0 = start.clientY;
        window.addEventListener('mousemove', this.move, true);
        window.addEventListener('mouseup', this.up, true);
        window.addEventListener('keydown', this.key, true);
    }

    private readonly move = (e: MouseEvent): void => {
        if (!this.started) {
            if (Math.hypot(e.clientX - this.x0, e.clientY - this.y0) < 5) {
                return;
            }
            this.started = true;
            document.body.classList.add('dc-row-dragging');
            this.ghost = Object.assign(document.createElement('div'), { className: 'dc-drag-ghost', textContent: this.label });
            this.marker = Object.assign(document.createElement('div'), { className: 'dc-drop-line' });
            document.body.append(this.ghost, this.marker);
        }
        this.ghost!.style.left = `${e.clientX + 12}px`;
        this.ghost!.style.top = `${e.clientY + 8}px`;
        this.find(e.clientX, e.clientY);
        // Near the top or bottom of the window: scroll.
        if (e.clientY < 70) {
            window.scrollBy(0, -18);
        } else if (e.clientY > window.innerHeight - 50) {
            window.scrollBy(0, 18);
        }
    };

    /** The row under the pointer and where on its line: the drop it would make. */
    private find(x: number, y: number): void {
        const under = document.elementFromPoint(x, y) as Element | null;
        const head = under?.closest('.dc-maprow-head') as HTMLElement | null;
        const target = head?.parentElement ? rowPositions.get(head.parentElement)?.() : undefined;
        this.over?.classList.remove('dc-drop-into');
        this.over = undefined;
        this.drop = undefined;
        this.marker!.hidden = true;
        document.body.classList.add('dc-drop-none');
        if (!head || target === undefined) {
            // Over a relationship table's cell (not one of its rows): into the cell, at its end.
            const cell = under?.closest('td.relcell, th.relcolspec') as HTMLElement | null;
            const at = cell ? cellPositions.get(cell)?.() : undefined;
            if (cell && at !== undefined && this.page.maps.dropPosition(this.view.state.doc, this.from, at, 'inside') !== undefined) {
                document.body.classList.remove('dc-drop-none');
                this.drop = { target: at, places: ['inside'] };
                cell.classList.add('dc-drop-into');
                this.over = cell;
            }
            return;
        }
        const box = head.getBoundingClientRect();
        const r = (y - box.top) / box.height;
        const places: DropPlace[] = r < 0.3 ? ['before', 'inside'] : r > 0.7 ? ['after', 'inside'] : ['inside', r < 0.5 ? 'before' : 'after'];
        const drop = dropTarget(this.view, this.page, this.from, target, places);
        if (!drop) {
            return;
        }
        document.body.classList.remove('dc-drop-none');
        this.drop = { target, places: [drop.place === 'inside' && places[0] === 'after' ? 'after' : drop.place] };
        if (drop.place === 'inside' && places[0] !== 'after') {
            head.classList.add('dc-drop-into');
            this.over = head;
            return;
        }
        // A line above or below the line, or (into a row showing its rows) at the start of its rows.
        const below = drop.place === 'after' || drop.place === 'inside';
        this.marker!.hidden = false;
        this.marker!.style.left = `${box.left + (drop.place === 'inside' ? 24 : 0)}px`;
        this.marker!.style.width = `${box.width - (drop.place === 'inside' ? 24 : 0)}px`;
        this.marker!.style.top = `${(below ? box.bottom : box.top) - 1}px`;
    }

    private readonly up = (e: MouseEvent): void => {
        const drop = this.started ? this.drop : undefined;
        this.end();
        if (drop) {
            e.preventDefault();
            if (drop.places[0] === 'inside') {
                setFold(this.view, drop.target, false);
            }
            dropRow(this.view, this.page, this.from, drop.target, drop.places);
            this.view.focus();
        }
    };

    private readonly key = (e: KeyboardEvent): void => {
        if (e.key === 'Escape' && this.started) {
            e.preventDefault();
            e.stopPropagation();
            this.end();
        }
    };

    private end(): void {
        window.removeEventListener('mousemove', this.move, true);
        window.removeEventListener('mouseup', this.up, true);
        window.removeEventListener('keydown', this.key, true);
        this.ghost?.remove();
        this.marker?.remove();
        this.over?.classList.remove('dc-drop-into');
        document.body.classList.remove('dc-row-dragging', 'dc-drop-none');
    }
}

/**
 * A relationship table's cell (a body cell, or a column header showing its type): drawn by its
 * node type; a click on its own space — not on one of its rows — selects it.
 */
class MapCellView implements NodeView {
    dom: HTMLElement;
    contentDOM?: HTMLElement;

    constructor(private node: PMNode, private readonly view: EditorView, private readonly getPos: () => number | undefined) {
        const rendered = DOMSerializer.renderSpec(document, node.type.spec.toDOM!(node));
        this.dom = rendered.dom as HTMLElement;
        this.contentDOM = (rendered.contentDOM as HTMLElement | undefined) ?? undefined;
        cellPositions.set(this.dom, getPos);
        const select = (e: MouseEvent, prevent: boolean): void => {
            const pos = this.getPos();
            if (!this.own(e.target) || pos === undefined) {
                return;
            }
            if (prevent) {
                e.preventDefault();
            }
            if (!(this.view.state.selection instanceof NodeSelection && this.view.state.selection.from === pos)) {
                this.view.dispatch(this.view.state.tr.setSelection(NodeSelection.create(this.view.state.doc, pos)));
            }
            this.view.focus();
        };
        this.dom.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                select(e, true);
            }
        });
        this.dom.addEventListener('contextmenu', (e) => select(e, false));
    }

    /** The cell's own space: itself, its content's box, its header's type. */
    private own(target: EventTarget | null): boolean {
        return target === this.dom || target === this.contentDOM || (target instanceof Element && target.closest('.dc-colspec-type') !== null && this.dom.contains(target));
    }

    update(node: PMNode): boolean {
        if (node.type !== this.node.type || !node.sameMarkup(this.node)) {
            return false; // a new @type: drawn again
        }
        this.node = node;
        return true;
    }

    stopEvent(event: Event): boolean {
        return (event.type === 'mousedown' || event.type === 'contextmenu') && this.own(event.target);
    }

    ignoreMutation(mutation: MutationRecord | { type: 'selection'; target: Node }): boolean {
        const label = this.dom.querySelector('.dc-colspec-type');
        return label !== null && label.contains(mutation.target);
    }
}

/** Node views for map rows (reused rows are reuse boxes) and relationship table cells. */
export function mapNodeViews(page: MapPage): Record<string, NodeViewConstructor> {
    const out: Record<string, NodeViewConstructor> = {};
    for (const type of Object.values(page.es.schema.nodes)) {
        const role = page.es.role(type);
        const element = role?.element;
        if (!element || role.context !== 'block') {
            continue;
        }
        const tokens = page.es.facts(element)?.tokens ?? [];
        if (role.kind !== 'opaque' && (tokens.includes('map/relcell') || tokens.includes('map/relcolspec'))) {
            out[type.name] = (node, view, getPos) => new MapCellView(node, view, getPos);
            continue;
        }
        if (!isMapRowElement(page.es.facts(element))) {
            continue;
        }
        out[type.name] = (node, view, getPos, decorations) => (isReuseNode(node)
            ? new ReusedView(node, element, decorations)
            : new MapRowView(node, view, getPos, decorations, page));
    }
    return out;
}

/** The position of the cell at (`row`, `col`) of the first relationship table (integration tests). */
export function cellAt(view: EditorView, page: MapPage, row: number, col: number): number | undefined {
    let table = -1;
    view.state.doc.descendants((node, pos) => {
        if (table === -1 && page.es.facts(page.es.role(node.type)?.element ?? '')?.tokens.includes('map/reltable')) {
            table = pos;
        }
        return table === -1;
    });
    if (table === -1) {
        return undefined;
    }
    const state = view.state.apply(view.state.tr.setSelection(NodeSelection.create(view.state.doc, table)));
    const grid = page.rel.gridAt(state);
    return grid ? page.rel.cellPos(grid, row, col) : undefined;
}

/** The row whose line shows `label` (integration tests): its position. */
export function rowByLabel(view: EditorView, label: string): number | undefined {
    for (const head of Array.from(view.dom.querySelectorAll<HTMLElement>('.dc-maprow-head'))) {
        if ((head.querySelector('.dc-maprow-label')?.textContent ?? '').includes(label)) {
            return rowPositions.get(head.parentElement!)?.();
        }
    }
    return undefined;
}
