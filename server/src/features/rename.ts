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
    countKeyDefinitionOccurrences,
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
    Object.assign(changes, await collectCrossFileEdits(
        workspaceFolders, document.uri, documents,
        (content) => findReferencesToId(content, oldId),
        (fileRefs, content, filePath) => collectMatchingEdits(
            fileRefs, content, filePath, normalizedTargetPath, oldId, newId, keySpaceService, log
        )
    ));

    return { changes };
}

/**
 * Shared cross-file traversal shape behind both ID and key rename: walk every
 * DITA file in the workspace (skipping the document being renamed itself),
 * read each one (preferring in-memory content for open documents, which may
 * have unsaved changes), find candidate reference occurrences, and build the
 * verified text edits for the ones that match — via the caller-supplied
 * `findRefs`/`buildEdits`, so this owns only the traversal, not what counts
 * as a match or how a match gets rewritten.
 */
async function collectCrossFileEdits(
    workspaceFolders: readonly string[] | undefined,
    currentUri: string,
    documents: TextDocuments<TextDocument>,
    findRefs: (content: string) => ReferenceOccurrence[],
    buildEdits: (refs: ReferenceOccurrence[], content: string, filePath: string) => Promise<TextEdit[]>
): Promise<{ [uri: string]: TextEdit[] }> {
    const changes: { [uri: string]: TextEdit[] } = {};
    if (!workspaceFolders || workspaceFolders.length === 0) return changes;

    const ditaFiles = collectDitaFiles(workspaceFolders);

    const perFileEdits = await Promise.all(ditaFiles.map(async (filePath) => {
        const fileUri = URI.file(filePath).toString();
        if (fileUri === currentUri) return null;

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

        const fileRefs = findRefs(content);
        if (fileRefs.length === 0) return null;

        const fileEdits = await buildEdits(fileRefs, content, filePath);
        return fileEdits.length > 0 ? { fileUri, fileEdits } : null;
    }));

    for (const result of perFileEdits) {
        if (result) {
            changes[result.fileUri] = result.fileEdits;
        }
    }

    return changes;
}

/**
 * Resolve which of `refs` actually match (async, e.g. a KeySpaceService
 * lookup per ref) and build the corresponding text edits for the ones that
 * do. Shared shape behind `collectMatchingEdits` (ID rename) and
 * `collectMatchingKeyEdits` (key rename) — they differ only in what counts
 * as a match and how a matched value gets rewritten, supplied here as
 * `verify`/`rewrite`.
 */
