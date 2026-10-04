/**
 * Maps and bookmaps in the visual editor (spec §13.8). A map's references — `topicref` and its
 * specializations (`chapter`, `keydef`, `topichead`, `mapref`…), recognized by class — are rows:
 * a line that says what the reference is (its label, its kind, its target) above the rows it
 * holds. The rows are the map's own elements: their structure is edited with the commands every
 * element has (insert after, move, delete) and their attributes in the Properties view.
 *
 * A row's label, first found:
 * 1. the `<navtitle>` of its `<topicmeta>`;
 * 2. its `@navtitle`;
 * 3. what its target is called, resolved by the host (the topic's or map's title, a key's
 *    navigation title) — passed in as `resolved`;
 * 4. a text key's `<keyword>` (a `keydef` without a target);
 * 5. its target as written (`href`, `[keyref]`) or its keys.
 *
 * Environment-neutral (prosemirror-model only; DOM output specs are plain arrays).
 */

import type { DOMOutputSpec, Node as PMNode } from 'prosemirror-model';
import { type EditorState, NodeSelection, type Selection } from 'prosemirror-state';
import type { Labels } from '../render/labels';
import type { EditorSchema, ElementFacts } from './schema';

/** The class token of a map reference: every row with rows inside. */
export const ROW_TOKEN = 'map/topicref';
/** Map elements shown as rows with nothing inside (kept as written). */
const LEAF_ROW_TOKENS = ['map/navref', 'map/anchor'];
/** Shown only with Show markup: a reference's metadata, a book's metadata. */
export const MAP_METADATA_TOKEN = 'map/topicmeta';

export type RowLabelSource = 'navtitle' | 'attribute' | 'title' | 'keyword' | 'target' | 'none';

/** What a row shows. */
export interface MapRowInfo {
    element: string;
    label: string;
    labelFrom: RowLabelSource;
    /** The target as written: `href`, `[keyref]` (shown after the label unless it is the label). */
    target?: string;
    keys?: string;
    /** It holds other rows (it can fold). */
    parent: boolean;
}

/** Where a row points, for Open target (as a link's target). */
export interface MapRowTarget {
    href?: string;
    keyref?: string;
    scope?: string;
    format?: string;
}

/** What the host resolved a row's target to (spec §13.8): its title, or why it cannot be read. */
export interface RowResolution {
    text?: string;
    error?: string;
    from?: string;
}

function xmlOf(node: PMNode): [string, string][] {
    return Array.isArray(node.attrs.xml) ? (node.attrs.xml as [string, string][]) : [];
}

function get(node: PMNode, name: string): string | undefined {
    return xmlOf(node).find(([n]) => n === name)?.[1];
}

function tokensOf(node: PMNode, es: EditorSchema): string[] {
    const element = es.role(node.type)?.element;
    return (element ? es.facts(element)?.tokens : undefined) ?? [];
}

/** Whether an element is shown as a map row. */
export function isMapRowElement(fact: ElementFacts | undefined): boolean {
    return fact !== undefined && (fact.tokens.includes(ROW_TOKEN) || LEAF_ROW_TOKENS.some((t) => fact.tokens.includes(t)));
}

/** Whether a node of the page is a map row. */
export function isMapRow(node: PMNode, es: EditorSchema): boolean {
    const element = es.role(node.type)?.element;
    return element !== null && element !== undefined && isMapRowElement(es.facts(element));
}

/** Whether the page's document is a map (its root is a `map/map`). */
export function isMapDocument(doc: PMNode, es: EditorSchema): boolean {
    const root = doc.firstChild;
    return root !== null && tokensOf(root, es).includes('map/map');
}

function collapse(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
}

/** The first child of `node` whose element has `token`. */
function childWith(node: PMNode, es: EditorSchema, token: string): PMNode | undefined {
    let found: PMNode | undefined;
    node.forEach((child) => {
        if (!found && tokensOf(child, es).includes(token)) {
            found = child;
        }
    });
    return found;
}

/** The text of a row's `<topicmeta>/<navtitle>`, if any. */
export function rowNavtitle(node: PMNode, es: EditorSchema): string | undefined {
    const meta = childWith(node, es, MAP_METADATA_TOKEN);
    const navtitle = meta ? childWith(meta, es, 'topic/navtitle') : undefined;
    const text = navtitle ? collapse(navtitle.textContent) : '';
    return text || undefined;
}

/** The text of a key definition: the first `<keyword>` of its `<topicmeta>/<keywords>`. */
function rowKeyword(node: PMNode, es: EditorSchema): string | undefined {
    const meta = childWith(node, es, MAP_METADATA_TOKEN);
    const keywords = meta ? childWith(meta, es, 'topic/keywords') : undefined;
    const keyword = keywords ? childWith(keywords, es, 'topic/keyword') : undefined;
    // A keyword kept whole (keyref'd, reused) has no text of its own on the page.
    const text = keyword ? collapse(keyword.isAtom ? '' : keyword.textContent) : '';
    return text || undefined;
}

