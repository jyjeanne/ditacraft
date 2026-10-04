/**
 * Editing a map's rows in the visual editor (spec §13.8, M2): a row's target (from the link
 * picker), a new reference from the picker, a row's label written as its navigation title, and
 * rows moved — one level in (Tab), one level out (Shift+Tab), or dragged anywhere, into a
 * relationship table's cell too — wherever the DTD allows them. A reference added with a cell
 * selected goes into the cell (M3).
 *
 * A move takes the row with everything it holds (its metadata, its rows); the lossless writer
 * writes it in its new place re-indented as a whole (toSource.ts `placed`), the rest of the map
 * as it was.
 *
 * Environment-neutral.
 */

import { Fragment, type Node as PMNode } from 'prosemirror-model';
import { type Command, type EditorState, NodeSelection } from 'prosemirror-state';
import { withAttribute, type AttributePairs } from '../cst/openTag';
import { elementAttributes } from '../grammar/types';
import type { DitaCommands } from './commands';
import { linkAttributes, type LinkTarget } from './links';
import { isMapRow, MAP_METADATA_TOKEN, selectedRow } from './maps';
import type { EditorSchema } from './schema';

const FRESH = { src: null, xml: [], view: null };

/** Where a dragged row goes, relative to the row it is dropped on. */
export type DropPlace = 'before' | 'after' | 'inside';

/** Rows that group or define rather than reference a topic: a new reference is not one of them. */
const NOT_REFERENCES = ['mapgroup-d/keydef', 'mapgroup-d/topichead', 'mapgroup-d/topicgroup', 'mapgroup-d/anchorref', 'mapgroup-d/topicset',
    'mapgroup-d/topicsetref', 'ditavalref-d/ditavalref', 'bookmap/frontmatter', 'bookmap/backmatter', 'bookmap/booklists', 'bookmap/appendices',
    'bookmap/toc', 'bookmap/figurelist', 'bookmap/tablelist', 'bookmap/abbrevlist', 'bookmap/trademarklist', 'bookmap/bibliolist',
    'bookmap/glossarylist', 'bookmap/indexlist', 'bookmap/booklist'];

/** The elements a new reference is made of, in order of preference after the selected row's own. */
const REFERENCES = ['topicref', 'chapter', 'appendix', 'part', 'mapref'];

export class MapCommands {
    constructor(private readonly es: EditorSchema, private readonly cmds: DitaCommands) {}

    private element(node: PMNode): string | undefined {
        return this.es.role(node.type)?.element ?? undefined;
    }

    private tokens(node: PMNode): string[] {
        const element = this.element(node);
        return (element ? this.es.facts(element)?.tokens : undefined) ?? [];
    }

    private declares(element: string, attribute: string): boolean {
        return elementAttributes(this.es.grammar, element)[attribute] !== undefined;
    }

    /**
     * Whether `parent` takes `node` at `index` — by the DTD's model (its strict content
     * expression, even for an instance that breaks it, which then takes any block) and its child
     * set — once its child `without` has been taken out (a move inside the same parent).
     */
    private accepts(parent: PMNode, index: number, node: PMNode, without?: number): boolean {
        const name = this.element(node);
        if (!name || !this.cmds.allowedIn(parent, name)) {
            return false;
        }
        const children: PMNode[] = [];
        parent.forEach((child, _offset, k) => {
            if (k !== without) {
                children.push(child);
            }
        });
        children.splice(index, 0, node);
        return this.valid(parent, Fragment.from(children));
    }

    /** Whether `parent` may hold `content`: its DTD model, or, for an instance already loose, any blocks. */
    private valid(parent: PMNode, content: Fragment): boolean {
        const role = this.es.role(parent.type);
        const strict = (role?.element ? this.es.nodeType(role.element, 'block', 'main') : undefined) ?? parent.type;
        return strict.validContent(content) || (role?.variant === 'loose' && parent.type.validContent(content));
    }

    // -- moving rows ------------------------------------------------------------------------------

