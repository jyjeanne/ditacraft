import {
    FoldingRange,
    FoldingRangeKind,
    FoldingRangeParams,
    TextDocuments,
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';

// --- Types ---

interface OpenTag {
    name: string;
    line: number;
}

// --- Public handler ---

/**
 * Handle folding range requests.
 * Produces foldable regions for multi-line XML elements, comments, and CDATA.
 */
export function handleFoldingRanges(
    params: FoldingRangeParams,
    documents: TextDocuments<TextDocument>
): FoldingRange[] {
    const document = documents.get(params.textDocument.uri);
    if (!document) return [];

    return computeFoldingRanges(document.getText());
}

// --- Core logic (exported for unit testing) ---

export function computeFoldingRanges(text: string): FoldingRange[] {
    const ranges: FoldingRange[] = [];
    const lineOffsets = buildLineOffsets(text);
    const tagStack: OpenTag[] = [];

    // Regex alternatives (order matters — comments and CDATA first to consume inner tags):
    //  1. Comments:     <!--...-->
    //  2. CDATA:        <![CDATA[...]]>
    //  3. Close tag:    </name>
    //  4. Self-closing: <name .../>
    //  5. Open tag:     <name ...>
    const regex =
        /(<!--[\s\S]*?-->)|(<!\[CDATA\[[\s\S]*?\]\]>)|(<\/\s*([a-zA-Z][\w:-]*)\s*>)|(<([a-zA-Z][\w:-]*)(?:\s[^>]*?)?\/>)|(<([a-zA-Z][\w:-]*)(?:\s[^>]*)?>)/g;

    let match;
    while ((match = regex.exec(text)) !== null) {
        if (match[1]) {
            // Comment
            const startLine = lineAtOffset(lineOffsets, match.index);
            const endLine = lineAtOffset(lineOffsets, match.index + match[0].length - 1);
            if (endLine > startLine) {
                ranges.push({ startLine, endLine, kind: FoldingRangeKind.Comment });
            }
        } else if (match[2]) {
            // CDATA
            const startLine = lineAtOffset(lineOffsets, match.index);
            const endLine = lineAtOffset(lineOffsets, match.index + match[0].length - 1);
            if (endLine > startLine) {
                ranges.push({ startLine, endLine, kind: FoldingRangeKind.Region });
            }
        } else if (match[3]) {
            // Closing tag — match[4] is the tag name
            const closeName = match[4];
            for (let j = tagStack.length - 1; j >= 0; j--) {
                if (tagStack[j].name === closeName) {
                    const openLine = tagStack[j].line;
                    const closeLine = lineAtOffset(lineOffsets, match.index);
                    tagStack.splice(j, 1);
                    if (closeLine > openLine) {
                        ranges.push({
                            startLine: openLine,
                            endLine: closeLine,
                            kind: FoldingRangeKind.Region,
                        });
                    }
                    break;
                }
            }
        } else if (match[5]) {
            // Self-closing — no folding range
        } else if (match[7]) {
            // Opening tag — match[8] is the tag name
            const openLine = lineAtOffset(lineOffsets, match.index);
            tagStack.push({ name: match[8], line: openLine });
        }
    }

    return ranges;
}

// --- Helpers ---

/**
 * Build array of byte offsets where each line starts.
 * lineOffsets[0] = 0 (first line starts at offset 0).
 */
function buildLineOffsets(text: string): number[] {
    const offsets: number[] = [0];
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '\n') {
            offsets.push(i + 1);
        } else if (text[i] === '\r') {
            if (i + 1 < text.length && text[i + 1] === '\n') {
                i++;
            }
            offsets.push(i + 1);
        }
    }
    return offsets;
}

/**
 * Binary search to find the 0-based line number for a given offset.
 */
function lineAtOffset(lineOffsets: number[], offset: number): number {
    let low = 0;
    let high = lineOffsets.length - 1;
    while (low < high) {
        const mid = (low + high + 1) >> 1;
        if (lineOffsets[mid] <= offset) {
            low = mid;
        } else {
            high = mid - 1;
        }
    }
    return low;
}
