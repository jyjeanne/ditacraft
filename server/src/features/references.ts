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
    ReferenceOccurrence,
} from '../utils/referenceParser';

import { findCrossFileReferences, referenceMatchesTarget } from '../utils/workspaceScanner';
import { uriToPath, normalizeFsPath } from '../utils/textUtils';
import { KeySpaceService } from '../services/keySpaceService';

/**
 * Handle Find References requests.
 * Searches the current document and all workspace DITA files for references
 * to the ID at the cursor position.
 */
export async function handleReferences(
    params: ReferenceParams,
    documents: TextDocuments<TextDocument>,
    workspaceFolders?: readonly string[],
    keySpaceService?: KeySpaceService,
    log?: (msg: string) => void
): Promise<Location[]> {
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

    // Find all references to this ID in the current document. Filtered the
    // same way as cross-file refs below — a href/conref/conkeyref in this
    // file may reference a *different* file's element that merely shares
    // the same id text, and must not be reported as a match.
    const targetFilePath = uriToPath(document.uri);
    const normalizedTargetPath = normalizeFsPath(targetFilePath);
    const refs = findReferencesToId(text, idResult.id);
    for (const ref of await filterMatchingRefs(
        refs, targetFilePath, normalizedTargetPath, keySpaceService, log
    )) {
        const startPos = document.positionAt(ref.valueStart);
        const endPos = document.positionAt(ref.valueEnd);
        results.push(Location.create(document.uri, { start: startPos, end: endPos }));
    }

    // Find references across all workspace files
    if (workspaceFolders && workspaceFolders.length > 0) {
        const crossFileRefs = await findCrossFileReferences(
            idResult.id,
            targetFilePath,
            workspaceFolders,
            document.uri,
            documents,
            keySpaceService,
            log
        );
        results.push(...crossFileRefs);
    }

    return results;
}

/**
 * Filter reference occurrences found in `contextFilePath` down to only those
 * that actually point at `normalizedTargetPath`. Mirrors the filtering used
 * for cross-file references in workspaceScanner.ts's findCrossFileReferences.
 */
async function filterMatchingRefs(
    refs: ReferenceOccurrence[],
    contextFilePath: string,
    normalizedTargetPath: string,
    keySpaceService: KeySpaceService | undefined,
    log?: (msg: string) => void
): Promise<ReferenceOccurrence[]> {
    const matching: ReferenceOccurrence[] = [];

    for (const ref of refs) {
        if (await referenceMatchesTarget(ref, contextFilePath, normalizedTargetPath, keySpaceService, log)) {
            matching.push(ref);
        }
    }

    return matching;
}
