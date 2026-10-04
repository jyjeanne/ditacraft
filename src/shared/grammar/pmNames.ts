/**
 * ProseMirror node-type names for DITA elements.
 *
 * ProseMirror content expressions tokenize on non-word characters, so `line-through`
 * or `steps-unordered` cannot be used as written; `text` and `doc` are reserved by
 * ProseMirror, and `block`/`inline`/`textrun` are the schema's own group and node names.
 * Every grammar's content expressions are written over these mangled names.
 *
 * Environment-neutral.
 */

const RESERVED = new Set(['text', 'doc', 'block', 'inline', 'textrun']);

/** Synthetic block holding a run of text/inline siblings inside a block-mixed model. */
export const TEXTRUN = 'textrun';

/** Name of the block-level variant of a dual-placement element. */
export const BLOCK_SUFFIX = '__block';

export function pmName(elementName: string): string {
    const safe = elementName.replace(/[^A-Za-z0-9_]/g, '_');
    return RESERVED.has(safe) ? `dita_${safe}` : safe;
}

export function pmBlockName(elementName: string): string {
    return pmName(elementName) + BLOCK_SUFFIX;
}
