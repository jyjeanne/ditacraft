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
} from '../utils/referenceParser';

import { collectDitaFiles, offsetToPosition } from '../utils/workspaceScanner';

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
export function handleRename(
    params: RenameParams,
    documents: TextDocuments<TextDocument>,
    workspaceFolders?: readonly string[]
): WorkspaceEdit | null {
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

    // 2. Update all references to this ID in the current document
    const refs = findReferencesToId(text, oldId);
    for (const ref of refs) {
        const newValue = replaceIdInReference(ref.type, ref.value, oldId, newId);
        currentEdits.push({
            range: Range.create(
                document.positionAt(ref.valueStart),
                document.positionAt(ref.valueEnd)
            ),
            newText: newValue,
        });
    }
    changes[document.uri] = currentEdits;

    // 3. Cross-file: update references in other workspace files
    if (workspaceFolders && workspaceFolders.length > 0) {
        const targetFilePath = URI.parse(document.uri).fsPath;
        const normalizedTargetPath = path.normalize(targetFilePath);
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

            const fileDir = path.dirname(filePath);
            const fileEdits: TextEdit[] = [];

            for (const ref of fileRefs) {
                // Filter: only include refs that point to the target file
                if (ref.type === 'href' || ref.type === 'conref') {
                    const parsed = parseReference(ref.value);
                    if (parsed.filePath) {
                        const resolvedPath = path.normalize(
                            path.resolve(fileDir, parsed.filePath)
                        );
                        if (resolvedPath !== normalizedTargetPath) continue;
                    } else {
                        // Fragment-only ref: only relevant in the target file itself
                        if (path.normalize(filePath) !== normalizedTargetPath) continue;
                    }
                }
                // conkeyref: include all matches by element ID

                const newValue = replaceIdInReference(ref.type, ref.value, oldId, newId);
                const startPos = offsetToPosition(content, ref.valueStart);
                const endPos = offsetToPosition(content, ref.valueEnd);
                fileEdits.push({
                    range: Range.create(startPos, endPos),
                    newText: newValue,
                });
            }

            if (fileEdits.length > 0) {
                changes[fileUri] = fileEdits;
            }
        }
    }

    return { changes };
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
