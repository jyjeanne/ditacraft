/**
 * Page positions ↔ source offsets in the visual editor: cursor and scroll sync with the text
 * editor, and the handoffs between the two (spec §11.2 applied to the editor).
 *
 * Offsets are those of the document's current text, while the page's document was built from
 * an earlier text and edited since. As for problem marks (problems.ts), the correspondence goes
 * through a fresh build of the current text — where every node knows its source range — by
 * tree path, element by element; where the two differ, the deepest element that matches.
 *
 * Environment-neutral.
 */

import type { Node as PMNode } from 'prosemirror-model';
import type { EditorSchema } from './schema';
import type { BuildResult, NodeOrigin } from './toProseMirror';

/** A page position for a source offset. */
export interface PagePosition {
    pos: number;
    /** True when `pos` is before a node (a block, an element kept whole), false in text. */
    node: boolean;
}

interface Char {
    rel: number;
    start: number;
    end: number;
}

export class SourcePositions {
    private readonly origin: WeakMap<PMNode, NodeOrigin>;

    /** `doc`: the page's document; `fresh`: a build of the text offsets refer to. */
    constructor(private readonly doc: PMNode, private readonly fresh: BuildResult, private readonly es: EditorSchema) {
        this.origin = fresh.base.origin;
    }

    private nameOf(n: PMNode): string {
        return this.es.role(n.type)?.element ?? n.type.name;
    }

    /** Displayed characters of a paragraph of the fresh build (positions relative to its content), and the inline nodes kept whole. */
    private chars(block: PMNode): { chars: Char[]; atoms: { rel: number; o: NodeOrigin }[] } {
        const chars: Char[] = [];
        const atoms: { rel: number; o: NodeOrigin }[] = [];
        block.descendants((n, rel) => {
            const o = this.origin.get(n);
            if (n.isText) {
                const t = o?.text;
                for (let k = 0; t && k < t.display.length; k++) {
                    chars.push({ rel: rel + k, start: t.map[k], end: t.map[k + 1] });
                }
                return false;
            }
            if (n.isAtom && o) {
                atoms.push({ rel, o });
            }
            return true;
        });
        return { chars, atoms };
    }

    /**
     * The page position of source offset `offset`: in text, before that character; in a start
     * tag or an element kept whole, before the element; in layout between elements, before the
     * next element; in an end tag (or after the last child), at the end of the element's text.
     */
    positionOf(offset: number): PagePosition {
        const path: number[] = [];
        const freshNodes: PMNode[] = [];
        let rel: number | undefined;
        let atEnd = false;
        let node = this.fresh.doc;
        for (;;) {
            let next = -1;
            for (let i = 0; i < node.childCount && next === -1 && !atEnd; i++) {
                const o = this.origin.get(node.child(i));
                if (o && offset < o.end) {
                    next = i; // the child containing the offset, or the next one after it
                }
            }
            if (next === -1) {
                // After every child: towards the end of the last one.
                for (let i = node.childCount - 1; i >= 0 && next === -1; i--) {
                    next = this.origin.has(node.child(i)) ? i : -1;
                }
                atEnd = true;
            }
            if (next === -1) {
                break;
            }
            const child = node.child(next);
            path.push(next);
            freshNodes.push(child);
            const o = this.origin.get(child)!;
            if (!atEnd && (o.start > offset || (o.element && offset < o.contentStart))) {
                break; // before the next element, or in a start tag
            }
            if (child.isAtom) {
                break;
            }
            atEnd = atEnd || (o.element !== undefined && offset >= o.contentEnd);
            if (child.inlineContent) {
                const { chars, atoms } = this.chars(child);
                const atom = atEnd ? undefined : atoms.find((a) => a.o.start <= offset && offset < a.o.end);
                rel = atom ? atom.rel : atEnd ? child.content.size : (chars.find((c) => c.end > offset)?.rel ?? child.content.size);
                break;
            }
            node = child;
        }
        // The same path in the page's document.
        let live = this.doc;
        let pos = -1;
        let matched = 0;
        for (let d = 0; d < path.length; d++) {
            const i = path[d];
            if (i >= live.childCount || this.nameOf(live.child(i)) !== this.nameOf(freshNodes[d])) {
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
            return { pos: 0, node: true };
        }
        if (matched === path.length && rel !== undefined && live.inlineContent) {
            return { pos: pos + 1 + Math.min(rel, live.content.size), node: false };
        }
        return { pos, node: true };
    }

    /**
     * The source offset of page position `pos`: in text, of the character after it (or the end
     * of the paragraph's text); between elements, of the next element's start.
     */
    offsetOf(pos: number): number {
        const $pos = this.doc.resolve(Math.max(0, Math.min(pos, this.doc.content.size)));
        let fresh = this.fresh.doc;
        let matched = true;
        for (let d = 0; d < $pos.depth; d++) {
            const i = $pos.index(d);
            if (i >= fresh.childCount || this.nameOf(fresh.child(i)) !== this.nameOf($pos.node(d + 1))) {
                matched = false;
                break;
            }
            fresh = fresh.child(i);
        }
        const o = this.origin.get(fresh);
        const rootStart = this.origin.get(this.fresh.doc.firstChild!)?.start ?? 0;
        if (!matched) {
            return o?.start ?? rootStart;
        }
        if (fresh.inlineContent) {
            const { chars, atoms } = this.chars(fresh);
            const at = $pos.parentOffset;
            const atom = atoms.find((a) => a.rel === at);
            if (atom) {
                return atom.o.start;
            }
            const char = chars.find((c) => c.rel >= at);
            return char ? char.start : (chars.length > 0 ? chars[chars.length - 1].end : (o?.contentStart ?? rootStart));
        }
        const i = $pos.index($pos.depth);
        const child = i < fresh.childCount ? this.origin.get(fresh.child(i)) : undefined;
        return child?.start ?? o?.contentEnd ?? rootStart;
    }
}
