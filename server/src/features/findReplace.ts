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
 * "DITA-aware" here means comment/CDATA-aware: matches inside `<!-- -->`
 * or `<![CDATA[ ]]>` are ignored, using the same `stripCommentsAndCDATA`
 * blanking approach `textUtils.ts` already provides for ID/content
 * validation — blanking preserves line/character structure, so offsets
 * found in the stripped text apply unchanged to the original.
 */

import * as fs from 'fs/promises';
import { TextDocuments, TextEdit, WorkspaceEdit } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { URI } from 'vscode-uri';
import { collectDitaFilesAsync } from '../utils/workspaceScanner';
import { stripCommentsAndCDATA, offsetToRange, escapeRegex, uriToPath } from '../utils/textUtils';
import { mapWithConcurrency, MAX_CONCURRENT_READS } from './workspaceValidation';
import { isDitaFilePath } from './moveTopic';

export interface FindReplaceParams {
    query: string;
    replacement: string;
    useRegex: boolean;
    caseSensitive: boolean;
    wholeWord: boolean;
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

        const searchableText = stripCommentsAndCDATA(content);
        const edits: TextEdit[] = [];
        pattern.lastIndex = 0;

        let match: RegExpExecArray | null;
        while ((match = pattern.exec(searchableText)) !== null) {
            edits.push({
                range: offsetToRange(content, match.index, match.index + match[0].length),
                newText: params.useRegex ? expandReplacement(params.replacement, match) : params.replacement
            });
            // A zero-length match (e.g. the regex `a*` against text with no
            // "a") would otherwise leave lastIndex unchanged and loop
            // forever on the same position.
            if (match[0].length === 0) {
                pattern.lastIndex++;
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
