/**
 * Move Topic with Reference Updates
 * Backs the `dita/computeMoveEdits` request: given one or more file moves
 * (as reported by VS Code's `onDidRenameFiles`), finds every `href`/`conref`
 * in the workspace that pointed at a moved file's *old* path and returns a
 * `WorkspaceEdit` rewriting each to the new relative path.
 *
 * **Scope: inbound references only.** A moved file's own outbound hrefs
 * (which go stale too, but only when it moves to a *different directory* —
 * not on an in-place rename) are not rewritten here — see
 * `docs/V0.9-IMPLEMENTATION-PLAN.md` §4.4's status note for the reasoning.
 * Folder-level moves aren't handled either: VS Code reports a folder
 * rename as a single `{oldUri: folder, newUri: renamedFolder}` pair, not
 * one entry per contained file, so files relocated via a folder rename
 * are never individually reported to this handler.
 */

import * as fs from 'fs';
import * as path from 'path';
import { TextDocuments, TextEdit, WorkspaceEdit, Range } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { URI } from 'vscode-uri';
import { findFileReferences, parseReference } from '../utils/referenceParser';
import { collectDitaFiles } from '../utils/workspaceScanner';
import { offsetToPosition, uriToPath, normalizeFsPath } from '../utils/textUtils';

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

export async function handleComputeMoveEdits(
    params: ComputeMoveEditsParams,
    documents: TextDocuments<TextDocument>,
    workspaceFolders: readonly string[] | undefined
): Promise<WorkspaceEdit | null> {
    if (!workspaceFolders || workspaceFolders.length === 0) {
        return null;
    }

    // Only moves whose *old* path was a DITA file need inbound refs fixed.
    const ditaMoves = params.moves
        .map(m => ({ oldPath: uriToPath(m.oldUri), newPath: uriToPath(m.newUri) }))
        .filter(m => isDitaFilePath(m.oldPath))
        .map(m => ({ ...m, normalizedOldPath: normalizeFsPath(m.oldPath) }));
    if (ditaMoves.length === 0) {
        return null;
    }
    // Keyed by normalizedOldPath so each reference resolves its matching
    // move in O(1) instead of a linear scan per reference (a multi-select
    // move/rename can move many files at once, each scanned against every
    // reference in every other workspace file).
    const ditaMovesByOldPath = new Map(ditaMoves.map(m => [m.normalizedOldPath, m]));

    const ditaFiles = collectDitaFiles(workspaceFolders);
    // Never rewrite anything *inside* a moved file itself -- see the module
    // doc comment's "inbound references only" scope note.
    const movedNewPaths = new Set(ditaMoves.map(m => normalizeFsPath(m.newPath)));

    const changes: { [uri: string]: TextEdit[] } = {};

    await Promise.all(ditaFiles.map(async (filePath) => {
        if (movedNewPaths.has(normalizeFsPath(filePath))) {
            return;
        }

        const fileUri = URI.file(filePath).toString();
        const openDoc = documents.get(fileUri);
        let content: string;
        if (openDoc) {
            content = openDoc.getText();
        } else {
            try {
                content = fs.readFileSync(filePath, 'utf-8');
            } catch {
                return;
            }
        }

        const refs = findFileReferences(content);
        if (refs.length === 0) {
            return;
        }

        const fileDir = path.dirname(filePath);
        const edits: TextEdit[] = [];

        for (const ref of refs) {
            const { filePath: refFilePath, fragment } = parseReference(ref.value);
            if (!refFilePath) {
                continue;
            }
            const resolvedRefPath = normalizeFsPath(path.resolve(fileDir, refFilePath));
            const move = ditaMovesByOldPath.get(resolvedRefPath);
            if (!move) {
                continue;
            }

            const newHrefPath = toHrefPath(path.relative(fileDir, move.newPath));
            if (newHrefPath === undefined) {
                continue;
            }
            const newValue = fragment ? `${newHrefPath}#${fragment}` : newHrefPath;

            edits.push({
                range: Range.create(
                    offsetToPosition(content, ref.valueStart),
                    offsetToPosition(content, ref.valueEnd)
                ),
                newText: newValue
            });
        }

        if (edits.length > 0) {
            changes[fileUri] = edits;
        }
    }));

    return Object.keys(changes).length > 0 ? { changes } : null;
}
