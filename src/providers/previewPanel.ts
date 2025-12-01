/**
 * Preview Panel
 * WebView panel for showing HTML5 preview of DITA content
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { logger } from '../utils/logger';
import { fireAndForget } from '../utils/errorUtils';

/**
 * Manages the DITA Preview WebView panel
 */
export class DitaPreviewPanel {
    public static currentPanel: DitaPreviewPanel | undefined;
    public static readonly viewType = 'ditacraft.preview';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _currentHtmlFile: string | undefined;
    private _currentSourceFile: string | undefined;
    private _disposables: vscode.Disposable[] = [];

    /**
     * Create or show the preview panel
     */
    public static createOrShow(
        extensionUri: vscode.Uri,
        htmlFile: string,
        sourceFile: string
    ): DitaPreviewPanel {
        const column = vscode.ViewColumn.Beside;

        // If we already have a panel, show it
        if (DitaPreviewPanel.currentPanel) {
            DitaPreviewPanel.currentPanel._panel.reveal(column);
            DitaPreviewPanel.currentPanel.update(htmlFile, sourceFile);
            return DitaPreviewPanel.currentPanel;
        }

        // Otherwise, create a new panel
        const panel = vscode.window.createWebviewPanel(
            DitaPreviewPanel.viewType,
            'DITA Preview',
            column,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.file(path.dirname(htmlFile)),
                    extensionUri
                ]
            }
        );

        DitaPreviewPanel.currentPanel = new DitaPreviewPanel(panel, extensionUri, htmlFile, sourceFile);
        return DitaPreviewPanel.currentPanel;
    }

    /**
     * Revive the panel from a previous session
     */
    public static revive(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri
    ): void {
        DitaPreviewPanel.currentPanel = new DitaPreviewPanel(panel, extensionUri);
    }

    private constructor(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        htmlFile?: string,
        sourceFile?: string
    ) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._currentHtmlFile = htmlFile;
        this._currentSourceFile = sourceFile;

        // Set the webview's initial html content
        if (htmlFile) {
            this._update();
        }

        // Listen for when the panel is disposed
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Update the content when the view becomes visible
        this._panel.onDidChangeViewState(
            () => {
                if (this._panel.visible && this._currentHtmlFile) {
                    this._update();
                }
            },
            null,
            this._disposables
        );

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'refresh':
                        this._update();
                        return;
                    case 'openSource':
                        if (this._currentSourceFile) {
                            fireAndForget(
                                (async () => {
                                    const doc = await vscode.workspace.openTextDocument(this._currentSourceFile!);
                                    await vscode.window.showTextDocument(doc, vscode.ViewColumn.One);
                                })(),
                                'open-source-file'
                            );
                        }
                        return;
                }
            },
            null,
            this._disposables
        );

        logger.debug('DITA Preview Panel created');
    }

    /**
     * Update the preview with new content
     */
    public update(htmlFile: string, sourceFile: string): void {
        this._currentHtmlFile = htmlFile;
        this._currentSourceFile = sourceFile;

        // Update local resource roots to include new file's directory
        this._panel.webview.options = {
            ...this._panel.webview.options,
            localResourceRoots: [
                vscode.Uri.file(path.dirname(htmlFile)),
                this._extensionUri
            ]
        };

        this._update();
    }

    /**
     * Refresh the preview content
     */
    public refresh(): void {
        this._update();
    }

    /**
     * Get the source file path
     */
    public getSourceFile(): string | undefined {
        return this._currentSourceFile;
    }

    /**
     * Dispose of the panel
     */
    public dispose(): void {
        DitaPreviewPanel.currentPanel = undefined;

        // Clean up resources
        this._panel.dispose();

        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }

        logger.debug('DITA Preview Panel disposed');
    }

    /**
     * Update the webview content
     */
    private _update(): void {
        const webview = this._panel.webview;

        if (!this._currentHtmlFile) {
            webview.html = this._getNoContentHtml();
            return;
        }

        // Update panel title
        const fileName = path.basename(this._currentSourceFile || this._currentHtmlFile);
        this._panel.title = `Preview: ${fileName}`;

        // Set the HTML content
        webview.html = this._getHtmlForWebview(webview);
    }

    /**
     * Get HTML content for no file scenario
     */
    private _getNoContentHtml(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DITA Preview</title>
    <style>
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
        }
        .message {
            text-align: center;
            padding: 2rem;
        }
        .message h2 {
            margin-bottom: 1rem;
        }
    </style>
</head>
<body>
    <div class="message">
        <h2>No Preview Available</h2>
        <p>Open a DITA file and run "DITA: Preview HTML5" to see the preview.</p>
    </div>
