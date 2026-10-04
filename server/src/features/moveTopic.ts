/**
 * Move Topic with Reference Updates
 * Backs the `dita/computeMoveEdits` request: given one or more file moves
 * (as reported by VS Code's `onDidRenameFiles`), returns a `WorkspaceEdit`
 * that keeps every relative file reference pointing where it did:
 *
 * - **inbound** — in every other DITA file, a reference that pointed at a
 *   moved file's *old* path is rewritten to its new relative path;
 * - **outbound** — in each moved file, every relative reference is
 *   re-resolved from the folder the file was in and rewritten relative to
 *   the folder it is in now (to the target's new path when the target moved
 *   in the same operation). An in-place rename changes none of them, except
 *   references to the file itself or to another moved file.
 *
 * References are the `href`, `conref`, `conrefend`, `data`, `codebase` and
 * `longdescref` attributes with a relative file part (`relativeFileReferences`):
 * fragment-only references, URLs, absolute paths, and references inside
 * comments or CDATA sections (code samples) are left as written.
 *
 * A moved folder — VS Code reports a folder rename as a single
 * `{oldUri: folder, newUri: renamedFolder}` pair, not one entry per contained
 * file — counts as a move of every file in it: each DITA file it holds is a
 * moved file (outbound), and a reference into it from outside — to a topic,
 * an image, any file — follows it (inbound). References between files of
 * the folder are unchanged. Any other moved file (an image, a `.ditaval`, a
 * PDF…) is only referred to: the references to it follow it (inbound).
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { TextDocuments, TextEdit, WorkspaceEdit, Range } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { URI } from 'vscode-uri';
import { collectDitaFilesAsync } from '../utils/workspaceScanner';
import { offsetToPosition, uriToPath, normalizeFsPath, stripCommentsAndCDATA } from '../utils/textUtils';
import { mapWithConcurrency, MAX_CONCURRENT_READS } from './workspaceValidation';

// ── Request/response types (mirrored on the client, src/extension.ts) ──────

export interface FileMove {
    oldUri: string;
    newUri: string;
}

export interface ComputeMoveEditsParams {
    moves: FileMove[];
}

const DITA_FILE_EXTENSIONS = new Set(['.dita', '.ditamap', '.bookmap']);

/**
 * True for DITA *content* files (topic/map/bookmap) — excludes `.ditaval`,
 * which carries filtering rules rather than content. Exported so other
 * features needing the same "is this file in scope" check (e.g.
 * `findReplace.ts`'s single-file scope option) reuse this rather than
 * writing their own copy.
 */
export function isDitaFilePath(filePath: string): boolean {
    return DITA_FILE_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

/**
 * Turn an OS-native relative path into a forward-slashed href value,
 * matching DITA's URI-reference convention regardless of authoring
 * platform. Returns undefined for the pathological case `path.relative()`
 * itself falls back to an absolute path for (e.g. different Windows drive
 * letters between the referencing file and the move's new location) —
 * inserting an OS-absolute path into a relative href would be worse than
 * leaving the stale-but-at-least-relative original value untouched.
 */
function toHrefPath(relativePath: string): string | undefined {
    if (path.isAbsolute(relativePath)) {
        return undefined;
    }
    return relativePath.split(path.sep).join('/');
}

/** A relative file reference: an attribute value and its file part and fragment. */
export interface FileReference {
    value: string;
    valueStart: number;
    valueEnd: number;
    /** The file part, as written (percent-encoding included). */
    file: string;
    /** After `#`, undefined when there is none. */
    fragment?: string;
}

const REFERENCE_PATTERN = /(?<=\s)(href|conref|conrefend|data|codebase|longdescref)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

/**
 * Every reference attribute in `content` with a relative file part: not
 * fragment-only, not a URL (a scheme of 2+ characters; `C:` is a drive) or
 * an absolute path. Comments and CDATA sections are skipped — a code sample
 * is not a reference. Exported for testing.
 */
export function relativeFileReferences(content: string): FileReference[] {
    const searchable = stripCommentsAndCDATA(content);
    const references: FileReference[] = [];
    REFERENCE_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = REFERENCE_PATTERN.exec(searchable)) !== null) {
        const value = match[2] ?? match[3];
        const hash = value.indexOf('#');
        const file = (hash < 0 ? value : value.slice(0, hash)).trim();
        if (file === '' || /^[a-z][\w+.-]+:/i.test(file) || path.isAbsolute(file) || file.startsWith('/')) {
            continue;
        }
        const valueStart = match.index + match[0].length - 1 - value.length;
        references.push({ value, valueStart, valueEnd: valueStart + value.length, file, fragment: hash < 0 ? undefined : value.slice(hash + 1) });
    }
    return references;
}

