import * as fs from 'fs/promises';
import * as path from 'path';
import {
    ErrorCodes,
    PrepareRenameParams,
    RenameParams,
    ResponseError,
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
    findReferenceAtOffset,
    findReferencesToId,
    findReferencesToKey,
    findElementByIdOffset,
    countKeyDefinitionOccurrences,
    extractKeyPart,
    parseReference,
    referencePartAtOffset,
    ReferenceAtOffset,
    ReferenceOccurrence,
    ReferencePart,
    KeyAtOffset,
} from '../utils/referenceParser';

import { collectDitaFilesAsync, referenceMatchesTarget } from '../utils/workspaceScanner';
import { offsetToPosition, uriToPath, normalizeFsPath, stripCommentsAndCDATA, escapeRegex, isPathWithinWorkspace } from '../utils/textUtils';
import { KeySpaceService, KeyDefinition } from '../services/keySpaceService';
import { MAP_TYPE_NAMES, TOPIC_TYPE_NAMES } from '../data/ditaSpecialization';
import { mapWithConcurrency, MAX_CONCURRENT_READS } from './workspaceValidation';

interface IdAtOffset {
    id: string;
    valueStart: number;
    valueEnd: number;
}

/** A renamable part of a reference value under the cursor (a usage of a key or an id). */
interface Usage {
    ref: ReferenceAtOffset;
    part: ReferencePart;
}

/** The definition a usage names — where the rename is made — or why it cannot be found. */
type ResolvedUsage =
    | { kind: 'key'; document: TextDocument; keyResult: KeyAtOffset }
    | { kind: 'id'; document: TextDocument; idResult: IdAtOffset; isTopicId: boolean }
    | { reason: string };

/**
 * Handle Prepare Rename request.
 * Validates the cursor is on something renamable and returns its range: an
 * id attribute value, a single key-name token within a `keys="..."`
 * attribute, or a usage of either — the key of a `keyref`/`conkeyref`, the
 * topic or element id in an `href`/`conref` fragment, the element id after a
 * key (`key/elementid`). A usage is renamed at its definition, so it must be
 * found first: when it can't be (key not defined, element not found…), the
 * request fails with the reason, which VS Code shows at the cursor.
 */
export async function handlePrepareRename(
    params: PrepareRenameParams,
    documents: TextDocuments<TextDocument>,
    keySpaceService?: KeySpaceService,
    workspaceFolders?: readonly string[]
): Promise<Range | null> {
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

    const usage = usageAtOffset(text, offset);
    if (!usage) return null;
    const definition = await resolveUsage(document, usage, documents, keySpaceService, workspaceFolders);
    if ('reason' in definition) {
        throw new ResponseError(ErrorCodes.InvalidRequest, definition.reason);
    }
    return Range.create(document.positionAt(usage.part.start), document.positionAt(usage.part.end));
}

/**
 * Handle Rename request.
 * Renames an id attribute value (and updates all references to it), or a
 * key-name token in a `keys="..."` attribute (and updates all keyref/
 * conkeyref usages verified to resolve to that same key definition),
 * whichever the cursor is on — or, on a usage of either (see
 * `handlePrepareRename`), the definition it names, in whichever file it is,
 * with all its usages.
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
    if (idResult) {
        return handleIdRename(
            document, text, idResult, params.newName, isTopicIdAt(text, idResult.valueStart),
            documents, workspaceFolders, keySpaceService, log
        );
    }
    const keyResult = findKeyAtOffset(text, offset);
    if (keyResult) {
        return handleKeyRename(
            document, text, keyResult, params.newName, documents, workspaceFolders, keySpaceService, log
        );
    }

    const usage = usageAtOffset(text, offset);
    if (!usage) return null;
    const definition = await resolveUsage(document, usage, documents, keySpaceService, workspaceFolders);
    if ('reason' in definition) {
        log?.(`Rename: ${definition.reason}`);
        return null;
    }
    if (definition.kind === 'key') {
        return handleKeyRename(
            definition.document, definition.document.getText(), definition.keyResult, params.newName,
            documents, workspaceFolders, keySpaceService, log
        );
    }
    return handleIdRename(
        definition.document, definition.document.getText(), definition.idResult, params.newName, definition.isTopicId,
        documents, workspaceFolders, keySpaceService, log
    );
}

/** The renamable part of a `keyref`/`conkeyref`/`href`/`conref` value at `offset`, if any. */
function usageAtOffset(text: string, offset: number): Usage | undefined {
    const ref = findReferenceAtOffset(text, offset);
    const part = ref ? referencePartAtOffset(ref, offset) : undefined;
    return ref && part ? { ref, part } : undefined;
}

