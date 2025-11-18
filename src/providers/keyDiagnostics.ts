/**
 * Key Diagnostics Provider
 * Provides diagnostic warnings for missing or unresolved key references
 */

import * as vscode from 'vscode';
import { KeySpaceResolver } from '../utils/keySpaceResolver';
import { logger } from '../utils/logger';

export class KeyDiagnosticsProvider implements vscode.Disposable {
    private diagnosticCollection: vscode.DiagnosticCollection;
    private keySpaceResolver: KeySpaceResolver;
    private disposables: vscode.Disposable[] = [];

    // Pre-compiled regex patterns
    private static readonly KEYREF_PATTERN = /\bkeyref\s*=\s*["']([^"']+)["']/gi;
    private static readonly CONKEYREF_PATTERN = /\bconkeyref\s*=\s*["']([^"']+)["']/gi;
    private static readonly XREF_KEYREF_PATTERN = /<xref[^>]*\bkeyref\s*=\s*["']([^"']+)["'][^>]*>/gi;

    constructor(keySpaceResolver: KeySpaceResolver) {
        this.keySpaceResolver = keySpaceResolver;
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('ditacraft-keys');

        // Register document change listeners
        this.disposables.push(
            vscode.workspace.onDidOpenTextDocument(doc => this.checkDocument(doc)),
            vscode.workspace.onDidSaveTextDocument(doc => this.checkDocument(doc)),
            vscode.workspace.onDidChangeTextDocument(e => this.onDocumentChange(e))
        );

        // Check all open DITA documents
        vscode.workspace.textDocuments.forEach(doc => this.checkDocument(doc));

        logger.info('Key Diagnostics Provider initialized');
    }

    /**
     * Debounced document change handler
     */
    private changeTimeout: NodeJS.Timeout | undefined;
    private onDocumentChange(event: vscode.TextDocumentChangeEvent): void {
        if (!this.isDitaFile(event.document)) {
            return;
        }

        // Debounce to avoid excessive checks
        if (this.changeTimeout) {
            clearTimeout(this.changeTimeout);
        }

        this.changeTimeout = setTimeout(() => {
            this.checkDocument(event.document).catch(err => {
                logger.error('Error checking document for key diagnostics', err);
            });
        }, 1000);
    }

    /**
     * Check if file is a DITA file
     */
    private isDitaFile(document: vscode.TextDocument): boolean {
        const fileName = document.fileName.toLowerCase();
        return fileName.endsWith('.dita') ||
               fileName.endsWith('.ditamap') ||
               fileName.endsWith('.bookmap') ||
               document.languageId === 'dita';
    }

    /**
     * Check a document for missing key references
     */
    public async checkDocument(document: vscode.TextDocument): Promise<void> {
        if (!this.isDitaFile(document)) {
            return;
        }

        const diagnostics: vscode.Diagnostic[] = [];
        const text = document.getText();

        // Find all key references
        const keyRefs = this.findKeyReferences(text, document);

        // Check each key reference
        for (const keyRef of keyRefs) {
            const resolved = await this.keySpaceResolver.resolveKey(keyRef.keyName, document.uri.fsPath);

            if (!resolved) {
                const diagnostic = new vscode.Diagnostic(
                    keyRef.range,
                    `Key "${keyRef.keyName}" not found in key space. Make sure it's defined in a root map.`,
                    vscode.DiagnosticSeverity.Warning
                );
                diagnostic.source = 'ditacraft-keys';
                diagnostic.code = 'missing-key';
                diagnostics.push(diagnostic);

                logger.debug('Missing key reference', {
                    key: keyRef.keyName,
                    file: document.uri.fsPath,
                    line: keyRef.range.start.line
                });
            }
        }

        this.diagnosticCollection.set(document.uri, diagnostics);

        if (diagnostics.length > 0) {
            logger.info(`Found ${diagnostics.length} missing key reference(s) in ${document.uri.fsPath}`);
        }
    }

    /**
     * Find all key references in text
     */
    private findKeyReferences(
        text: string,
        document: vscode.TextDocument
    ): Array<{ keyName: string; range: vscode.Range; type: string }> {
        const refs: Array<{ keyName: string; range: vscode.Range; type: string }> = [];

        // Find keyref attributes
        this.findMatches(text, KeyDiagnosticsProvider.KEYREF_PATTERN, document, 'keyref', refs);

        // Find conkeyref attributes
        this.findMatches(text, KeyDiagnosticsProvider.CONKEYREF_PATTERN, document, 'conkeyref', refs);

        // Find xref keyref attributes
        this.findMatches(text, KeyDiagnosticsProvider.XREF_KEYREF_PATTERN, document, 'xref-keyref', refs);

        return refs;
    }

    /**
     * Find matches for a pattern and add to refs array
     */
    private findMatches(
        text: string,
        pattern: RegExp,
        document: vscode.TextDocument,
        type: string,
        refs: Array<{ keyName: string; range: vscode.Range; type: string }>
    ): void {
        pattern.lastIndex = 0;

        let match: RegExpExecArray | null;
        let count = 0;
        const maxMatches = 1000;

        while ((match = pattern.exec(text)) !== null) {
            if (++count > maxMatches) {
                break;
            }

            let keyValue = match[1];

            // For conkeyref, extract just the key part (before /)
            if (type === 'conkeyref' && keyValue.includes('/')) {
                keyValue = keyValue.split('/')[0];
            }

            // Skip if it looks like a filename (backward compatibility fallback)
            if (keyValue.includes('.dita') || keyValue.includes('.ditamap')) {
                continue;
            }

            // Skip variable references
            if (keyValue.includes('${')) {
                continue;
            }

            // Calculate range
            const valueStart = match.index + match[0].indexOf(keyValue);
            const startPos = document.positionAt(valueStart);
            const endPos = document.positionAt(valueStart + keyValue.length);
            const range = new vscode.Range(startPos, endPos);

            refs.push({ keyName: keyValue, range, type });
        }
    }

    /**
     * Clear diagnostics for a document
     */
    public clearDiagnostics(uri: vscode.Uri): void {
        this.diagnosticCollection.delete(uri);
    }

    /**
     * Clear all diagnostics
     */
    public clearAllDiagnostics(): void {
        this.diagnosticCollection.clear();
    }

    /**
     * Dispose the provider
     */
    public dispose(): void {
        if (this.changeTimeout) {
            clearTimeout(this.changeTimeout);
        }
        this.diagnosticCollection.dispose();
        this.disposables.forEach(d => d.dispose());
        logger.info('Key Diagnostics Provider disposed');
    }
}

/**
 * Register the key diagnostics provider
 */
export function registerKeyDiagnosticsProvider(
    context: vscode.ExtensionContext,
    keySpaceResolver: KeySpaceResolver
): KeyDiagnosticsProvider {
    const provider = new KeyDiagnosticsProvider(keySpaceResolver);
    context.subscriptions.push(provider);
    logger.info('Key Diagnostics Provider registered');
    return provider;
}
