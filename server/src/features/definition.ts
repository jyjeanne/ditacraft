import {
    DefinitionParams,
    Location,
    TextDocuments,
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';
import { URI } from 'vscode-uri';
import * as fs from 'fs';
import * as path from 'path';

import {
    findReferenceAtOffset,
    parseReference,
    getTargetId,
    findElementByIdOffset,
} from '../utils/referenceParser';

import { KeySpaceService } from '../services/keySpaceService';

/**
 * Handle Go to Definition requests.
 * Navigates to the target of href/conref/keyref/conkeyref attributes.
 */
export async function handleDefinition(
    params: DefinitionParams,
    documents: TextDocuments<TextDocument>,
    keySpaceService?: KeySpaceService
): Promise<Location | null> {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        return null;
    }

    const text = document.getText();
    const offset = document.offsetAt(params.position);

    // Find the reference attribute at the cursor
    const ref = findReferenceAtOffset(text, offset);
    if (!ref) {
        return null;
    }

    // keyref: resolve via key space service
    if (ref.type === 'keyref') {
        if (!keySpaceService) return null;

        const currentFilePath = URI.parse(params.textDocument.uri).fsPath;
        const keyDef = await keySpaceService.resolveKey(ref.value, currentFilePath);
        if (!keyDef) return null;

        if (keyDef.targetFile) {
            return resolveElementInFile(
                keyDef.targetFile,
                URI.file(keyDef.targetFile).toString(),
                keyDef.elementId
            );
        }

        // Inline key — navigate to the source map where key is defined
        if (keyDef.sourceMap) {
            return locationAtFileStart(URI.file(keyDef.sourceMap).toString());
        }
        return null;
    }

    // conkeyref: "keyname/elementid" — resolve key for file, then element ID
    if (ref.type === 'conkeyref') {
        const slashIdx = ref.value.indexOf('/');
        const keyName = slashIdx >= 0 ? ref.value.slice(0, slashIdx) : ref.value;
        const elementId = slashIdx >= 0 ? ref.value.slice(slashIdx + 1) : '';

        if (keySpaceService) {
            const currentFilePath = URI.parse(params.textDocument.uri).fsPath;
            const keyDef = await keySpaceService.resolveKey(keyName, currentFilePath);
            if (keyDef?.targetFile) {
                return resolveElementInFile(
                    keyDef.targetFile,
                    URI.file(keyDef.targetFile).toString(),
                    elementId || keyDef.elementId
                );
            }
        }

        // Fallback: same-file lookup for element ID
        if (elementId) {
            return resolveInDocument(document, text, elementId);
        }
        return null;
    }

    // href / conref: parse file path + fragment
    const parsed = parseReference(ref.value);
    const targetId = getTargetId(parsed.fragment);

    if (!parsed.filePath) {
        // Same-file reference (e.g., conref="#topicid/elementid")
        return resolveInDocument(document, text, targetId);
    }

    // Cross-file reference
    const currentDir = path.dirname(URI.parse(document.uri).fsPath);
    const targetPath = path.resolve(currentDir, parsed.filePath);
    return resolveElementInFile(targetPath, URI.file(targetPath).toString(), targetId || undefined);
}

/**
 * Resolve a same-file reference by finding the element with the target ID.
 */
function resolveInDocument(
    document: TextDocument,
    text: string,
    targetId: string
): Location | null {
    if (!targetId) return null;

    const elementOffset = findElementByIdOffset(text, targetId);
    if (elementOffset < 0) return null;

    const pos = document.positionAt(elementOffset);
    return Location.create(document.uri, { start: pos, end: pos });
}

/**
 * Resolve a reference to a (possibly cross-file) element.
 * If elementId is provided, searches for the element in the file.
 * Falls back to file start if element not found or not specified.
 */
function resolveElementInFile(
    filePath: string,
    fileUri: string,
    elementId?: string
): Location | null {
    try {
        if (!fs.existsSync(filePath)) return null;

        if (!elementId) {
            return locationAtFileStart(fileUri);
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        const elementOffset = findElementByIdOffset(content, elementId);

        if (elementOffset < 0) {
            return locationAtFileStart(fileUri);
        }

        const pos = offsetToPosition(content, elementOffset);
        return Location.create(fileUri, { start: pos, end: pos });
    } catch {
        return null;
    }
}

function locationAtFileStart(uri: string): Location {
    return Location.create(uri, {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 0 },
    });
}

/**
 * Convert a byte offset to { line, character } position.
 */
function offsetToPosition(text: string, offset: number): { line: number; character: number } {
    let line = 0;
    let lastLineStart = 0;

    for (let i = 0; i < offset && i < text.length; i++) {
        if (text[i] === '\n') {
            line++;
            lastLineStart = i + 1;
        } else if (text[i] === '\r') {
            line++;
            if (i + 1 < text.length && text[i + 1] === '\n') {
                i++; // skip \n in \r\n
            }
            lastLineStart = i + 1;
        }
    }

    return { line, character: offset - lastLineStart };
}
