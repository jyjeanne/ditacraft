import {
    CompletionItem,
    CompletionItemKind,
    CompletionParams,
    InsertTextFormat,
    TextDocuments,
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';
import { URI } from 'vscode-uri';
import * as path from 'path';
import * as fs from 'fs';

import {
    DITA_ELEMENTS,
    DITAVAL_ELEMENTS,
    COMMON_ATTRIBUTES,
    ELEMENT_ATTRIBUTES,
    ATTRIBUTE_VALUES,
    ELEMENT_DOCS,
} from '../data/ditaSchema';
import { KeySpaceService } from '../services/keySpaceService';
import { SubjectSchemeService } from '../services/subjectSchemeService';

const enum Context {
    ElementName,
    AttributeName,
    AttributeValue,
    None,
}

interface CompletionContext {
    /** Parent element name (for element completions) or current element (for attributes) */
    elementName: string;
    /** Attribute name (for value completions) */
    attributeName: string;
    /** Text already typed after '<' or inside attribute value (for filtering) */
    prefix: string;
}

interface DetectedContext extends CompletionContext {
    kind: Context;
}

/**
 * Handle completion requests.
 * Now async to support key space resolution for keyref/conkeyref completion.
 */
export async function handleCompletion(
    params: CompletionParams,
    documents: TextDocuments<TextDocument>,
    keySpaceService?: KeySpaceService,
    subjectSchemeService?: SubjectSchemeService
): Promise<CompletionItem[]> {
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
            return getAttributeValueCompletions(
                ctx, params.textDocument.uri, keySpaceService, subjectSchemeService
            );
        default:
            return [];
    }
}

/**
 * Detect what kind of completion is needed at the cursor position.
 */
