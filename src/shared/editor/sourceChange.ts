/**
 * A change of the topic's source text made outside the page's own commands — a quick fix
 * computed by the language server (spec §11.1) — applied as a change of the page's document,
 * so that undo on the page takes it back and the writer (toSource.ts) writes it like any other
 * change: everything it does not touch stays byte for byte.
 *
 * The change is located in a build of the old text and a build of the new one, where every
 * node knows its source range. The page's document has the shape of the old build (it
 * serializes to that text), so the same tree path finds the element in the page's document.
 * The smallest element that contains the change in both texts is then updated:
 * - the change is in its start tag and its content is unchanged: its attributes;
 * - the change is in its content: the children it touches, rebuilt from the new text;
 * - otherwise (an element kept as written, a change across its tags): the element, rebuilt.
 * Rebuilt nodes are detached from the new text: written as new content, in the file's layout
 * (elements kept as written keep their new text as it is).
 *
 * The result is checked: the page's document, written, must read as the new text. A change
 * outside the root element (the DOCTYPE), or one that cannot be made this way, gives
 * undefined — the caller applies the text change itself.
 *
 * Environment-neutral.
 */

import { Fragment, type Mark, type Node as PMNode } from 'prosemirror-model';
import type { EditorState, Transaction } from 'prosemirror-state';
import { parse } from '../cst/parse';
import type { CstNode } from '../cst/types';
import type { EditorSchema } from './schema';
import { detachNode, type Base, type BuildResult, type NodeOrigin } from './toProseMirror';
import { serializeDocument } from './toSource';

/** A text edit: [start, end) of the old text replaced by `text`. */
export interface TextEdit {
    start: number;
    end: number;
    text: string;
}

/** Where two texts differ: [start, end) of the old one became [start, newEnd) of the new one. */
export interface TextSpan {
    start: number;
    end: number;
    newEnd: number;
}

/** `text` with `edits` applied (offsets of `text`); undefined when edits overlap or fall outside it. */
export function applyTextEdits(text: string, edits: readonly TextEdit[]): string | undefined {
    const sorted = [...edits].sort((a, b) => a.start - b.start || a.end - b.end);
    let out = '';
    let at = 0;
    for (const edit of sorted) {
        if (edit.start < at || edit.end < edit.start || edit.end > text.length) {
            return undefined;
        }
        out += text.slice(at, edit.start) + edit.text;
        at = edit.end;
    }
    return out + text.slice(at);
}

/** The span `edits` change: from the first edit's start to the last one's end. */
export function editedSpan(text: string, edits: readonly TextEdit[]): TextSpan | undefined {
    if (edits.length === 0) {
        return undefined;
    }
    const start = Math.min(...edits.map((e) => e.start));
    const end = Math.max(...edits.map((e) => e.end));
    const growth = edits.reduce((n, e) => n + e.text.length - (e.end - e.start), 0);
    return end <= text.length ? { start, end, newEnd: end + growth } : undefined;
}

export type SourceChangePlan =
    /** Set the attributes (and presentation hints) of the node at `pos`. */
    | { kind: 'attributes'; pos: number; attrs: Record<string, unknown> }
    /** Replace [from, to) of the page's document with `nodes`. */
    | { kind: 'replace'; from: number; to: number; nodes: PMNode[] };

/**
 * How to make the change `span` (from the text `fresh` was built from to the text `next` was
 * built from) on `doc`, the page's document that serializes to the first; undefined when it
 * cannot be made as a change of the document.
 */
