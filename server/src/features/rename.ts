import * as fs from 'fs';
import {
    PrepareRenameParams,
    RenameParams,
    TextDocuments,
    WorkspaceEdit,
    TextEdit,
    Range,
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';
import { URI } from 'vscode-uri';

import {
    findIdAtOffset,
    findKeyAtOffset,
    findReferencesToId,
    findReferencesToKey,
    extractKeyPart,
    ReferenceOccurrence,
    KeyAtOffset,
} from '../utils/referenceParser';

import { collectDitaFiles, referenceMatchesTarget } from '../utils/workspaceScanner';
import { offsetToPosition, uriToPath, normalizeFsPath } from '../utils/textUtils';
import { KeySpaceService, KeyDefinition } from '../services/keySpaceService';

/**
 * Handle Prepare Rename request.
 * Validates the cursor is on an id attribute value, or a single key-name
 * token within a `keys="..."` attribute, and returns its range.
 */
export function handlePrepareRename(
    params: PrepareRenameParams,
    documents: TextDocuments<TextDocument>
): Range | null {
    const document = documents.get(params.textDocument.uri);
    if (!document) return null;

    const text = document.getText();
    const offset = document.offsetAt(params.position);

    const idResult = findIdAtOffset(text, offset);
    if (idResult) {
        return Range.create(
            document.positionAt(idResult.valueStart),
            document.positionAt(idResult.valueEnd)
        );
    }

    const keyResult = findKeyAtOffset(text, offset);
    if (keyResult) {
        return Range.create(
            document.positionAt(keyResult.valueStart),
            document.positionAt(keyResult.valueEnd)
        );
    }

    return null;
}

/**
 * Handle Rename request.
 * Renames an id attribute value (and updates all references to it), or a
 * key-name token in a `keys="..."` attribute (and updates all keyref/
 * conkeyref usages verified to resolve to that same key definition),
 * whichever the cursor is on.
 */
export async function handleRename(
    params: RenameParams,
    documents: TextDocuments<TextDocument>,
    workspaceFolders?: readonly string[],
    keySpaceService?: KeySpaceService,
    log?: (msg: string) => void
): Promise<WorkspaceEdit | null> {
    const document = documents.get(params.textDocument.uri);
    if (!document) return null;

    const text = document.getText();
    const offset = document.offsetAt(params.position);

    const idResult = findIdAtOffset(text, offset);
    if (!idResult) {
        const keyResult = findKeyAtOffset(text, offset);
        if (keyResult) {
            return handleKeyRename(
                document, text, keyResult, params.newName, documents, workspaceFolders, keySpaceService, log
            );
        }
        return null;
    }

    const oldId = idResult.id;
    const newId = params.newName;
    const changes: { [uri: string]: TextEdit[] } = {};

    // 1. Rename the id attribute value itself
    const currentEdits: TextEdit[] = [];
    currentEdits.push({
        range: Range.create(
            document.positionAt(idResult.valueStart),
            document.positionAt(idResult.valueEnd)
        ),
        newText: newId,
    });

    // 2. Update all references to this ID in the current document.
    // Filtered the same way as cross-file refs below — a href/conref/conkeyref
    // in this file may reference a *different* file's element that merely
    // shares the same id text, and must not be rewritten.
    const targetFilePath = uriToPath(document.uri);
    const normalizedTargetPath = normalizeFsPath(targetFilePath);
    const refs = findReferencesToId(text, oldId);
    const selfEdits = await collectMatchingEdits(
        refs, text, targetFilePath, normalizedTargetPath, oldId, newId, keySpaceService, log
    );
    currentEdits.push(...selfEdits);
    changes[document.uri] = currentEdits;

    // 3. Cross-file: update references in other workspace files. Files are
    // processed concurrently (KeySpaceService dedupes concurrent builds of
    // the same key space via pendingBuilds) since each file's conkeyref
    // matches otherwise resolve one at a time.
    if (workspaceFolders && workspaceFolders.length > 0) {
        const ditaFiles = collectDitaFiles(workspaceFolders);

        const perFileEdits = await Promise.all(ditaFiles.map(async (filePath) => {
            const fileUri = URI.file(filePath).toString();
            if (fileUri === document.uri) return null;

            // Prefer in-memory content for open documents (may have unsaved changes)
            const openDoc = documents.get(fileUri);
            let content: string;
            if (openDoc) {
                content = openDoc.getText();
            } else {
                try {
                    content = fs.readFileSync(filePath, 'utf-8');
                } catch {
                    return null;
                }
            }

            const fileRefs = findReferencesToId(content, oldId);
            if (fileRefs.length === 0) return null;

            const fileEdits = await collectMatchingEdits(
                fileRefs, content, filePath, normalizedTargetPath, oldId, newId, keySpaceService, log
            );

            return fileEdits.length > 0 ? { fileUri, fileEdits } : null;
        }));

        for (const result of perFileEdits) {
            if (result) {
                changes[result.fileUri] = result.fileEdits;
            }
        }
    }

    return { changes };
}

/**
 * Filter reference occurrences found in `contextFilePath` down to only those
 * that actually point at `normalizedTargetPath` (the file whose element is
 * being renamed), then build the corresponding text edits.
 *
 * href/conref are filtered by resolving their file part relative to the
 * containing file. conkeyref has no file part — the key must be resolved via
 * the key space to know which file it targets. Without a KeySpaceService,
 * a conkeyref match cannot be verified and is skipped rather than risking a
 * rewrite of an unrelated file's reference that merely shares the id text.
 */
async function collectMatchingEdits(
    refs: ReferenceOccurrence[],
    content: string,
    contextFilePath: string,
    normalizedTargetPath: string,
    oldId: string,
    newId: string,
    keySpaceService: KeySpaceService | undefined,
    log?: (msg: string) => void
): Promise<TextEdit[]> {
    const matchFlags = await Promise.all(
        refs.map(ref => referenceMatchesTarget(ref, contextFilePath, normalizedTargetPath, keySpaceService, log))
    );

    const edits: TextEdit[] = [];
    refs.forEach((ref, i) => {
        if (!matchFlags[i]) return;

        const newValue = replaceIdInReference(ref.type, ref.value, oldId, newId);
        const startPos = offsetToPosition(content, ref.valueStart);
        const endPos = offsetToPosition(content, ref.valueEnd);
        edits.push({
            range: Range.create(startPos, endPos),
            newText: newValue,
        });
    });

    return edits;
}

/**
 * Replace the ID portion in a reference value while preserving the rest.
 */
function replaceIdInReference(
    type: string,
    value: string,
    oldId: string,
    newId: string
): string {
    if (type === 'conkeyref') {
        // conkeyref format: "keyname/elementid"
        const slashIdx = value.indexOf('/');
        if (slashIdx >= 0 && value.slice(slashIdx + 1) === oldId) {
            return value.slice(0, slashIdx + 1) + newId;
        }
        return value;
    }

    // href, conref: replace the ID in the fragment
    const hashIdx = value.indexOf('#');
    if (hashIdx < 0) return value;

    const fragment = value.slice(hashIdx + 1);
    const slashIdx = fragment.indexOf('/');

    if (slashIdx >= 0 && fragment.slice(slashIdx + 1) === oldId) {
        // Format: file.dita#topicid/elementid
        return value.slice(0, hashIdx + 1) + fragment.slice(0, slashIdx + 1) + newId;
    } else if (fragment === oldId) {
        // Format: #elementid
        return value.slice(0, hashIdx + 1) + newId;
    }

    return value;
}

/**
 * Rename a key-name token (the cursor's `keys="..."` occurrence, found via
 * `findKeyAtOffset`) and every `keyref`/`conkeyref` usage across the
 * workspace verified — via `KeySpaceService` — to resolve to that same key
 * definition.
 *
 * Unlike ID rename, no separate "find other definitions of this name"
 * pass is needed: `keyResult`'s offsets already pin the exact `keys="..."`
 * occurrence under the cursor, so that's the one and only definition edit.
 * A different `keydef` elsewhere that happens to define the same key name
 * (a different key in a different scope, or an already-invalid same-scope
 * duplicate flagged by DITA-KEY-004) is deliberately left untouched — it
 * isn't reachable by cursor position, and renaming it too would be renaming
 * a different key on the strength of a name collision alone, the exact
 * false-positive class `referenceMatchesTarget`'s conkeyref verification
 * exists to prevent for ID rename.
 *
 * No preemptive "does the new name already collide" guard is added here,
 * matching ID rename's own behavior: a resulting collision is left to
 * surface as a normal DITA-KEY-004 diagnostic afterward rather than a
 * rename-time block, since `handlePrepareRename` doesn't have a
 * `KeySpaceService` to check against in the first place.
 */
async function handleKeyRename(
    document: TextDocument,
    text: string,
    keyResult: KeyAtOffset,
    newKey: string,
    documents: TextDocuments<TextDocument>,
    workspaceFolders?: readonly string[],
    keySpaceService?: KeySpaceService,
    log?: (msg: string) => void
): Promise<WorkspaceEdit | null> {
    const oldKey = keyResult.key;
    const changes: { [uri: string]: TextEdit[] } = {};

    // 1. Rename the key-defining token itself — the one occurrence the
    // cursor is actually on.
    const currentEdits: TextEdit[] = [{
        range: Range.create(
            document.positionAt(keyResult.valueStart),
            document.positionAt(keyResult.valueEnd)
        ),
        newText: newKey,
    }];

    const sourceMapPath = uriToPath(document.uri);
    const normalizedSourceMap = normalizeFsPath(sourceMapPath);
    // 1-based line of the definition, matching KeyDefinition.sourceLine's
    // convention (KeySpaceService.extractKeyDefinitions) so the two compare
    // directly without a unit conversion at the comparison site.
    const sourceLine = document.positionAt(keyResult.valueStart).line + 1;

    // 2. Update keyref/conkeyref usages in the current document.
    const refs = findReferencesToKey(text, oldKey);
    const selfEdits = await collectMatchingKeyEdits(
        refs, text, sourceMapPath, normalizedSourceMap, sourceLine, newKey, keySpaceService, log
    );
    currentEdits.push(...selfEdits);
    changes[document.uri] = currentEdits;

    // 3. Cross-file: same concurrency shape as ID rename (§ handleRename) —
    // KeySpaceService dedupes concurrent builds of the same key space via
    // pendingBuilds, so processing files concurrently is safe.
    if (workspaceFolders && workspaceFolders.length > 0) {
        const ditaFiles = collectDitaFiles(workspaceFolders);

        const perFileEdits = await Promise.all(ditaFiles.map(async (filePath) => {
            const fileUri = URI.file(filePath).toString();
            if (fileUri === document.uri) return null;

            const openDoc = documents.get(fileUri);
            let content: string;
            if (openDoc) {
                content = openDoc.getText();
            } else {
                try {
                    content = fs.readFileSync(filePath, 'utf-8');
                } catch {
                    return null;
                }
            }

            const fileRefs = findReferencesToKey(content, oldKey);
            if (fileRefs.length === 0) return null;

            const fileEdits = await collectMatchingKeyEdits(
                fileRefs, content, filePath, normalizedSourceMap, sourceLine, newKey, keySpaceService, log
            );

            return fileEdits.length > 0 ? { fileUri, fileEdits } : null;
        }));

        for (const result of perFileEdits) {
            if (result) {
                changes[result.fileUri] = result.fileEdits;
            }
        }
    }

    return { changes };
}

/**
 * Filter `keyref`/`conkeyref` occurrences found in `contextFilePath` down to
 * only those that resolve (via `KeySpaceService`, keyscope-aware) to the
 * same key definition being renamed, then build the corresponding text
 * edits. Both reference types require verification here — unlike ID
 * rename, where a bare `keyref` never matches at all (see
 * `referenceMatchesId`), a `keyref`/`conkeyref` value *is* the key name for
 * key rename, so a same-named-but-different-scope key must be excluded the
 * same way an unrelated conkeyref-target file is excluded for ID rename.
 * Without a KeySpaceService, nothing here is verifiable, so every match is
 * skipped (logged) rather than rewritten on text equality alone.
 */
async function collectMatchingKeyEdits(
    refs: ReferenceOccurrence[],
    content: string,
    contextFilePath: string,
    targetSourceMap: string,
    targetSourceLine: number,
    newKey: string,
    keySpaceService: KeySpaceService | undefined,
    log?: (msg: string) => void
): Promise<TextEdit[]> {
    if (refs.length === 0) return [];

    if (!keySpaceService) {
        log?.(
            `Skipping ${refs.length} unverifiable keyref/conkeyref match(es) in ${contextFilePath} ` +
            '(no KeySpaceService available to confirm they resolve to the renamed key definition)'
        );
        return [];
    }

    const matchFlags = await Promise.all(refs.map(async (ref) => {
        const keyName = extractKeyPart(ref.value);
        const resolved = await keySpaceService.resolveKey(keyName, contextFilePath);
        return sameKeyDefinition(resolved, targetSourceMap, targetSourceLine);
    }));

    const edits: TextEdit[] = [];
    refs.forEach((ref, i) => {
        if (!matchFlags[i]) return;

        const newValue = replaceKeyInReference(ref.type, ref.value, newKey);
        const startPos = offsetToPosition(content, ref.valueStart);
        const endPos = offsetToPosition(content, ref.valueEnd);
        edits.push({
            range: Range.create(startPos, endPos),
            newText: newValue,
        });
    });

    return edits;
}

/**
 * Check whether a resolved key definition is the same definition the rename
 * was invoked on, identified by (sourceMap, sourceLine) rather than by key
 * name — two different scopes can validly define the same key name, and
 * only the one at the cursor should be renamed.
 *
 * `sourceLine` is optional on `KeyDefinition` (not always available from
 * every extraction path); when either side lacks it, this falls back to
 * file-level identity, matching the conservative "same file counts as the
 * same definition" precedent already used where finer-grained provenance
 * isn't available.
 */
function sameKeyDefinition(
    resolved: KeyDefinition | null,
    targetSourceMap: string,
    targetSourceLine: number
): boolean {
    if (!resolved) return false;
    if (normalizeFsPath(resolved.sourceMap) !== targetSourceMap) return false;
    if (resolved.sourceLine === undefined) return true;
    return resolved.sourceLine === targetSourceLine;
}

/**
 * Replace the key-name portion of a keyref/conkeyref value with the new key
 * name, preserving any conkeyref element-id suffix. The counterpart to
 * `replaceIdInReference`, which replaces the *suffix* (element id) for ID
 * rename — key rename replaces the *prefix* (key name) instead.
 */
function replaceKeyInReference(type: string, value: string, newKey: string): string {
    if (type === 'conkeyref') {
        const slashIdx = value.indexOf('/');
        return slashIdx >= 0 ? newKey + value.slice(slashIdx) : newKey;
    }
    // keyref: the whole value is the key name.
    return newKey;
}