    /**
     * Move the row at `from` to position `to` of the same document (between two nodes, not inside
     * the row itself), when the DTD allows it there and allows it to leave where it was. The
     * moved row is selected.
     */
    moveRow(from: number, to: number): Command {
        return (state, dispatch) => {
            if (!this.movable(state.doc, from, to)) {
                return false;
            }
            if (dispatch) {
                const node = state.doc.nodeAt(from)!;
                const tr = state.tr.delete(from, from + node.nodeSize);
                const at = tr.mapping.map(to);
                tr.insert(at, node);
                tr.setSelection(NodeSelection.create(tr.doc, at));
                dispatch(tr.scrollIntoView());
            }
            return true;
        };
    }

    /** Whether the row at `from` may move to position `to` (see `moveRow`). */
    movable(doc: PMNode, from: number, to: number): boolean {
        const node = from >= 0 && from < doc.content.size ? doc.nodeAt(from) : null;
        if (!node || !isMapRow(node, this.es) || to < 0 || to > doc.content.size) {
            return false;
        }
        if (to >= from && to <= from + node.nodeSize) {
            return false; // into itself, or where it already is
        }
        const $from = doc.resolve(from);
        const $to = doc.resolve(to);
        if ($from.depth === 0 || $to.depth === 0) {
            return false; // the root element's place
        }
        const sameParent = $from.depth === $to.depth && $from.start() === $to.start();
        const without = sameParent ? $from.index() : undefined;
        const index = sameParent && $to.index() > $from.index() ? $to.index() - 1 : $to.index();
        if (!this.accepts($to.parent, index, node, without)) {
            return false;
        }
        if (!sameParent) {
            // Where it was: what remains must still follow the DTD (a required child stays).
            const remaining: PMNode[] = [];
            $from.parent.forEach((child, _offset, k) => {
                if (k !== $from.index()) {
                    remaining.push(child);
                }
            });
            if (!this.valid($from.parent, Fragment.from(remaining))) {
                return false;
            }
        }
        return true;
    }

    /** Where a row dropped on the row at `target` goes (`before`, `after`, or as its last row), if anywhere. */
    dropPosition(doc: PMNode, from: number, target: number, place: DropPlace): number | undefined {
        const node = doc.nodeAt(target);
        if (!node || !(isMapRow(node, this.es) || (place === 'inside' && this.isCell(node)))) {
            return undefined;
        }
        const to = place === 'before' ? target : place === 'after' ? target + node.nodeSize : node.isAtom ? undefined : target + node.nodeSize - 1;
        if (to === undefined) {
            return undefined;
        }
        return this.movable(doc, from, to) ? to : undefined;
    }

    /** Tab: the selected row goes into the row before it, as its last row. */
    readonly indentRow: Command = (state, dispatch) => {
        const row = selectedRow(state, this.es);
        if (!row) {
            return false;
        }
        const $pos = state.doc.resolve(row.pos);
        const index = $pos.index();
        const before = index > 0 ? $pos.parent.child(index - 1) : undefined;
        if (!before || before.isAtom || !isMapRow(before, this.es)) {
            return false;
        }
        return this.moveRow(row.pos, row.pos - 1)(state, dispatch); // the end of the row before
    };

    /** Shift+Tab: the selected row leaves the row holding it, and goes right after it. */
    readonly outdentRow: Command = (state, dispatch) => {
        const row = selectedRow(state, this.es);
        if (!row) {
            return false;
        }
        const $pos = state.doc.resolve(row.pos);
        if ($pos.depth < 2 || !isMapRow($pos.parent, this.es)) {
            return false;
        }
        return this.moveRow(row.pos, $pos.after())(state, dispatch);
    };

    // -- targets ----------------------------------------------------------------------------------

    /** Point the selected row at `target` (`href` or `keyref`, `scope`, `format`; its other attributes stay). */
    setTarget(target: LinkTarget): Command {
        return (state, dispatch) => {
            const row = selectedRow(state, this.es);
            if (!row || !this.canTarget(row.node)) {
                return false;
            }
            if (dispatch) {
                const xml = row.node.attrs.xml as AttributePairs;
                const next = this.tokens(row.node).includes('map/navref')
                    ? withAttribute(xml, 'mapref', target.href ?? null)
                    : linkAttributes(xml, target);
                const tr = state.tr.setNodeMarkup(row.pos, undefined, { ...row.node.attrs, xml: next });
                tr.setSelection(NodeSelection.create(tr.doc, row.pos));
                dispatch(tr.scrollIntoView());
            }
            return true;
        };
    }