/** The absolute path a reference's file part names, written in a file in `fromDir`. */
function resolveReference(fromDir: string, file: string): string {
    let decoded = file;
    try {
        decoded = decodeURI(file);
    } catch {
        // Malformed escapes: use the reference as written.
    }
    return path.resolve(fromDir, decoded);
}

/** The value naming `targetPath` from a file in `fromDir`, written like `original` (encoded spaces, a folder's trailing `/`, fragment). */
function referenceValue(fromDir: string, targetPath: string, original: FileReference): string | undefined {
    let relative = toHrefPath(path.relative(fromDir, targetPath));
    if (relative === undefined) {
        return undefined;
    }
    if (/[\\/]$/.test(original.file)) {
        relative = relative === '' ? './' : `${relative}/`;
    }
    const file = original.file.includes('%') ? relative.replace(/ /g, '%20') : relative;
    return original.fragment === undefined ? file : `${file}#${original.fragment}`;
}

async function isDirectory(filePath: string): Promise<boolean> {
    try {
        return (await fs.stat(filePath)).isDirectory();
    } catch {
        return false;
    }
}

/** The text of a file: its open document (unsaved changes included), else the disk. */
async function readContent(filePath: string, documents: TextDocuments<TextDocument>): Promise<string | undefined> {
    const openDoc = documents.get(URI.file(filePath).toString());
    if (openDoc) {
        return openDoc.getText();
    }
    try {
        return await fs.readFile(filePath, 'utf-8');
    } catch {
        return undefined;
    }
}

