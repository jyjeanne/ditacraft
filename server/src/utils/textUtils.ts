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

/** A key name of a `@keys` attribute, found by {@link scanKeyDefinitions}. */
export interface KeyDefinitionToken {
    keyName: string;
    /** Offset of the key name in the text. */
    offset: number;
    /** Name of the element that defines the key. */
    elementName: string;
    /** Offset of that element's start tag. */
    elementOffset: number;
    /**
     * The key scope the key is defined in, within this text: the offset of the start tag of
     * the innermost element with `@keyscope` around the key (its own element included, as
     * the keys of a scope-defining element belong to that scope), or -1 for the scope of the
     * whole map. A `@keyscope` on the root element names the map's own scope, so it is -1.
     */
    scopeOffset: number;
}

const TAG_PATTERN = /<(\/?)([A-Za-z_][\w:.-]*)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>/g;
const ATTRIBUTE_PATTERN = /(^|\s)([A-Za-z_][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

/**
 * The key definitions of a map in document order: every name of every `@keys` attribute,
 * with its offset and key scope. Only start tags are read, quote-aware, so `keys="…"`
 * written in another attribute's value or in text is not taken for one. Pass the text
 * with comments and CDATA blanked out (offsets preserved), as stripCommentsAndCDATA does.
 */
export function scanKeyDefinitions(text: string): KeyDefinitionToken[] {
    const tokens: KeyDefinitionToken[] = [];
    // Open elements: name and the key scope their content is in
    const open: Array<{ name: string; scopeOffset: number }> = [];
    let rootSeen = false;
    TAG_PATTERN.lastIndex = 0;
    let tag: RegExpExecArray | null;
    while ((tag = TAG_PATTERN.exec(text)) !== null) {
        const [, closing, name, attributeText, selfClosing] = tag;
        if (closing) {
            const index = open.map(e => e.name).lastIndexOf(name);
            if (index !== -1) open.length = index;
            continue;
        }
        const isRoot = !rootSeen;
        rootSeen = true;
        const attributesStart = tag.index + 1 + name.length;
        let keys: { value: string; offset: number } | undefined;
        let hasKeyscope = false;
        ATTRIBUTE_PATTERN.lastIndex = 0;
        let attribute: RegExpExecArray | null;
        while ((attribute = ATTRIBUTE_PATTERN.exec(attributeText)) !== null) {
            const value = attribute[3] ?? attribute[4];
            if (attribute[2] === 'keys') {
                // The value ends before the closing quote, the last character of the match
                const valueEnd = attributesStart + attribute.index + attribute[0].length - 1;
                keys = { value, offset: valueEnd - value.length };
            } else if (attribute[2] === 'keyscope' && value.trim()) {
                hasKeyscope = true;
            }
        }
        const parentScope = open.length > 0 ? open[open.length - 1].scopeOffset : -1;
        const scopeOffset = hasKeyscope && !isRoot ? tag.index : parentScope;
        if (keys) {
            const tokenPattern = /\S+/g;
            let token: RegExpExecArray | null;
            while ((token = tokenPattern.exec(keys.value)) !== null) {
                tokens.push({
                    keyName: token[0], offset: keys.offset + token.index,
                    elementName: name, elementOffset: tag.index, scopeOffset,
                });
            }
        }
        if (!selfClosing) open.push({ name, scopeOffset });
    }
    return tokens;
}

/**
 * XML 1.0 name characters (XML 1.0 §2.3), as the contents of regular expression character
 * classes, for the `u` flag: a name is an XML_NAME_START character followed by XML_NAME_CHAR
 * characters; a name token (NMTOKEN) is XML_NAME_CHAR characters only. Letters of every script
 * are included.
 */
export const XML_NAME_START = String.raw`:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u{10000}-\u{EFFFF}`;
export const XML_NAME_CHAR = `${XML_NAME_START}\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040`;