    /** Whether a row can point somewhere (Change target). */
    canTarget(node: PMNode): boolean {
        const element = this.element(node);
        if (!element || !isMapRow(node, this.es)) {
            return false;
        }
        return this.tokens(node).includes('map/navref') ? this.declares(element, 'mapref') : this.declares(element, 'href') || this.declares(element, 'keyref');
    }

    /** The element a new reference after the cursor or the selected row is made of, if any is allowed there. */
    referenceElement(state: EditorState): string | undefined {
        const point = this.referencePoint(state);
        if (!point) {
            return undefined;
        }
        const row = selectedRow(state, this.es);
        const own = row ? this.element(row.node) : undefined;
        const usable = (name: string): boolean => {
            const tokens = this.es.facts(name)?.tokens ?? [];
            const type = this.es.nodeType(name, 'block');
            return type !== undefined && this.es.role(type)?.kind !== 'opaque' && tokens.includes('map/topicref')
                && !NOT_REFERENCES.some((t) => tokens.includes(t)) && this.declares(name, 'href') && this.accepts(point.parent, point.index, this.cmds.fill(type));
        };
        return [own, ...REFERENCES].find((name): name is string => name !== undefined && usable(name))
            ?? Object.keys(this.es.grammar.elements).sort().find(usable);
    }

    /** A relationship table's cell (a body cell or a column header). */
    private isCell(node: PMNode): boolean {
        const tokens = this.tokens(node);
        return tokens.includes('map/relcell') || tokens.includes('map/relcolspec');
    }

    /** Where a new reference goes: at the end of the selected cell, else after the selected row or the cursor's block. */
    referencePoint(state: EditorState): { parent: PMNode; index: number; pos: number } | undefined {
        const sel = state.selection;
        if (sel instanceof NodeSelection && this.isCell(sel.node)) {
            return { parent: sel.node, index: sel.node.childCount, pos: sel.from + sel.node.nodeSize - 1 };
        }
        return this.cmds.insertionPointAt(state);
    }

    /** Insert a reference to `target` into the selected cell, or after the selected row (or the block at the cursor); the new row is selected. Without a target: a dry run. */
    insertReference(target?: LinkTarget): Command {
        return (state, dispatch) => {
            const name = this.referenceElement(state);
            const point = this.referencePoint(state);
            const type = name ? this.es.nodeType(name, 'block') : undefined;
            if (!name || !point || !type) {
                return false;
            }
            if (dispatch && target) {
                const filled = this.cmds.fill(type);
                const node = type.create({ ...FRESH, xml: linkAttributes([], target) }, filled.content);
                if (!point.parent.canReplaceWith(point.index, point.index, type)) {
                    return false;
                }
                const tr = state.tr.insert(point.pos, node);
                tr.setSelection(NodeSelection.create(tr.doc, point.pos));
                dispatch(tr.scrollIntoView());
            }
            return true;
        };
    }

    // -- labels ----------------------------------------------------------------------------------------

