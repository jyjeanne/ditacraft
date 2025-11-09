/**
 * DITA Link Provider
 * Provides clickable links for href, conref, conkeyref, and keyref attributes in DITA files
 * Enables Ctrl+Click navigation to open referenced DITA files
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class DitaLinkProvider implements vscode.DocumentLinkProvider {

    /**
     * Provide document links for various reference attributes in DITA files
     * Supports: href, conref, conkeyref, keyref
     */
    public provideDocumentLinks(
        document: vscode.TextDocument,
        _token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.DocumentLink[]> {

        const links: vscode.DocumentLink[] = [];
        const text = document.getText();
        const documentDir = path.dirname(document.uri.fsPath);

        // Process href attributes (in map and topic elements)
        this.processHrefAttributes(text, document, documentDir, links);

        // Process conref attributes (content references)
        this.processConrefAttributes(text, document, documentDir, links);

        // Process conkeyref attributes (content key references)
        this.processConkeyrefAttributes(text, document, documentDir, links);

        // Process keyref attributes (key references)
        this.processKeyrefAttributes(text, document, documentDir, links);

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
        while ((match = hrefRegex.exec(text)) !== null) {
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
        while ((match = conrefRegex.exec(text)) !== null) {
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
     * Process conkeyref attributes (content key references)
     * Format: conkeyref="keyname/elementid" or conkeyref="keyname"
     * Note: This creates a link if the keyname looks like a filename
     */
    private processConkeyrefAttributes(
        text: string,
        document: vscode.TextDocument,
        documentDir: string,
        links: vscode.DocumentLink[]
    ): void {
        // Match conkeyref attributes
        const conkeyrefRegex = /\bconkeyref\s*=\s*["']([^"']+)["']/gi;

        let match: RegExpExecArray | null;
        while ((match = conkeyrefRegex.exec(text)) !== null) {
            const conkeyrefValue = match[1];

            // Skip if empty or contains variables
            if (!conkeyrefValue || conkeyrefValue.includes('${')) {
                continue;
            }

            // Extract the key part (before any slash)
            const keyPart = conkeyrefValue.split('/')[0];

            // Check if the key looks like a filename (contains .dita or .ditamap extension)
            if (!keyPart.includes('.dita') && !keyPart.includes('.ditamap')) {
                // Skip pure key references that don't look like filenames
                // In a full implementation, we would resolve keys from a keyspace
                continue;
            }

            // Calculate position
            const valueStart = match.index + match[0].indexOf(conkeyrefValue);
            const startPos = document.positionAt(valueStart);
            const endPos = document.positionAt(valueStart + conkeyrefValue.length);
            const range = new vscode.Range(startPos, endPos);

            // Try to resolve as a file path
            const targetPath = this.resolveReference(keyPart, documentDir);

            if (targetPath) {
                const targetUri = vscode.Uri.file(targetPath);
                const link = new vscode.DocumentLink(range, targetUri);
                link.tooltip = `Open content key reference: ${path.basename(targetPath)}`;
                links.push(link);
            }
        }
    }

    /**
     * Process keyref attributes (key references)
     * Format: keyref="keyname"
     * Note: This creates a link if the keyname looks like a filename
     */
    private processKeyrefAttributes(
        text: string,
        document: vscode.TextDocument,
        documentDir: string,
        links: vscode.DocumentLink[]
    ): void {
        // Match keyref attributes
        const keyrefRegex = /\bkeyref\s*=\s*["']([^"']+)["']/gi;

        let match: RegExpExecArray | null;
        while ((match = keyrefRegex.exec(text)) !== null) {
            const keyrefValue = match[1];

            // Skip if empty or contains variables
            if (!keyrefValue || keyrefValue.includes('${')) {
                continue;
            }

            // Check if the key looks like a filename
            if (!keyrefValue.includes('.dita') && !keyrefValue.includes('.ditamap')) {
                // Skip pure key references that don't look like filenames
                continue;
            }

            // Calculate position
            const valueStart = match.index + match[0].indexOf(keyrefValue);
            const startPos = document.positionAt(valueStart);
            const endPos = document.positionAt(valueStart + keyrefValue.length);
            const range = new vscode.Range(startPos, endPos);

            // Try to resolve as a file path
            const targetPath = this.resolveReference(keyrefValue, documentDir);

            if (targetPath) {
                const targetUri = vscode.Uri.file(targetPath);
                const link = new vscode.DocumentLink(range, targetUri);
                link.tooltip = `Open key reference: ${path.basename(targetPath)}`;
                links.push(link);
            }
        }
    }

    /**
     * Resolve reference to absolute file path
     * Handles relative paths and fragments (e.g., "file.dita#topic_id")
     */
    private resolveReference(reference: string, baseDir: string): string | null {
        // Remove fragment identifier if present (e.g., "file.dita#topic_id" -> "file.dita")
        const referenceWithoutFragment = reference.split('#')[0];

        if (!referenceWithoutFragment) {
            return null;
        }

        // Resolve relative path to absolute path
        const absolutePath = path.resolve(baseDir, referenceWithoutFragment);

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
}

/**
 * Register the DITA link provider for map files
 */
export function registerDitaLinkProvider(context: vscode.ExtensionContext): void {
    const linkProvider = new DitaLinkProvider();

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

    context.subscriptions.push(ditamapProvider, bookmapProvider, ditaProvider);
}
