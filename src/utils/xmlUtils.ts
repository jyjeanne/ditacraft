/**
 * XML Text Utilities
 * Shared escaping for free-text values interpolated into generated
 * XML/DITA markup (as opposed to parsing/validating existing XML, which
 * belongs to the LSP server's own utilities).
 */

/**
 * Escape `&`, `<`, `>`, and `"` for safe interpolation into XML element or
 * attribute content. Mirrors the identical helper the server already uses
 * for the same purpose (`server/src/features/contextSnapshot.ts`'s
 * `escapeXml`) — client and server can't share code across the package
 * boundary this project maintains, so this is a parallel copy, not a
 * duplicate import.
 */
export function escapeXml(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Blank XML comments/CDATA while preserving line/character offsets, so a
 * tag-like fragment inside one (e.g. `<!-- TODO: convert to <task> -->`)
 * can never be mistaken for a real element. Shared by `sectionExtractor.ts`
 * (§5.4) and its own callers rather than each writing a private copy —
 * `keySpaceResolver.ts` has a third, inline instance of this same regex
 * pair predating this export; left as-is rather than refactored in, since
 * touching that file's existing, well-exercised map-parsing chain for a
 * pure dedup win isn't worth the regression risk on its own.
 */
export function stripCommentsAndCDATA(text: string): string {
    return text
        .replace(/<!--[\s\S]*?-->/g, m => m.replace(/[^\n\r]/g, ' '))
        .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, m => m.replace(/[^\n\r]/g, ' '));
}