export function sourceChange(doc: PMNode, fresh: BuildResult, next: BuildResult, es: EditorSchema, span: TextSpan): SourceChangePlan | undefined {
    const before = fresh.base.source;
    const after = next.base.source;
    const { start: s, end: e, newEnd: e2 } = span;
    const oldOrigin = fresh.base.origin;
    const newOrigin = next.base.origin;
    const nameOf = (n: PMNode): string => es.role(n.type)?.element ?? n.type.name;
    /** Whether a change [from, to) lies inside the node with origin `o`. */
    const inside = (o: NodeOrigin | undefined, from: number, to: number): boolean =>
        o !== undefined && (from === to ? o.start < from && from < o.end : o.start <= from && to <= o.end);
    const childInside = (parent: PMNode, origin: WeakMap<PMNode, NodeOrigin>, from: number, to: number): number => {
        for (let i = 0; i < parent.childCount; i++) {
            if (inside(origin.get(parent.child(i)), from, to)) {
                return i;
            }
        }
        return -1;
    };

    // Down both builds, and the page's document, while one child contains the change on both sides.
    let a = fresh.doc;
    let b = next.doc;
    let live = doc;
    let livePos = -1;
    let parent: { node: PMNode; index: number } | undefined;
    for (;;) {
        const i = childInside(a, oldOrigin, s, e);
        if (i === -1 || i !== childInside(b, newOrigin, s, e2)) {
            break;
        }
        const ca = a.child(i);
        const cb = b.child(i);
        if (ca.isText || cb.isText || nameOf(ca) !== nameOf(cb)) {
            break;
        }
        if (i >= live.childCount || nameOf(live.child(i)) !== nameOf(ca)) {
            return undefined; // the page's document does not have the old text's shape
        }
        let pos = livePos + 1;
        for (let k = 0; k < i; k++) {
            pos += live.child(k).nodeSize;
        }
        parent = { node: live, index: i };
        a = ca;
        b = cb;
        live = live.child(i);
        livePos = pos;
        if (ca.isAtom) {
            break;
        }
    }
    if (!parent) {
        return undefined; // across the root element's boundaries, or outside it
    }
    const isRoot = livePos === 0;
    const whole = (): SourceChangePlan | undefined => {
        const node = keepMarks(detachNode(b, newOrigin, after), live.marks);
        return !isRoot && parent!.node.canReplace(parent!.index, parent!.index + 1, Fragment.from(node))
            ? { kind: 'replace', from: livePos, to: livePos + live.nodeSize, nodes: [node] }
            : undefined;
    };
    if (a.isAtom || b.isAtom) {
        return whole();
    }

    const o = oldOrigin.get(a)!;
    const o2 = newOrigin.get(b)!;
    if (s >= o.start && e <= o.contentStart && s >= o2.start && e2 <= o2.contentStart
        && before.slice(o.contentStart, o.end) === after.slice(o2.contentStart, o2.end)) {
        // Only the start tag changed: the attributes.
        return { kind: 'attributes', pos: livePos, attrs: { ...live.attrs, xml: b.attrs.xml, view: b.attrs.view } };
    }
    if (!(s >= o.contentStart && e <= o.contentEnd && s >= o2.contentStart && e2 <= o2.contentEnd)) {
        return whole();
    }

    // In the content: the children the change touches, on both sides, then as many untouched
    // children before and after as both sides have (text runs merge or split around a change).
    const [i, j] = touched(a, oldOrigin, s, e);
    const [i2, j2] = touched(b, newOrigin, s, e2);
    let pre = Math.min(i, i2);
    let post = Math.min(a.childCount - j, b.childCount - j2);
    const kept = (k: number, k2: number): boolean => nameOf(a.child(k)) === nameOf(b.child(k2));
    if (Array.from({ length: pre }, (_, k) => kept(k, k)).includes(false)
        || Array.from({ length: post }, (_, k) => kept(a.childCount - 1 - k, b.childCount - 1 - k)).includes(false)) {
        pre = 0;
        post = 0;
    }
    if (pre === a.childCount - post && pre === b.childCount - post) {
        return undefined; // between the children only (layout): nothing the document holds
    }
    if (live.childCount !== a.childCount || a.content.content.some((c, k) => nameOf(live.child(k)) !== nameOf(c))) {
        return undefined;
    }
    const pool: Mark[] = [];
    for (let k = Math.max(0, pre - 1); k < Math.min(live.childCount, live.childCount - post + 1); k++) {
        pool.push(...live.child(k).marks);
    }
    const nodes: PMNode[] = [];
    for (let k = pre; k < b.childCount - post; k++) {
        nodes.push(keepMarks(detachNode(b.child(k), newOrigin, after), pool));
    }
    if (!live.canReplace(pre, live.childCount - post, Fragment.from(nodes))) {
        return whole();
    }
    let from = livePos + 1;
    for (let k = 0; k < pre; k++) {
        from += live.child(k).nodeSize;
    }
    const replaced: PMNode[] = [];
    for (let k = pre; k < live.childCount - post; k++) {
        replaced.push(live.child(k));
    }
    if (live.inlineContent) {
        // In text, only the characters that differ: the writer then edits the text where it is,
        // keeping its line breaks and entities.
        const was = Fragment.fromArray(replaced);
        const now = Fragment.fromArray(nodes);
        let first = was.findDiffStart(now);
        if (first === null) {
            return undefined;
        }
        const last = was.findDiffEnd(now) ?? { a: was.size, b: now.size };
        const overlap = first - Math.min(last.a, last.b);
        let endA = overlap > 0 ? last.a + overlap : last.a;
        let endB = overlap > 0 ? last.b + overlap : last.b;
        // Never inside an inline element: from its start, to its end.
        first = enclosing(was, first)?.[0] ?? first;
        const grow = Math.max((enclosing(was, endA)?.[1] ?? endA) - endA, (enclosing(now, endB)?.[1] ?? endB) - endB);
        endA += grow;
        endB += grow;
        const content: PMNode[] = [];
        now.cut(first, endB).forEach((n) => content.push(n));
        return { kind: 'replace', from: from + first, to: from + endA, nodes: content };
    }
    return { kind: 'replace', from, to: from + replaced.reduce((n, c) => n + c.nodeSize, 0), nodes };
}

