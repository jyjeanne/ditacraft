/**
 * DITA @class handling: tokenizing, base-class lookup, and the placement of the base
 * vocabulary.
 *
 * DITA defines an element's semantics by its class ancestry, not its name: `uicontrol`
 * is `+ topic/ph ui-d/uicontrol`, so it is a phrase wherever it appears; `step` is
 * `- topic/li task/step`, so it is a list item. Placement is therefore decided by the
 * element's BASE token (`topic/ph`, `topic/li`, …) and is inherited by every
 * specialization, including a project's own.
 *
 * Environment-neutral.
 */

import type { Placement } from './types';

/** Class tokens, most general first: "- topic/note hazard-d/hazardstatement " → ["topic/note", "hazard-d/hazardstatement"]. */
export function classTokens(classValue: string | undefined): string[] {
    if (!classValue) {
        return [];
    }
    return classValue.trim().split(/\s+/).filter((t) => t.includes('/'));
}

/** The base token (first `module/element` token), e.g. "topic/note", or undefined. */
export function baseToken(classValue: string | undefined): string | undefined {
    return classTokens(classValue)[0];
}

/** Element-name part of a token: "hazard-d/hazardstatement" → "hazardstatement". */
export function tokenElement(token: string): string {
    return token.slice(token.indexOf('/') + 1);
}

/** Phrase-level base elements: only ever in inline (text) flow. */
const INLINE_BASE = new Set([
    'topic/ph',
    'topic/keyword',
    'topic/term',
    'topic/text',
    'topic/tm',
    'topic/cite',
    'topic/q',
    'topic/boolean',
    'topic/state',
    'topic/indextermref',
    'topic/index-base',
    'topic/longquoteref',
]);

/**
 * Base elements DITA allows both in phrase flow and as blocks (e.g. an <image> inside a
 * <p> and an <image> directly inside a <fig>). They need an inline and a block variant in
 * the Phase 2 schema.
 */
const DUAL_BASE = new Set([
    'topic/xref',
    'topic/image',
    'topic/data',
    'topic/data-about',
    'topic/foreign',
    'topic/unknown',
    'topic/fn',
    'topic/draft-comment',
    'topic/required-cleanup',
    'topic/indexterm',
    'topic/object',
    'topic/sort-as',
    // DITA 2.0 base additions.
    'topic/include',
    'topic/audio',
    'topic/video',
]);

/**
 * Placement of an element from its @class value; undefined when the class has no
 * `topic/` or `map/` base token (foreign or non-DITA vocabulary). Every other `topic/*`
 * and `map/*` base element is a block.
 */
export function basePlacement(classValue: string | undefined): Placement | undefined {
    const base = baseToken(classValue);
    if (!base) {
        return undefined;
    }
    if (INLINE_BASE.has(base)) {
        return 'inline';
    }
    if (DUAL_BASE.has(base)) {
        return 'dual';
    }
    if (base.startsWith('topic/') || base.startsWith('map/')) {
        return 'block';
    }
    return undefined;
}
