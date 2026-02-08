import {
    DocumentFormattingParams,
    DocumentRangeFormattingParams,
    TextDocuments,
    TextEdit,
    Range,
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';

// --- Inline and preformatted element sets ---

const INLINE_ELEMENTS = new Set([
    'ph', 'b', 'i', 'u', 'sup', 'sub', 'tt',
    'xref', 'keyword', 'term', 'codeph', 'filepath',
    'menucascade', 'uicontrol', 'wintitle',
    'varname', 'parmname', 'apiname', 'cmdname',
    'msgnum', 'msgph', 'cite', 'q', 'fn', 'tm',
    'boolean', 'state', 'data', 'text',
    'navtitle', 'linktext', 'searchtitle',
]);

const PREFORMATTED_ELEMENTS = new Set([
    'codeblock', 'pre', 'lines', 'msgblock', 'screen',
]);

// --- Token types ---

interface XMLToken {
    type: 'open' | 'close' | 'selfClose' | 'text' | 'comment' | 'cdata' | 'pi' | 'doctype';
    name?: string;
    raw: string;
}

// --- Public handlers ---

/**
 * Handle document formatting request.
 * Reformats the entire document with proper XML indentation.
 */
export function handleFormatting(
    params: DocumentFormattingParams,
    documents: TextDocuments<TextDocument>
): TextEdit[] {
    const document = documents.get(params.textDocument.uri);
    if (!document) return [];

    const text = document.getText();
    const formatted = formatXML(text, params.options.tabSize, params.options.insertSpaces);

    if (formatted === text) return [];

    const lastLine = document.lineCount - 1;
    const lastChar = document.getText(Range.create(lastLine, 0, lastLine + 1, 0)).length;

    return [{
        range: Range.create(0, 0, lastLine, lastChar),
        newText: formatted,
    }];
}

/**
 * Handle range formatting request.
 * Formats the selected range (re-formats the full document and returns the edit).
 */
export function handleRangeFormatting(
    params: DocumentRangeFormattingParams,
    documents: TextDocuments<TextDocument>
): TextEdit[] {
    // For simplicity, format the full document.
    // The LSP client applies minimal diffs.
    return handleFormatting(
        {
            textDocument: params.textDocument,
            options: params.options,
        },
        documents
    );
}

// --- Core formatting logic ---

/**
 * Format XML text with proper indentation.
 * Handles inline elements, preformatted blocks, comments, CDATA, PI, and DOCTYPE.
 */
export function formatXML(
    text: string,
    tabSize: number,
    insertSpaces: boolean
): string {
    const tokens = tokenize(text);
    if (tokens.length === 0) return text;

    const indent = insertSpaces ? ' '.repeat(tabSize) : '\t';
    const eol = detectEOL(text);
    const lines: string[] = [];

    let depth = 0;
    let currentLine = '';
    let inPreformatted = 0;
    let preformattedTagName = '';
    let preformattedTokens: XMLToken[] = [];
    let preformattedDepth = 0;

    function flush(): void {
        const trimmed = currentLine.trim();
        if (trimmed) {
            lines.push(indent.repeat(depth) + trimmed);
        }
        currentLine = '';
    }

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        // --- Inside preformatted element: collect raw content ---
        if (inPreformatted > 0) {
            preformattedTokens.push(token);

            if (token.type === 'open' && token.name === preformattedTagName) {
                inPreformatted++;
            } else if (token.type === 'close' && token.name === preformattedTagName) {
                inPreformatted--;
                if (inPreformatted === 0) {
                    // Output collected preformatted block
                    const raw = preformattedTokens.map(t => t.raw).join('');
                    lines.push(indent.repeat(preformattedDepth) + raw.replace(/^\s+/, ''));
                    preformattedTokens = [];
                    depth = Math.max(0, depth - 1);
                }
            }
            continue;
        }

        // --- Normal formatting ---

        switch (token.type) {
            case 'pi':
            case 'doctype':
            case 'comment':
            case 'cdata':
                flush();
                lines.push(indent.repeat(depth) + token.raw.trim());
                break;

            case 'selfClose':
                if (INLINE_ELEMENTS.has(token.name!)) {
                    currentLine += token.raw.trim();
                } else {
                    flush();
                    lines.push(indent.repeat(depth) + token.raw.trim());
                }
                break;

            case 'open':
                if (INLINE_ELEMENTS.has(token.name!)) {
                    currentLine += token.raw.trim();
                } else if (PREFORMATTED_ELEMENTS.has(token.name!)) {
                    flush();
                    preformattedDepth = depth;
                    preformattedTagName = token.name!;
                    preformattedTokens = [token];
                    inPreformatted = 1;
                    depth++;
                } else {
                    // Block element
                    flush();

                    // Lookahead: keep on one line if content is simple text
                    const simple = getSimpleTextContent(tokens, i + 1, token.name!);
                    if (simple !== null) {
                        const closeTag = tokens[simple.endIdx].raw.trim();
                        lines.push(
                            indent.repeat(depth) +
                            token.raw.trim() +
                            simple.text +
                            closeTag
                        );
                        i = simple.endIdx;
                    } else {
                        lines.push(indent.repeat(depth) + token.raw.trim());
                        depth++;
                    }
                }
                break;

            case 'close':
                if (INLINE_ELEMENTS.has(token.name!)) {
                    currentLine += token.raw.trim();
                } else {
                    flush();
                    depth = Math.max(0, depth - 1);
                    lines.push(indent.repeat(depth) + token.raw.trim());
                }
                break;

            case 'text':
                if (currentLine === '' && !token.raw.trim()) {
                    // Whitespace-only text between block elements — skip
                    break;
                }
                currentLine += token.raw;
                break;
        }
    }

    flush();

    // Ensure trailing newline
    let result = lines.join(eol);
    if (!result.endsWith(eol)) {
        result += eol;
    }
    return result;
}