async function buildEditsForVerifiedRefs(
    refs: ReferenceOccurrence[],
    content: string,
    verify: (ref: ReferenceOccurrence) => Promise<boolean>,
    rewrite: (ref: ReferenceOccurrence) => string
): Promise<TextEdit[]> {
    if (refs.length === 0) return [];

    const matchFlags = await Promise.all(refs.map(verify));

    const edits: TextEdit[] = [];
    refs.forEach((ref, i) => {
        if (!matchFlags[i]) return;

        const startPos = offsetToPosition(content, ref.valueStart);
        const endPos = offsetToPosition(content, ref.valueEnd);
        edits.push({
            range: Range.create(startPos, endPos),
            newText: rewrite(ref),
        });
    });

    return edits;
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
    return buildEditsForVerifiedRefs(
        refs,
        content,
        (ref) => referenceMatchesTarget(ref, contextFilePath, normalizedTargetPath, keySpaceService, log),
        (ref) => replaceIdInReference(ref.type, ref.value, oldId, newId)
    );
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

    // `keys` is a whitespace-delimited *list* (unlike `id`, a single value) —
    // splicing a name containing whitespace into one token's range wouldn't
    // just produce one malformed key, it would silently split into extra
    // key definitions (`keys="alpha beta gamma"` renaming "beta" to "new name"
    // would become `keys="alpha new name gamma"`, a 4-key list). Refuse
    // rather than risk that structural corruption.
    if (/\s/.test(newKey) || newKey.length === 0) {
        log?.(`Refusing to rename key "${oldKey}" to "${newKey}": key names cannot contain whitespace`);
        return null;
    }

    // Unlike ID rename — where only conkeyref needs KeySpaceService, so href/
    // conref matches still get rewritten without one — key rename needs it to
    // verify *every* keyref/conkeyref match, since the reference value itself
    // is the key name being renamed. Without it there is nothing safe to
    // verify at all, so refuse the whole rename rather than silently doing
    // only the definition-site edit and returning an apparently-successful
    // WorkspaceEdit that actually leaves every usage — same-file or
    // cross-file — dangling with no signal the editor UI would ever surface.
    if (!keySpaceService) {
        log?.(
            `Refusing to rename key "${oldKey}": no KeySpaceService available to verify ` +
            'keyref/conkeyref usages, and renaming the definition alone would silently break them'
        );
        return null;
    }

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

    // KeySpaceService.resolveKeyEntry() only ever reads map content from
    // disk and caches the result — it can't see this document's *unsaved*
    // edits. If those edits shifted the keydef's line, the live `sourceLine`
    // computed above and the disk-cached definition's sourceLine disagree,
    // and sameKeyDefinition() would wrongly reject every reference that
    // actually does resolve to this definition.
    //
    // When `oldKey` is defined only once in this document — the overwhelming
    // common case — that staleness can't cause an incorrect match: there is
    // no *other* same-named definition in this text a candidate could be
    // confused with, so the line number isn't doing any disambiguation work
    // and can be safely ignored once the file itself is confirmed to match.
    // This relaxes the LINE check only — resolveKeyEntry()'s own scope-aware
    // FILE resolution is still authoritative and still runs normally, so a
    // candidate that genuinely resolves elsewhere is still rejected exactly
    // as before. Only when this document defines `oldKey` more than once
    // (e.g. via distinct inline `@keyscope` branches) does line-based
    // disambiguation still matter, and the strict comparison applies.
    const targetKeyUnambiguousInOwnFile = countKeyDefinitionOccurrences(text, oldKey) === 1;

    // 2. Update keyref/conkeyref usages in the current document.
    const refs = findReferencesToKey(text, oldKey);
    const selfEdits = await collectMatchingKeyEdits(
        refs, text, sourceMapPath, normalizedSourceMap, sourceLine, newKey, keySpaceService,
        targetKeyUnambiguousInOwnFile
    );
    currentEdits.push(...selfEdits);
    changes[document.uri] = currentEdits;

    // 3. Cross-file: same concurrency shape as ID rename (§ handleRename) —
    // KeySpaceService dedupes concurrent builds of the same key space via
    // pendingBuilds, so processing files concurrently is safe. The staleness
    // relaxation above applies here too — a topic file's keyref can resolve
    // straight back to the same (possibly unsaved) map document.
    Object.assign(changes, await collectCrossFileEdits(
        workspaceFolders, document.uri, documents,
        (content) => findReferencesToKey(content, oldKey),
        (fileRefs, content, filePath) => collectMatchingKeyEdits(
            fileRefs, content, filePath, normalizedSourceMap, sourceLine, newKey, keySpaceService,
            targetKeyUnambiguousInOwnFile
        )
    ));

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
 *
 * `keySpaceService` is required (not optional) here: `handleKeyRename`
 * refuses the entire rename before calling this when one isn't available,
 * rather than letting this function silently skip every match while the
 * caller still reports a normal, apparently-complete rename.
 */
async function collectMatchingKeyEdits(
    refs: ReferenceOccurrence[],
    content: string,
    contextFilePath: string,
    targetSourceMap: string,
    targetSourceLine: number,
    newKey: string,
    keySpaceService: KeySpaceService,
    targetKeyUnambiguousInOwnFile: boolean
): Promise<TextEdit[]> {
    return buildEditsForVerifiedRefs(
        refs,
        content,
        async (ref) => {
            const keyName = extractKeyPart(ref.value);
            // resolveKeyEntry(), not resolveKey(): a candidate keyref/conkeyref
            // might name the definition being renamed even when that definition
            // is itself an indirect key (keys="alias" keyref="target") — resolveKey()
            // would follow the chain straight through to "target"'s identity, which
            // would never match "alias"'s own (sourceMap, sourceLine) and silently
            // skip every direct usage of the alias being renamed.
            const resolved = await keySpaceService.resolveKeyEntry(keyName, contextFilePath);
            return sameKeyDefinition(resolved, targetSourceMap, targetSourceLine, targetKeyUnambiguousInOwnFile);
        },
        (ref) => replaceKeyInReference(ref.type, ref.value, newKey)
    );
}

/**
 * Check whether a resolved key definition is the same definition the rename
 * was invoked on, identified by (sourceMap, sourceLine) rather than by key
 * name — two different scopes can validly define the same key name, and
 * only the one at the cursor should be renamed. The file (`sourceMap`) check
 * is always strict — `resolveKeyEntry`'s own scope-aware resolution is what
 * decides which file a candidate actually points at, and a candidate
 * resolving to a different file is never treated as a match here.
 *
 * The line check is relaxed when `targetKeyUnambiguousInOwnFile` is true
 * (the renamed key is defined only once in its own file, per
 * `countKeyDefinitionOccurrences` — see `handleKeyRename`): with nothing
 * else in that file sharing the name, `sourceLine` isn't doing any
 * disambiguation work, so it's ignored once the file already matches. This
 * matters because `resolved.sourceLine` comes from `KeySpaceService`, which
 * only ever reads map content from disk — an unsaved edit shifting the
 * definition's line would otherwise make a same-file rename spuriously
 * "unverifiable" via `resolved.sourceLine === undefined` below, or mismatch
 * against the live cursor's own line, even though there's no real ambiguity.
 *
 * Otherwise, `sourceLine` is optional on `KeyDefinition` (not always
 * available from every extraction path — e.g. keys registered via an
 * inline `@keyscope` branch never get one); when it's missing and the
 * ambiguity can't be ruled out, this requires it not match rather than
 * falling back to file-level identity, since a same-file-only fallback
 * would let a candidate resolving to a genuinely *different*, same-named
 * key in another scope of that file get rewritten too — the exact
 * false-positive class this (sourceMap, sourceLine) check exists to
 * prevent. Skipping an unverifiable candidate is the same "don't guess"
 * choice `handleKeyRename` already makes when no `KeySpaceService` is
 * available at all.
 */
function sameKeyDefinition(
    resolved: KeyDefinition | null,
    targetSourceMap: string,
    targetSourceLine: number,
    targetKeyUnambiguousInOwnFile: boolean
): boolean {
    if (!resolved) return false;
    if (normalizeFsPath(resolved.sourceMap) !== targetSourceMap) return false;
    if (targetKeyUnambiguousInOwnFile) return true;
    if (resolved.sourceLine === undefined) return false;
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
