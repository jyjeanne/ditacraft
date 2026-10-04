/**
 * Grammar JSON → plain ProseMirror schema specification (spec §13.2).
 *
 * Produces the `nodes` object a `new Schema({ nodes })` call takes, without importing
 * ProseMirror, so it stays dependency-free. Phase 0 instantiates it in tests to prove
 * every compiled content expression is valid; the Phase 2 editor adds attrs, toDOM and
 * parseDOM on top of it.
 *
 * Environment-neutral.
 */

import { BLOCK_SUFFIX, pmName, TEXTRUN } from './pmNames';
import type { Grammar } from './types';

export interface NodeSpecLike {
    content?: string;
    group?: string;
    inline?: boolean;
    atom?: boolean;
}

export interface SchemaSpecLike {
    topNode: string;
    nodes: Record<string, NodeSpecLike>;
}

/** True when a content expression admits block-level children. */
function admitsBlocks(content: string, blockNames: Set<string>): boolean {
    return content.split(/[^A-Za-z0-9_]+/).some((token) => token === 'block' || token === TEXTRUN || blockNames.has(token));
}

export function buildSchemaSpec(grammar: Grammar): SchemaSpecLike {
    const nodes: Record<string, NodeSpecLike> = {
        doc: { content: 'block*' },
        text: { group: 'inline' },
        [TEXTRUN]: { content: 'inline*' },
    };

    const blockNames = new Set<string>();
    for (const [name, el] of Object.entries(grammar.elements)) {
        if (el.foreign) {
            continue;
        }
        if (el.placement === 'block') {
            blockNames.add(pmName(name));
        } else if (el.placement === 'dual') {
            blockNames.add(pmName(name) + BLOCK_SUFFIX);
        }
    }

    for (const [name, el] of Object.entries(grammar.elements)) {
        if (el.foreign) {
            continue;
        }
        const base = pmName(name);
        if (el.placement === 'block' || el.placement === 'dual') {
            const blockName = el.placement === 'dual' ? base + BLOCK_SUFFIX : base;
            nodes[blockName] = { content: el.content, group: 'block' };
        }
        if (el.placement === 'inline' || el.placement === 'dual') {
            // An inline element with block content (fn, xref with desc, data…) is edited as a
            // unit (a nested editor in Phase 2), so it is an atom in the inline flow.
            const atom = el.empty || admitsBlocks(el.content, blockNames);
            nodes[base] = { content: el.content, group: 'inline', inline: true, ...(atom ? { atom: true } : {}) };
        }
    }
    return { topNode: 'doc', nodes };
}