/**
 * The definition a usage names: for a key, its `keys` token in the map that
 * defines it as seen from this file (`resolveKeyEntry`, keyscope-aware); for
 * an id, its `id` attribute in the file the reference points to (an element
 * id within the reference's topic when it names one).
 */
async function resolveUsage(
    document: TextDocument,
    usage: Usage,
    documents: TextDocuments<TextDocument>,
    keySpaceService: KeySpaceService | undefined,
    workspaceFolders: readonly string[] | undefined
): Promise<ResolvedUsage> {
    const filePath = uriToPath(document.uri);
    const { ref, part } = usage;
    if (part.kind === 'key') {
        if (!keySpaceService) {
            return { reason: `No key space is available to find the definition of key "${part.name}".` };
        }
        const definition = await keySpaceService.resolveKeyEntry(part.name, filePath);
        if (!definition) {
            return { reason: `Key "${part.name}" is not defined in this file's key space.` };
        }
        const map = await openDocument(definition.sourceMap, documents);
        const keyResult = map ? findKeyDefinition(map.getText(), part.name, definition.sourceLine) : null;
        if (!map || !keyResult) {
            return {
                reason: part.name.includes('.')
                    ? `"${part.name}" is a scope-qualified key reference: rename the key from its definition in ${path.basename(definition.sourceMap)}.`
                    : `The definition of key "${part.name}" was not found in ${path.basename(definition.sourceMap)}.`,
            };
        }
        return { kind: 'key', document: map, keyResult };
    }

    let targetPath: string;
    let topicId: string | undefined;
    if (ref.type === 'href' || ref.type === 'conref') {
        const parsed = parseReference(ref.value);
        targetPath = parsed.filePath ? path.resolve(path.dirname(filePath), parsed.filePath) : filePath;
        const first = parsed.fragment.split('/')[0];
        topicId = part.role === 'element' && first !== '.' ? first : undefined;
    } else {
        const key = extractKeyPart(ref.value);
        if (!keySpaceService) {
            return { reason: `No key space is available to find what key "${key}" points to.` };
        }
        const definition = await keySpaceService.resolveKey(key, filePath);
        if (!definition?.targetFile) {
            return { reason: `Key "${key}" does not point to a file.` };
        }
        targetPath = definition.targetFile;
    }
    if (workspaceFolders && workspaceFolders.length > 0 && !isPathWithinWorkspace(targetPath, workspaceFolders)) {
        return { reason: `${path.basename(targetPath)} is outside the workspace.` };
    }
    const target = await openDocument(targetPath, documents);
    if (!target) {
        return { reason: `Could not read ${path.basename(targetPath)}.` };
    }
    const idResult = findIdDefinition(target.getText(), part.name, topicId);
    if (!idResult) {
        return { reason: `No ${part.role === 'topic' ? 'topic' : 'element'} with id "${part.name}" in ${path.basename(targetPath)}.` };
    }
    return { kind: 'id', document: target, idResult, isTopicId: part.role === 'topic' };
}

