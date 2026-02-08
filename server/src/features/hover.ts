import {
    Hover,
    HoverParams,
    TextDocuments,
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';

import { ELEMENT_DOCS, DITA_ELEMENTS } from '../data/ditaSchema';

/**
 * Handle hover requests.
 * Shows documentation for DITA elements when the cursor is over an element name.
 */
export function handleHover(
    params: HoverParams,
    documents: TextDocuments<TextDocument>
): Hover | null {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        return null;
    }

    const text = document.getText();
    const offset = document.offsetAt(params.position);

    // Find the word at the cursor position
    const word = getWordAt(text, offset);
    if (!word) {
        return null;
    }

    // Check if this word is inside an element tag
    if (!isInsideTag(text, offset, word)) {
        return null;
    }

    // Look up documentation
    const doc = ELEMENT_DOCS[word];
    if (!doc) {
        // Even without full docs, show children if known
        const children = DITA_ELEMENTS[word];
        if (children) {
            return {
                contents: {
                    kind: 'markdown',
                    value: `**\`<${word}>\`**\n\n**Children:** ${children.join(', ')}`,
                },
            };
        }
        return null;
    }

    return {
        contents: {
            kind: 'markdown',
            value: doc,
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
