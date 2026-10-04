/*
 * Derived from DITA Editor (https://github.com/sageata/dita-editor), files src/cst/element-ids.ts
 * and src/host/scroll-handoff.ts.
 * Copyright 2026 Paul Razvan Sarbu. Licensed under the Apache License, Version 2.0;
 * see LICENSE-THIRD-PARTY/apache-2.0.txt.
 * Modified by DitaCraft (2026): merged into one index built once per parse (the originals
 * re-parse the source on every lookup); every element is addressable (not only structural
 * kinds); lookups return the containing chain so a caller can fall back to an ancestor that
 * is actually rendered.
 */

/**
 * Element identity and source-offset mapping for one parsed document.
 *
 * Ids are depth-first indexes over all elements (`e0`, `e1`, …). They are valid for one
 * parse only — any edit can shift them — so every consumer re-resolves after a render.
 */

import type { CstNode, Document, ElementNode } from './types';
import { isElement } from './types';

export class ElementIndex {
    private readonly ids = new Map<ElementNode, string>();
    private readonly byId = new Map<string, ElementNode>();
    /** All elements in document (pre-)order. */
    private readonly ordered: ElementNode[] = [];

    constructor(public readonly doc: Document) {
        let index = 0;
        const visit = (nodes: CstNode[]): void => {
            for (const node of nodes) {
                if (!isElement(node)) {
                    continue;
                }
                const id = `e${index++}`;
                this.ids.set(node, id);
                this.byId.set(id, node);
                this.ordered.push(node);
                visit(node.children);
            }
        };
        visit(doc.children);
    }

    get size(): number {
        return this.ordered.length;
    }

    idOf(el: ElementNode): string | undefined {
        return this.ids.get(el);
    }

    element(id: string): ElementNode | undefined {
        return this.byId.get(id);
    }

    /** Offset of the element's start tag (`<name`). */
    openingTagOffset(id: string): number | undefined {
        return this.byId.get(id)?.openTagRange.start;
    }

    /**
     * Ids of the elements that contain `offset`, innermost first. When the offset sits in
     * whitespace between elements (or outside every element), the nearest following element
     * is used, else the nearest preceding one. Empty only for a document with no elements.
     */
    chainAt(offset: number): string[] {
        if (this.ordered.length === 0) {
            return [];
        }
        const source = this.doc.source;
        const bounded = Math.max(0, Math.min(offset, source.length));
        let innermost: ElementNode | undefined;
        if (!isInterElementWhitespace(source, bounded)) {
            innermost = this.innermostContaining(bounded);
        }
        if (!innermost) {
            innermost = this.ordered.find((el) => el.range.start >= bounded)
                ?? [...this.ordered].reverse().find((el) => el.range.end <= bounded)
                ?? this.ordered[0];
        }
        const chain: string[] = [];
        for (let el: ElementNode | null | undefined = innermost; el; el = el.parent) {
            const id = this.ids.get(el);
            if (id) {
                chain.push(id);
            }
        }
        return chain;
    }

    private innermostContaining(offset: number): ElementNode | undefined {
        // Descend from the top level: at each depth pick the child element containing offset.
        let candidates: CstNode[] = this.doc.children;
        let found: ElementNode | undefined;
        for (;;) {
            const next = candidates.find(
                (n): n is ElementNode => isElement(n) && n.range.start <= offset && offset < n.range.end,
            );
            if (!next) {
                return found;
            }
            found = next;
            candidates = next.children;
        }
    }
}

function isInterElementWhitespace(source: string, offset: number): boolean {
    if (offset >= source.length || !/\s/.test(source[offset])) {
        return false;
    }
    const textStart = source.lastIndexOf('>', offset - 1) + 1;
    const nextTag = source.indexOf('<', offset);
    const textEnd = nextTag === -1 ? source.length : nextTag;
    return textStart <= offset && offset < textEnd && source.slice(textStart, textEnd).trim() === '';
}
