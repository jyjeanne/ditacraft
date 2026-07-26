/**
 * Shared text utilities for DITA validation.
 * Centralizes functions previously duplicated across multiple feature files.
 */

import * as path from 'path';
import { Range } from 'vscode-languageserver/node';
import { URI } from 'vscode-uri';

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
 * Convert a byte offset in `text` to a zero-based { line, character } position.
 * Handles `\r\n`, standalone `\r`, and `\n` line endings.
 *
 * This is the single canonical implementation — use it instead of local copies
 * in feature files (e.g., `findLineAndColumn` in validation.ts, `offsetToPosition`
 * in workspaceScanner.ts).
 */
export function offsetToPosition(
    text: string,
    offset: number,
): { line: number; character: number } {
    let line = 0;
    let lastLineStart = 0;
    const safeOffset = Math.min(Math.max(0, offset), text.length);

    for (let i = 0; i < safeOffset; i++) {
        if (text[i] === '\r') {
            line++;
            if (i + 1 < text.length && text[i + 1] === '\n') {
                i++;
            }
            lastLineStart = i + 1;
        } else if (text[i] === '\n') {
            line++;
            lastLineStart = i + 1;
        }
    }

    return { line, character: safeOffset - lastLineStart };
}

/**
 * Normalize a file system path for comparison.
 * On Windows (case-insensitive), lowercases the path.
 * On Linux/macOS (case-sensitive), preserves case.
 */
export function normalizeFsPath(filePath: string): string {
    const resolved = path.resolve(filePath);
    return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
}

/**
 * Check whether an absolute path resolves inside one of the given workspace
 * folders. Use this after every `path.resolve()` of a user-authored `href`,
 * `conref`, `conkeyref`, or similar reference before touching the filesystem
 * (`fs.readFile`, `fs.readdir`, `fs.access`, etc.), so a relative path that
 * escapes the workspace (e.g. `href="../../../../etc/passwd"`) cannot be used
 * to read or list files outside it.
 *
 * Returns `true` when `workspaceFolders` is empty (single-file mode, no
 * workspace boundary to enforce).
 */
export function isPathWithinWorkspace(absolutePath: string, workspaceFolders: readonly string[]): boolean {
    if (workspaceFolders.length === 0) {
        return true;
    }
    return findContainingWorkspaceFolder(absolutePath, workspaceFolders) !== undefined;
}

/**
 * Return the workspace folder that contains `absolutePath`, or undefined.
 *
 * Uses normalizeFsPath (not a bare path.normalize) so the comparison is
 * case-insensitive on Windows — otherwise two paths that refer to the
 * same file but were derived through different code paths (e.g. one via
 * a file:// URI round-trip, which vscode-uri lowercases the drive letter
 * of, and one from a raw fs path) would wrongly compare as different.
 */
export function findContainingWorkspaceFolder(
    absolutePath: string,
    workspaceFolders: readonly string[],
): string | undefined {
    const normalizedPath = normalizeFsPath(absolutePath);
    return workspaceFolders.find(folder => {
        const normalizedWorkspace = normalizeFsPath(folder);
        return normalizedPath === normalizedWorkspace ||
            normalizedPath.startsWith(normalizedWorkspace + path.sep);
    });
}

/**
 * Compute the workspace-folder list to actually enforce boundaries against
 * for a given document.
 *
 * If the document itself isn't inside any of the configured workspace
 * folders (e.g. a loose file opened via File > Open while a different
 * project folder is the active workspace), there is no workspace boundary
 * to enforce for *that document* — treating it as bounded by folders it
 * isn't even part of would block every relative reference it makes,
 * including trivial same-directory siblings. In that case this returns an
 * empty list, which isPathWithinWorkspace treats as single-file mode
 * (always permissive), matching how the document would behave if no
 * workspace were open at all.
 */
export function effectiveWorkspaceFolders(
    documentPath: string,
    workspaceFolders: readonly string[]
): readonly string[] {
    if (workspaceFolders.length === 0) {
        return workspaceFolders;
    }
    return isPathWithinWorkspace(documentPath, workspaceFolders) ? workspaceFolders : [];
}

/**
 * Escape special regex characters in a string for use in `new RegExp(...)`.
 */
export function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Convert a `file://` URI to a file system path with forward slashes.
 *
 * `vscode-uri`'s `URI.fsPath` returns OS-native separators (backslashes on
 * Windows). Normalising to forward slashes produces consistent paths across
 * platforms, which is required for string comparisons inside the LSP server
 * and for Node.js `fs` calls (Node accepts `/` on all platforms).
 */
export function uriToPath(uri: string): string {
    return URI.parse(uri).fsPath.replace(/\\/g, '/');
}
