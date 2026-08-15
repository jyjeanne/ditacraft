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
    /** Offset just past the opening tag itself (`start === openTagEnd === end` -3-ish for a self-closing element -- concretely, `openTagEnd === end` for one, since there's no separate closing tag to reach). Lets a caller slice out just the element's *inner* content (between the tags) without re-deriving the closing tag's length. */
    openTagEnd: number;
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
        return { start, end: openTagEnd, openTagEnd, tagName };
    }

    const closeEnd = findClosingTagEnd(searchableText, tagName, openTagEnd);
    return closeEnd === undefined ? undefined : { start, end: closeEnd, openTagEnd, tagName };
}

/** The inner content of `extent` (between its opening and closing tags) — empty for a self-closing element. */
export function getElementInnerContent(content: string, extent: ElementExtent): string {
    if (extent.openTagEnd >= extent.end) {
        return '';
    }
    const closeTagLength = extent.tagName.length + 3; // `</` + tagName + `>`
    return content.slice(extent.openTagEnd, extent.end - closeTagLength);
}

/**
 * Given a comment/CDATA-blanked document, a tag name, and the offset just
 * past that tag's *opening* tag, depth-track forward to find the offset
 * just past its *matching* closing tag. Returns `undefined` for
 * malformed/unclosed content. Exported so other "find an element, then
 * need its full extent" callers (e.g. `inlineConref.ts`'s own
 * find-by-attribute discovery, which locates the opening tag a different
 * way than `findElementExtentById`'s by-id lookup) can reuse the same
 * depth-tracking core instead of reimplementing it.
 */
export function findClosingTagEnd(searchableText: string, tagName: string, fromOffset: number): number | undefined {
    const closeTag = `</${tagName}>`;
    const tagOpenPattern = new RegExp(`<${tagName}\\b${TAG_ATTRS}\\/?>`, 'g');
    let depth = 1;
    let pos = fromOffset;

    while (depth > 0 && pos < searchableText.length) {
        const nextClose = searchableText.indexOf(closeTag, pos);
        if (nextClose === -1) {
            return undefined; // Malformed/unclosed -- no reliable extent.
        }

        tagOpenPattern.lastIndex = pos;
        let openMatch: RegExpExecArray | null;
        while ((openMatch = tagOpenPattern.exec(searchableText)) !== null && openMatch.index < nextClose) {
            if (!openMatch[0].endsWith('/>')) {
                depth++;
            }
        }

        depth--;
        if (depth === 0) {
            return nextClose + closeTag.length;
        }
        pos = nextClose + closeTag.length;
    }

    return undefined;
}