/** Where a row points (navref: the map it references), or undefined. */
export function mapRowTarget(node: PMNode, es: EditorSchema): MapRowTarget | undefined {
    const tokens = tokensOf(node, es);
    if (tokens.includes('map/navref')) {
        const mapref = get(node, 'mapref');
        return mapref ? { href: mapref, format: 'ditamap' } : undefined;
    }
    if (!tokens.includes(ROW_TOKEN)) {
        return undefined;
    }
    const href = get(node, 'href');
    const keyref = get(node, 'keyref');
    if (!href && !keyref) {
        return undefined;
    }
    return { href, keyref, scope: get(node, 'scope'), format: get(node, 'format') };
}

/** What a row shows (see the module comment for the label's order). */
export function mapRowInfo(node: PMNode, es: EditorSchema, resolved?: RowResolution): MapRowInfo {
    const element = es.role(node.type)?.element ?? '';
    const tokens = tokensOf(node, es);
    let parent = false;
    node.forEach((child) => {
        parent = parent || isMapRow(child, es);
    });
    if (tokens.includes('map/anchor')) {
        const id = get(node, 'id');
        return { element, label: id ? `⚓ ${id}` : '', labelFrom: id ? 'attribute' : 'none', parent: false };
    }
    const target = mapRowTarget(node, es);
    const written = target ? (target.keyref ? `[${target.keyref}]` : target.href) : undefined;
    const keys = get(node, 'keys') || undefined;
    const pick = (): { label: string; labelFrom: RowLabelSource } => {
        const navtitle = rowNavtitle(node, es);
        if (navtitle) {
            return { label: navtitle, labelFrom: 'navtitle' };
        }
        const attribute = collapse(get(node, 'navtitle') ?? '');
        if (attribute) {
            return { label: attribute, labelFrom: 'attribute' };
        }
        if (resolved?.text && resolved.error === undefined) {
            return { label: collapse(resolved.text), labelFrom: 'title' };
        }
        const keyword = target ? undefined : rowKeyword(node, es);
        if (keyword) {
            return { label: keyword, labelFrom: 'keyword' };
        }
        if (written) {
            return { label: written, labelFrom: 'target' };
        }
        return { label: '', labelFrom: 'none' };
    };
    const { label, labelFrom } = pick();
    return { element, label, labelFrom, target: labelFrom === 'target' ? undefined : written, keys, parent };
}

/** Kinds of rows the page styles (class `dc-row-<kind>`, by class token); others are plain references. */
const ROW_STYLES: [string, string][] = [
    ['bookmap/part', 'part'], ['bookmap/chapter', 'chapter'], ['bookmap/appendix', 'chapter'], ['bookmap/appendices', 'part'],
    ['bookmap/frontmatter', 'matter'], ['bookmap/backmatter', 'matter'], ['bookmap/booklists', 'matter'],
    ['mapgroup-d/topichead', 'head'], ['mapgroup-d/topicgroup', 'group'], ['mapgroup-d/keydef', 'key'],
    ['mapgroup-d/mapref', 'map'], ['map/navref', 'map'], ['map/anchor', 'anchor'],
    // A book's generated lists.
    ...['toc', 'figurelist', 'tablelist', 'abbrevlist', 'trademarklist', 'bibliolist', 'glossarylist', 'indexlist', 'booklist']
        .map((name): [string, string] => [`bookmap/${name}`, 'list']),
];

/** Kinds of rows that point somewhere: without a label, they say they have no target. */
const TARGET_STYLES = new Set(['ref', 'chapter', 'map']);

function rowStyle(fact: ElementFacts, node: PMNode): string {
    for (const [token, style] of ROW_STYLES) {
        if (fact.tokens.includes(token)) {
            return style;
        }
    }
    return get(node, 'format') === 'ditamap' ? 'map' : 'ref';
}

/**
 * A row as DOM: its line (not editable: what the row says comes from its attributes, its
 * metadata and its target) and the rows it holds (the content hole). `labels`: the page's words.
 */