function detectContext(text: string, offset: number): DetectedContext {
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

    if (i >= 1 && text[i] === '/' && text[i - 1] === '<') {
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
function findAttributeValueContext(text: string, offset: number): DetectedContext | null {
    // Scan backwards for opening quote
    let i = offset - 1;
    while (i >= 0 && text[i] !== '"' && text[i] !== '\'' && text[i] !== '<' && text[i] !== '>') {
        i--;
    }
    if (i < 0 || (text[i] !== '"' && text[i] !== '\'')) {
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
    const attrEnd = j + 1;
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
function findAttributeContext(text: string, beforeWord: number, _offset: number): DetectedContext | null {
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
    // DITAVAL elements don't use DITA common attributes
    const all = DITAVAL_ELEMENTS.has(ctx.elementName)
        ? specific
        : [...specific, ...COMMON_ATTRIBUTES];
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

/**
 * Get attribute value completions.
 * Handles static enum values, keyref completion, and href fragment completion.
 */
async function getAttributeValueCompletions(
    ctx: CompletionContext,
    documentUri: string,
    keySpaceService?: KeySpaceService,
    subjectSchemeService?: SubjectSchemeService
): Promise<CompletionItem[]> {
    const attrName = ctx.attributeName;

    // --- Keyref / Conkeyref completion ---
    if ((attrName === 'keyref' || attrName === 'conkeyref') && keySpaceService) {
        return getKeyrefCompletions(ctx, documentUri, keySpaceService);
    }

    // --- Href / Conref completion ---
    if (attrName === 'href' || attrName === 'conref') {
        if (ctx.prefix.includes('#')) {
            // Fragment completion: topic/element IDs in target file
            return getHrefFragmentCompletions(ctx, documentUri);
        }
        // File path completion: list .dita/.ditamap files relative to current doc
        return getHrefFileCompletions(ctx, documentUri);
    }

    // --- Subject scheme controlled values ---
    // When a subject scheme constrains this attribute, offer only valid values
    if (subjectSchemeService && subjectSchemeService.hasSchemeData()) {
        const schemeValues = subjectSchemeService.getValidValues(attrName, ctx.elementName);
        if (schemeValues && schemeValues.size > 0) {
            const items: CompletionItem[] = [];
            let index = 0;
            for (const val of schemeValues) {
                items.push({
                    label: val,
                    kind: CompletionItemKind.EnumMember,
                    detail: 'Subject scheme',
                    sortText: String(index).padStart(3, '0'),
                });
                index++;
            }
            return items;
        }
    }

    // --- Static enum values (fallback) ---
    const values = ATTRIBUTE_VALUES[attrName];
    if (!values) return [];

    return values.map((val, index) => ({
        label: val,
        kind: CompletionItemKind.EnumMember,
        sortText: String(index).padStart(3, '0'),
    }));
}

/**
 * Complete key names for keyref/conkeyref attributes.
 * When the value contains '/', completes element IDs in the key's target.
 */
async function getKeyrefCompletions(
    ctx: CompletionContext,
    documentUri: string,
    keySpaceService: KeySpaceService
): Promise<CompletionItem[]> {
    const filePath = URI.parse(documentUri).fsPath;
    const currentValue = ctx.prefix;

    if (currentValue.includes('/')) {
        // "keyname/elementId" — complete element IDs in the key's target
        const keyName = currentValue.substring(0, currentValue.indexOf('/'));
        const keyDef = await keySpaceService.resolveKey(keyName, filePath);
        if (keyDef?.targetFile && fs.existsSync(keyDef.targetFile)) {
            const targetContent = fs.readFileSync(keyDef.targetFile, 'utf-8');
            const elementIds = extractAllIds(targetContent);
            return elementIds.map((id, index) => ({
                label: id,
                kind: CompletionItemKind.Reference,
                detail: `Element ID in ${path.basename(keyDef.targetFile!)}`,
                sortText: String(index).padStart(4, '0'),
            }));
        }
        return [];
    }

    // No slash — complete all known key names
    const allKeys = await keySpaceService.getAllKeys(filePath);
    const items: CompletionItem[] = [];
    let index = 0;

    for (const [keyName, keyDef] of allKeys) {
        const detail = keyDef.targetFile
            ? `\u2192 ${path.basename(keyDef.targetFile)}`
            : (keyDef.inlineContent || 'Key definition');

        const docParts: string[] = [];
        if (keyDef.metadata?.navtitle) {
            docParts.push(keyDef.metadata.navtitle);
        }
        if (keyDef.metadata?.shortdesc) {
            docParts.push(keyDef.metadata.shortdesc);
        }
        if (keyDef.targetFile) {
            docParts.push(keyDef.targetFile);
        }

        const item: CompletionItem = {
            label: keyName,
            kind: CompletionItemKind.Reference,
            detail,
            sortText: String(index).padStart(4, '0'),
        };
        if (docParts.length > 0) {
            item.documentation = docParts.join('\n');
        }

        items.push(item);
        index++;
    }

    return items;
}

/**
 * Complete topic IDs and element IDs in href/conref fragment values.
 * Triggered when the value contains '#'.
 *
 * Formats handled:
 * - "file.dita#" → complete topic IDs in file.dita
 * - "file.dita#topicid/" → complete element IDs in that topic
 * - "#" → complete topic IDs in current file
 * - "#topicid/" → complete element IDs in current file
 *
 */
function getHrefFragmentCompletions(
    ctx: CompletionContext,
    documentUri: string
): CompletionItem[] {
    const currentValue = ctx.prefix;
    const hashPos = currentValue.indexOf('#');
    const filePart = currentValue.substring(0, hashPos);
    const fragment = currentValue.substring(hashPos + 1);

    // Resolve the target file path
    const currentFilePath = URI.parse(documentUri).fsPath;
    const currentDir = path.dirname(currentFilePath);
    const targetPath = filePart
        ? path.resolve(currentDir, filePart)
        : currentFilePath; // same-file reference

    if (!fs.existsSync(targetPath)) {
        return [];
    }

    let targetContent: string;
    try {
        targetContent = fs.readFileSync(targetPath, 'utf-8');
    } catch {
        return [];
    }

    const slashPos = fragment.indexOf('/');

    if (slashPos !== -1) {
        // "topicid/elementid" — complete element IDs within the topic
        const topicId = fragment.substring(0, slashPos);
        const elementIds = extractElementIdsInTopic(targetContent, topicId);
        return elementIds.map((id, index) => ({
            label: id,
            kind: CompletionItemKind.Reference,
            detail: `Element in topic "${topicId}"`,
            sortText: String(index).padStart(4, '0'),
        }));
    }

    // No slash — complete topic IDs in the target file
    const topicIds = extractTopicIds(targetContent);
    return topicIds.map((id, index) => ({
        label: id,
        kind: CompletionItemKind.Reference,
        detail: `Topic ID in ${path.basename(targetPath)}`,
        sortText: String(index).padStart(4, '0'),
    }));
}

/**
 * Complete file paths for href/conref attributes.
 * Lists .dita, .ditamap, .xml files (and subdirectories) relative to the current document.
 * Supports partial path input (e.g., "topics/" lists files in the topics/ subdirectory).
 *
 */
function getHrefFileCompletions(
    ctx: CompletionContext,
    documentUri: string
): CompletionItem[] {
    const currentFilePath = URI.parse(documentUri).fsPath;
    const currentDir = path.dirname(currentFilePath);
    const currentValue = ctx.prefix;

    // Determine the directory to list based on partial input
    // e.g., "topics/getting-started" → list "topics/" dir
    // VS Code client handles prefix filtering
    const lastSlash = currentValue.lastIndexOf('/');
    let searchDir: string;

    if (lastSlash >= 0) {
        const relDir = currentValue.substring(0, lastSlash);
        searchDir = path.resolve(currentDir, relDir);
    } else {
        searchDir = currentDir;
    }

    let entries: fs.Dirent[];
    try {
        entries = fs.readdirSync(searchDir, { withFileTypes: true });
    } catch {
        return [];
    }

    const items: CompletionItem[] = [];
    let index = 0;

    for (const entry of entries) {
        const name = entry.name;

        // Skip hidden files/dirs
        if (name.startsWith('.')) continue;

        // Skip current file (don't suggest self-reference)
        if (entry.isFile() && path.resolve(searchDir, name) === currentFilePath) continue;

        if (entry.isDirectory()) {
            // Offer directory with trailing slash
            items.push({
                label: name + '/',
                kind: CompletionItemKind.Folder,
                sortText: `0${String(index).padStart(4, '0')}`,
                // No trailing quote — user continues typing
                command: { title: 'Trigger completions', command: 'editor.action.triggerSuggest' },
            });
            index++;
        } else if (entry.isFile() && HREF_FILE_EXTENSIONS.test(name)) {
            items.push({
                label: name,
                kind: CompletionItemKind.File,
                sortText: `1${String(index).padStart(4, '0')}`,
            });
            index++;
        }
    }

    return items;
}

/** File extensions relevant for href/conref completion. */
const HREF_FILE_EXTENSIONS = /\.(dita|ditamap|xml|ditaval|bookmap)$/i;

// --- ID extraction helpers ---

/** DITA topic-type element names for topic ID extraction. */
const TOPIC_ELEMENTS = /^(?:topic|concept|task|reference|glossentry|glossgroup|troubleshooting)$/;

/** Same list as a string for use in dynamic RegExp construction. */
const TOPIC_ELEMENTS_ALT = 'topic|concept|task|reference|glossentry|glossgroup|troubleshooting';

/**
 * Extract all topic-level IDs (root elements of topic types).
 */
function extractTopicIds(content: string): string[] {
    const topicIds: string[] = [];
    const regex = /<(\w+)\b[^>]*\bid\s*=\s*["']([^"']+)["']/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
        if (TOPIC_ELEMENTS.test(match[1])) {
            topicIds.push(match[2]);
        }
    }
    return topicIds;
}

/**
 * Extract all element @id values from the content.
 */
function extractAllIds(content: string): string[] {
    const ids: string[] = [];
    const regex = /\bid\s*=\s*["']([^"']+)["']/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
        ids.push(match[1]);
    }
    return [...new Set(ids)]; // deduplicate
}

/**
 * Extract element IDs within a specific topic, excluding nested topic IDs.
 * Finds the topic element with the given ID, then collects @id values
 * until the next sibling topic-level element.
 */
function extractElementIdsInTopic(content: string, topicId: string): string[] {
    const escapedId = topicId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const topicStartRegex = new RegExp(
        `<(${TOPIC_ELEMENTS_ALT})\\b[^>]*\\bid\\s*=\\s*["']${escapedId}["']`
    );
    const startMatch = topicStartRegex.exec(content);
    if (!startMatch) return [];

    // Find the end of the opening tag
    const tagEnd = content.indexOf('>', startMatch.index);
    if (tagEnd === -1) return [];
    const searchStart = tagEnd + 1;

    // Collect IDs until we hit a closing topic tag or another topic-level element
    const ids: string[] = [];

    // Find the depth-aware end of this topic
    let depth = 1;
    let topicEnd = content.length;

    // Simple depth tracking for same-name nesting
    const openRegex = new RegExp(`<${startMatch[1]}\\b`, 'g');
    const closeRegex = new RegExp(`</${startMatch[1]}\\b`, 'g');

    // Find all open/close of same element type after our start
    const events: { pos: number; isOpen: boolean }[] = [];
    openRegex.lastIndex = searchStart;
    closeRegex.lastIndex = searchStart;

    let m: RegExpExecArray | null;
    while ((m = openRegex.exec(content)) !== null) {
        events.push({ pos: m.index, isOpen: true });
    }
    while ((m = closeRegex.exec(content)) !== null) {
        events.push({ pos: m.index, isOpen: false });
    }
    events.sort((a, b) => a.pos - b.pos);

    for (const ev of events) {
        if (ev.isOpen) {
            depth++;
        } else {
            depth--;
            if (depth === 0) {
                topicEnd = ev.pos;
                break;
            }
        }
    }

    // Collect all IDs within the topic boundary, skip nested topic IDs
    const scopedContent = content.substring(searchStart, topicEnd);
    const nestedTopicIds = new Set(extractTopicIds(scopedContent));

    const scopedIdRegex = /\bid\s*=\s*["']([^"']+)["']/g;
    let idMatch: RegExpExecArray | null;
    while ((idMatch = scopedIdRegex.exec(scopedContent)) !== null) {
        const id = idMatch[1];
        if (!nestedTopicIds.has(id)) {
            ids.push(id);
        }
    }

    return [...new Set(ids)]; // deduplicate
}
