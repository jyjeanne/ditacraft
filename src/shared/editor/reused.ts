/**
 * Resolved references in the visual editor's boxes: reused content (spec §13.7), and what keys
 * and links stand for — the text of `<keyword keyref="…"/>`, the title of an empty link's
 * target, the file of `<image keyref="…"/>` — and, in a map, the title of each row's target
 * (spec §13.8).
 *
 * The host resolves the topic's references as the preview does and sends one item per
 * element (src/editor/reusedContent.ts); items are keyed by the source offset of the element
 * in the document's text, and the page's document may have been edited since it was built, so
 * offsets go through a fresh build of the text the host has (SourcePositions, as for problem
 * marks and sync). Only elements kept whole on the page (atoms) and map rows take items.
 *
 * Environment-neutral.
 */

import type { Node as PMNode } from 'prosemirror-model';
import { isMapRow } from './maps';
import type { EditorSchema } from './schema';
import { SourcePositions } from './sourcePositions';
import type { BuildResult } from './toProseMirror';

/** What the element starting at `offset` stands for, or why it is not resolved. */
export interface ResolvedItem {
    offset: number;
    /** Reused content, a key (text or image), a link (its target's title), or a map row (its target's title). */
    kind: 'reuse' | 'key' | 'link' | 'row';
    /** Reused content: the reused element as the preview renders it (HTML of DitaCraft's renderer). */
    html?: string;
    /** A key's text, a glossary term, or the title of a link's target. */
    text?: string;
    /** An image's file (a webview URL), for an image given by a key. */
    src?: string;
    error?: string;
    /** Where it comes from: "file#topic/element", or the key. */
    from?: string;
}

const PUSH_ACTIONS = new Set(['pushafter', 'pushbefore', 'pushreplace', 'mark']);

/** A box of the page that stands for reused content (`conref`, `conkeyref`; not a push). */
export function isReuseNode(node: PMNode): boolean {
    if (!node.isAtom || !Array.isArray(node.attrs.xml)) {
        return false;
    }
    const xml = node.attrs.xml as [string, string][];
    const get = (name: string) => xml.find(([n]) => n === name)?.[1];
    const conref = get('conref');
    const conaction = get('conaction');
    return (get('conkeyref') !== undefined || (conref !== undefined && conref !== '-dita-use-conref-target'))
        && !(conaction !== undefined && PUSH_ACTIONS.has(conaction));
}

/** Where each item goes in `doc` (the page's document), through `fresh` (a build of the text the offsets refer to). */
export function resolvedTargets(doc: PMNode, fresh: BuildResult, items: readonly ResolvedItem[], es: EditorSchema): { pos: number; item: ResolvedItem }[] {
    const positions = new SourcePositions(doc, fresh, es);
    const out: { pos: number; item: ResolvedItem }[] = [];
    for (const item of items) {
        const { pos } = positions.positionOf(item.offset);
        const node = pos < doc.content.size ? doc.nodeAt(pos) : null;
        if (!node || node.isText || !Array.isArray(node.attrs.xml)) {
            continue;
        }
        // A row's target goes to the row; reused content to a reuse box; keys and links to
        // another element kept whole (an atom).
        if (item.kind === 'row' ? isMapRow(node, es) && !isReuseNode(node) : node.isAtom && (item.kind === 'reuse') === isReuseNode(node)) {
            out.push({ pos, item });
        }
    }
    return out;
}
