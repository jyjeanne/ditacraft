/**
 * Multi-File DITA-Aware Find & Replace
 * Backs the `dita/computeFindReplaceEdits` request: given a search query
 * (literal or regex) and a replacement, scans every DITA content file in
 * scope and returns a `WorkspaceEdit` of every match rewritten. The
 * client is responsible for showing this for review (VS Code's native
 * "needs confirmation" refactor-preview UI, not a custom diff viewer —
 * see `findReplaceCommand.ts`) before applying it; this handler only
 * *computes* the edit.
 *
 * "DITA-aware" here means markup-aware (`searchableSpans`): only text
 * content is searched — and, with `includeAttributeValues`, the inside of
 * attribute values. Tag names, attribute names, comments, CDATA sections,
 * processing instructions and the DOCTYPE are never matched, a match never
 * spans markup (each text run is searched on its own), and a match never
 * cuts an entity or character reference in two. Offsets stay those of the
 * original text.
 */

import * as fs from 'fs/promises';
import { TextDocuments, TextEdit, WorkspaceEdit } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { URI } from 'vscode-uri';
import { collectDitaFilesAsync } from '../utils/workspaceScanner';
import { offsetToRange, escapeRegex, uriToPath } from '../utils/textUtils';
import { mapWithConcurrency, MAX_CONCURRENT_READS } from './workspaceValidation';
import { isDitaFilePath } from './moveTopic';

export interface FindReplaceParams {
    query: string;
    replacement: string;
    useRegex: boolean;
    caseSensitive: boolean;
    wholeWord: boolean;
    /** Also search inside attribute values (ids, hrefs, keyrefs, navtitle…); text content only otherwise. */
    includeAttributeValues?: boolean;
    /** When set, restrict the search to this one file instead of the whole workspace. */
    scopeUri?: string;
}

export interface FindReplaceResult {
    edit: WorkspaceEdit | null;
    matchCount: number;
    fileCount: number;
}

const EMPTY_RESULT: FindReplaceResult = { edit: null, matchCount: 0, fileCount: 0 };

// `\b` is ASCII-only in JS regex — it doesn't treat accented Latin letters
// (é, ñ, ü, ...) as word characters, so `\b(?:café)\b` fails to match
// "café" at all (no boundary between "é" and a following space). This
// extends the word-character set with Latin-1 Supplement + Latin
// Extended-A (U+00C0-U+017F, covering the accented letters used by
// French/Spanish/German/... — this project ships French localization,
// see fr.json) via lookaround assertions instead of forcing regex mode's
// arbitrary user-supplied pattern onto the `u` flag, which could reject
// otherwise-valid patterns that aren't Unicode-mode-compatible.
const WHOLE_WORD_CHAR_CLASS = '[A-Za-z0-9_\\u00C0-\\u017F]';

/**
 * Build the search pattern for a query. Non-regex queries are escaped so
 * every character is matched literally. `wholeWord` wraps the pattern in
 * word-boundary lookarounds (see `WHOLE_WORD_CHAR_CLASS` above — not a
 * bare `\b`, which misses accented-letter word edges). Throws
 * `SyntaxError` for an invalid regex — callers should validate this
 * themselves before offering a preview (the client already does, via a
 * plain `new RegExp()` probe) but this handler guards it too rather than
 * assuming the client always will.
 */
export function buildSearchPattern(
    query: string,
    useRegex: boolean,
    caseSensitive: boolean,
    wholeWord: boolean
): RegExp {
    let source = useRegex ? query : escapeRegex(query);
    if (wholeWord) {
        source = `(?<!${WHOLE_WORD_CHAR_CLASS})(?:${source})(?!${WHOLE_WORD_CHAR_CLASS})`;
    }
    return new RegExp(source, caseSensitive ? 'g' : 'gi');
}

/**
 * Expand `$&`, `$$`, and `$1`-`$99` backreferences in a regex-mode
 * replacement string against a specific match, mirroring the common
 * subset of `String.prototype.replace`'s special replacement patterns.
 * `` $` `` and `$'` (text before/after the match) are deliberately not
 * supported — they need full surrounding-text context this per-match
 * helper doesn't have, and are rarely used in practice; a literal `` $` ``
 * or `$'` in a replacement string is passed through unexpanded rather than
 * silently dropped. Non-regex mode never calls this — `$` is just a
 * literal character there, matching ordinary "find and replace" UX.
 */
export function expandReplacement(replacement: string, match: RegExpExecArray): string {
    return replacement.replace(/\$(\$|&|\d{1,2})/g, (full: string, token: string) => {
        if (token === '$') return '$';
        if (token === '&') return match[0];
        const groupIndex = parseInt(token, 10);
        const group = match[groupIndex];
        return group !== undefined ? group : full;
    });
}

/**
 * The `[start, end)` spans of `content` that find & replace may change: the
 * text between tags and, with `includeAttributeValues`, the inside of each
 * attribute value (between its quotes). Comments, CDATA sections,
 * processing instructions, `<!DOCTYPE …>` (internal subset included), tag
 * and attribute names are left out. Exported for testing.
 */
