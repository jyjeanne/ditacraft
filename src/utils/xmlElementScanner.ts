/**
 * Minimal client-side element scanner for the condition-highlighting
 * decoration pass (§4.5 Piece 2): finds every element carrying at least
 * one DITA profiling attribute and computes its full source range
 * (opening tag through matching closing tag), so the whole element — not
 * just its opening tag — can be dimmed when a `.ditaval` filter excludes
 * it.
 *
 * Regex-based, matching this codebase's established client-side XML
 * handling convention (see insertImageCommand.ts / fileCreationCommands.ts)
 * rather than a full parser. The depth-counting closing-tag search below
 * mirrors an existing server-side equivalent
 * (`KeySpaceService.findInnerContent`) — a client-local copy per this
 * project's established "duplicate primitives across the client/server
 * boundary" convention (client and server are separate bundles with no
 * shared runtime), not a new algorithm.
 */

export interface ProfiledElement {
    /** Offset of the opening tag's `<`. */
    start: number;
    /** Offset just past the matching closing tag (or the opening tag itself, if self-closing). */
    end: number;
    /** The element's own attribute map (lowercased attribute names). */
    attrs: Record<string, string>;
}

const OPEN_TAG_PATTERN = /<([a-zA-Z][\w-]*)\b((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>/g;
const ATTR_PATTERN = /([\w-]+)\s*=\s*"([^"]*)"|([\w-]+)\s*=\s*'([^']*)'/g;

function parseTagAttributes(attrsText: string): Record<string, string> {
    const attrs: Record<string, string> = {};
    ATTR_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = ATTR_PATTERN.exec(attrsText)) !== null) {
        const name = (match[1] ?? match[3]).toLowerCase();
        attrs[name] = match[2] ?? match[4];
    }
    return attrs;
}

/**
 * `[start, end)` offset spans of every `<!-- ... -->` comment in `content`.
 * `/code-review` correctness fix: without this, an opening tag inside a
 * comment (e.g. old content left commented out pending removal) was matched
 * as live content and dimmed alongside genuinely excluded elements — a
 * comment's contents were never rendered or published in the first place,
 * so highlighting them as "excluded by the filter" is misleading. Only the
 * *opening tag's* position is checked against these spans (see
 * `findProfiledElements` below) — a stray closing tag of the same name
 * inside a comment (a pathological, vanishingly rare case) can still
 * confuse the depth-counting closing-tag search; not guarded against here,
 * matching this module's regex-based (not a full parser) scope.
 */
function findCommentSpans(content: string): Array<[number, number]> {
    const spans: Array<[number, number]> = [];
    const pattern = /<!--[\s\S]*?-->/g;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content)) !== null) {
        spans.push([match.index, match.index + match[0].length]);
    }
    return spans;
}

function isWithinSpans(offset: number, spans: ReadonlyArray<[number, number]>): boolean {
    return spans.some(([start, end]) => offset >= start && offset < end);
}

/**
 * From just after an element's opening tag, find the offset just past its
 * matching closing tag, tracking nested same-name elements by depth.
 * Returns undefined if no matching close tag is found (a malformed or
 * truncated document) — the caller falls back to just the opening tag's
 * own range rather than dimming to end-of-file.
 */
function findMatchingCloseTag(content: string, fromIndex: number, tagName: string): number | undefined {
    const escaped = tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const tagPattern = new RegExp(`<(/?)${escaped}\\b(?:[^>"']|"[^"]*"|'[^']*')*?(/?)>`, 'gi');
    tagPattern.lastIndex = fromIndex;

    let depth = 1;
    let match: RegExpExecArray | null;
    while ((match = tagPattern.exec(content)) !== null) {
        const isCloseTag = match[1] === '/';
        const isSelfClosing = match[2] === '/';
        if (isCloseTag) {
            depth--;
            if (depth === 0) {
                return match.index + match[0].length;
            }
        } else if (!isSelfClosing) {
            depth++;
        }
    }
    return undefined;
}

/**
 * Find every element in `content` carrying at least one of `profilingAttrs`,
 * and compute each one's full source range.
 */
export function findProfiledElements(content: string, profilingAttrs: readonly string[]): ProfiledElement[] {
    const results: ProfiledElement[] = [];
    const commentSpans = findCommentSpans(content);
    OPEN_TAG_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = OPEN_TAG_PATTERN.exec(content)) !== null) {
        const [full, tagName, attrsText, selfClose] = match;
        // <prop> is the ditaval rule element itself, not authored content —
        // never itself a highlighting target even if it somehow carried a
        // matching attribute name.
        if (tagName.toLowerCase() === 'prop') {
            continue;
        }
        // A tag inside an XML comment isn't live content — never rendered
        // or published, so it can't be "excluded by the filter" either.
        if (isWithinSpans(match.index, commentSpans)) {
            continue;
        }

        const attrs = parseTagAttributes(attrsText);
        const hasProfilingAttr = profilingAttrs.some(attr => attrs[attr] !== undefined);
        if (!hasProfilingAttr) {
            continue;
        }

        const tagStart = match.index;
        if (selfClose === '/') {
            results.push({ start: tagStart, end: tagStart + full.length, attrs });
            continue;
        }

        const closeEnd = findMatchingCloseTag(content, tagStart + full.length, tagName);
        results.push({ start: tagStart, end: closeEnd ?? tagStart + full.length, attrs });
    }
    return results;
}
