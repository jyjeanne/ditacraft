import {
    CompletionItem,
    CompletionItemKind,
    CompletionParams,
    InsertTextFormat,
    TextDocuments,
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';

import {
    DITA_ELEMENTS,
    COMMON_ATTRIBUTES,
    ELEMENT_ATTRIBUTES,
    ATTRIBUTE_VALUES,
    ELEMENT_DOCS,
} from '../data/ditaSchema';

const enum Context {
    ElementName,
    AttributeName,
    AttributeValue,
    None,
}

interface CompletionContext {
    kind: Context;
    /** Parent element name (for element completions) or current element (for attributes) */
    elementName: string;
    /** Attribute name (for value completions) */
    attributeName: string;
    /** Text already typed after '<' (for filtering) */
    prefix: string;
}

/**
 * Handle completion requests.
 */
export function handleCompletion(
    params: CompletionParams,
    documents: TextDocuments<TextDocument>
): CompletionItem[] {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        return [];
    }

    const text = document.getText();
    const offset = document.offsetAt(params.position);
    const ctx = detectContext(text, offset);

    switch (ctx.kind) {
        case Context.ElementName:
            return getElementCompletions(ctx);
        case Context.AttributeName:
            return getAttributeCompletions(ctx);
        case Context.AttributeValue:
            return getAttributeValueCompletions(ctx);
        default:
            return [];
    }
}

/**
 * Detect what kind of completion is needed at the cursor position.
 */
function detectContext(text: string, offset: number): CompletionContext {
    // Scan backwards from cursor
    let i = offset - 1;

    // Skip current partial word
    while (i >= 0 && /[\w-]/.test(text[i])) {
        i--;
    }

    // Check what character precedes the word
    if (i >= 0 && text[i] === '<') {
        // Element completion: <|
        const prefix = text.slice(i + 1, offset);
        const parent = findParentElement(text, i);
        return { kind: Context.ElementName, elementName: parent, attributeName: '', prefix };
    }

    if (i >= 0 && text[i] === '/') {
        // Closing tag: </| — no completions
        return { kind: Context.None, elementName: '', attributeName: '', prefix: '' };
    }

    // Check if we're inside an attribute value: attr="|
    const valueCtx = findAttributeValueContext(text, offset);
    if (valueCtx) {
        return valueCtx;
    }

    // Check if we're inside an opening tag (for attribute completions)
    const attrCtx = findAttributeContext(text, i, offset);
    if (attrCtx) {
        return attrCtx;
    }

    return { kind: Context.None, elementName: '', attributeName: '', prefix: '' };
}

/**
 * Find the parent element by scanning backwards for the nearest unclosed opening tag.
 */
function findParentElement(text: string, beforePos: number): string {
    const stack: string[] = [];
    // Simple scan: find opening and closing tags
    const tagPattern = /<\/?([a-zA-Z][\w-]*)/g;
    let match;

    while ((match = tagPattern.exec(text)) !== null) {
        if (match.index >= beforePos) break;

        const tagName = match[1];
        if (match[0].startsWith('</')) {
            // Closing tag — pop from stack
            const idx = stack.lastIndexOf(tagName);
            if (idx >= 0) {
                stack.splice(idx, 1);
            }
        } else {
            // Opening tag — check if self-closing
            const closeAngle = text.indexOf('>', match.index);
            if (closeAngle >= 0) {
                const restOfTag = text.slice(match.index, closeAngle + 1);
                if (!restOfTag.endsWith('/>')) {
                    stack.push(tagName);
                }
            }
        }
    }

    return stack.length > 0 ? stack[stack.length - 1] : '';
}

/**
 * Check if cursor is inside an attribute value (between quotes after =).
 */