// --- Tokenizer ---

function tokenize(text: string): XMLToken[] {
    const tokens: XMLToken[] = [];
    const regex =
        /(<!--[\s\S]*?-->)|(<!\[CDATA\[[\s\S]*?\]\]>)|(<![^>]+>)|(<\?[\s\S]*?\?>)|(<\/\s*([a-zA-Z][\w:-]*)\s*>)|(<([a-zA-Z][\w:-]*)(?:\s[^>]*?)?\/>)|(<([a-zA-Z][\w:-]*)(?:\s[^>]*)?>)|([^<]+)/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
        if (match[1]) {
            tokens.push({ type: 'comment', raw: match[1] });
        } else if (match[2]) {
            tokens.push({ type: 'cdata', raw: match[2] });
        } else if (match[3]) {
            tokens.push({ type: 'doctype', raw: match[3] });
        } else if (match[4]) {
            tokens.push({ type: 'pi', raw: match[4] });
        } else if (match[5]) {
            tokens.push({ type: 'close', name: match[6], raw: match[5] });
        } else if (match[7]) {
            tokens.push({ type: 'selfClose', name: match[8], raw: match[7] });
        } else if (match[9]) {
            tokens.push({ type: 'open', name: match[10], raw: match[9] });
        } else if (match[11]) {
            tokens.push({ type: 'text', raw: match[11] });
        }
    }

    return tokens;
}

// --- Helpers ---

/**
 * Check if the tokens after an opening tag contain only plain text
 * followed by the matching close tag. If so, the element can stay on one line.
 */
function getSimpleTextContent(
    tokens: XMLToken[],
    startIdx: number,
    tagName: string
): { text: string; endIdx: number } | null {
    let textContent = '';
    let i = startIdx;

    // Consume text tokens
    while (i < tokens.length && tokens[i].type === 'text') {
        textContent += tokens[i].raw;
        i++;
    }

    // Must be followed by the matching close tag
    if (i < tokens.length && tokens[i].type === 'close' && tokens[i].name === tagName) {
        const trimmed = textContent.trim();
        if (!trimmed.includes('\n') && trimmed.length <= 80) {
            return { text: trimmed, endIdx: i };
        }
    }

    return null;
}

function detectEOL(text: string): string {
    const crlfCount = (text.match(/\r\n/g) || []).length;
    const lfCount = (text.match(/(?<!\r)\n/g) || []).length;
    return crlfCount > lfCount ? '\r\n' : '\n';
}
