/**
 * Extract Topic From Section — pure extraction helper (§5.4)
 * Given a document's full text and a cursor/selection offset, finds the
 * innermost `<section>` element containing that offset and extracts what
 * `extractTopicCommand.ts` needs to turn it into a standalone topic file:
 * its raw span (for removal from the source), its own `id` (if any), its
 * `<title>` text (if any, to pre-fill the new topic's title prompt), and
 * the remaining body content with that leading title stripped out (DITA's
 * `<body>`/`<conbody>`/`<refbody>` content models don't allow a `<title>`
 * child directly, so it can't just be carried over verbatim).
 *
 * DITA sections don't nest (a `<section>` can't contain another
 * `<section>` per the DTD content model), so unlike a general XML tree
 * walker this only needs to track depth for `<section>` tags themselves —
 * comments/CDATA are blanked first (offsets preserved) so a `<section>`-
 * looking fragment inside one can't be mistaken for a real tag, matching
 * `stripCommentsAndCDATA`'s established approach elsewhere in this project
 * (server-side: `textUtils.ts`; client-side: `keySpaceResolver.ts`).
 */

export interface ExtractedSection {
    /** Offset of the `<` starting the `<section>` open tag. */
    start: number;
    /** Offset just past the matching `</section>`. */
    end: number;
    /** The section's own `id` attribute, if present. */
    id?: string;
    /** Plain-text title (tags stripped), if the section has a `<title>`. */
    title?: string;
    /**
     * The section's inner content with a leading `<title>...</title>`
     * element (if any) removed and the remainder trimmed — this is what's
     * structurally valid to drop straight into a new topic's body.
     */
    bodyContent: string;
}

const SECTION_TAG_PATTERN = /<(\/?)section\b((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>/g;
const ID_ATTR_PATTERN = /\bid\s*=\s*(["'])([^"']*)\1/;
const LEADING_TITLE_PATTERN = /^\s*<title\b(?:[^>"']|"[^"]*"|'[^']*')*>([\s\S]*?)<\/title>\s*/;

/** Blank XML comments/CDATA while preserving offsets, so a match inside one is never treated as a real tag. */
function stripCommentsAndCDATA(text: string): string {
    return text
        .replace(/<!--[\s\S]*?-->/g, m => m.replace(/[^\n\r]/g, ' '))
        .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, m => m.replace(/[^\n\r]/g, ' '));
}

/**
 * Find the innermost `<section>` element containing `offset`, if any.
 * Returns `undefined` when `offset` isn't inside a (well-formed) section.
 */
export function findEnclosingSection(text: string, offset: number): ExtractedSection | undefined {
    const searchableText = stripCommentsAndCDATA(text);

    interface OpenSection {
        tagStart: number;
        contentStart: number;
        attrsText: string;
    }
    const stack: OpenSection[] = [];
    let best: ExtractedSection | undefined;

    SECTION_TAG_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = SECTION_TAG_PATTERN.exec(searchableText)) !== null) {
        const isClosing = match[1] === '/';
        const isSelfClosing = match[3] === '/';
        const tagStart = match.index;
        const tagEnd = match.index + match[0].length;

        if (isClosing) {
            const open = stack.pop();
            if (!open) continue; // stray closing tag -- ignore
            if (open.tagStart <= offset && offset <= tagEnd) {
                // The innermost (last-pushed, so last-popped-so-far at this
                // depth) match containing offset wins -- sections don't
                // nest in valid DITA, so in practice this loop runs once.
                if (!best || tagStart - open.tagStart < best.end - best.start) {
                    best = buildExtractedSection(text, open.tagStart, tagEnd, open.contentStart, open.attrsText);
                }
            }
        } else if (isSelfClosing) {
            // A self-closing `<section/>` has no content -- only matches
            // an offset that falls exactly on the tag itself.
            if (tagStart <= offset && offset <= tagEnd) {
                if (!best) {
                    best = buildExtractedSection(text, tagStart, tagEnd, tagEnd, match[2]);
                }
            }
        } else {
            stack.push({ tagStart, contentStart: tagEnd, attrsText: match[2] });
        }
    }

    return best;
}

function buildExtractedSection(
    originalText: string,
    tagStart: number,
    end: number,
    contentStart: number,
    attrsText: string
): ExtractedSection {
    const idMatch = ID_ATTR_PATTERN.exec(attrsText);
    const id = idMatch ? idMatch[2] : undefined;

    const closeTagStart = originalText.lastIndexOf('<', end - 1);
    const rawInner = originalText.slice(contentStart, closeTagStart);

    const titleMatch = LEADING_TITLE_PATTERN.exec(rawInner);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : undefined;
    const bodyContent = (titleMatch ? rawInner.slice(titleMatch[0].length) : rawInner).trim();

    return { start: tagStart, end, id, title, bodyContent };
}
