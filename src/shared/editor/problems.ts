/**
 * Language-server diagnostics → problem marks on the visual editor's page (spec §11.1).
 *
 * Diagnostics are offsets in the document's text. The page's document was built from an
 * earlier text and edited since, so its own source ranges are those of that earlier text.
 * The marks are therefore found in a fresh build of the current text (where every node knows
 * its source range) and carried to the page's document by tree path: the page's document
 * serializes to that text, so it has the same shape — checked element by element; where it
 * differs, the mark goes to the deepest element that still matches.
 *
 * A diagnostic that starts in a paragraph's text marks that text (up to its end, within the
 * paragraph); one in a start tag (an attribute), or in an element kept as written, marks the
 * element. Several diagnostics on the same place make one mark.
 *
 * Environment-neutral.
 */

import type { Node as PMNode } from 'prosemirror-model';
import type { EditorSchema } from './schema';
import type { BuildResult, NodeOrigin } from './toProseMirror';

export type ProblemSeverity = 'error' | 'warning' | 'info';

export interface ProblemItem {
    /** Source offsets of the diagnostic's range in the document's text. */
    start: number;
    end: number;
    /** 1-based line, for messages. */
    line: number;
    severity: ProblemSeverity;
    message: string;
    code?: string;
    source?: string;
}

export interface ProblemMark {
    /** Range in the page's document: a node (`inline` false) or text inside a paragraph. */
    from: number;
    to: number;
    inline: boolean;
    /** The most severe of `items`. */
    severity: ProblemSeverity;
    items: ProblemItem[];
}

const RANK: Record<ProblemSeverity, number> = { error: 0, warning: 1, info: 2 };

type Target = { from: number; to: number; inline: boolean };

/**
 * Marks for `items` on `doc` (the page's document), through `fresh`: a build of the text the
 * diagnostics' offsets refer to.
 */
export function problemMarks(doc: PMNode, fresh: BuildResult, items: readonly ProblemItem[], es: EditorSchema): ProblemMark[] {
    const origin = fresh.base.origin;
    const nameOf = (n: PMNode): string => es.role(n.type)?.element ?? n.type.name;
    const inTags = (o: NodeOrigin, at: number): boolean => o.element !== undefined && (at < o.contentStart || at >= o.contentEnd);

    /** Inside a paragraph of the fresh build: an inline node, or a text range (positions relative to its content). */
    const inlineTarget = (block: PMNode, item: ProblemItem): { node: string; at: number } | { from: number; to: number } | undefined => {
        let hit: { node: string; at: number } | undefined;
        const chars: { rel: number; start: number; end: number }[] = [];
        block.descendants((n, rel) => {
            if (hit) {
                return false;
            }
            const o = origin.get(n);
            if (!o) {
                return true;
            }
            if (n.isText) {
                const t = o.text;
                for (let k = 0; t && k < t.display.length; k++) {
                    chars.push({ rel: rel + k, start: t.map[k], end: t.map[k + 1] });
                }
                return false;
            }
            if (o.start <= item.start && item.start < o.end && (n.isAtom || inTags(o, item.start))) {
                hit = { node: nameOf(n), at: rel };
                return false;
            }
            return true;
        });
        if (hit) {
            return hit;
        }
        const first = chars.findIndex((c) => c.end > item.start);
        if (first === -1) {
            return undefined;
        }
        let last = first;
        for (let k = first + 1; k < chars.length && chars[k].start < item.end; k++) {
            last = k;
        }
        return { from: chars[first].rel, to: chars[last].rel + 1 };
    };

    const locate = (item: ProblemItem): Target | undefined => {
        // The path, in the fresh build, of the nodes containing the start.
        const path: number[] = [];
        const freshNodes: PMNode[] = [];
        let inline: ReturnType<typeof inlineTarget>;
        let node = fresh.doc;
        for (;;) {
            let next = -1;
            for (let i = 0; i < node.childCount && next === -1; i++) {
                const o = origin.get(node.child(i));
                if (o && o.start <= item.start && item.start < o.end) {
                    next = i;
                }
            }
            if (next === -1) {
                break;
            }
            const child = node.child(next);
            path.push(next);
            freshNodes.push(child);
            const o = origin.get(child)!;
            if (inTags(o, item.start) || child.isAtom) {
                break;
            }
            if (child.inlineContent) {
                inline = inlineTarget(child, item);
                break;
            }
            node = child;
        }
        // The same path in the page's document.
        let live = doc;
        let pos = -1;
        let matched = 0;
        for (let d = 0; d < path.length; d++) {
            const i = path[d];
            if (i >= live.childCount || nameOf(live.child(i)) !== nameOf(freshNodes[d])) {
                break;
            }
            let p = pos + 1;
            for (let k = 0; k < i; k++) {
                p += live.child(k).nodeSize;
            }
            pos = p;
            live = live.child(i);
            matched++;
        }
        if (matched === 0) {
            const root = doc.firstChild;
            return root ? { from: 0, to: root.nodeSize, inline: false } : undefined;
        }
        if (matched === path.length && inline && live.inlineContent) {
            const start = pos + 1;
            const end = start + live.content.size;
            if ('node' in inline) {
                const at = start + inline.at;
                const n = at < end ? doc.nodeAt(at) : null;
                if (n && !n.isText && nameOf(n) === inline.node) {
                    return { from: at, to: at + n.nodeSize, inline: false };
                }
            } else {
                const from = Math.min(start + inline.from, end);
                const to = Math.min(start + inline.to, end);
                if (from < to) {
                    return { from, to, inline: true };
                }
            }
        }
        return { from: pos, to: pos + live.nodeSize, inline: false };
    };

    const marks = new Map<string, ProblemMark>();
    for (const item of items) {
        const target = locate(item);
        if (!target) {
            continue;
        }
        const key = `${target.inline ? 'i' : 'n'}:${target.from}:${target.to}`;
        const mark = marks.get(key);
        if (mark) {
            mark.items.push(item);
            if (RANK[item.severity] < RANK[mark.severity]) {
                mark.severity = item.severity;
            }
        } else {
            marks.set(key, { ...target, severity: item.severity, items: [item] });
        }
    }
    return [...marks.values()].sort((a, b) => a.from - b.from || a.to - b.to);
}