/** The range of the child of `frag` that is not text and has `pos` strictly inside it. */
function enclosing(frag: Fragment, pos: number): [number, number] | undefined {
    let at = 0;
    for (let k = 0; k < frag.childCount; k++) {
        const child = frag.child(k);
        const end = at + child.nodeSize;
        if (pos > at && pos < end && !child.isText) {
            return [at, end];
        }
        at = end;
    }
    return undefined;
}

/**
 * The children of `node` (a build with `origin`) that a change [from, to) touches:
 * [first, last). A text run's range is its formatting element's when the change is in that
 * element's tags.
 */
function touched(node: PMNode, origin: WeakMap<PMNode, NodeOrigin>, from: number, to: number): [number, number] {
    const extents: [number, number][] = [];
    for (let k = 0; k < node.childCount; k++) {
        const o = origin.get(node.child(k));
        if (!o) {
            return [0, node.childCount];
        }
        let [start, end] = [o.start, o.end];
        for (const m of o.markEls ?? []) {
            const hits = from === to ? m.range.start < from && from < m.range.end : from < m.range.end && to > m.range.start;
            const inContent = from >= m.openTagRange.end && to <= (m.closeTagRange?.start ?? m.range.end);
            if (hits && !inContent) {
                start = Math.min(start, m.range.start);
                end = Math.max(end, m.range.end);
            }
        }
        extents.push([start, end]);
    }
    let first = 0;
    let last = node.childCount;
    while (first < last && extents[first][1] <= from) {
        first++;
    }
    while (last > first && extents[last - 1][0] >= to) {
        last--;
    }
    return [first, last];
}

/**
 * A rebuilt inline node inside the same formatting as the page's nodes around it takes their
 * marks (the same source elements), so the formatting is not split around it.
 */
function keepMarks(node: PMNode, pool: readonly Mark[]): PMNode {
    if (node.marks.length === 0 || pool.length === 0) {
        return node;
    }
    return node.mark(node.marks.map((m) => pool.find((p) => p.type === m.type) ?? m));
}

/**
 * The transaction that makes the text change `edits` (offsets of the text the page's document
 * serializes to, which `fresh` was built from) on the page, checked: written against `base`,
 * the document reads as the new text. `buildText` builds the new text as the page builds a
 * document. Undefined: not possible as a change of the document.
 */
export function sourceChangeTransaction(state: EditorState, fresh: BuildResult, edits: readonly TextEdit[], es: EditorSchema, base: Base,
    buildText: (text: string) => BuildResult): Transaction | undefined {
    const before = fresh.base.source;
    const after = applyTextEdits(before, edits);
    const span = editedSpan(before, edits);
    if (after === undefined || !span) {
        return undefined;
    }
    let plan: SourceChangePlan | undefined;
    try {
        plan = sourceChange(state.doc, fresh, buildText(after), es, span);
    } catch {
        return undefined; // the new text is not well-formed
    }
    if (!plan) {
        return undefined;
    }
    const tr = state.tr;
    try {
        if (plan.kind === 'attributes') {
            tr.setNodeMarkup(plan.pos, undefined, plan.attrs);
        } else {
            tr.replaceWith(plan.from, plan.to, plan.nodes);
        }
        const written = serializeDocument(tr.doc, base);
        // As the change itself, or reading the same and about as small (not the file rewritten).
        return written === after || (sameReading(written, after) && changedSize(before, written) <= 2 * changedSize(before, after) + 80) ? tr : undefined;
    } catch {
        return undefined;
    }
}

/** How many characters differ between two texts (the longer side of the span where they differ). */
export function changedSize(x: string, y: string): number {
    let start = 0;
    const max = Math.min(x.length, y.length);
    while (start < max && x.charCodeAt(start) === y.charCodeAt(start)) {
        start++;
    }
    let tail = 0;
    while (tail < max - start && x.charCodeAt(x.length - 1 - tail) === y.charCodeAt(y.length - 1 - tail)) {
        tail++;
    }
    return Math.max(x.length, y.length) - start - tail;
}

/**
 * Whether two XML texts read the same: the same elements with the same attributes (in any
 * order), the same text with whitespace runs taken as one space, the same comments and
 * processing instructions; whitespace between elements does not count.
 */
export function sameReading(x: string, y: string): boolean {
    try {
        return readingOf(x) === readingOf(y);
    } catch {
        return false;
    }
}

function readingOf(text: string): string {
    const doc = parse(text);
    const out: string[] = [];
    const walk = (nodes: readonly CstNode[]): void => {
        for (const node of nodes) {
            if (node.type === 'element') {
                const attrs = node.attrs.map((at) => `${at.name}=${JSON.stringify(at.value)}`).sort().join(' ');
                out.push(`<${node.name}${attrs ? ` ${attrs}` : ''}>`);
                walk(node.children);
                out.push(`</${node.name}>`);
            } else {
                const raw = text.slice(node.range.start, node.range.end).replace(/\s+/g, ' ');
                if (raw.trim() !== '') {
                    out.push(raw);
                }
            }
        }
    };
    walk(doc.children);
    return out.join('').replace(/ ?(<[^>]*>) ?/g, '$1');
}