export function mapRowDom(fact: ElementFacts, node: PMNode, es: EditorSchema, labels: Labels, resolved?: RowResolution): DOMOutputSpec {
    const info = mapRowInfo(node, es, resolved);
    const style = rowStyle(fact, node);
    const outputclass = get(node, 'outputclass');
    const attrs: Record<string, string> = {
        class: `dc-maprow dc-row-${style}${info.parent ? ' dc-maprow-parent' : ''}${outputclass ? ` ${outputclass}` : ''}`,
        'data-dita': fact.name,
        'data-label-from': info.labelFrom,
    };
    if (fact.cls) {
        attrs['data-class'] = fact.cls;
    }
    const lang = get(node, 'xml:lang');
    if (lang) {
        attrs.lang = lang;
    }
    const ui = (key: string, fallback: string): string => labels.ui[key] ?? fallback;
    const head: DOMOutputSpec[] = [
        ['span', { class: 'dc-maprow-twisty', title: info.parent ? ui('foldRow', 'Fold') : '' }],
        // A plain reference is the common case: its kind goes without saying.
        ...(style === 'ref' && fact.name === 'topicref' ? [] : [['span', { class: 'dc-maprow-kind' }, fact.name] as DOMOutputSpec]),
        // A group, a book's front matter or a generated list needs no label: its kind says what it is.
        ['span', { class: `dc-maprow-label${info.label ? '' : ' dc-maprow-nolabel'}` }, info.label || (TARGET_STYLES.has(style) ? ui('noTarget', 'no target') : '')],
    ];
    if (info.keys) {
        head.push(['span', { class: 'dc-maprow-keys', title: `keys="${info.keys}"` }, info.keys]);
    }
    if (info.target) {
        head.push(['span', { class: 'dc-maprow-target', title: info.target }, info.target]);
    }
    const title = resolved?.error !== undefined ? `⚠ ${resolved.error}` : resolved?.from ? `${fact.name} → ${resolved.from}` : (info.target ?? fact.name);
    const line: DOMOutputSpec = ['div', { class: 'dc-maprow-head', contenteditable: 'false', title }, ...head];
    if (node.isAtom) {
        return ['div', { ...attrs, class: `${attrs.class} dc-maprow-leaf` }, line];
    }
    return ['div', attrs, line, ['div', { class: 'dc-maprow-body' }, 0]];
}

/** The row selected (a NodeSelection on a row). */
export function selectedRow(state: EditorState, es: EditorSchema): { pos: number; node: PMNode } | undefined {
    const sel = state.selection;
    return sel instanceof NodeSelection && isMapRow(sel.node, es) ? { pos: sel.from, node: sel.node } : undefined;
}

/**
 * Where the cursor may not be in a map while markup is hidden: inside a reference's metadata
 * (its navtitle). The selection to use instead — the row holding it (or the book's metadata
 * element) — or undefined when the selection is fine.
 */
export function hiddenMetadataSelection(state: EditorState, es: EditorSchema): Selection | undefined {
    const sel = state.selection;
    if (sel instanceof NodeSelection || !isMapDocument(state.doc, es)) {
        return undefined;
    }
    const $from = sel.$from;
    for (let d = $from.depth; d > 0; d--) {
        const element = es.role($from.node(d).type)?.element;
        if (element && es.facts(element)?.tokens.includes(MAP_METADATA_TOKEN)) {
            for (let up = d - 1; up > 0; up--) {
                if (isMapRow($from.node(up), es)) {
                    return NodeSelection.create(state.doc, $from.before(up));
                }
            }
            return NodeSelection.create(state.doc, $from.before(d));
        }
    }
    return undefined;
}

/** The rows of `doc` in document order, with their positions and whether a folded row hides them. */
export function mapRows(doc: PMNode, es: EditorSchema, folded: (pos: number) => boolean = () => false): { pos: number; node: PMNode; hidden: boolean }[] {
    const out: { pos: number; node: PMNode; hidden: boolean }[] = [];
    const visit = (node: PMNode, start: number, hidden: boolean): void => {
        node.forEach((child, offset) => {
            const pos = start + offset;
            const row = isMapRow(child, es);
            if (row) {
                out.push({ pos, node: child, hidden });
            }
            if (!child.isLeaf) {
                visit(child, pos + 1, hidden || (row && folded(pos)));
            }
        });
    };
    visit(doc, 0, false);
    return out;
}

/** A row's place as child indices from the root (for keeping folds across a rebuild of the page). */
export function rowPath(doc: PMNode, pos: number): string {
    const $pos = doc.resolve(pos);
    const path: number[] = [];
    for (let d = 0; d <= $pos.depth; d++) {
        path.push($pos.index(d));
    }
    return path.join('/');
}

/** The position of the row at `path` in `doc`, if that node is still a row. */
export function rowAtPath(doc: PMNode, path: string, es: EditorSchema): number | undefined {
    let node = doc;
    let pos = 0;
    const indices = path.split('/').map(Number);
    for (let d = 0; d < indices.length; d++) {
        const index = indices[d];
        if (!Number.isInteger(index) || index < 0 || index >= node.childCount) {
            return undefined;
        }
        let offset = 0;
        for (let k = 0; k < index; k++) {
            offset += node.child(k).nodeSize;
        }
        const child = node.child(index);
        pos += offset + (d === 0 ? 0 : 1);
        if (d === indices.length - 1) {
            return isMapRow(child, es) ? pos : undefined;
        }
        node = child;
    }
    return undefined;
}
