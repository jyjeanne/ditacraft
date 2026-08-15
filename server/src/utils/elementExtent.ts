/**
 * Element Extent Lookup
 * Given XML content and a target element `id`, finds that element's full
 * span (opening tag through its matching closing tag) plus its tag name.
 *
 * `hover.ts`'s `getConrefPreview()` and `keySpaceService.ts`'s private
 * `findInnerContent()` each independently implement a version of this same
 * depth-tracking algorithm for their own narrower needs (a
 * 300-char-truncated hover preview, and "content starting just past an
 * already-located open tag," respectively) — this is the first caller
 * needing the full, untruncated span *and* its own open-tag-by-id
 * discovery in one call, so it's a new shared home for the pattern rather
 * than a third private copy. Used by `inlineConref.ts` (§6.1) to read a
 * resolved conref/conkeyref target's complete content before splicing it
 * into the referencing document.
 */

import { TAG_ATTRS } from './patterns';
import { stripCommentsAndCDATA, escapeRegex } from './textUtils';

export interface ElementExtent {
    /** Offset of the `<` starting the element's opening tag. */
    start: number;
    /** Offset just past the element's closing tag (or, for a self-closing element, its own `>`). */
    end: number;
    /** Offset just past the opening tag itself. Lets a caller slice out just the element's *inner* content (between the tags) without re-deriving the closing tag's length. */
    openTagEnd: number;
    /**
     * Offset of the `<` starting the closing tag (equals `end` for a
     * self-closing element, since there's no separate closing tag). A
     * closing tag's length isn't fixed at `tagName.length + 3` -- XML's
     * ETag production allows whitespace before the final `>` (`</p >`) --
     * so this is stored explicitly rather than derived from `end` and
     * `tagName.length` by a caller.
     */
    closeTagStart: number;
    tagName: string;
}

/**
 * Find the element with the given `id` attribute and return its full
 * span. Matches against a comment/CDATA-blanked view (offsets preserved)
 * so a tag-like fragment inside one is never mistaken for a real element,
 * and handles self-closing elements (`<x id="y"/>`, which by definition
 * have no separate closing tag to depth-track to). Returns `undefined`
 * when no element has that id, or its closing tag can't be found
 * (malformed/unclosed content).
 */
export function findElementExtentById(content: string, elementId: string): ElementExtent | undefined {
    const searchableText = stripCommentsAndCDATA(content);
    const escapedId = escapeRegex(elementId);
    // The trailing attrs segment is intentionally *lazy* (`*?`), not
    // `TAG_ATTRS`'s own greedy `*` -- a greedy run there would swallow a
    // self-closing element's trailing `/` too (nothing in `[^>"']`
    // excludes `/`), leaving the `(\/?)` group to match empty and this
    // function to wrongly treat `<x id="y"/>` as having a separate
    // closing tag to depth-track to.
    const openPattern = new RegExp(`<([\\w-]+)\\b${TAG_ATTRS}\\bid\\s*=\\s*["']${escapedId}["'](?:"[^"]*"|'[^']*'|[^>"'])*?(\\/?)>`);
    const match = openPattern.exec(searchableText);
    if (!match) {
        return undefined;
    }

    const tagName = match[1];
    const isSelfClosing = match[2] === '/';
    const start = match.index;
    const openTagEnd = match.index + match[0].length;

    if (isSelfClosing) {
        return { start, end: openTagEnd, openTagEnd, closeTagStart: openTagEnd, tagName };
    }

    const closeTag = findClosingTagEnd(searchableText, tagName, openTagEnd);
    return closeTag === undefined
        ? undefined
        : { start, end: closeTag.end, openTagEnd, closeTagStart: closeTag.start, tagName };
}

/** The inner content of `extent` (between its opening and closing tags) — empty for a self-closing element. */
export function getElementInnerContent(content: string, extent: ElementExtent): string {
    if (extent.openTagEnd >= extent.closeTagStart) {
        return '';
    }
    return content.slice(extent.openTagEnd, extent.closeTagStart);
}

/** The offset span of a closing tag, `<` through just past `>`. */
export interface ClosingTagSpan {
    /** Offset of the closing tag's `<`. */
    start: number;
    /** Offset just past the closing tag's `>`. */
    end: number;
}

/**
 * Given a comment/CDATA-blanked document, a tag name, and the offset just
 * past that tag's *opening* tag, depth-track forward to find its *matching*
 * closing tag's span. Returns `undefined` for malformed/unclosed content.
 * Exported so other "find an element, then need its full extent" callers
 * (e.g. `inlineConref.ts`'s own find-by-attribute discovery, which locates
 * the opening tag a different way than `findElementExtentById`'s by-id
 * lookup) can reuse the same depth-tracking core instead of reimplementing
 * it.
 */
export function findClosingTagEnd(searchableText: string, tagName: string, fromOffset: number): ClosingTagSpan | undefined {
    // XML's ETag production is `</` Name `S?` `>` -- whitespace before the
    // final `>` (e.g. `</p >`) is legal, so this has to search for the
    // pattern, not an exact `</tagName>` substring (`indexOf` would miss
    // that whitespace variant entirely and wrongly report the content as
    // unclosed).
    const closeTagPattern = new RegExp(`<\\/${tagName}\\s*>`, 'g');
    const tagOpenPattern = new RegExp(`<${tagName}\\b${TAG_ATTRS}\\/?>`, 'g');
    let depth = 1;
    let pos = fromOffset;

    while (depth > 0 && pos < searchableText.length) {
        closeTagPattern.lastIndex = pos;
        const closeMatch = closeTagPattern.exec(searchableText);
        if (!closeMatch) {
            return undefined; // Malformed/unclosed -- no reliable extent.
        }
        const nextClose = closeMatch.index;
        const closeTagEnd = nextClose + closeMatch[0].length;

        tagOpenPattern.lastIndex = pos;
        let openMatch: RegExpExecArray | null;
        while ((openMatch = tagOpenPattern.exec(searchableText)) !== null && openMatch.index < nextClose) {
            if (!openMatch[0].endsWith('/>')) {
                depth++;
            }
        }

        depth--;
        if (depth === 0) {
            return { start: nextClose, end: closeTagEnd };
        }
        pos = closeTagEnd;
    }

    return undefined;
}
