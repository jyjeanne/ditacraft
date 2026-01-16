/**
 * Preview Panel
 * WebView panel for showing HTML5 preview of DITA content
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { logger } from '../utils/logger';
import { fireAndForget } from '../utils/errorUtils';
import { configManager, PreviewThemeType } from '../utils/configurationManager';

/** Debounce delay for editor scroll events (ms) */
const EDITOR_SCROLL_DEBOUNCE_MS = 50;
/** Delay before resetting scroll sync flags (ms) */
const SCROLL_SYNC_RESET_DELAY_MS = 100;

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

    // Scroll sync state
    private _scrollSyncEnabled: boolean = true;
    private _isScrollingFromEditor: boolean = false;
    private _isScrollingFromPreview: boolean = false;
    private _scrollSyncDebounceTimer: NodeJS.Timeout | undefined;
    private _scrollSyncResetTimers: NodeJS.Timeout[] = [];

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
                    case 'scrollSync':
                        this._handlePreviewScroll(message.scrollPercentage);
                        return;
                    case 'setTheme':
                        this._handleSetTheme(message.theme);
                        return;
                    case 'toggleScrollSync':
                        this._scrollSyncEnabled = message.enabled;
                        return;
                }
            },
            null,
            this._disposables
        );

        // Initialize scroll sync from configuration
        this._scrollSyncEnabled = configManager.get('previewScrollSync');

        // Set up editor scroll/cursor sync
        this._setupEditorScrollSync();

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
     * Handle theme change from webview
     */
    private _handleSetTheme(theme: string): void {
        if (theme !== 'auto' && theme !== 'light' && theme !== 'dark') {
            return;
        }

        fireAndForget(
            (async () => {
                try {
                    const config = vscode.workspace.getConfiguration('ditacraft');
                    await config.update('previewTheme', theme, vscode.ConfigurationTarget.Global);
                    logger.debug(`Preview theme changed to: ${theme}`);
                } catch (error) {
                    logger.error('Failed to update preview theme setting', error);
                }
            })(),
            'set-theme'
        );
    }

    /**
     * Set up editor scroll and cursor change listeners for bidirectional sync
     */
    private _setupEditorScrollSync(): void {
        // Listen for visible range changes (scroll)
        this._disposables.push(
            vscode.window.onDidChangeTextEditorVisibleRanges(event => {
                this._handleEditorScroll(event.textEditor);
            })
        );

        // Listen for cursor position changes
        this._disposables.push(
            vscode.window.onDidChangeTextEditorSelection(event => {
                this._handleEditorCursorChange(event.textEditor);
            })
        );

        // Listen for active editor changes
        this._disposables.push(
            vscode.window.onDidChangeActiveTextEditor(editor => {
                if (editor && this._currentSourceFile &&
                    editor.document.uri.fsPath === this._currentSourceFile) {
                    this._handleEditorScroll(editor);
                }
            })
        );
    }

    /**
     * Handle editor scroll event - sync to preview
     */
    private _handleEditorScroll(editor: vscode.TextEditor): void {
        // Skip if scroll sync is disabled or we're currently syncing from preview
        if (!this._scrollSyncEnabled || this._isScrollingFromPreview) {
            return;
        }

        // Skip if panel is not visible
        if (!this._panel.visible) {
            return;
        }

        // Only sync if this editor has the source file we're previewing
        if (!this._currentSourceFile ||
            editor.document.uri.fsPath !== this._currentSourceFile) {
            return;
        }

        // Debounce the scroll sync
        if (this._scrollSyncDebounceTimer) {
            clearTimeout(this._scrollSyncDebounceTimer);
        }

        this._scrollSyncDebounceTimer = setTimeout(() => {
            const visibleRanges = editor.visibleRanges;
            if (visibleRanges.length === 0) {
                return;
            }

            // Calculate scroll percentage based on visible range
            const lineCount = editor.document.lineCount;
            const firstVisibleLine = visibleRanges[0].start.line;
            const scrollPercentage = lineCount > 1
                ? (firstVisibleLine / (lineCount - 1)) * 100
                : 0;

            // Send scroll position to webview
            this._isScrollingFromEditor = true;
            this._panel.webview.postMessage({
                command: 'scrollToPercentage',
                scrollPercentage: scrollPercentage
            });

            // Reset flag after a short delay (tracked for cleanup)
            const timer = setTimeout(() => {
                this._isScrollingFromEditor = false;
            }, SCROLL_SYNC_RESET_DELAY_MS);
            this._scrollSyncResetTimers.push(timer);
        }, EDITOR_SCROLL_DEBOUNCE_MS);
    }

    /**
     * Handle editor cursor change - optionally sync to preview
     */
    private _handleEditorCursorChange(editor: vscode.TextEditor): void {
        // Skip if scroll sync is disabled or we're currently syncing from preview
        if (!this._scrollSyncEnabled || this._isScrollingFromPreview) {
            return;
        }

        // Skip if panel is not visible
        if (!this._panel.visible) {
            return;
        }

        // Only sync if this editor has the source file we're previewing
        if (!this._currentSourceFile ||
            editor.document.uri.fsPath !== this._currentSourceFile) {
            return;
        }

        // Only scroll on cursor change if the cursor is outside visible range
        const visibleRanges = editor.visibleRanges;
        const cursorLine = editor.selection.active.line;

        const isVisible = visibleRanges.some(
            range => cursorLine >= range.start.line && cursorLine <= range.end.line
        );

        // If cursor is already visible, don't force a scroll
        if (isVisible) {
            return;
        }

        // Calculate percentage based on cursor position
        const lineCount = editor.document.lineCount;
        const scrollPercentage = lineCount > 1
            ? (cursorLine / (lineCount - 1)) * 100
            : 0;

        // Send scroll position to webview
        this._isScrollingFromEditor = true;
        this._panel.webview.postMessage({
            command: 'scrollToPercentage',
            scrollPercentage: scrollPercentage
        });

        // Reset flag after a short delay (tracked for cleanup)
        const timer = setTimeout(() => {
            this._isScrollingFromEditor = false;
        }, SCROLL_SYNC_RESET_DELAY_MS);
        this._scrollSyncResetTimers.push(timer);
    }

    /**
     * Handle scroll synchronization from preview (percentage-based)
     */
    private _handlePreviewScroll(scrollPercentage: number): void {
        // Skip if scroll sync is disabled or we're currently syncing from editor
        if (!this._scrollSyncEnabled || this._isScrollingFromEditor) {
            return;
        }

        // Skip if panel is not visible
        if (!this._panel.visible) {
            return;
        }

        if (!this._currentSourceFile) {
            return;
        }

        // Validate input
        if (typeof scrollPercentage !== 'number' || isNaN(scrollPercentage)) {
            return;
        }
        // Clamp to valid range
        const clampedPercentage = Math.max(0, Math.min(100, scrollPercentage));

        fireAndForget(
            (async () => {
                try {
                    // Find the editor showing the source file
                    const editor = vscode.window.visibleTextEditors.find(
                        e => e.document.uri.fsPath === this._currentSourceFile
                    );

                    if (editor) {
                        // Mark that we're scrolling from preview to prevent loops
                        this._isScrollingFromPreview = true;

                        // Calculate target line from percentage
                        const lineCount = editor.document.lineCount;
                        const targetLine = Math.min(
                            Math.floor((clampedPercentage / 100) * (lineCount - 1)),
                            lineCount - 1
                        );

                        // Reveal the line in the editor at the center
                        const position = new vscode.Position(Math.max(0, targetLine), 0);
                        editor.revealRange(
                            new vscode.Range(position, position),
                            vscode.TextEditorRevealType.InCenter
                        );

                        // Reset flag after a short delay (tracked for cleanup)
                        const timer = setTimeout(() => {
                            this._isScrollingFromPreview = false;
                        }, SCROLL_SYNC_RESET_DELAY_MS);
                        this._scrollSyncResetTimers.push(timer);
                    }
                } catch (error) {
                    logger.error('Preview to editor scroll sync failed', error);
                }
            })(),
            'scroll-sync-preview-to-editor'
        );
    }

    /**
     * Dispose of the panel
     */
    public dispose(): void {
        DitaPreviewPanel.currentPanel = undefined;

        // Clear scroll sync debounce timer
        if (this._scrollSyncDebounceTimer) {
            clearTimeout(this._scrollSyncDebounceTimer);
            this._scrollSyncDebounceTimer = undefined;
        }

        // Clear all scroll sync reset timers
        for (const timer of this._scrollSyncResetTimers) {
            clearTimeout(timer);
        }
        this._scrollSyncResetTimers = [];

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
     * Sanitize CSS content to prevent injection attacks
     * Escapes </style> tags that could break out of the style block
     */
    private _sanitizeCss(css: string): string {
        // Escape </style> to prevent breaking out of style tag
        return css.replace(/<\/style>/gi, '<\\/style>');
    }

    /**
     * Load custom CSS content from configured file path
     */
    private _loadCustomCss(): string {
        const customCssPath = configManager.get('previewCustomCss');
        if (!customCssPath) {
            return '';
        }

        // Resolve ${workspaceFolder} variable
        let resolvedPath = customCssPath;
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            resolvedPath = customCssPath.replace(
                /\$\{workspaceFolder\}/g,
                workspaceFolders[0].uri.fsPath
            );
        }

        // Validate path is within workspace (security)
        if (workspaceFolders && workspaceFolders.length > 0) {
            const workspaceRoot = workspaceFolders[0].uri.fsPath;
            const normalizedPath = path.normalize(resolvedPath);
            const normalizedWorkspace = path.normalize(workspaceRoot);

            // Allow absolute paths but warn if outside workspace
            if (!normalizedPath.startsWith(normalizedWorkspace)) {
                logger.warn(`Custom CSS path is outside workspace: ${resolvedPath}`);
            }
        }

        // Try to read the CSS file
        try {
            if (fs.existsSync(resolvedPath)) {
                const cssContent = fs.readFileSync(resolvedPath, 'utf-8');
                logger.debug(`Loaded custom CSS from: ${resolvedPath}`);
                // Sanitize CSS content to prevent injection
                return this._sanitizeCss(cssContent);
            } else {
                logger.warn(`Custom CSS file not found: ${resolvedPath}`);
                return '';
            }
        } catch (error) {
            logger.error(`Failed to load custom CSS from: ${resolvedPath}`, error);
            return '';
        }
    }

    /**
     * Inject preview enhancements (toolbar, theme integration, scroll sync)
     */
    private _injectPreviewEnhancements(html: string): string {
        // Get configuration
        const previewTheme = configManager.get('previewTheme');
        const customCss = this._loadCustomCss();

        // Determine initial theme label for button
        const themeLabels: Record<PreviewThemeType, string> = {
            'auto': 'Auto',
            'light': 'Light',
            'dark': 'Dark'
        };
        const currentThemeLabel = themeLabels[previewTheme];

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
    <button onclick="ditacraftCycleTheme()" id="themeButton" style="
        background: var(--vscode-button-secondaryBackground, #3a3d41);
        color: var(--vscode-button-secondaryForeground, #fff);
        border: none;
        padding: 4px 10px;
        margin-left: 8px;
        cursor: pointer;
        border-radius: 2px;
    " title="Cycle through themes (Auto/Light/Dark)">
        Theme: ${currentThemeLabel}
    </button>
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
    <button onclick="ditacraftToggleScrollSync()" id="scrollSyncButton" style="
        background: var(--vscode-button-secondaryBackground, #3a3d41);
        color: var(--vscode-button-secondaryForeground, #fff);
        border: none;
        padding: 4px 10px;
        margin-left: 8px;
        cursor: pointer;
        border-radius: 2px;
    " title="${configManager.get('previewScrollSync') ? 'Disable Scroll Sync' : 'Enable Scroll Sync'}">
        Sync: ${configManager.get('previewScrollSync') ? 'ON' : 'OFF'}
    </button>
    <button onclick="ditacraftPrint()" style="
        background: var(--vscode-button-secondaryBackground, #3a3d41);
        color: var(--vscode-button-secondaryForeground, #fff);
        border: none;
        padding: 4px 10px;
        margin-left: 8px;
        cursor: pointer;
        border-radius: 2px;
    " title="Print Preview">
        Print
    </button>
</div>
<div id="ditacraft-toolbar-spacer" style="height: 32px;"></div>
<script>
    const vscode = acquireVsCodeApi();
    let scrollSyncEnabled = ${configManager.get('previewScrollSync')};
    let lastScrollTime = 0;
    let isScrollingFromEditor = false;
    let editorScrollResetTimer = null;
    const SCROLL_DEBOUNCE_MS = ${SCROLL_SYNC_RESET_DELAY_MS};

    // Theme cycling
    const themes = ['auto', 'light', 'dark'];
    let currentThemeIndex = themes.indexOf('${previewTheme}');
    if (currentThemeIndex === -1) currentThemeIndex = 0;

    function ditacraftRefresh() {
        vscode.postMessage({ command: 'refresh' });
    }

    function ditacraftOpenSource() {
        vscode.postMessage({ command: 'openSource' });
    }

    function ditacraftPrint() {
        window.print();
    }

    function ditacraftToggleScrollSync() {
        scrollSyncEnabled = !scrollSyncEnabled;
        const button = document.getElementById('scrollSyncButton');
        if (button) {
            button.textContent = scrollSyncEnabled ? 'Sync: ON' : 'Sync: OFF';
            button.title = scrollSyncEnabled ? 'Disable Scroll Sync' : 'Enable Scroll Sync';
        }
        // Notify VS Code of the change
        vscode.postMessage({ command: 'toggleScrollSync', enabled: scrollSyncEnabled });
    }

    // Handle messages from VS Code (for editor-to-preview scroll sync)
    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.command) {
            case 'scrollToPercentage':
                if (scrollSyncEnabled) {
                    isScrollingFromEditor = true;
                    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
                    // Validate and clamp scroll percentage
                    const pct = Math.max(0, Math.min(100, message.scrollPercentage || 0));
                    const targetScroll = (pct / 100) * scrollHeight;
                    window.scrollTo({
                        top: targetScroll,
                        behavior: 'auto' // Use 'auto' to avoid smooth scroll delays
                    });
                    // Reset flag after scroll completes (clear previous timer first)
                    if (editorScrollResetTimer) {
                        clearTimeout(editorScrollResetTimer);
                    }
                    editorScrollResetTimer = setTimeout(() => {
                        isScrollingFromEditor = false;
                        editorScrollResetTimer = null;
                    }, SCROLL_DEBOUNCE_MS);
                }
                break;
        }
    });

    function ditacraftCycleTheme() {
        currentThemeIndex = (currentThemeIndex + 1) % themes.length;
        const newTheme = themes[currentThemeIndex];
        const themeLabels = { 'auto': 'Auto', 'light': 'Light', 'dark': 'Dark' };

        const button = document.getElementById('themeButton');
        if (button) {
            button.textContent = 'Theme: ' + themeLabels[newTheme];
        }

        // Apply theme immediately
        applyTheme(newTheme);

        // Notify VS Code to persist the setting
        vscode.postMessage({ command: 'setTheme', theme: newTheme });
    }

    function applyTheme(theme) {
        // Remove existing theme style if present
        const existingStyle = document.getElementById('ditacraft-theme-style');
        if (existingStyle) {
            existingStyle.remove();
        }

        const style = document.createElement('style');
        style.id = 'ditacraft-theme-style';

        if (theme === 'light') {
            style.textContent = \`
                body {
                    background-color: #ffffff !important;
                    color: #1e1e1e !important;
                }
                a { color: #0066cc !important; }
                a:hover { color: #004499 !important; }
                code, pre {
                    background-color: #f5f5f5 !important;
                    border: 1px solid #e0e0e0 !important;
                }
                #ditacraft-toolbar {
                    background: #f3f3f3 !important;
                    border-bottom-color: #d4d4d4 !important;
                }
                #ditacraft-toolbar span { color: #333 !important; }
                #ditacraft-toolbar button {
                    background: #d4d4d4 !important;
                    color: #1e1e1e !important;
                }
                #ditacraft-toolbar button:hover {
                    background: #c0c0c0 !important;
                }
            \`;
        } else if (theme === 'dark') {
            style.textContent = \`
                body {
                    background-color: #1e1e1e !important;
                    color: #d4d4d4 !important;
                }
                a { color: #3794ff !important; }
                a:hover { color: #4da6ff !important; }
                code, pre {
                    background-color: #2d2d2d !important;
                    border: 1px solid #404040 !important;
                }
                #ditacraft-toolbar {
                    background: #252526 !important;
                    border-bottom-color: #454545 !important;
                }
                #ditacraft-toolbar span { color: #ccc !important; }
                #ditacraft-toolbar button {
                    background: #3a3d41 !important;
                    color: #fff !important;
                }
                #ditacraft-toolbar button:hover {
                    background: #4a4d51 !important;
                }
            \`;
        } else {
            // auto - use VS Code CSS variables
            style.textContent = \`
                body {
                    background-color: var(--vscode-editor-background, #1e1e1e) !important;
                    color: var(--vscode-editor-foreground, #d4d4d4) !important;
                }
                a { color: var(--vscode-textLink-foreground, #3794ff) !important; }
                a:hover { color: var(--vscode-textLink-activeForeground, #3794ff) !important; }
                code, pre {
                    background-color: var(--vscode-textCodeBlock-background, rgba(220, 220, 220, 0.1)) !important;
                }
            \`;
        }

        document.head.appendChild(style);
    }

    // Add scroll event listener for scroll synchronization (preview to editor)
    window.addEventListener('scroll', () => {
        const now = Date.now();
        // Skip if sync is disabled, too recent, or caused by editor sync
        if (!scrollSyncEnabled || (now - lastScrollTime) < SCROLL_DEBOUNCE_MS || isScrollingFromEditor) {
            return;
        }
        lastScrollTime = now;

        // Calculate scroll percentage
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercentage = scrollHeight > 0
            ? (window.scrollY / scrollHeight) * 100
            : 0;

        vscode.postMessage({
            command: 'scrollSync',
            scrollPercentage: scrollPercentage
        });
    });

    // Apply initial theme on load
    document.addEventListener('DOMContentLoaded', function() {
        applyTheme('${previewTheme}');
    });
</script>
<style id="ditacraft-custom-css">
${customCss}
</style>
<style id="ditacraft-print-styles">
@media print {
    /* Hide toolbar and its spacer when printing */
    #ditacraft-toolbar,
    #ditacraft-toolbar-spacer {
        display: none !important;
    }

    /* Reset to print-friendly colors */
    body {
        background-color: white !important;
        color: black !important;
        font-size: 12pt !important;
        line-height: 1.5 !important;
        margin: 0 !important;
        padding: 20px !important;
    }

    /* Links should be visible but not colored */
    a {
        color: black !important;
        text-decoration: underline !important;
    }

    /* Code blocks with light background */
    code, pre {
        background-color: #f5f5f5 !important;
        border: 1px solid #ddd !important;
        color: black !important;
        page-break-inside: avoid;
    }

    /* Ensure images don't overflow and avoid page breaks */
    img {
        max-width: 100% !important;
        page-break-inside: avoid;
    }

    /* Headings - avoid orphaned headings */
    h1, h2, h3, h4, h5, h6 {
        color: black !important;
        page-break-after: avoid;
        page-break-inside: avoid;
    }

    /* Tables - avoid breaking inside rows */
    table {
        page-break-inside: auto;
    }
    tr {
        page-break-inside: avoid;
        page-break-after: auto;
    }
    thead {
        display: table-header-group;
    }

    /* Paragraphs and list items */
    p, li {
        orphans: 3;
        widows: 3;
    }

    /* Reset fixed/absolute positioning to static for proper print layout */
    [style*="position: fixed"],
    [style*="position:fixed"],
    [style*="position: absolute"],
    [style*="position:absolute"] {
        position: static !important;
    }

    /* Ensure content is visible */
    .hidden-print, .no-print {
        display: none !important;
    }
}
</style>`;

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