export function searchableSpans(content: string, includeAttributeValues: boolean): Array<[number, number]> {
    const spans: Array<[number, number]> = [];
    const length = content.length;
    const skipTo = (from: number, terminator: string): number => {
        const end = content.indexOf(terminator, from);
        return end < 0 ? length : end + terminator.length;
    };
    let textStart = 0;
    let i = 0;
    while (i < length) {
        if (content[i] !== '<') {
            i++;
            continue;
        }
        if (i > textStart) {
            spans.push([textStart, i]);
        }
        if (content.startsWith('<!--', i)) {
            i = skipTo(i + 4, '-->');
        } else if (content.startsWith('<![CDATA[', i)) {
            i = skipTo(i + 9, ']]>');
        } else if (content.startsWith('<?', i)) {
            i = skipTo(i + 2, '?>');
        } else if (content.startsWith('<!', i)) {
            // <!DOCTYPE …> and its internal subset: up to the first '>' outside [ ] and quotes.
            let j = i + 2;
            let depth = 0;
            let quote = '';
            for (; j < length; j++) {
                const c = content[j];
                if (quote) {
                    if (c === quote) quote = '';
                } else if (c === '"' || c === '\'') {
                    quote = c;
                } else if (c === '[') {
                    depth++;
                } else if (c === ']') {
                    depth--;
                } else if (c === '>' && depth <= 0) {
                    break;
                }
            }
            i = Math.min(j + 1, length);
        } else {
            // A start or end tag: quotes only ever open attribute values.
            let j = i + 1;
            for (; j < length && content[j] !== '>'; j++) {
                const c = content[j];
                if (c === '"' || c === '\'') {
                    const close = content.indexOf(c, j + 1);
                    const end = close < 0 ? length : close;
                    if (includeAttributeValues && end > j + 1) {
                        spans.push([j + 1, end]);
                    }
                    j = end;
                }
            }
            i = Math.min(j + 1, length);
        }
        textStart = i;
    }
    if (length > textStart) {
        spans.push([textStart, length]);
    }
    return spans;
}

const REFERENCE = /&(?:#\d+|#x[0-9a-fA-F]+|[A-Za-z_][\w.-]*);/g;

/** Whether `[start, end)` cuts one of the entity or character references in `[spanStart, spanEnd)` in two. */
function cutsReference(content: string, spanStart: number, spanEnd: number, start: number, end: number): boolean {
    const text = content.slice(spanStart, spanEnd);
    REFERENCE.lastIndex = 0;
    let ref: RegExpExecArray | null;
    while ((ref = REFERENCE.exec(text)) !== null) {
        const refStart = spanStart + ref.index;
        const refEnd = refStart + ref[0].length;
        if ((start > refStart && start < refEnd) || (end > refStart && end < refEnd)) {
            return true;
        }
    }
    return false;
}

export async function handleComputeFindReplaceEdits(
    params: FindReplaceParams,
    documents: TextDocuments<TextDocument>,
    workspaceFolders: readonly string[] | undefined
): Promise<FindReplaceResult> {
    if (params.query.length === 0) {
        return EMPTY_RESULT;
    }
    if (!workspaceFolders || workspaceFolders.length === 0) {
        return EMPTY_RESULT;
    }

    let pattern: RegExp;
    try {
        pattern = buildSearchPattern(params.query, params.useRegex, params.caseSensitive, params.wholeWord);
    } catch {
        return EMPTY_RESULT; // Invalid regex — the client validates first, but never trust that alone.
    }

    let files: string[];
    if (params.scopeUri) {
        const scopedPath = uriToPath(params.scopeUri);
        // The workspace-wide path is already filtered to DITA content
        // files by collectDitaFilesAsync — scopeUri bypassed that filter
        // entirely, so a non-DITA active file (package.json, a .md file,
        // ...) would otherwise get rewritten by an arbitrary regex/literal
        // search with no DITA-aware guard at all.
        files = isDitaFilePath(scopedPath) ? [scopedPath] : [];
    } else {
        files = await collectDitaFilesAsync(workspaceFolders);
    }

    const changes: { [uri: string]: TextEdit[] } = {};
    let matchCount = 0;
    let fileCount = 0;

    // Bounded concurrency, not an unbounded Promise.all — a large
    // workspace's worth of simultaneous file reads risks exhausting file
    // descriptors (EMFILE), the same failure class
    // workspaceValidation.ts's mapWithConcurrency already guards against
    // for its own bulk reads.
    await mapWithConcurrency(files, MAX_CONCURRENT_READS, async (filePath) => {
        const fileUri = URI.file(filePath).toString();
        const openDoc = documents.get(fileUri);

        let content: string;
        if (openDoc) {
            content = openDoc.getText();
        } else {
            try {
                content = await fs.readFile(filePath, 'utf-8');
            } catch {
                return;
            }
        }

        const edits: TextEdit[] = [];
        // Each text run (or attribute value) on its own: a match never spans markup.
        for (const [spanStart, spanEnd] of searchableSpans(content, params.includeAttributeValues ?? false)) {
            const text = content.slice(spanStart, spanEnd);
            pattern.lastIndex = 0;
            let match: RegExpExecArray | null;
            while ((match = pattern.exec(text)) !== null) {
                const start = spanStart + match.index;
                const end = start + match[0].length;
                if (!cutsReference(content, spanStart, spanEnd, start, end)) {
                    edits.push({
                        range: offsetToRange(content, start, end),
                        newText: params.useRegex ? expandReplacement(params.replacement, match) : params.replacement
                    });
                }
                // A zero-length match (e.g. the regex `a*` against text with no
                // "a") would otherwise leave lastIndex unchanged and loop
                // forever on the same position.
                if (match[0].length === 0) {
                    pattern.lastIndex++;
                }
            }
        }

        if (edits.length > 0) {
            changes[fileUri] = edits;
            matchCount += edits.length;
            fileCount++;
        }
    });

    return fileCount > 0 ? { edit: { changes }, matchCount, fileCount } : EMPTY_RESULT;
}
