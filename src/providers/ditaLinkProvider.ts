/**
 * DITA Link Provider
 * Provides clickable links for href, conref, conkeyref, keyref, and xref attributes in DITA files
 * Enables Ctrl+Click navigation to open referenced DITA files
 *
 * Supports:
 * - Direct file references (href="file.dita")
 * - Content references (conref="file.dita#element")
 * - Key references (keyref="keyname") - requires key space resolution
 * - Content key references (conkeyref="keyname/element")
 * - Cross references (xref href="file.dita#element" or xref keyref="keyname")
 * - Same-file references (conref="#element")
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { KeySpaceResolver } from '../utils/keySpaceResolver';
import { logger } from '../utils/logger';
import { configManager } from '../utils/configurationManager';

/**
 * Custom DocumentLink that stores additional metadata for deferred resolution
 */
interface PendingKeyLink {
    range: vscode.Range;
    keyName: string;
    elementId?: string;
    type: 'keyref' | 'conkeyref';
}

export class DitaLinkProvider implements vscode.DocumentLinkProvider {
    private keySpaceResolver: KeySpaceResolver;
    private pendingKeyLinks: Map<string, PendingKeyLink[]> = new Map();

    // Pre-compiled regex patterns for better performance (avoid re-compilation on each call)
    private static readonly HREF_REGEX = /<(?:topicref|chapter|appendix|part|mapref|keydef|topicgroup|topichead)[^>]*\bhref\s*=\s*["']([^"']+)["']/gi;
    private static readonly CONREF_REGEX = /\bconref\s*=\s*["']([^"']+)["']/gi;
    private static readonly CONKEYREF_REGEX = /\bconkeyref\s*=\s*["']([^"']+)["']/gi;
    private static readonly KEYREF_REGEX = /\bkeyref\s*=\s*["']([^"']+)["']/gi;
    private static readonly XREF_HREF_REGEX = /<xref[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi;
    private static readonly XREF_KEYREF_REGEX = /<xref[^>]*\bkeyref\s*=\s*["']([^"']+)["'][^>]*>/gi;
    private static readonly LINK_HREF_REGEX = /<link[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi;

    // Attribute extraction patterns
    private static readonly SCOPE_PATTERN = /\bscope\s*=\s*["']([^"']+)["']/i;
    private static readonly FORMAT_PATTERN = /\bformat\s*=\s*["']([^"']+)["']/i;
    private static readonly LINKTEXT_PATTERN = /\blinktext\s*=\s*["']([^"']+)["']/i;
    private static readonly TYPE_PATTERN = /\btype\s*=\s*["']([^"']+)["']/i;
    private static readonly REV_PATTERN = /\brev\s*=\s*["']([^"']+)["']/i;

    constructor(keySpaceResolver?: KeySpaceResolver) {
        this.keySpaceResolver = keySpaceResolver || new KeySpaceResolver();
    }

    /**
     * P1-7 Fix: Safely calculate the start position of a captured value within a match
     * Searches backwards from the end to find the opening quote, avoiding indexOf unreliability
     * @param matchText The full matched text (match[0])
     * @param capturedValue The captured group value (match[1])
     * @returns Offset within matchText where capturedValue starts
     */
    private getValueStartOffset(matchText: string, capturedValue: string): number {
        // The captured value is always followed by a closing quote at the end of the match
        // Search backwards from the end to find the opening quote of the captured value

        // Find where the closing quote is (should be at end of match, possibly followed by > or />)
        const trimmedMatch = matchText.replace(/\/?>\s*$/, ''); // Remove trailing > if present
        const lastChar = trimmedMatch.charAt(trimmedMatch.length - 1);

        if (lastChar === '"' || lastChar === "'") {
            // The value ends just before this quote
            // Search backwards to find the matching opening quote
            const valueEndPos = trimmedMatch.length - 1;
            const valueStartPos = valueEndPos - capturedValue.length;

            // Verify that what's at this position matches our captured value
            const extracted = trimmedMatch.substring(valueStartPos, valueEndPos);
            if (extracted === capturedValue) {
                return valueStartPos;
            }
        }

        // Fallback: use lastIndexOf which is more reliable than indexOf for this case
        // since the value appears at the end of the relevant portion
        const lastIndex = matchText.lastIndexOf(capturedValue);
        if (lastIndex !== -1) {
            return lastIndex;
        }

        // Final fallback to indexOf
        return matchText.indexOf(capturedValue);
    }

    /**
     * Get max link matches from configuration
     * P1-4 Fix: Use centralized configManager
     */
    private getMaxMatches(): number {
        return configManager.get('maxLinkMatches');
    }

    /**
     * Provide document links for various reference attributes in DITA files
     * Supports: href, conref, conkeyref, keyref, xref, link
     */
    public async provideDocumentLinks(
        document: vscode.TextDocument,
        _token: vscode.CancellationToken
    ): Promise<vscode.DocumentLink[]> {

        const links: vscode.DocumentLink[] = [];
        const text = document.getText();
        const documentDir = path.dirname(document.uri.fsPath);
        const documentPath = document.uri.fsPath;

        // Clear pending key links for this document
        this.pendingKeyLinks.delete(documentPath);

        // Process href attributes (in map and topic elements)
        this.processHrefAttributes(text, document, documentDir, links);

        // Process xref elements (cross-references)
        this.processXrefAttributes(text, document, documentDir, links);
        await this.processXrefKeyrefAttributes(text, document, links);

        // Process link elements
        this.processLinkAttributes(text, document, documentDir, links);

        // Process conref attributes (content references)
        this.processConrefAttributes(text, document, documentDir, links);

        // Process conkeyref attributes (content key references) - with key space resolution
        await this.processConkeyrefAttributesWithKeySpace(text, document, documentDir, links);

        // Process keyref attributes (key references) - with key space resolution
        await this.processKeyrefAttributesWithKeySpace(text, document, documentDir, links);

        return links;
    }

    /**
     * Process href attributes in DITA map and topic elements
     */
    private processHrefAttributes(
        text: string,
        document: vscode.TextDocument,
        documentDir: string,
        links: vscode.DocumentLink[]
    ): void {
        // Use pre-compiled regex pattern (reset lastIndex for fresh search)
        const hrefRegex = DitaLinkProvider.HREF_REGEX;
        hrefRegex.lastIndex = 0;

        let match: RegExpExecArray | null;
        let matchCount = 0;
        while ((match = hrefRegex.exec(text)) !== null) {
            // Safety check to prevent infinite loops
            if (++matchCount > this.getMaxMatches()) {
                break;
            }

            const hrefValue = match[1];

            // Skip if href is empty, a URL, or contains variables
            if (!hrefValue ||
                hrefValue.startsWith('http://') ||
                hrefValue.startsWith('https://') ||
                hrefValue.includes('${')) {
                continue;
            }

            // Calculate the position of the href value (not the attribute name)
            const hrefValueStart = match.index! + this.getValueStartOffset(match[0], hrefValue);
            const startPos = document.positionAt(hrefValueStart);
            const endPos = document.positionAt(hrefValueStart + hrefValue.length);
            const range = new vscode.Range(startPos, endPos);

            // Resolve the target file path
            const targetPath = this.resolveReference(hrefValue, documentDir);

            if (targetPath) {
                const targetUri = vscode.Uri.file(targetPath);
                const link = new vscode.DocumentLink(range, targetUri);
                link.tooltip = `Open ${path.basename(targetPath)}`;
                links.push(link);
            }
        }
    }

    /**
     * Process conref attributes (content references)
     * Format: conref="path/to/file.dita#topicid/elementid"
     */
    private processConrefAttributes(
        text: string,
        document: vscode.TextDocument,
        documentDir: string,
        links: vscode.DocumentLink[]
    ): void {
        // Use pre-compiled regex pattern (reset lastIndex for fresh search)
        const conrefRegex = DitaLinkProvider.CONREF_REGEX;
        conrefRegex.lastIndex = 0;

        let match: RegExpExecArray | null;
        let matchCount = 0;
        while ((match = conrefRegex.exec(text)) !== null) {
            // Safety check to prevent infinite loops
            if (++matchCount > this.getMaxMatches()) {
                break;
            }

            const conrefValue = match[1];

            // Skip if empty, URL, or contains variables
            if (!conrefValue ||
                conrefValue.startsWith('http://') ||
                conrefValue.startsWith('https://') ||
                conrefValue.includes('${')) {
                continue;
            }

            // Calculate position
            const valueStart = match.index! + this.getValueStartOffset(match[0], conrefValue);
            const startPos = document.positionAt(valueStart);
            const endPos = document.positionAt(valueStart + conrefValue.length);
            const range = new vscode.Range(startPos, endPos);

            // Handle same-file references (e.g., "#elementId/path")
            if (conrefValue.startsWith('#')) {
                // Same-file reference - create command URI to navigate to element
                const elementPath = conrefValue.substring(1);
                const link = this.createElementNavigationLink(
                    range,
                    document.uri,
                    elementPath,
                    `Go to element: ${elementPath}`
                );
                links.push(link);
                continue;
            }

            // Resolve the target file path and fragment
            const resolved = this.resolveReferenceWithFragment(conrefValue, documentDir);

            if (resolved) {
                const targetUri = vscode.Uri.file(resolved.filePath);

                // If there's a fragment (element ID), use element navigation
                if (resolved.fragment) {
                    const link = this.createElementNavigationLink(
                        range,
                        targetUri,
                        resolved.fragment,
                        `Go to element: ${resolved.fragment} in ${path.basename(resolved.filePath)}`
                    );
                    links.push(link);
                } else {
                    // No fragment - just open the file
                    const link = new vscode.DocumentLink(range, targetUri);
                    link.tooltip = `Open content reference: ${path.basename(resolved.filePath)}`;
                    links.push(link);
                }
            }
        }
    }

    /**
     * Process conkeyref attributes with key space resolution
     * Format: conkeyref="keyname/elementid" or conkeyref="keyname"
     */
    private async processConkeyrefAttributesWithKeySpace(
        text: string,
        document: vscode.TextDocument,
        documentDir: string,
        links: vscode.DocumentLink[]
    ): Promise<void> {
        // Use pre-compiled regex pattern (reset lastIndex for fresh search)
        const conkeyrefRegex = DitaLinkProvider.CONKEYREF_REGEX;
        conkeyrefRegex.lastIndex = 0;

        let match: RegExpExecArray | null;
        let matchCount = 0;
        while ((match = conkeyrefRegex.exec(text)) !== null) {
            // Safety check to prevent infinite loops
            if (++matchCount > this.getMaxMatches()) {
                break;
            }

            const conkeyrefValue = match[1];

            // Skip if empty or contains variables
            if (!conkeyrefValue || conkeyrefValue.includes('${')) {
                continue;
            }

            // Extract the key part (before any slash)
            const parts = conkeyrefValue.split('/');
            const keyPart = parts[0];
            const elementPart = parts.length > 1 ? parts.slice(1).join('/') : undefined;

            // Calculate position
            const valueStart = match.index! + this.getValueStartOffset(match[0], conkeyrefValue);
            const startPos = document.positionAt(valueStart);
            const endPos = document.positionAt(valueStart + conkeyrefValue.length);
            const range = new vscode.Range(startPos, endPos);

            // Try to resolve through key space
            try {
                const keyDef = await this.keySpaceResolver.resolveKey(keyPart, document.uri.fsPath);

                if (keyDef && keyDef.targetFile) {
                    const targetUri = vscode.Uri.file(keyDef.targetFile);
                    const link = new vscode.DocumentLink(range, targetUri);

                    if (elementPart) {
                        link.tooltip = `Open content key reference: ${keyPart}/${elementPart} → ${path.basename(keyDef.targetFile)}`;
                    } else {
                        link.tooltip = `Open content key reference: ${keyPart} → ${path.basename(keyDef.targetFile)}`;
                    }

                    links.push(link);
                    logger.debug('Resolved conkeyref', { key: keyPart, element: elementPart, target: keyDef.targetFile });
                } else if (keyDef && keyDef.inlineContent) {
                    // Key has inline content, navigate to source map
                    logger.debug('Conkeyref key has inline content', {
                        key: keyPart,
                        element: elementPart,
                        content: keyDef.inlineContent,
                        sourceMap: keyDef.sourceMap
                    });
                    const targetUri = vscode.Uri.file(keyDef.sourceMap);
                    const link = new vscode.DocumentLink(range, targetUri);
                    link.tooltip = `Key "${keyPart}" has inline content: "${keyDef.inlineContent}" (defined in ${path.basename(keyDef.sourceMap)})`;
                    links.push(link);
                } else if (keyDef) {
                    // Key exists but has no target file or inline content
                    logger.debug('Conkeyref key resolved but has no target', {
                        key: keyPart,
                        element: elementPart,
                        sourceMap: keyDef.sourceMap
                    });
                    const targetUri = vscode.Uri.file(keyDef.sourceMap);
                    const link = new vscode.DocumentLink(range, targetUri);
                    link.tooltip = `Key "${keyPart}" defined in ${path.basename(keyDef.sourceMap)} (no target file)`;
                    links.push(link);
                } else {
                    logger.debug('Conkeyref key not found in key space', { key: keyPart, element: elementPart });
                }
            } catch (error) {
                logger.debug('Failed to resolve conkeyref', { key: keyPart, error });
            }

            // Fallback: Check if the key looks like a filename (backward compatibility)
            if (!links.some(l => l.range.isEqual(range))) {
                if (keyPart.includes('.dita') || keyPart.includes('.ditamap')) {
                    const targetPath = this.resolveReference(keyPart, documentDir);
                    if (targetPath) {
                        const targetUri = vscode.Uri.file(targetPath);
                        const link = new vscode.DocumentLink(range, targetUri);
                        link.tooltip = `Open content key reference: ${path.basename(targetPath)}`;
                        links.push(link);
                    }
                }
            }
        }
    }

    /**
     * Process keyref attributes with key space resolution
     * Format: keyref="keyname"
     */
    private async processKeyrefAttributesWithKeySpace(
        text: string,
        document: vscode.TextDocument,
        documentDir: string,
        links: vscode.DocumentLink[]
    ): Promise<void> {
        // Use pre-compiled regex pattern (reset lastIndex for fresh search)
        const keyrefRegex = DitaLinkProvider.KEYREF_REGEX;
        keyrefRegex.lastIndex = 0;

        let match: RegExpExecArray | null;
        let matchCount = 0;
        while ((match = keyrefRegex.exec(text)) !== null) {
            // Safety check to prevent infinite loops
            if (++matchCount > this.getMaxMatches()) {
                break;
            }

            const keyrefValue = match[1];

            // Skip if empty or contains variables
            if (!keyrefValue || keyrefValue.includes('${')) {
                continue;
            }

            // Calculate position
            const valueStart = match.index! + this.getValueStartOffset(match[0], keyrefValue);
            const startPos = document.positionAt(valueStart);
            const endPos = document.positionAt(valueStart + keyrefValue.length);
            const range = new vscode.Range(startPos, endPos);

            // Try to resolve through key space
            try {
                const keyDef = await this.keySpaceResolver.resolveKey(keyrefValue, document.uri.fsPath);

                if (keyDef && keyDef.targetFile) {
                    const targetUri = vscode.Uri.file(keyDef.targetFile);
                    const link = new vscode.DocumentLink(range, targetUri);
                    link.tooltip = `Open key reference: ${keyrefValue} → ${path.basename(keyDef.targetFile)}`;
                    links.push(link);
                    logger.debug('Resolved keyref', { key: keyrefValue, target: keyDef.targetFile });
                } else if (keyDef && keyDef.inlineContent) {
                    // Key has inline content, no file to navigate to
                    // Create a link with no target but informative tooltip
                    logger.debug('Key has inline content', {
                        key: keyrefValue,
                        content: keyDef.inlineContent,
                        sourceMap: keyDef.sourceMap
                    });
                    // Still create a visual indicator even though we can't navigate
                    // Use the source map as target so user can see where key is defined
                    const targetUri = vscode.Uri.file(keyDef.sourceMap);
                    const link = new vscode.DocumentLink(range, targetUri);
                    link.tooltip = `Key "${keyrefValue}" has inline content: "${keyDef.inlineContent}" (defined in ${path.basename(keyDef.sourceMap)})`;
                    links.push(link);
                } else if (keyDef) {
                    // Key exists but has no target file or inline content
                    logger.debug('Key resolved but has no target', {
                        key: keyrefValue,
                        sourceMap: keyDef.sourceMap
                    });
                    // Link to the source map where key is defined
                    const targetUri = vscode.Uri.file(keyDef.sourceMap);
                    const link = new vscode.DocumentLink(range, targetUri);
                    link.tooltip = `Key "${keyrefValue}" defined in ${path.basename(keyDef.sourceMap)} (no target file)`;
                    links.push(link);
                } else {
                    logger.debug('Key not found in key space', { key: keyrefValue });
                }
            } catch (error) {
                logger.debug('Failed to resolve keyref', { key: keyrefValue, error });
            }

            // Fallback: Check if the key looks like a filename (backward compatibility)
            if (!links.some(l => l.range.isEqual(range))) {
                if (keyrefValue.includes('.dita') || keyrefValue.includes('.ditamap')) {
                    const targetPath = this.resolveReference(keyrefValue, documentDir);
                    if (targetPath) {
                        const targetUri = vscode.Uri.file(targetPath);
                        const link = new vscode.DocumentLink(range, targetUri);
                        link.tooltip = `Open key reference: ${path.basename(targetPath)}`;
                        links.push(link);
                    }
                }
            }
        }
    }

    /**
     * Process xref elements with href attributes (cross-references)
     * Format: <xref href="file.dita#element_id">text</xref>
     */
    private processXrefAttributes(
        text: string,
        document: vscode.TextDocument,
        documentDir: string,
        links: vscode.DocumentLink[]
    ): void {
        // Use pre-compiled regex pattern (reset lastIndex for fresh search)
        const xrefHrefRegex = DitaLinkProvider.XREF_HREF_REGEX;
        xrefHrefRegex.lastIndex = 0;

        let match: RegExpExecArray | null;
        let matchCount = 0;
        while ((match = xrefHrefRegex.exec(text)) !== null) {
            // Safety check to prevent infinite loops
            if (++matchCount > this.getMaxMatches()) {
                break;
            }

            const hrefValue = match[1];

            // Skip if empty, URL, or contains variables
            if (!hrefValue ||
                hrefValue.startsWith('http://') ||
                hrefValue.startsWith('https://') ||
                hrefValue.includes('${')) {
                continue;
            }

            // Calculate the position of the href value
            const valueStart = match.index! + this.getValueStartOffset(match[0], hrefValue);
            const startPos = document.positionAt(valueStart);
            const endPos = document.positionAt(valueStart + hrefValue.length);
            const range = new vscode.Range(startPos, endPos);

            // Handle same-file references (e.g., "#elementId")
            if (hrefValue.startsWith('#')) {
                const elementId = hrefValue.substring(1);
                const link = this.createElementNavigationLink(
                    range,
                    document.uri,
                    elementId,
                    `Go to element: ${elementId}`
                );
                links.push(link);
                continue;
            }

            // Resolve the target file path and fragment
            const resolved = this.resolveReferenceWithFragment(hrefValue, documentDir);

            if (resolved) {
                const targetUri = vscode.Uri.file(resolved.filePath);

                // If there's a fragment (element ID), use element navigation
                if (resolved.fragment) {
                    let tooltip = `Go to element: ${resolved.fragment} in ${path.basename(resolved.filePath)}`;
                    // Enhance tooltip with scope, format, linktext, and rev
                    tooltip = this.buildEnhancedTooltip(tooltip, match[0], {
                        showScope: true,
                        showFormat: true,
                        showLinktext: true,
                        showRev: true
                    });
                    const link = this.createElementNavigationLink(
                        range,
                        targetUri,
                        resolved.fragment,
                        tooltip
                    );
                    links.push(link);
                } else {
                    // No fragment - just open the file
                    const link = new vscode.DocumentLink(range, targetUri);
                    const baseTooltip = `Open cross-reference: ${path.basename(resolved.filePath)}`;
                    link.tooltip = this.buildEnhancedTooltip(baseTooltip, match[0], {
                        showScope: true,
                        showFormat: true,
                        showLinktext: true,
                        showRev: true
                    });
                    links.push(link);
                }
            }
        }
    }

    /**
     * Process xref elements with keyref attributes
     * Format: <xref keyref="keyname">text</xref>
     */
    private async processXrefKeyrefAttributes(
        text: string,
        document: vscode.TextDocument,
        links: vscode.DocumentLink[]
    ): Promise<void> {
        // Use pre-compiled regex pattern (reset lastIndex for fresh search)
        const xrefKeyrefRegex = DitaLinkProvider.XREF_KEYREF_REGEX;
        xrefKeyrefRegex.lastIndex = 0;

        let match: RegExpExecArray | null;
        let matchCount = 0;
        while ((match = xrefKeyrefRegex.exec(text)) !== null) {
            // Safety check to prevent infinite loops
            if (++matchCount > this.getMaxMatches()) {
                break;
            }

            const keyrefValue = match[1];

            // Skip if empty or contains variables
            if (!keyrefValue || keyrefValue.includes('${')) {
                continue;
            }

            // Calculate position
            const valueStart = match.index! + this.getValueStartOffset(match[0], keyrefValue);
            const startPos = document.positionAt(valueStart);
            const endPos = document.positionAt(valueStart + keyrefValue.length);
            const range = new vscode.Range(startPos, endPos);

            // Try to resolve through key space
            try {
                const keyDef = await this.keySpaceResolver.resolveKey(keyrefValue, document.uri.fsPath);

                if (keyDef && keyDef.targetFile) {
                    const targetUri = vscode.Uri.file(keyDef.targetFile);
                    const link = new vscode.DocumentLink(range, targetUri);
                    link.tooltip = `Open xref key: ${keyrefValue} → ${path.basename(keyDef.targetFile)}`;
                    links.push(link);
                    logger.debug('Resolved xref keyref', { key: keyrefValue, target: keyDef.targetFile });
                } else if (keyDef && keyDef.inlineContent) {
                    // Key has inline content, navigate to source map
                    const targetUri = vscode.Uri.file(keyDef.sourceMap);
                    const link = new vscode.DocumentLink(range, targetUri);
                    link.tooltip = `Xref key "${keyrefValue}" has inline content: "${keyDef.inlineContent}" (defined in ${path.basename(keyDef.sourceMap)})`;
                    links.push(link);
                    logger.debug('Xref keyref has inline content', { key: keyrefValue, content: keyDef.inlineContent });
                } else if (keyDef) {
                    // Key exists but has no target file or inline content
                    const targetUri = vscode.Uri.file(keyDef.sourceMap);
                    const link = new vscode.DocumentLink(range, targetUri);
                    link.tooltip = `Xref key "${keyrefValue}" defined in ${path.basename(keyDef.sourceMap)} (no target file)`;
                    links.push(link);
                    logger.debug('Xref keyref resolved but has no target', { key: keyrefValue });
                } else {
                    logger.debug('Xref key not found in key space', { key: keyrefValue });
                }
            } catch (error) {
                logger.debug('Failed to resolve xref keyref', { key: keyrefValue, error });
            }
        }
    }

    /**
     * Process link elements with href attributes
     * Format: <link href="file.dita#element_id"/>
     */
    private processLinkAttributes(
        text: string,
        document: vscode.TextDocument,
        documentDir: string,
        links: vscode.DocumentLink[]
    ): void {
        // Use pre-compiled regex pattern (reset lastIndex for fresh search)
        const linkHrefRegex = DitaLinkProvider.LINK_HREF_REGEX;
        linkHrefRegex.lastIndex = 0;

        let match: RegExpExecArray | null;
        let matchCount = 0;
        while ((match = linkHrefRegex.exec(text)) !== null) {
            // Safety check to prevent infinite loops
            if (++matchCount > this.getMaxMatches()) {
                break;
            }

            const hrefValue = match[1];

            // Skip if empty, URL, or contains variables
            if (!hrefValue ||
                hrefValue.startsWith('http://') ||
                hrefValue.startsWith('https://') ||
                hrefValue.includes('${')) {
                continue;
            }

            // Calculate the position of the href value
            const valueStart = match.index! + this.getValueStartOffset(match[0], hrefValue);
            const startPos = document.positionAt(valueStart);
            const endPos = document.positionAt(valueStart + hrefValue.length);
            const range = new vscode.Range(startPos, endPos);

            // Handle same-file references (e.g., "#elementId")
            if (hrefValue.startsWith('#')) {
                const elementId = hrefValue.substring(1);
                const link = this.createElementNavigationLink(
                    range,
                    document.uri,
                    elementId,
                    `Go to element: ${elementId}`
                );
                links.push(link);
                continue;
            }

            // Resolve the target file path and fragment
            const resolved = this.resolveReferenceWithFragment(hrefValue, documentDir);

            if (resolved) {
                const targetUri = vscode.Uri.file(resolved.filePath);

                // If there's a fragment (element ID), use element navigation
                if (resolved.fragment) {
                    let tooltip = `Go to element: ${resolved.fragment} in ${path.basename(resolved.filePath)}`;
                    // Enhance tooltip with scope, format, linktext, type, and rev
                    tooltip = this.buildEnhancedTooltip(tooltip, match[0], {
                        showScope: true,
                        showFormat: true,
                        showLinktext: true,
                        showType: true,
                        showRev: true
                    });
                    const link = this.createElementNavigationLink(
                        range,
                        targetUri,
                        resolved.fragment,
                        tooltip
                    );
                    links.push(link);
                } else {
                    // No fragment - just open the file
                    const link = new vscode.DocumentLink(range, targetUri);
                    const baseTooltip = `Open related link: ${path.basename(resolved.filePath)}`;
                    link.tooltip = this.buildEnhancedTooltip(baseTooltip, match[0], {
                        showScope: true,
                        showFormat: true,
                        showLinktext: true,
                        showType: true,
                        showRev: true
                    });
                    links.push(link);
                }
            }
        }
    }

    /**
     * Resolve reference to absolute file path
     * Handles relative paths and fragments (e.g., "file.dita#topic_id")
     */
    private resolveReference(reference: string, baseDir: string): string | null {
        const result = this.resolveReferenceWithFragment(reference, baseDir);
        return result?.filePath ?? null;
    }

    /**
     * Resolve reference to absolute file path AND extract fragment identifier
     * Returns both the file path and the element path (fragment)
     */
    private resolveReferenceWithFragment(reference: string, baseDir: string): { filePath: string; fragment?: string } | null {
        // Split into file path and fragment (e.g., "file.dita#topic_id/element_id")
        const hashIndex = reference.indexOf('#');
        let referenceWithoutFragment: string;
        let fragment: string | undefined;

        if (hashIndex >= 0) {
            referenceWithoutFragment = reference.substring(0, hashIndex);
            fragment = reference.substring(hashIndex + 1);
        } else {
            referenceWithoutFragment = reference;
        }

        if (!referenceWithoutFragment) {
            return null;
        }

        // Resolve relative path to absolute path
        const absolutePath = path.resolve(baseDir, referenceWithoutFragment);

        // Security: Prevent path traversal attacks
        // Ensure resolved path is within the workspace bounds
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            const normalizedAbsolutePath = path.normalize(absolutePath);
            const isWithinWorkspace = workspaceFolders.some(folder => {
                const normalizedWorkspace = path.normalize(folder.uri.fsPath);
                return normalizedAbsolutePath.startsWith(normalizedWorkspace + path.sep) ||
                       normalizedAbsolutePath === normalizedWorkspace;
            });

            // Reject path traversal attempts outside workspace
            if (!isWithinWorkspace) {
                return null;
            }
        }

        return {
            filePath: absolutePath,
            fragment: fragment
        };
    }

    /**
     * Create a command URI for element navigation
     * Used for both same-file and cross-file references with element IDs
     */
    private createElementNavigationLink(
        range: vscode.Range,
        targetUri: vscode.Uri,
        elementPath: string,
        tooltip: string
    ): vscode.DocumentLink {
        const args = encodeURIComponent(JSON.stringify([targetUri.toString(), elementPath]));
        const commandUri = vscode.Uri.parse(`command:ditacraft.navigateToElement?${args}`);
        const link = new vscode.DocumentLink(range, commandUri);
        link.tooltip = tooltip;
        return link;
    }

    /**
     * Optional: Resolve document link (can add additional processing here)
     */
    public resolveDocumentLink?(
        link: vscode.DocumentLink,
        _token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.DocumentLink> {
        return link;
    }

    /**
     * Get the KeySpaceResolver instance
     */
    public getKeySpaceResolver(): KeySpaceResolver {
        return this.keySpaceResolver;
    }

    /**
     * Extract @scope attribute from element tag
     * Returns 'local' | 'peer' | 'external' | undefined
     */
    private extractScope(elementTag: string): string | undefined {
        const match = elementTag.match(DitaLinkProvider.SCOPE_PATTERN);
        return match ? match[1] : undefined;
    }

    /**
     * Extract @format attribute from element tag
     * Returns format type (e.g., 'dita', 'pdf', 'html') or undefined
     */
    private extractFormat(elementTag: string): string | undefined {
        const match = elementTag.match(DitaLinkProvider.FORMAT_PATTERN);
        return match ? match[1] : undefined;
    }

    /**
     * Extract @linktext attribute from element tag
     * Returns custom link text or undefined
     */
    private extractLinktext(elementTag: string): string | undefined {
        const match = elementTag.match(DitaLinkProvider.LINKTEXT_PATTERN);
        return match ? match[1] : undefined;
    }

    /**
     * Extract @type attribute from element tag
     * Returns topic type (e.g., 'concept', 'task', 'reference') or undefined
     */
    private extractType(elementTag: string): string | undefined {
        const match = elementTag.match(DitaLinkProvider.TYPE_PATTERN);
        return match ? match[1] : undefined;
    }

    /**
     * Extract @rev attribute from element tag
     * Returns revision identifier (e.g., '2.0', '1.1', 'draft') or undefined
     */
    private extractRev(elementTag: string): string | undefined {
        const match = elementTag.match(DitaLinkProvider.REV_PATTERN);
        return match ? match[1] : undefined;
    }

    /**
     * Build enhanced tooltip with scope, format, and linktext information
     */
    private buildEnhancedTooltip(
        baseTooltip: string,
        elementTag: string,
        options: { showScope?: boolean; showFormat?: boolean; showLinktext?: boolean; showType?: boolean; showRev?: boolean } = {}
    ): string {
        const parts: string[] = [baseTooltip];

        // Extract attributes
        if (options.showScope) {
            const scope = this.extractScope(elementTag);
            if (scope) {
                parts.push(`[scope: ${scope}]`);
            }
        }

        if (options.showFormat) {
            const format = this.extractFormat(elementTag);
            if (format) {
                parts.push(`[format: ${format}]`);
            }
        }

        if (options.showType) {
            const type = this.extractType(elementTag);
            if (type) {
                parts.push(`[type: ${type}]`);
            }
        }

        if (options.showRev) {
            const rev = this.extractRev(elementTag);
            if (rev) {
                parts.push(`[rev: ${rev}]`);
            }
        }

        if (options.showLinktext) {
            const linktext = this.extractLinktext(elementTag);
            if (linktext) {
                parts.push(`\nLink text: "${linktext}"`);
            }
        }

        return parts.join(' ');
    }
}

// Global key space resolver instance for shared use
let globalKeySpaceResolver: KeySpaceResolver | undefined;

/**
 * Get or create the global KeySpaceResolver
 */
export function getGlobalKeySpaceResolver(): KeySpaceResolver {
    if (!globalKeySpaceResolver) {
        globalKeySpaceResolver = new KeySpaceResolver();
    }
    return globalKeySpaceResolver;
}

/**
 * Register the DITA link provider for map files
 */
export function registerDitaLinkProvider(context: vscode.ExtensionContext): void {
    // Create shared key space resolver
    const keySpaceResolver = getGlobalKeySpaceResolver();
    const linkProvider = new DitaLinkProvider(keySpaceResolver);

    // Register for .ditamap files (language ID is 'dita' as configured in package.json)
    const ditamapProvider = vscode.languages.registerDocumentLinkProvider(
        { language: 'dita', pattern: '**/*.ditamap' },
        linkProvider
    );

    // Register for .bookmap files
    const bookmapProvider = vscode.languages.registerDocumentLinkProvider(
        { language: 'dita', pattern: '**/*.bookmap' },
        linkProvider
    );

    // Also register for generic DITA language (catches all .dita, .ditamap, .bookmap)
    const ditaProvider = vscode.languages.registerDocumentLinkProvider(
        { language: 'dita' },
        linkProvider
    );

    // Clean up key space resolver on deactivation
    context.subscriptions.push({
        dispose: () => {
            keySpaceResolver.dispose();
            globalKeySpaceResolver = undefined;
        }
    });

    context.subscriptions.push(ditamapProvider, bookmapProvider, ditaProvider);

    logger.info('DITA Link Provider registered with key space resolution');
}
