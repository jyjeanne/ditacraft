/**
 * DITA Link Provider
 * Provides clickable links for href attributes in DITA maps
 * Enables Ctrl+Click navigation to open referenced DITA files
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class DitaLinkProvider implements vscode.DocumentLinkProvider {

    /**
     * Provide document links for href attributes in DITA maps
     */
    public provideDocumentLinks(
        document: vscode.TextDocument,
        _token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.DocumentLink[]> {

        const links: vscode.DocumentLink[] = [];
        const text = document.getText();
        const documentDir = path.dirname(document.uri.fsPath);

        // Regular expression to match href attributes in topicref elements
        // Matches: href="path/to/file.dita"
        const hrefRegex = /<topicref[^>]*\bhref\s*=\s*["']([^"']+)["']/gi;

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
            const targetPath = this.resolveHref(hrefValue, documentDir);

            if (targetPath) {
                const targetUri = vscode.Uri.file(targetPath);
                const link = new vscode.DocumentLink(range, targetUri);
                link.tooltip = `Open ${path.basename(targetPath)}`;
                links.push(link);
            }
        }

        return links;
    }

    /**
     * Resolve href to absolute file path
     * Handles relative paths and fragments (e.g., "file.dita#topic_id")
     */
    private resolveHref(href: string, baseDir: string): string | null {
        // Remove fragment identifier if present (e.g., "file.dita#topic_id" -> "file.dita")
        const hrefWithoutFragment = href.split('#')[0];

        if (!hrefWithoutFragment) {
            return null;
        }

        // Resolve relative path to absolute path
        const absolutePath = path.resolve(baseDir, hrefWithoutFragment);

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
