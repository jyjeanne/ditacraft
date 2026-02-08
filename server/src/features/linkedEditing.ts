import {
    LinkedEditingRangeParams,
    LinkedEditingRanges,
    TextDocuments,
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';

/**
 * Handle Linked Editing Range requests.
 * Returns the ranges of matching open/close XML tag names so they
 * can be edited simultaneously.
 */
export function handleLinkedEditingRange(
    params: LinkedEditingRangeParams,
    documents: TextDocuments<TextDocument>
): LinkedEditingRanges | null {
    const document = documents.get(params.textDocument.uri);
    if (!document) return null;

    const text = document.getText();
    const offset = document.offsetAt(params.position);

    // Determine if cursor is on a tag name
    const tagInfo = findTagAtOffset(text, offset);
    if (!tagInfo) return null;

    // Find the matching counterpart
    const matchRange = tagInfo.isClosing
        ? findOpeningTag(text, tagInfo.tagName, tagInfo.tagStart)
        : findClosingTag(text, tagInfo.tagName, tagInfo.tagEnd);

    if (!matchRange) return null;

    return {
        ranges: [
            {
                start: document.positionAt(tagInfo.nameStart),
                end: document.positionAt(tagInfo.nameEnd),
            },
            {
                start: document.positionAt(matchRange.nameStart),
                end: document.positionAt(matchRange.nameEnd),
            },
        ],
        wordPattern: '[a-zA-Z][\\w:-]*',
    };
}

interface TagAtOffset {
    tagName: string;
    nameStart: number;  // offset of the tag name start
    nameEnd: number;    // offset of the tag name end
    tagStart: number;   // offset of '<' or '</'
    tagEnd: number;     // offset after '>'
    isClosing: boolean;
}

interface TagNameRange {
    nameStart: number;
    nameEnd: number;
}

/**
 * Determine if the cursor offset is on a tag name in the document text.
 * Returns tag info if found, null otherwise.
 */
function findTagAtOffset(text: string, offset: number): TagAtOffset | null {
    // Find the '<' that opens the tag containing the cursor
    let ltPos = -1;
    for (let i = offset; i >= 0; i--) {
        if (text[i] === '<') {
            ltPos = i;
            break;
        }
        // If we hit '>' before '<', cursor is not inside a tag
        if (text[i] === '>') return null;
    }
    if (ltPos < 0) return null;

    // Find the matching '>'
    let gtPos = -1;
    for (let i = ltPos + 1; i < text.length; i++) {
        if (text[i] === '>') {
            gtPos = i;
            break;
        }
        // Nested '<' means malformed — bail
        if (text[i] === '<') return null;
    }
    if (gtPos < 0) return null;

    const tagContent = text.slice(ltPos, gtPos + 1);

    // Check for self-closing tag — no linked editing needed
    if (tagContent.endsWith('/>')) return null;

    // Check for comment or CDATA or processing instruction
    if (tagContent.startsWith('<!--') || tagContent.startsWith('<![') || tagContent.startsWith('<?')) {
        return null;
    }

    const isClosing = text[ltPos + 1] === '/';
    const nameStartOffset = ltPos + (isClosing ? 2 : 1);

    // Extract tag name: sequence of valid XML name characters
    const nameMatch = text.slice(nameStartOffset).match(/^([a-zA-Z][\w:-]*)/);
    if (!nameMatch) return null;

    const tagName = nameMatch[1];
    const nameStart = nameStartOffset;
    const nameEnd = nameStartOffset + tagName.length;

    // Cursor must be within the tag name range
    if (offset < nameStart || offset > nameEnd) return null;

    return {
        tagName,
        nameStart,
        nameEnd,
        tagStart: ltPos,
        tagEnd: gtPos + 1,
        isClosing,
    };
}

/**
 * Find the closing tag that matches an opening tag.
 * Uses a depth counter to handle nested same-name tags.
 * Starts scanning from the end of the opening tag.
 */
function findClosingTag(text: string, tagName: string, fromOffset: number): TagNameRange | null {
    let depth = 1;
    const tagRegex = new RegExp(
        `<(/?)\\s*(${escapeRegExp(tagName)})(?=[\\s/>])([^>]*?)(/?)>`,
        'g'
    );
    tagRegex.lastIndex = fromOffset;

    let match: RegExpExecArray | null;
    while ((match = tagRegex.exec(text)) !== null) {
        const isClose = match[1] === '/';
        const isSelfClose = match[4] === '/';

        if (isSelfClose) continue;

        if (isClose) {
            depth--;
            if (depth === 0) {
                // Found the matching closing tag — skip whitespace between '</' and tag name
                let actualNameStart = match.index + 2; // skip '</'
                while (actualNameStart < text.length && /\s/.test(text[actualNameStart])) {
                    actualNameStart++;
                }
                return {
                    nameStart: actualNameStart,
                    nameEnd: actualNameStart + tagName.length,
                };
            }
        } else {
            depth++;
        }
    }

    return null;
}

/**
 * Find the opening tag that matches a closing tag.
 * Uses a depth counter to handle nested same-name tags.
 * Scans backward from the start of the closing tag.
 */
function findOpeningTag(text: string, tagName: string, beforeOffset: number): TagNameRange | null {
    // Collect all opening and closing tags for this name before the offset
    const tagRegex = new RegExp(
        `<(/?)\\s*(${escapeRegExp(tagName)})(?=[\\s/>])([^>]*?)(/?)>`,
        'g'
    );

    interface TagOccurrence {
        index: number;
        isClose: boolean;
        nameStart: number;
    }

    const occurrences: TagOccurrence[] = [];
    let match: RegExpExecArray | null;
    while ((match = tagRegex.exec(text)) !== null) {
        if (match.index >= beforeOffset) break;

        const isSelfClose = match[4] === '/';
        if (isSelfClose) continue;

        const isClose = match[1] === '/';
        let actualNameStart: number;
        if (isClose) {
            actualNameStart = match.index + 2;
            while (actualNameStart < text.length && /\s/.test(text[actualNameStart])) {
                actualNameStart++;
            }
        } else {
            actualNameStart = match.index + 1;
            while (actualNameStart < text.length && /\s/.test(text[actualNameStart])) {
                actualNameStart++;
            }
        }

        occurrences.push({
            index: match.index,
            isClose,
            nameStart: actualNameStart,
        });
    }

    // Walk backwards with depth counter
    let depth = 1;
    for (let i = occurrences.length - 1; i >= 0; i--) {
        const occ = occurrences[i];
        if (occ.isClose) {
            depth++;
        } else {
            depth--;
            if (depth === 0) {
                return {
                    nameStart: occ.nameStart,
                    nameEnd: occ.nameStart + tagName.length,
                };
            }
        }
    }

    return null;
}

/**
 * Escape special regex characters in a string.
 */
function escapeRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
