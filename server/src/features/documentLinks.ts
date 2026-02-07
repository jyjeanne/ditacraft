import * as path from 'path';
import {
    DocumentLink,
    DocumentLinkParams,
    Range,
    TextDocuments,
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';
import { URI } from 'vscode-uri';
import { KeySpaceService } from '../services/keySpaceService';

// --- Types ---

interface LinkData {
    type: 'keyref' | 'conkeyref';
    value: string;
    contextFilePath: string;
}

// --- Public handlers ---

/**
 * Handle document links request.
 * Provides clickable links for href, conref, keyref, conkeyref attributes.
 */
export async function handleDocumentLinks(
    params: DocumentLinkParams,
    documents: TextDocuments<TextDocument>
): Promise<DocumentLink[]> {
    const document = documents.get(params.textDocument.uri);
    if (!document) return [];

    const text = document.getText();
    const documentUri = params.textDocument.uri;
    const documentDir = path.dirname(URI.parse(documentUri).fsPath);
    const contextFilePath = URI.parse(documentUri).fsPath;
    const links: DocumentLink[] = [];

    // Regex patterns (created per-call to avoid shared stateful /g flag)
    const HREF_REGEX = /<(?:topicref|chapter|appendix|part|mapref|keydef|topicgroup|topichead)[^>]*\bhref\s*=\s*["']([^"']+)["']/gi;
    const CONREF_REGEX = /\bconref\s*=\s*["']([^"']+)["']/gi;
    const KEYREF_REGEX = /\bkeyref\s*=\s*["']([^"']+)["']/gi;
    const CONKEYREF_REGEX = /\bconkeyref\s*=\s*["']([^"']+)["']/gi;
    const XREF_HREF_REGEX = /<xref[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi;
    const LINK_HREF_REGEX = /<link[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi;

    // Strip comments to avoid matching attributes inside them
    const commentRanges = getCommentRanges(text);

    // Process file-based references (resolve target immediately)
    processFileRefs(text, document, documentDir, links, commentRanges, HREF_REGEX);
    processFileRefs(text, document, documentDir, links, commentRanges, CONREF_REGEX);
    processFileRefs(text, document, documentDir, links, commentRanges, XREF_HREF_REGEX);
    processFileRefs(text, document, documentDir, links, commentRanges, LINK_HREF_REGEX);

    // Process key-based references (deferred resolution via resolveDocumentLink)
    // KEYREF_REGEX covers all elements including xref (no separate xref keyref pattern needed)
    processKeyRefs(text, document, contextFilePath, links, commentRanges, KEYREF_REGEX, 'keyref');
    processKeyRefs(text, document, contextFilePath, links, commentRanges, CONKEYREF_REGEX, 'conkeyref');

    return links;
}

/**
 * Handle document link resolve request.
 * Resolves key-based links via KeySpaceService.
 */
export async function handleDocumentLinkResolve(
    link: DocumentLink,
    keySpaceService?: KeySpaceService
): Promise<DocumentLink> {
    const data = link.data as LinkData | undefined;
    if (!data || !keySpaceService) return link;

    const keyName = data.type === 'conkeyref'
        ? data.value.split('/')[0]
        : data.value;

    try {
        const keyDef = await keySpaceService.resolveKey(keyName, data.contextFilePath);
        if (keyDef?.targetFile) {
            link.target = URI.file(keyDef.targetFile).toString();
        } else if (keyDef?.sourceMap) {
            link.target = URI.file(keyDef.sourceMap).toString();
        }
    } catch {
        // Key resolution failed — return link unchanged
    }

    return link;
}

// --- Internal helpers ---

/**
 * Get ranges of all XML comments to exclude from matching.
 */
function getCommentRanges(text: string): [number, number][] {
    const ranges: [number, number][] = [];
    const regex = /<!--[\s\S]*?-->/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
        ranges.push([match.index, match.index + match[0].length]);
    }
    return ranges;
}

/**
 * Check if an offset falls inside a comment range.
 */
function isInsideComment(offset: number, commentRanges: [number, number][]): boolean {
    for (const [start, end] of commentRanges) {
        if (offset >= start && offset < end) return true;
        if (start > offset) break; // ranges are sorted
    }
    return false;
}

/**
 * Check if an href value should be skipped (external URL, variable, fragment-only).
 */
function shouldSkip(value: string): boolean {
    return !value ||
        value.startsWith('http://') ||
        value.startsWith('https://') ||
        value.startsWith('mailto:') ||
        value.includes('${');
}

/**
 * Find the start offset of the captured value within the full match text.
 * Searches backward from the end of the match to find the attribute value.
 */
function getValueStartOffset(matchText: string, capturedValue: string): number {
    // Remove trailing > or /> to isolate the last quote
    const trimmed = matchText.replace(/\/?>\s*$/, '');
    const lastChar = trimmed.charAt(trimmed.length - 1);

    if (lastChar === '"' || lastChar === "'") {
        const valueEndPos = trimmed.length - 1;
        const valueStartPos = valueEndPos - capturedValue.length;
        if (trimmed.substring(valueStartPos, valueEndPos) === capturedValue) {
            return valueStartPos;
        }
    }

    // Fallback: find the exact quoted value to avoid matching in wrong attribute
    const dqIdx = matchText.indexOf('"' + capturedValue + '"');
    if (dqIdx >= 0) return dqIdx + 1;
    const sqIdx = matchText.indexOf("'" + capturedValue + "'");
    if (sqIdx >= 0) return sqIdx + 1;

    // Final fallback
    return matchText.indexOf(capturedValue);
}

/**
 * Process file-based reference attributes (href, conref, xref href, link href).
 * Resolves target path immediately and sets link.target.
 */
function processFileRefs(
    text: string,
    document: TextDocument,
    documentDir: string,
    links: DocumentLink[],
    commentRanges: [number, number][],
    pattern: RegExp
): void {
    pattern.lastIndex = 0;
    let match;

    while ((match = pattern.exec(text)) !== null) {
        const value = match[1];
        if (shouldSkip(value)) continue;
        if (isInsideComment(match.index, commentRanges)) continue;

        const valueOffset = match.index + getValueStartOffset(match[0], value);
        const range = Range.create(
            document.positionAt(valueOffset),
            document.positionAt(valueOffset + value.length)
        );

        // Extract file path (before # fragment)
        const hashIdx = value.indexOf('#');
        const filePart = hashIdx >= 0 ? value.substring(0, hashIdx) : value;

        if (!filePart) {
            // Fragment-only ref (e.g., "#topicid/elementid") — link to same document
            links.push({
                range,
                target: document.uri,
                tooltip: `Same-file reference: ${value}`,
            });
            continue;
        }

        const targetPath = path.resolve(documentDir, filePart);
        const targetUri = URI.file(targetPath).toString();

        links.push({
            range,
            target: targetUri,
            tooltip: `Open ${path.basename(targetPath)}`,
        });
    }
}

/**
 * Process key-based reference attributes (keyref, conkeyref, xref keyref).
 * Attempts immediate resolution; falls back to deferred resolve via link.data.
 */
function processKeyRefs(
    text: string,
    document: TextDocument,
    contextFilePath: string,
    links: DocumentLink[],
    commentRanges: [number, number][],
    pattern: RegExp,
    type: 'keyref' | 'conkeyref'
): void {
    pattern.lastIndex = 0;
    let match;

    while ((match = pattern.exec(text)) !== null) {
        const value = match[1];
        if (!value || value.includes('${')) continue;
        if (isInsideComment(match.index, commentRanges)) continue;

        const valueOffset = match.index + getValueStartOffset(match[0], value);
        const range = Range.create(
            document.positionAt(valueOffset),
            document.positionAt(valueOffset + value.length)
        );

        // Store data for deferred resolution
        const linkData: LinkData = { type, value, contextFilePath };

        links.push({
            range,
            tooltip: `Key reference: ${value}`,
            data: linkData,
            // target is set during resolve phase if keySpaceService is available
        });
    }
}
