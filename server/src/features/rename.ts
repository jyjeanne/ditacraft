import {
    PrepareRenameParams,
    RenameParams,
    TextDocuments,
    WorkspaceEdit,
    TextEdit,
    Range,
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';

import {
    findIdAtOffset,
    findReferencesToId,
} from '../utils/referenceParser';

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
 * Renames an id attribute value and updates all same-document references.
 */
export function handleRename(
    params: RenameParams,
    documents: TextDocuments<TextDocument>
): WorkspaceEdit | null {
    const document = documents.get(params.textDocument.uri);
    if (!document) return null;

    const text = document.getText();
    const offset = document.offsetAt(params.position);

    const idResult = findIdAtOffset(text, offset);
    if (!idResult) return null;

    const oldId = idResult.id;
    const newId = params.newName;
    const edits: TextEdit[] = [];

    // 1. Rename the id attribute value itself
    edits.push({
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
        edits.push({
            range: Range.create(
                document.positionAt(ref.valueStart),
                document.positionAt(ref.valueEnd)
            ),
            newText: newValue,
        });
    }

    return {
        changes: {
            [document.uri]: edits,
        },
    };
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
