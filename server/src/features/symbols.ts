import {
    DocumentSymbol,
    DocumentSymbolParams,
    SymbolKind,
    Range,
    TextDocuments,
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';

/** Map DITA element names to LSP SymbolKind */
const SYMBOL_KIND_MAP: Record<string, SymbolKind> = {
    topic: SymbolKind.Class,
    concept: SymbolKind.Class,
    task: SymbolKind.Class,
    reference: SymbolKind.Class,
    body: SymbolKind.Struct,
    conbody: SymbolKind.Struct,
    taskbody: SymbolKind.Struct,
    refbody: SymbolKind.Struct,
    section: SymbolKind.Method,
    example: SymbolKind.Method,
    step: SymbolKind.Function,
    table: SymbolKind.Array,
    simpletable: SymbolKind.Array,
    map: SymbolKind.Module,
    bookmap: SymbolKind.Module,
    note: SymbolKind.Event,
    codeblock: SymbolKind.Event,
    title: SymbolKind.String,
    prolog: SymbolKind.Namespace,
    'related-links': SymbolKind.Namespace,
    fig: SymbolKind.Object,
};

/** Elements to include in the document outline */
const OUTLINE_ELEMENTS = new Set([
    'topic', 'concept', 'task', 'reference',
    'body', 'conbody', 'taskbody', 'refbody',
    'section', 'example', 'steps', 'step',
    'table', 'simpletable', 'fig',
    'note', 'codeblock', 'prolog', 'related-links',
    'map', 'bookmap', 'topicref', 'chapter', 'appendix', 'part',
    'keydef', 'frontmatter', 'backmatter', 'reltable',
    'prereq', 'context', 'result', 'postreq',
]);

interface ParsedTag {
    name: string;
    id: string;
    titleText: string;
    startOffset: number;
    endOffset: number;
    selfClosing: boolean;
    isClosing: boolean;
}

/**
 * Handle document symbol requests (Outline view).
 */
export function handleDocumentSymbol(
    params: DocumentSymbolParams,
    documents: TextDocuments<TextDocument>
): DocumentSymbol[] {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        return [];
    }

    const text = document.getText();
    const tags = parseTags(text);
    return buildSymbolTree(tags, document);
}

/**
 * Parse XML tags from the document text.
 */
function parseTags(text: string): ParsedTag[] {
    const tags: ParsedTag[] = [];
    const pattern = /<(\/?)([\w-]+)([^>]*?)(\/?)>/g;
    let match;

    while ((match = pattern.exec(text)) !== null) {
        const isClosing = match[1] === '/';
        const name = match[2];
        const attrs = match[3];
        const selfClosing = match[4] === '/' || isClosing;

        // Extract id attribute
        const idMatch = attrs.match(/\bid="([^"]*)"/);
        const id = idMatch ? idMatch[1] : '';

        tags.push({
            name,
            id,
            titleText: '',
            startOffset: match.index,
            endOffset: match.index + match[0].length,
            selfClosing: selfClosing && !isClosing,
            isClosing,
        });
    }

    return tags;
}

/**
 * Build a hierarchical DocumentSymbol tree from parsed tags.
 */
function buildSymbolTree(tags: ParsedTag[], document: TextDocument): DocumentSymbol[] {
    const result: DocumentSymbol[] = [];
    const stack: { symbol: DocumentSymbol; name: string; children: DocumentSymbol[] }[] = [];
    const text = document.getText();

    for (let i = 0; i < tags.length; i++) {
        const tag = tags[i];

        if (tag.isClosing) {
            // Find matching opening tag on the stack
            for (let j = stack.length - 1; j >= 0; j--) {
                if (stack[j].name === tag.name) {
                    // Update the range end to include the closing tag
                    const entry = stack[j];
                    entry.symbol.range.end = document.positionAt(tag.endOffset);
                    entry.symbol.children = entry.children;
                    stack.splice(j, 1);
                    break;
                }
            }
            continue;
        }

        if (!OUTLINE_ELEMENTS.has(tag.name)) {
            // Extract title text for the parent if this is a <title> tag
            if (tag.name === 'title' && !tag.selfClosing && stack.length > 0) {
                const titleContent = extractTextContent(text, tag.endOffset);
                if (titleContent && stack.length > 0) {
                    const parent = stack[stack.length - 1];
                    parent.symbol.name = titleContent;
                }
            }
            continue;
        }

        const kind = SYMBOL_KIND_MAP[tag.name] || SymbolKind.Property;
        const startPos = document.positionAt(tag.startOffset);
        const endPos = document.positionAt(tag.endOffset);

        const symbolName = tag.id ? `${tag.name} #${tag.id}` : tag.name;

        const symbol: DocumentSymbol = {
            name: symbolName,
            detail: tag.id || undefined,
            kind,
            range: Range.create(startPos, endPos),
            selectionRange: Range.create(startPos, endPos),
            children: [],
        };

        if (tag.selfClosing) {
            // Self-closing tag — add directly to parent or root
            if (stack.length > 0) {
                stack[stack.length - 1].children.push(symbol);
            } else {
                result.push(symbol);
            }
        } else {
            // Opening tag — push to stack
            if (stack.length > 0) {
                stack[stack.length - 1].children.push(symbol);
            } else {
                result.push(symbol);
            }
            stack.push({ symbol, name: tag.name, children: [] });
        }
    }

    // Close any remaining open tags
    for (const entry of stack) {
        entry.symbol.children = entry.children;
    }

    return result;
}

/**
 * Extract text content between current position and the next closing tag.
 */
function extractTextContent(text: string, startOffset: number): string {
    const closeTag = text.indexOf('</', startOffset);
    if (closeTag < 0) return '';
    const content = text.slice(startOffset, closeTag).trim();
    // Limit length for display
    return content.length > 80 ? content.slice(0, 77) + '...' : content;
}
