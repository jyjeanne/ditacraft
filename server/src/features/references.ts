import {
    Location,
    ReferenceParams,
    TextDocuments,
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';
import { URI } from 'vscode-uri';

import {
    findIdAtOffset,
    findReferencesToId,
    findElementByIdOffset,
} from '../utils/referenceParser';

import { findCrossFileReferences } from '../utils/workspaceScanner';

/**
 * Handle Find References requests.
 * Searches the current document and all workspace DITA files for references
 * to the ID at the cursor position.
 */
export function handleReferences(
    params: ReferenceParams,
    documents: TextDocuments<TextDocument>,
    workspaceFolders?: readonly string[]
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

    // Find references across all workspace files
    if (workspaceFolders && workspaceFolders.length > 0) {
        const targetFilePath = URI.parse(document.uri).fsPath;
        const crossFileRefs = findCrossFileReferences(
            idResult.id,
            targetFilePath,
            workspaceFolders,
            document.uri,
            documents
        );
        results.push(...crossFileRefs);
    }

    return results;
}
