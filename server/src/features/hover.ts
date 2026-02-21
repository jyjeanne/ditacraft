import {
    Hover,
    HoverParams,
    MarkupKind,
    TextDocuments,
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';
import { URI } from 'vscode-uri';
import * as path from 'path';
import * as fs from 'fs';

import { ELEMENT_DOCS, DITA_ELEMENTS } from '../data/ditaSchema';
import { findReferenceAtOffset, parseReference } from '../utils/referenceParser';
import { KeySpaceService } from '../services/keySpaceService';

/**
 * Handle hover requests.
 * Shows documentation for DITA elements, key reference info, and href resolution.
 * Now async to support key space resolution for keyref/conkeyref hover.
 */
export async function handleHover(
    params: HoverParams,
    documents: TextDocuments<TextDocument>,
    keySpaceService?: KeySpaceService
): Promise<Hover | null> {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        return null;
    }

    const text = document.getText();
    const offset = document.offsetAt(params.position);

    // --- Key reference hover (keyref / conkeyref) ---
    const refAtOffset = findReferenceAtOffset(text, offset);
    if (refAtOffset) {
        if ((refAtOffset.type === 'keyref' || refAtOffset.type === 'conkeyref') && keySpaceService) {
            const hover = await getKeyrefHover(refAtOffset, params.textDocument.uri, keySpaceService);
            if (hover) return hover;
        }

        if (refAtOffset.type === 'href' || refAtOffset.type === 'conref') {
            const hover = getHrefHover(refAtOffset, params.textDocument.uri);
            if (hover) return hover;
        }
    }

    // --- Element documentation hover (existing behavior) ---
    const word = getWordAt(text, offset);
    if (!word) {
        return null;
    }

    if (!isInsideTag(text, offset, word)) {
        return null;
    }

    const doc = ELEMENT_DOCS[word];
    if (!doc) {
        const children = DITA_ELEMENTS[word];
        if (children) {
            return {
                contents: {
                    kind: MarkupKind.Markdown,
                    value: `**\`<${word}>\`**\n\n**Children:** ${children.join(', ')}`,
                },
            };
        }
        return null;
    }

    return {
        contents: {
            kind: MarkupKind.Markdown,
            value: doc,
        },
    };
}

/**
 * Generate hover content for keyref/conkeyref attribute values.
 * Shows key metadata: target file, navtitle, shortdesc, inline content, source map.
 */
async function getKeyrefHover(
    ref: { type: string; value: string },
    documentUri: string,
    keySpaceService: KeySpaceService
): Promise<Hover | null> {
    const filePath = URI.parse(documentUri).fsPath;

    // Strip "/elementId" suffix for conkeyref
    let keyName = ref.value;
    const slashPos = keyName.indexOf('/');
    let elementId: string | undefined;
    if (slashPos !== -1) {
        elementId = keyName.substring(slashPos + 1);
        keyName = keyName.substring(0, slashPos);
    }

    if (!keyName) return null;

    const keyDef = await keySpaceService.resolveKey(keyName, filePath);
    if (!keyDef) {
        return {
            contents: {
                kind: MarkupKind.Markdown,
                value: `**Key:** \`${keyName}\`\n\n**Warning:** Key not found in key space`,
            },
        };
    }

    const contents: string[] = [];
    contents.push(`**Key:** \`${keyName}\``);

    if (keyDef.targetFile) {
        contents.push(`**Target:** ${path.basename(keyDef.targetFile)}`);
    }
    if (keyDef.metadata?.navtitle) {
        contents.push(`**Nav title:** ${keyDef.metadata.navtitle}`);
    }
    if (keyDef.metadata?.shortdesc) {
        contents.push(`**Description:** ${keyDef.metadata.shortdesc}`);
    }
    if (keyDef.inlineContent) {
        contents.push(`**Content:** ${keyDef.inlineContent}`);
    }
    if (elementId) {
        contents.push(`**Element:** \`${elementId}\``);
    }
    contents.push(`**Defined in:** ${path.basename(keyDef.sourceMap)}`);

    return {
        contents: {
            kind: MarkupKind.Markdown,
            value: contents.join('\n\n'),
        },
    };
}

/**
 * Generate hover content for href/conref attribute values.
 * Shows resolved path, fragment info, and file existence warning.
 */
function getHrefHover(
    ref: { type: string; value: string },
    documentUri: string
): Hover | null {
    if (!ref.value) return null;

    const currentDir = path.dirname(URI.parse(documentUri).fsPath);
    const parsed = parseReference(ref.value);

    // External URLs — show as-is
    if (parsed.filePath.startsWith('http://') || parsed.filePath.startsWith('https://')) {
        return {
            contents: {
                kind: MarkupKind.Markdown,
                value: `**${ref.type}:** \`${ref.value}\`\n\n**External link**`,
            },
        };
    }

    const resolvedPath = parsed.filePath
        ? path.resolve(currentDir, parsed.filePath)
        : URI.parse(documentUri).fsPath; // same-file ref

    const contents: string[] = [];
    contents.push(`**${ref.type}:** \`${ref.value}\``);

    if (parsed.filePath) {
        contents.push(`**Resolved:** ${resolvedPath}`);
        if (!fs.existsSync(resolvedPath)) {
            contents.push('**Warning:** Target file not found');
        }
    } else {
        contents.push('**Same-file reference**');
    }

    if (parsed.fragment) {
        contents.push(`**Fragment:** \`${parsed.fragment}\``);
    }

    return {
        contents: {
            kind: MarkupKind.Markdown,
            value: contents.join('\n\n'),
        },
    };
}

/**
 * Extract the XML element/attribute name at the given offset.
 */
function getWordAt(text: string, offset: number): string {
    let start = offset;
    let end = offset;

    while (start > 0 && /[\w-]/.test(text[start - 1])) start--;
    while (end < text.length && /[\w-]/.test(text[end])) end++;

    if (start === end) return '';
    return text.slice(start, end);
}

/**
 * Check if the word at offset is part of an element tag name.
 * Returns true for `<word`, `</word`, or `<word ` patterns.
 */
function isInsideTag(text: string, offset: number, word: string): boolean {
    // Find start of the word
    let start = offset;
    while (start > 0 && /[\w-]/.test(text[start - 1])) start--;

    // Check if preceded by < or </
    if (start > 0 && text[start - 1] === '<') return true;
    if (start > 1 && text[start - 2] === '<' && text[start - 1] === '/') return true;

    // Also match if the word is a known element inside content
    // (e.g., hovering over element name in running text isn't useful)
    // Only show hover for known DITA elements inside angle brackets
    // Scan backwards for nearest < or >
    let i = start - 1;
    while (i >= 0 && text[i] !== '<' && text[i] !== '>') i--;

    if (i >= 0 && text[i] === '<') {
        // We're between < and >, check if word matches the tag name
        const closeAngle = text.indexOf('>', i);
        if (closeAngle < 0) return false;
        const tagContent = text.slice(i + 1, closeAngle);
        const tagName = tagContent.match(/^\/?([\w-]+)/);
        if (tagName && tagName[1] === word) return true;
    }

    return false;
}
