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