    /**
     * Write `label` as the navigation title of the row at `pos`: in its `<topicmeta>/<navtitle>`
     * (made when missing), or in its `@navtitle` when that is how the row has it. An empty label
     * removes the navigation title (and a `<topicmeta>` left empty by that). A row that points to a
     * topic also gets `locktitle="yes"`, so the published navigation shows the label rather than
     * the topic's title.
     */
    setLabel(pos: number, label: string): Command {
        return (state, dispatch) => {
            const node = pos >= 0 && pos < state.doc.content.size ? state.doc.nodeAt(pos) : null;
            const element = node ? this.element(node) : undefined;
            if (!node || !element || !isMapRow(node, this.es) || node.isAtom) {
                return false;
            }
            const text = label.replace(/\s+/g, ' ').trim();
            const tr = state.tr;
            const meta = node.childCount > 0 && this.tokens(node.child(0)).includes(MAP_METADATA_TOKEN) ? node.child(0) : undefined;
            const metaPos = pos + 1;
            let navIndex = -1;
            meta?.forEach((child, _offset, k) => {
                if (navIndex === -1 && this.tokens(child).includes('topic/navtitle')) {
                    navIndex = k;
                }
            });
            const xml = node.attrs.xml as AttributePairs;
            const hasAttribute = xml.some(([n]) => n === 'navtitle');
            if (meta && navIndex !== -1) {
                let navPos = metaPos + 1;
                for (let k = 0; k < navIndex; k++) {
                    navPos += meta.child(k).nodeSize;
                }
                const nav = meta.child(navIndex);
                if (text) {
                    if (nav.isAtom || !nav.inlineContent) {
                        return false; // a navtitle kept as written (reused): edited in the source
                    }
                    if (nav.textContent === text) {
                        return false;
                    }
                    tr.replaceWith(navPos + 1, navPos + nav.nodeSize - 1, this.es.schema.text(text));
                } else if (meta.childCount === 1 && (meta.attrs.xml as AttributePairs).length === 0 && this.valid(node, node.content.cut(meta.nodeSize))) {
                    tr.delete(metaPos, metaPos + meta.nodeSize);
                } else {
                    tr.delete(navPos, navPos + nav.nodeSize);
                }
            } else if (hasAttribute) {
                if ((xml.find(([n]) => n === 'navtitle')?.[1] ?? '') === text) {
                    return false;
                }
                tr.setNodeMarkup(pos, undefined, { ...node.attrs, xml: withAttribute(xml, 'navtitle', text || null) });
            } else if (text) {
                const made = this.newNavtitle(node, meta, text);
                if (!made) {
                    if (!this.declares(element, 'navtitle')) {
                        return false;
                    }
                    tr.setNodeMarkup(pos, undefined, { ...node.attrs, xml: withAttribute(xml, 'navtitle', text) });
                } else {
                    tr.insert(made.at === 'meta' ? metaPos + 1 : pos + 1, made.node);
                }
            } else {
                return false;
            }
            // Shown in the published navigation instead of the topic's title.
            if (text && this.pointsToTopic(xml) && this.declares(element, 'locktitle') && xml.find(([n]) => n === 'locktitle')?.[1] !== 'yes') {
                const current = tr.doc.nodeAt(pos)!;
                tr.setNodeMarkup(pos, undefined, { ...current.attrs, xml: withAttribute(current.attrs.xml as AttributePairs, 'locktitle', 'yes') });
            }
            if (dispatch) {
                tr.setSelection(NodeSelection.create(tr.doc, pos));
                dispatch(tr.scrollIntoView());
            }
            return true;
        };
    }

    /** A new `<navtitle>` for a row: into its `<topicmeta>` (first), or in a new `<topicmeta>` (first in the row). */
    private newNavtitle(row: PMNode, meta: PMNode | undefined, text: string): { node: PMNode; at: 'meta' | 'row' } | undefined {
        const navType = this.es.nodeType('navtitle', 'block');
        if (!navType || !navType.isTextblock) {
            return undefined;
        }
        const nav = navType.create(FRESH, this.es.schema.text(text));
        if (meta) {
            return this.accepts(meta, 0, nav) ? { node: nav, at: 'meta' } : undefined;
        }
        const metaElement = this.es.facts('topicmeta') ? 'topicmeta' : undefined;
        const metaType = metaElement ? this.es.nodeType(metaElement, 'block') : undefined;
        if (!metaType) {
            return undefined;
        }
        const newMeta = metaType.create(FRESH, nav);
        return metaType.validContent(Fragment.from(nav)) && this.accepts(row, 0, newMeta) ? { node: newMeta, at: 'row' } : undefined;
    }

    /** A reference to a local DITA topic (not a map, not another format, not the web). */
    private pointsToTopic(xml: AttributePairs): boolean {
        const get = (name: string) => xml.find(([n]) => n === name)?.[1];
        const format = get('format');
        return (get('href') !== undefined || get('keyref') !== undefined) && get('scope') !== 'external' && (!format || format === 'dita');
    }
}