function findAttributeValueContext(text: string, offset: number): CompletionContext | null {
    // Scan backwards for opening quote
    let i = offset - 1;
    while (i >= 0 && text[i] !== '"' && text[i] !== '\'' && text[i] !== '<' && text[i] !== '>') {
        i--;
    }
    if (i < 0 || text[i] !== '"' && text[i] !== '\'') {
        return null;
    }

    const quoteChar = text[i];
    const valueStart = i;

    // Check there's = before the quote
    let j = valueStart - 1;
    while (j >= 0 && text[j] === ' ') j--;
    if (j < 0 || text[j] !== '=') return null;

    // Get attribute name before =
    j--;
    while (j >= 0 && text[j] === ' ') j--;
    let attrEnd = j + 1;
    while (j >= 0 && /[\w-]/.test(text[j])) j--;
    const attributeName = text.slice(j + 1, attrEnd);

    if (!attributeName) return null;

    // Check there's no closing quote between valueStart and offset
    const betweenQuotes = text.slice(valueStart + 1, offset);
    if (betweenQuotes.includes(quoteChar)) return null;

    // Find which element we're in
    const elementName = findCurrentElement(text, valueStart);

    return {
        kind: Context.AttributeValue,
        elementName,
        attributeName,
        prefix: betweenQuotes,
    };
}

/**
 * Check if cursor is after a space inside an opening tag (attribute name context).
 */
function findAttributeContext(text: string, beforeWord: number, _offset: number): CompletionContext | null {
    // We need to be inside an opening tag: find < before cursor without > between
    let i = beforeWord;
    while (i >= 0 && text[i] !== '<' && text[i] !== '>') {
        i--;
    }
    if (i < 0 || text[i] !== '<') return null;

    // Make sure it's an opening tag (not </ or <?)
    if (i + 1 < text.length && (text[i + 1] === '/' || text[i + 1] === '?')) return null;

    // Extract element name
    const nameMatch = text.slice(i + 1).match(/^([a-zA-Z][\w-]*)/);
    if (!nameMatch) return null;

    const elementName = nameMatch[1];

    // Verify there's at least a space between element name and cursor
    const afterName = i + 1 + elementName.length;
    if (beforeWord < afterName) return null;

    return {
        kind: Context.AttributeName,
        elementName,
        attributeName: '',
        prefix: '',
    };
}

/**
 * Find the element name of the tag the cursor is currently inside.
 */
function findCurrentElement(text: string, beforePos: number): string {
    let i = beforePos;
    while (i >= 0 && text[i] !== '<') i--;
    if (i < 0) return '';

    const nameMatch = text.slice(i + 1).match(/^([a-zA-Z][\w-]*)/);
    return nameMatch ? nameMatch[1] : '';
}

// --- Completion item builders ---

function getElementCompletions(ctx: CompletionContext): CompletionItem[] {
    const children = DITA_ELEMENTS[ctx.elementName];
    if (!children) {
        // Unknown parent — offer common top-level elements
        return [];
    }

    return children.map((child, index) => {
        const doc = ELEMENT_DOCS[child];
        const item: CompletionItem = {
            label: child,
            kind: CompletionItemKind.Property,
            sortText: String(index).padStart(3, '0'),
            insertText: `${child}>$1</${child}>`,
            insertTextFormat: InsertTextFormat.Snippet,
        };
        if (doc) {
            item.documentation = { kind: 'markdown', value: doc };
        }
        return item;
    });
}

function getAttributeCompletions(ctx: CompletionContext): CompletionItem[] {
    const specific = ELEMENT_ATTRIBUTES[ctx.elementName] || [];
    const all = [...specific, ...COMMON_ATTRIBUTES];
    // Deduplicate
    const unique = [...new Set(all)];

    return unique.map((attr, index) => ({
        label: attr,
        kind: CompletionItemKind.Property,
        sortText: index < specific.length
            ? `0${String(index).padStart(3, '0')}`
            : `1${String(index).padStart(3, '0')}`,
        insertText: `${attr}="$1"`,
        insertTextFormat: InsertTextFormat.Snippet,
    }));
}

function getAttributeValueCompletions(ctx: CompletionContext): CompletionItem[] {
    const values = ATTRIBUTE_VALUES[ctx.attributeName];
    if (!values) return [];

    return values.map((val, index) => ({
        label: val,
        kind: CompletionItemKind.EnumMember,
        sortText: String(index).padStart(3, '0'),
    }));
}