</body>
</html>`;
    }

    /**
     * Get the HTML content for the webview
     */
    private _getHtmlForWebview(webview: vscode.Webview): string {
        if (!this._currentHtmlFile || !fs.existsSync(this._currentHtmlFile)) {
            return this._getNoContentHtml();
        }

        try {
            // Read the generated HTML file
            let htmlContent = fs.readFileSync(this._currentHtmlFile, 'utf-8');

            // Get the directory of the HTML file for resolving relative paths
            const htmlDir = path.dirname(this._currentHtmlFile);

            // Convert local file references to webview URIs
            htmlContent = this._convertLocalResources(htmlContent, htmlDir, webview);

            // Inject VS Code theme integration and toolbar
            htmlContent = this._injectPreviewEnhancements(htmlContent);

            return htmlContent;

        } catch (error) {
            logger.error('Failed to load preview content', error);
            return this._getErrorHtml(error instanceof Error ? error.message : 'Unknown error');
        }
    }

    /**
     * Convert local resource references to webview URIs
     */
    private _convertLocalResources(html: string, baseDir: string, webview: vscode.Webview): string {
        // Convert relative src and href attributes
        const patterns = [
            { regex: /src="([^"]+)"/g, attr: 'src' },
            { regex: /href="([^"]+\.css)"/g, attr: 'href' },
            { regex: /href="([^"]+\.js)"/g, attr: 'href' }
        ];

        for (const pattern of patterns) {
            html = html.replace(pattern.regex, (match, relativePath) => {
                // Skip external URLs and data URIs
                if (relativePath.startsWith('http') ||
                    relativePath.startsWith('//') ||
                    relativePath.startsWith('data:')) {
                    return match;
                }

                // Convert to absolute path
                const absolutePath = path.isAbsolute(relativePath)
                    ? relativePath
                    : path.join(baseDir, relativePath);

                // Convert to webview URI
                if (fs.existsSync(absolutePath)) {
                    const uri = webview.asWebviewUri(vscode.Uri.file(absolutePath));
                    return `${pattern.attr}="${uri}"`;
                }

                return match;
            });
        }

        return html;
    }

    /**
     * Inject preview enhancements (toolbar, theme integration)
     */
    private _injectPreviewEnhancements(html: string): string {
        // Create toolbar HTML
        const toolbar = `
<div id="ditacraft-toolbar" style="
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 32px;
    background: var(--vscode-editor-background, #1e1e1e);
    border-bottom: 1px solid var(--vscode-panel-border, #454545);
    display: flex;
    align-items: center;
    padding: 0 10px;
    z-index: 10000;
    font-family: var(--vscode-font-family, sans-serif);
    font-size: 12px;
">
    <span style="color: var(--vscode-foreground, #ccc); margin-right: auto;">
        DITA Preview
    </span>
    <button onclick="ditacraftRefresh()" style="
        background: var(--vscode-button-background, #0e639c);
        color: var(--vscode-button-foreground, #fff);
        border: none;
        padding: 4px 10px;
        margin-left: 8px;
        cursor: pointer;
        border-radius: 2px;
    " title="Refresh Preview">
        Refresh
    </button>
    <button onclick="ditacraftOpenSource()" style="
        background: var(--vscode-button-secondaryBackground, #3a3d41);
        color: var(--vscode-button-secondaryForeground, #fff);
        border: none;
        padding: 4px 10px;
        margin-left: 8px;
        cursor: pointer;
        border-radius: 2px;
    " title="Open Source File">
        Source
    </button>
</div>
<div style="height: 32px;"></div>
<script>
    const vscode = acquireVsCodeApi();
    function ditacraftRefresh() {
        vscode.postMessage({ command: 'refresh' });
    }
    function ditacraftOpenSource() {
        vscode.postMessage({ command: 'openSource' });
    }
</script>`;

        // Inject toolbar after opening body tag
        const bodyMatch = html.match(/<body[^>]*>/i);
        if (bodyMatch) {
            const insertPos = html.indexOf(bodyMatch[0]) + bodyMatch[0].length;
            html = html.slice(0, insertPos) + toolbar + html.slice(insertPos);
        }

        return html;
    }

    /**
     * Get error HTML
     */
    private _getErrorHtml(errorMessage: string): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview Error</title>
    <style>
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            font-family: var(--vscode-font-family);
            color: var(--vscode-errorForeground);
            background-color: var(--vscode-editor-background);
        }
        .error {
            text-align: center;
            padding: 2rem;
            max-width: 600px;
        }
        .error h2 {
            color: var(--vscode-errorForeground);
            margin-bottom: 1rem;
        }
        .error pre {
            background: var(--vscode-textBlockQuote-background);
            padding: 1rem;
            border-radius: 4px;
            overflow-x: auto;
            text-align: left;
        }
    </style>
</head>
<body>
    <div class="error">
        <h2>Preview Error</h2>
        <p>An error occurred while loading the preview:</p>
        <pre>${this._escapeHtml(errorMessage)}</pre>
    </div>
</body>
</html>`;
    }

    /**
     * Escape HTML special characters
     */
    private _escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

/**
 * Register the preview panel serializer for persistence
 */
export function registerPreviewPanelSerializer(context: vscode.ExtensionContext): void {
    if (vscode.window.registerWebviewPanelSerializer) {
        vscode.window.registerWebviewPanelSerializer(DitaPreviewPanel.viewType, {
            async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel) {
                DitaPreviewPanel.revive(webviewPanel, context.extensionUri);
            }
        });
    }
}