/** A file as a TextDocument: the open one (unsaved changes included), else read from disk. */
async function openDocument(filePath: string, documents: TextDocuments<TextDocument>): Promise<TextDocument | undefined> {
    const uri = URI.file(filePath).toString();
    const open = documents.get(uri);
    if (open) return open;
    try {
        return TextDocument.create(uri, 'dita', 0, await fs.readFile(filePath, 'utf-8'));
    } catch {
        return undefined;
    }
}

/**
 * The `keys` token defining `keyName` in a map's text: the only one, or the
 * one on `sourceLine` (1-based, as `KeyDefinition.sourceLine`) when the map
 * defines the name more than once.
 */
function findKeyDefinition(text: string, keyName: string, sourceLine: number | undefined): KeyAtOffset | null {
    const searchable = stripCommentsAndCDATA(text);
    const candidates: KeyAtOffset[] = [];
    const pattern = /\bkeys\s*=\s*(["'])([^"']*)\1/g;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(searchable)) !== null) {
        const valueStart = match.index + match[0].length - 1 - match[2].length;
        const tokens = /\S+/g;
        let token: RegExpExecArray | null;
        while ((token = tokens.exec(match[2])) !== null) {
            if (token[0] === keyName) {
                candidates.push({ key: keyName, valueStart: valueStart + token.index, valueEnd: valueStart + token.index + keyName.length });
            }
        }
    }
    if (candidates.length === 1) return candidates[0];
    const lineOf = (offset: number): number => text.slice(0, offset).split('\n').length;
    return candidates.find(c => lineOf(c.valueStart) === sourceLine) ?? null;
}

/** The `id` attribute value `id` in `text` — after the element with id `topicId`, when given. */
function findIdDefinition(text: string, id: string, topicId: string | undefined): IdAtOffset | null {
    const searchable = stripCommentsAndCDATA(text);
    const pattern = new RegExp(`(?<=\\s)id\\s*=\\s*(["'])${escapeRegex(id)}\\1`, 'g');
    if (topicId) {
        const topicStart = findElementByIdOffset(text, topicId);
        if (topicStart < 0) return null;
        pattern.lastIndex = topicStart;
    }
    const match = pattern.exec(searchable);
    if (!match) return null;
    const valueStart = match.index + match[0].length - 1 - id.length;
    return { id, valueStart, valueEnd: valueStart + id.length };
}

/**
 * Whether the `id` attribute at `offset` belongs to a topic: a topic type by
 * name, or the document's root element when the document is not a map (a
 * specialized topic type).
 */
function isTopicIdAt(text: string, offset: number): boolean {
    const tagStart = text.lastIndexOf('<', offset);
    const name = /^<([\w.:-]+)/.exec(text.slice(tagStart))?.[1];
    if (!name) return false;
    if (TOPIC_TYPE_NAMES.has(name)) return true;
    const root = /<(?![?!/])([\w.:-]+)/.exec(stripCommentsAndCDATA(text));
    return root !== null && root.index === tagStart && !MAP_TYPE_NAMES.has(name);
}

/**
 * Rename an id attribute value (`idResult`, in `document`) and every
 * reference to it in the workspace (see `referenceMatchesId`; `isTopicId`:
 * the topic part of `#topicid/elementid` references is renamed too).
 */
async function handleIdRename(
    document: TextDocument,
    text: string,
    idResult: IdAtOffset,
    newId: string,
    isTopicId: boolean,
    documents: TextDocuments<TextDocument>,
    workspaceFolders?: readonly string[],
    keySpaceService?: KeySpaceService,
    log?: (msg: string) => void
): Promise<WorkspaceEdit | null> {
    const oldId = idResult.id;
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
    const refs = findReferencesToId(text, oldId, isTopicId);
    const selfEdits = await collectMatchingEdits(
        refs, text, targetFilePath, normalizedTargetPath, oldId, newId, isTopicId, keySpaceService, log
    );
    currentEdits.push(...selfEdits);
    changes[document.uri] = currentEdits;

    // 3. Cross-file: update references in other workspace files. Files are
    // processed concurrently (KeySpaceService dedupes concurrent builds of
    // the same key space via pendingBuilds) since each file's conkeyref
    // matches otherwise resolve one at a time.
    Object.assign(changes, await collectCrossFileEdits(
        workspaceFolders, document.uri, documents,
        (content) => findReferencesToId(content, oldId, isTopicId),
        (fileRefs, content, filePath) => collectMatchingEdits(
            fileRefs, content, filePath, normalizedTargetPath, oldId, newId, isTopicId, keySpaceService, log
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

    // `/code-review` fix: switched from a synchronous `collectDitaFiles`
    // walk + `fs.readFileSync` inside an unbounded `Promise.all` to the
    // non-blocking `collectDitaFilesAsync` + bounded-concurrency
    // `mapWithConcurrency`/`MAX_CONCURRENT_READS` pattern `findReplace.ts`/
    // `batchMetadata.ts`/`moveTopic.ts` all establish for this identical
    // "read every DITA file in the workspace" operation — this function
    // backs both ID rename and key rename, so both were paying the
    // event-loop-blocking cost of the old synchronous scan on every
    // invocation.
    const ditaFiles = await collectDitaFilesAsync(workspaceFolders);

    const perFileEdits = await mapWithConcurrency(ditaFiles, MAX_CONCURRENT_READS, async (filePath) => {
        const fileUri = URI.file(filePath).toString();
        if (fileUri === currentUri) return null;

        const openDoc = documents.get(fileUri);
        let content: string;
        if (openDoc) {
            content = openDoc.getText();
        } else {
            try {
                content = await fs.readFile(filePath, 'utf-8');
            } catch {
                return null;
            }
        }

        const fileRefs = findRefs(content);
        if (fileRefs.length === 0) return null;

        const fileEdits = await buildEdits(fileRefs, content, filePath);
        return fileEdits.length > 0 ? { fileUri, fileEdits } : null;
    });

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
    isTopicId: boolean,
    keySpaceService: KeySpaceService | undefined,
    log?: (msg: string) => void
): Promise<TextEdit[]> {
    return buildEditsForVerifiedRefs(
        refs,
        content,
        (ref) => referenceMatchesTarget(ref, contextFilePath, normalizedTargetPath, keySpaceService, log),
        (ref) => replaceIdInReference(ref.type, ref.value, oldId, newId, isTopicId)
    );
}

/**
 * Replace the ID portion in a reference value while preserving the rest:
 * the element part of `keyname/elementid` (`conkeyref`, `keyref`) or of
 * `#topicid/elementid`, a whole `#id` fragment, and — for a topic id — the
 * topic part of `#topicid/elementid`.
 */
function replaceIdInReference(
    type: string,
    value: string,
    oldId: string,
    newId: string,
    isTopicId = false
): string {
    if (type === 'conkeyref' || type === 'keyref') {
        // "keyname/elementid"
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
    } else if (slashIdx >= 0 && isTopicId && fragment.slice(0, slashIdx) === oldId) {
        // Format: file.dita#topicid/elementid, renaming the topic
        return value.slice(0, hashIdx + 1) + newId + fragment.slice(slashIdx);
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
        (ref) => replaceKeyInReference(ref.value, newKey)
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
 * name, preserving any element-id suffix — a conkeyref's (`key/elem`) and a
 * keyref's too: DITA allows `keyref="key/elem"` on an xref or link to point at
 * an element of the key's topic. The counterpart to `replaceIdInReference`,
 * which replaces the *suffix* (element id) for ID rename — key rename
 * replaces the *prefix* (key name) instead.
 */
function replaceKeyInReference(value: string, newKey: string): string {
    const slashIdx = value.indexOf('/');
    return slashIdx >= 0 ? newKey + value.slice(slashIdx) : newKey;
}
