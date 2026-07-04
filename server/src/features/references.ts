import * as path from 'path';
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
    parseReference,
    ReferenceOccurrence,
} from '../utils/referenceParser';

import { findCrossFileReferences } from '../utils/workspaceScanner';
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
    keySpaceService?: KeySpaceService
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
        refs, targetFilePath, normalizedTargetPath, keySpaceService
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
            keySpaceService
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
    keySpaceService: KeySpaceService | undefined
): Promise<ReferenceOccurrence[]> {
    const contextDir = path.dirname(contextFilePath);
    const matching: ReferenceOccurrence[] = [];

    for (const ref of refs) {
        if (ref.type === 'href' || ref.type === 'conref') {
            const parsed = parseReference(ref.value);
            if (parsed.filePath) {
                const resolvedPath = normalizeFsPath(path.resolve(contextDir, parsed.filePath));
                if (resolvedPath !== normalizedTargetPath) continue;
            } else if (normalizeFsPath(contextFilePath) !== normalizedTargetPath) {
                continue;
            }
        } else if (ref.type === 'conkeyref') {
            if (!keySpaceService) continue;
            const slashIdx = ref.value.indexOf('/');
            const keyName = slashIdx >= 0 ? ref.value.slice(0, slashIdx) : ref.value;
            const keyDef = await keySpaceService.resolveKey(keyName, contextFilePath);
            const resolvedTarget = keyDef?.targetFile ? normalizeFsPath(keyDef.targetFile) : null;
            if (resolvedTarget !== normalizedTargetPath) continue;
        }
        matching.push(ref);
    }

    return matching;
}
