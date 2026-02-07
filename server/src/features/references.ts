import {
    Location,
    ReferenceParams,
    TextDocuments,
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';

import {
    findIdAtOffset,
    findReferencesToId,
    findElementByIdOffset,
} from '../utils/referenceParser';

/**
 * Handle Find References requests.
 * When the cursor is on an id attribute value, finds all conref/href
 * attributes in the current document that reference this ID.
 */
export function handleReferences(
    params: ReferenceParams,
    documents: TextDocuments<TextDocument>
): Location[] {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        return [];
    }

    const text = document.getText();
    const offset = document.offsetAt(params.position);

    // Check if cursor is on an id attribute value
    const idResult = findIdAtOffset(text, offset);
    if (!idResult) {
        return [];
    }

    const results: Location[] = [];

    // Include the declaration itself if requested
    if (params.context.includeDeclaration) {
        const declOffset = findElementByIdOffset(text, idResult.id);
        if (declOffset >= 0) {
            const pos = document.positionAt(declOffset);
            results.push(Location.create(document.uri, { start: pos, end: pos }));
        }
    }

    // Find all references to this ID in the current document
    const refs = findReferencesToId(text, idResult.id);
    for (const ref of refs) {
        const startPos = document.positionAt(ref.valueStart);
        const endPos = document.positionAt(ref.valueEnd);
        results.push(Location.create(document.uri, { start: startPos, end: endPos }));
    }

    return results;
}
