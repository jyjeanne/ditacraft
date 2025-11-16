/**
 * DITA Link Provider
 * Provides clickable links for href, conref, conkeyref, and keyref attributes in DITA files
 * Enables Ctrl+Click navigation to open referenced DITA files
 *
 * Supports:
 * - Direct file references (href="file.dita")
 * - Content references (conref="file.dita#element")
 * - Key references (keyref="keyname") - requires key space resolution
 * - Content key references (conkeyref="keyname/element")
 * - Same-file references (conref="#element")
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { KeySpaceResolver } from '../utils/keySpaceResolver';
import { logger } from '../utils/logger';

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

    constructor(keySpaceResolver?: KeySpaceResolver) {
        this.keySpaceResolver = keySpaceResolver || new KeySpaceResolver();
    }

    /**
     * Provide document links for various reference attributes in DITA files
     * Supports: href, conref, conkeyref, keyref
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
        // Regular expression to match href attributes in DITA map elements
        // Matches href in: topicref, chapter, appendix, part, mapref, keydef, etc.
        // Pattern: <element ... href="value" ... >
        const hrefRegex = /<(?:topicref|chapter|appendix|part|mapref|keydef|topicgroup|topichead)[^>]*\bhref\s*=\s*["']([^"']+)["']/gi;

        let match: RegExpExecArray | null;
        let matchCount = 0;
        const maxMatches = 10000; // Safety limit to prevent infinite loops
        while ((match = hrefRegex.exec(text)) !== null) {
            // Safety check to prevent infinite loops if regex lacks global flag
            if (++matchCount > maxMatches) {
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
            const hrefValueStart = match.index + match[0].indexOf(hrefValue);
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
        // Match conref attributes in any element
        // Pattern: conref="value"
        const conrefRegex = /\bconref\s*=\s*["']([^"']+)["']/gi;

        let match: RegExpExecArray | null;
        let matchCount = 0;
        const maxMatches = 10000; // Safety limit to prevent infinite loops
        while ((match = conrefRegex.exec(text)) !== null) {
            // Safety check to prevent infinite loops
            if (++matchCount > maxMatches) {
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
            const valueStart = match.index + match[0].indexOf(conrefValue);
            const startPos = document.positionAt(valueStart);
            const endPos = document.positionAt(valueStart + conrefValue.length);
            const range = new vscode.Range(startPos, endPos);

            // Handle same-file references (e.g., "#elementId/path")
            if (conrefValue.startsWith('#')) {
                // Same-file reference - create link to current file with fragment
                const elementPath = conrefValue.substring(1);
                const targetUri = document.uri.with({ fragment: elementPath });
                const link = new vscode.DocumentLink(range, targetUri);
                link.tooltip = `Go to element: ${elementPath}`;
                links.push(link);
                continue;
            }

            // Resolve the target file path
            const targetPath = this.resolveReference(conrefValue, documentDir);

            if (targetPath) {
                const targetUri = vscode.Uri.file(targetPath);
                const link = new vscode.DocumentLink(range, targetUri);
                link.tooltip = `Open content reference: ${path.basename(targetPath)}`;
                links.push(link);
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
        // Match conkeyref attributes
        const conkeyrefRegex = /\bconkeyref\s*=\s*["']([^"']+)["']/gi;

        let match: RegExpExecArray | null;
        let matchCount = 0;
        const maxMatches = 10000; // Safety limit to prevent infinite loops
        while ((match = conkeyrefRegex.exec(text)) !== null) {
            // Safety check to prevent infinite loops
            if (++matchCount > maxMatches) {
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
            const valueStart = match.index + match[0].indexOf(conkeyrefValue);
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
                        link.tooltip = `Open content key reference: ${keyPart}/${elementPart}`;
                    } else {
                        link.tooltip = `Open content key reference: ${keyPart}`;
                    }

                    links.push(link);
                    logger.debug('Resolved conkeyref', { key: keyPart, target: keyDef.targetFile });
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
        // Match keyref attributes
        const keyrefRegex = /\bkeyref\s*=\s*["']([^"']+)["']/gi;

        let match: RegExpExecArray | null;
        let matchCount = 0;
        const maxMatches = 10000; // Safety limit to prevent infinite loops
        while ((match = keyrefRegex.exec(text)) !== null) {
            // Safety check to prevent infinite loops
            if (++matchCount > maxMatches) {
                break;
            }

            const keyrefValue = match[1];

            // Skip if empty or contains variables
            if (!keyrefValue || keyrefValue.includes('${')) {
                continue;
            }

            // Calculate position
            const valueStart = match.index + match[0].indexOf(keyrefValue);
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
                    // Could create a tooltip-only link or skip
                    logger.debug('Key has inline content', {
                        key: keyrefValue,
                        content: keyDef.inlineContent
                    });
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
     * Resolve reference to absolute file path
     * Handles relative paths and fragments (e.g., "file.dita#topic_id")
     */
    private resolveReference(reference: string, baseDir: string): string | null {
        // Remove fragment identifier if present (e.g., "file.dita#topic_id" -> "file.dita")
        const parts = reference.split('#');
        const referenceWithoutFragment = parts.length > 0 ? parts[0] : reference;

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

        // Check if file exists
        if (fs.existsSync(absolutePath)) {
            return absolutePath;
        }

        // File doesn't exist - still return the path so user gets feedback
        return absolutePath;
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