export async function handleComputeMoveEdits(
    params: ComputeMoveEditsParams,
    documents: TextDocuments<TextDocument>,
    workspaceFolders: readonly string[] | undefined
): Promise<WorkspaceEdit | null> {
    if (!workspaceFolders || workspaceFolders.length === 0) {
        return null;
    }

    // A moved DITA file (its references to fix too), a moved folder (whatever it holds moved
    // with it), or another moved file — an image, a .ditaval… — only referred to.
    const ditaMoves: { oldPath: string; newPath: string; normalizedOldPath: string }[] = [];
    const folderMoves: { oldPath: string; newPath: string }[] = [];
    const otherMoves = new Map<string, string>();
    for (const m of params.moves) {
        const oldPath = uriToPath(m.oldUri);
        const newPath = uriToPath(m.newUri);
        if (isDitaFilePath(oldPath)) {
            ditaMoves.push({ oldPath, newPath, normalizedOldPath: normalizeFsPath(oldPath) });
        } else if (await isDirectory(newPath)) {
            folderMoves.push({ oldPath, newPath });
        } else {
            otherMoves.set(normalizeFsPath(oldPath), newPath);
        }
    }
    // Every DITA file a folder carried is a moved file too (its references to fix).
    for (const folder of folderMoves) {
        for (const newPath of await collectDitaFilesAsync([folder.newPath])) {
            const oldPath = path.join(folder.oldPath, path.relative(folder.newPath, newPath));
            ditaMoves.push({ oldPath, newPath, normalizedOldPath: normalizeFsPath(oldPath) });
        }
    }
    if (ditaMoves.length === 0 && folderMoves.length === 0 && otherMoves.size === 0) {
        return null;
    }
    // Keyed by normalizedOldPath so each reference resolves its matching
    // move in O(1) instead of a linear scan per reference (a multi-select
    // move/rename can move many files at once, each scanned against every
    // reference in every other workspace file).
    const ditaMovesByOldPath = new Map(ditaMoves.map(m => [m.normalizedOldPath, m]));
    /**
     * Where a file (or folder) is now: its new path if it moved, or if a
     * moved folder held it — any file, an image as much as a topic — else
     * the same path.
     */
    const currentPath = (filePath: string): string => {
        const normalized = normalizeFsPath(filePath);
        const moved = ditaMovesByOldPath.get(normalized)?.newPath ?? otherMoves.get(normalized);
        if (moved) {
            return moved;
        }
        for (const folder of folderMoves) {
            const inside = path.relative(folder.oldPath, filePath);
            if (!inside.startsWith('..') && !path.isAbsolute(inside)) {
                return inside === '' ? folder.newPath : path.join(folder.newPath, inside);
            }
        }
        return filePath;
    };

    // `/code-review` fix: this used to be a synchronous `collectDitaFiles`
    // walk followed by `fs.readFileSync` inside an unbounded
    // `Promise.all` — since every read was synchronous (no `await` point
    // inside the loop body), that wasn't actually concurrent I/O at all;
    // it just ran every file's directory walk and read back-to-back on
    // the main thread with no yield point, blocking the LSP server's
    // event loop (hover/completion/diagnostics for every open file) for
    // the whole scan on a large workspace. Switched to the same
    // non-blocking `collectDitaFilesAsync` + bounded-concurrency
    // `mapWithConcurrency`/`MAX_CONCURRENT_READS` pattern `findReplace.ts`
    // and `batchMetadata.ts` already establish for the identical
    // "read every DITA file" operation.
    const ditaFiles = await collectDitaFilesAsync(workspaceFolders);
    // The moved files are handled by the outbound pass below, from where they are now.
    const movedNewPaths = new Set(ditaMoves.map(m => normalizeFsPath(m.newPath)));

    const changes: { [uri: string]: TextEdit[] } = {};
    const edit = (content: string, ref: FileReference, newText: string): TextEdit => ({
        range: Range.create(offsetToPosition(content, ref.valueStart), offsetToPosition(content, ref.valueEnd)),
        newText,
    });

    // Inbound: references to a moved file (or into a moved folder) from the files that stayed.
    await mapWithConcurrency(ditaFiles, MAX_CONCURRENT_READS, async (filePath) => {
        if (movedNewPaths.has(normalizeFsPath(filePath))) {
            return;
        }
        const content = await readContent(filePath, documents);
        if (content === undefined) {
            return;
        }
        const fileDir = path.dirname(filePath);
        const edits: TextEdit[] = [];
        for (const ref of relativeFileReferences(content)) {
            const target = resolveReference(fileDir, ref.file);
            const now = currentPath(target);
            const newValue = normalizeFsPath(now) !== normalizeFsPath(target) ? referenceValue(fileDir, now, ref) : undefined;
            if (newValue !== undefined && newValue !== ref.value) {
                edits.push(edit(content, ref, newValue));
            }
        }
        if (edits.length > 0) {
            changes[URI.file(filePath).toString()] = edits;
        }
    });

    // Outbound: each moved file's own references, re-resolved from where it was.
    await mapWithConcurrency(ditaMoves, MAX_CONCURRENT_READS, async (move) => {
        const content = await readContent(move.newPath, documents);
        if (content === undefined) {
            return;
        }
        const oldDir = path.dirname(move.oldPath);
        const newDir = path.dirname(move.newPath);
        const edits: TextEdit[] = [];
        for (const ref of relativeFileReferences(content)) {
            const target = currentPath(resolveReference(oldDir, ref.file));
            const newValue = referenceValue(newDir, target, ref);
            if (newValue !== undefined && newValue !== ref.value) {
                edits.push(edit(content, ref, newValue));
            }
        }
        if (edits.length > 0) {
            changes[URI.file(move.newPath).toString()] = edits;
        }
    });

    return Object.keys(changes).length > 0 ? { changes } : null;
}
