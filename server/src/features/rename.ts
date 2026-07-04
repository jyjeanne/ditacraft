import * as fs from 'fs';
import * as path from 'path';
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
    findReferencesToId,
    parseReference,
    ReferenceOccurrence,
} from '../utils/referenceParser';

import { collectDitaFiles } from '../utils/workspaceScanner';
import { offsetToPosition, uriToPath } from '../utils/textUtils';
import { KeySpaceService } from '../services/keySpaceService';

/**
 * Handle Prepare Rename request.
 * Validates the cursor is on an id attribute value and returns its range.
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
    if (!idResult) return null;

    return Range.create(
        document.positionAt(idResult.valueStart),
        document.positionAt(idResult.valueEnd)
    );
}

/**
 * Handle Rename request.
 * Renames an id attribute value and updates all references across the workspace.
 */
export async function handleRename(
    params: RenameParams,
    documents: TextDocuments<TextDocument>,
    workspaceFolders?: readonly string[],
    keySpaceService?: KeySpaceService
): Promise<WorkspaceEdit | null> {
    const document = documents.get(params.textDocument.uri);
    if (!document) return null;

    const text = document.getText();
    const offset = document.offsetAt(params.position);

    const idResult = findIdAtOffset(text, offset);
    if (!idResult) return null;

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
    const normalizedTargetPath = path.normalize(targetFilePath);
    const refs = findReferencesToId(text, oldId);
    const selfEdits = await collectMatchingEdits(
        refs, text, targetFilePath, normalizedTargetPath, oldId, newId, keySpaceService
    );
    currentEdits.push(...selfEdits);
    changes[document.uri] = currentEdits;

    // 3. Cross-file: update references in other workspace files
    if (workspaceFolders && workspaceFolders.length > 0) {
        const ditaFiles = collectDitaFiles(workspaceFolders);

        for (const filePath of ditaFiles) {
            const fileUri = URI.file(filePath).toString();
            if (fileUri === document.uri) continue;

            // Prefer in-memory content for open documents (may have unsaved changes)
            const openDoc = documents.get(fileUri);
            let content: string;
            if (openDoc) {
                content = openDoc.getText();
            } else {
                try {
                    content = fs.readFileSync(filePath, 'utf-8');
                } catch {
                    continue;
                }
            }

            const fileRefs = findReferencesToId(content, oldId);
            if (fileRefs.length === 0) continue;

            const fileEdits = await collectMatchingEdits(
                fileRefs, content, filePath, normalizedTargetPath, oldId, newId, keySpaceService
            );

            if (fileEdits.length > 0) {
                changes[fileUri] = fileEdits;
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
    keySpaceService: KeySpaceService | undefined
): Promise<TextEdit[]> {
    const contextDir = path.dirname(contextFilePath);
    const edits: TextEdit[] = [];

    for (const ref of refs) {
        if (ref.type === 'href' || ref.type === 'conref') {
            const parsed = parseReference(ref.value);
            if (parsed.filePath) {
                const resolvedPath = path.normalize(path.resolve(contextDir, parsed.filePath));
                if (resolvedPath !== normalizedTargetPath) continue;
            } else {
                // Fragment-only ref: only relevant when this file is the target file
                if (path.normalize(contextFilePath) !== normalizedTargetPath) continue;
            }
        } else if (ref.type === 'conkeyref') {
            if (!keySpaceService) continue;
            const slashIdx = ref.value.indexOf('/');
            const keyName = slashIdx >= 0 ? ref.value.slice(0, slashIdx) : ref.value;
            const keyDef = await keySpaceService.resolveKey(keyName, contextFilePath);
            const resolvedTarget = keyDef?.targetFile ? path.normalize(keyDef.targetFile) : null;
            if (resolvedTarget !== normalizedTargetPath) continue;
        }

        const newValue = replaceIdInReference(ref.type, ref.value, oldId, newId);
        const startPos = offsetToPosition(content, ref.valueStart);
        const endPos = offsetToPosition(content, ref.valueEnd);
        edits.push({
            range: Range.create(startPos, endPos),
            newText: newValue,
        });
    }

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
