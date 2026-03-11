/**
 * Shared text utilities for DITA validation.
 * Centralizes functions previously duplicated across multiple feature files.
 */

import { Range } from 'vscode-languageserver/node';

/**
 * Strip XML comments and CDATA sections, preserving line structure
 * so that line/column offsets remain valid.
 *
 * Use this when rules need to inspect element content (e.g., checking
 * what's inside `<pre>`). For ID/cross-ref validation where code content
 * could cause false positives, use {@link stripCommentsAndCodeContent}.
 */
export function stripCommentsAndCDATA(text: string): string {
    return text
        .replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n\r]/g, ' '))
        .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, (m) => m.replace(/[^\n\r]/g, ' '));
}

/**
 * Strip XML comments, CDATA sections, **and** code/pre element content,
 * preserving line structure so that line/column offsets remain valid.
 *
 * Code element content (codeblock, pre, screen, msgblock) is blanked to
 * prevent false positives from literal XML examples (e.g., `&lt;variable id="x">`).
 * The opening/closing tags are preserved since they may carry real attributes.
 */
export function stripCommentsAndCodeContent(text: string): string {
    return stripCommentsAndCDATA(text)
        .replace(/(<(codeblock|pre|screen|msgblock)\b[^>]*>)([\s\S]*?)(<\/\2>)/g,
            (_m, open: string, _tag: string, content: string, close: string) =>
                open + content.replace(/[^\n\r]/g, ' ') + close);
}

/**
 * Convert byte offsets to an LSP Range. Handles `\r\n` correctly.
 */
export function offsetToRange(text: string, start: number, end: number): Range {
    let line = 0;
    let char = 0;
    let startLine = 0;
    let startChar = 0;
    let endLine = 0;
    let endChar = 0;

    const safeStart = Math.min(start, text.length);
    const safeEnd = Math.min(end, text.length);

    for (let i = 0; i <= safeEnd; i++) {
        if (i === safeStart) { startLine = line; startChar = char; }
        if (i === safeEnd) { endLine = line; endChar = char; break; }
        if (text[i] === '\r') {
            line++;
            char = 0;
            if (i + 1 <= safeEnd && text[i + 1] === '\n') {
                i++;
                if (i === safeStart) { startLine = line; startChar = char; }
                if (i === safeEnd) { endLine = line; endChar = char; break; }
            }
        } else if (text[i] === '\n') {
            line++;
            char = 0;
        } else {
            char++;
        }
    }

    return Range.create(startLine, startChar, endLine, endChar);
}

/**
 * Escape special regex characters in a string for use in `new RegExp(...)`.
 */
export function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
