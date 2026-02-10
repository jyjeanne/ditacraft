/**
 * DITA Map Visualizer Panel
 * Provides a visual tree hierarchy of DITA maps and topics
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { logger } from '../utils/logger';
import { parseMapHierarchy, type MapNode } from '../utils/mapHierarchyParser';

// Re-export MapNode for backward compatibility
export type { MapNode } from '../utils/mapHierarchyParser';

/**
 * MapVisualizerPanel - WebView panel showing DITA map hierarchy
 */
export class MapVisualizerPanel {
    public static currentPanel: MapVisualizerPanel | undefined;
    public static readonly viewType = 'ditacraft.mapVisualizer';

    private readonly _panel: vscode.WebviewPanel;
    private _mapFilePath: string;
    private _disposables: vscode.Disposable[] = [];

    private constructor(
        panel: vscode.WebviewPanel,
        _extensionUri: vscode.Uri,
        mapFilePath: string
    ) {
        this._panel = panel;
        this._mapFilePath = mapFilePath;

        // Set panel title with map name
        this._updateTitle();

        // Set initial content
        this._update();

        // Handle panel disposal
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Handle messages from webview
        this._panel.webview.onDidReceiveMessage(
            message => this._handleMessage(message),
            null,
            this._disposables
        );

        // Update when panel becomes visible
        this._panel.onDidChangeViewState(
            () => {
                if (this._panel.visible) {
                    this._update();
                }
            },
            null,
            this._disposables
        );
    }

    /**
     * Create or show the map visualizer panel
     */
    public static createOrShow(extensionUri: vscode.Uri, mapFilePath: string): void {
        const column = vscode.ViewColumn.Beside;

        // If panel exists, show it
        if (MapVisualizerPanel.currentPanel) {
            MapVisualizerPanel.currentPanel._mapFilePath = mapFilePath;
            MapVisualizerPanel.currentPanel._updateTitle();
            MapVisualizerPanel.currentPanel._panel.reveal(column);
            MapVisualizerPanel.currentPanel._update();
            return;
        }

        // Create new panel
        const panel = vscode.window.createWebviewPanel(
            MapVisualizerPanel.viewType,
            'DITA Map Visualizer',
            column,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [extensionUri]
            }
        );

        MapVisualizerPanel.currentPanel = new MapVisualizerPanel(panel, extensionUri, mapFilePath);
        logger.info('Map visualizer panel created', { mapFilePath });
    }

    /**
     * Update the panel title to show the map file name
     */
    private _updateTitle(): void {
        const mapName = path.basename(this._mapFilePath);
        this._panel.title = `Map: ${mapName}`;
    }

    /**
     * Dispose of the panel
     */
    public dispose(): void {
        MapVisualizerPanel.currentPanel = undefined;

        this._panel.dispose();

        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }

    /**
     * Handle messages from the webview
     */
    private async _handleMessage(message: { command: string; filePath?: string }): Promise<void> {
        switch (message.command) {
            case 'openFile':
                if (message.filePath) {
                    await this._openFile(message.filePath);
                }
                break;
            case 'refresh':
                this._update();
                break;
        }
    }

    /**
     * Open a file in the editor
     */
    private async _openFile(filePath: string): Promise<void> {
        try {
            const uri = vscode.Uri.file(filePath);
            const document = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(document, vscode.ViewColumn.One);
            logger.debug('Opened file from map visualizer', { filePath });
        } catch (error) {
            logger.error('Failed to open file from visualizer', error);
            vscode.window.showErrorMessage(`Could not open file: ${filePath}`);
        }
    }

    /**
     * Update the webview content
     * P1-1 Fix: Use async file operations
     */
    private _update(): void {
        this._updateAsync().catch(error => {
            logger.error('Failed to update map visualizer', error);
            this._panel.webview.html = this._getErrorHtml(error);
        });
    }

    /**
     * Update the webview content asynchronously
     */
    private async _updateAsync(): Promise<void> {
        const mapTree = await parseMapHierarchy(this._mapFilePath);
        this._panel.webview.html = this._getHtmlContent(mapTree);
    }

    /**
     * Generate HTML content for the webview
     */
    private _getHtmlContent(mapTree: MapNode): string {
        const treeHtml = this._renderTreeNode(mapTree);

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
    <title>DITA Map Visualizer</title>
    <style>
        :root {
            --bg-color: var(--vscode-editor-background);
            --text-color: var(--vscode-editor-foreground);
            --border-color: var(--vscode-panel-border);
            --hover-bg: var(--vscode-list-hoverBackground);
            --selected-bg: var(--vscode-list-activeSelectionBackground);
            --link-color: var(--vscode-textLink-foreground);
            --error-color: var(--vscode-errorForeground);
            --warning-color: var(--vscode-editorWarning-foreground);
        }

        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--text-color);
            background-color: var(--bg-color);
            padding: 16px;
            margin: 0;
        }

        .toolbar {
            display: flex;
            gap: 8px;
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--border-color);
        }

        .toolbar button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 6px 12px;
            cursor: pointer;
            border-radius: 2px;
        }

        .toolbar button:hover {
            background: var(--vscode-button-hoverBackground);
        }

        .tree {
            list-style: none;
            padding-left: 0;
            margin: 0;
        }

        .tree ul {
            list-style: none;
            padding-left: 20px;
            margin: 0;
        }

        .tree-node {
            padding: 4px 8px;
            cursor: pointer;
            border-radius: 3px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .tree-node:hover {
            background: var(--hover-bg);
        }

        .tree-node.missing {
            color: var(--error-color);
            text-decoration: line-through;
        }

        .tree-node.has-errors {
            color: var(--warning-color);
        }

        .icon {
            width: 16px;
            height: 16px;
            display: inline-block;
            text-align: center;
        }

        .icon-map::before { content: "📚"; }
        .icon-chapter::before { content: "📖"; }
        .icon-appendix::before { content: "📎"; }
        .icon-part::before { content: "📂"; }
        .icon-topic::before { content: "📄"; }
        .icon-topicref::before { content: "📄"; }
        .icon-keydef::before { content: "🔑"; }
        .icon-unknown::before { content: "❓"; }

        .node-label {
            flex: 1;
        }

        .node-href {
            font-size: 0.85em;
            opacity: 0.7;
            margin-left: 8px;
        }

        .node-keys {
            font-size: 0.85em;
            color: var(--link-color);
            margin-left: 8px;
        }

        .toggle {
            width: 16px;
            cursor: pointer;
            user-select: none;
        }

        .toggle.collapsed::before { content: "▶"; }
        .toggle.expanded::before { content: "▼"; }
        .toggle.empty { visibility: hidden; }

        .children {
            overflow: hidden;
        }

        .children.collapsed {
            display: none;
        }

        .legend {
            margin-top: 24px;
            padding-top: 16px;
            border-top: 1px solid var(--border-color);
            font-size: 0.9em;
        }

        .legend-item {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            margin-right: 16px;
        }
    </style>
</head>
<body>
    <div class="toolbar">
        <button onclick="refresh()">Refresh</button>
        <button onclick="expandAll()">Expand All</button>
        <button onclick="collapseAll()">Collapse All</button>
    </div>

    <ul class="tree">
        ${treeHtml}
    </ul>

    <div class="legend">
        <span class="legend-item"><span class="icon icon-map"></span> Map</span>
        <span class="legend-item"><span class="icon icon-part"></span> Part</span>
        <span class="legend-item"><span class="icon icon-chapter"></span> Chapter</span>
        <span class="legend-item"><span class="icon icon-appendix"></span> Appendix</span>
        <span class="legend-item"><span class="icon icon-topicref"></span> Topic</span>
        <span class="legend-item"><span class="icon icon-keydef"></span> Key</span>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        function openFile(filePath) {
            if (filePath) {
                vscode.postMessage({ command: 'openFile', filePath: filePath });
            }
        }

        function refresh() {
            vscode.postMessage({ command: 'refresh' });
        }

        function toggleNode(element) {
            const toggle = element.querySelector('.toggle');
            const children = element.querySelector('.children');

            if (toggle && children) {
                toggle.classList.toggle('collapsed');
                toggle.classList.toggle('expanded');
                children.classList.toggle('collapsed');
            }
        }

        function expandAll() {
            document.querySelectorAll('.toggle').forEach(t => {
                t.classList.remove('collapsed');
                t.classList.add('expanded');
            });
            document.querySelectorAll('.children').forEach(c => {
                c.classList.remove('collapsed');
            });
        }

        function collapseAll() {
            document.querySelectorAll('.toggle').forEach(t => {
                t.classList.remove('expanded');
                t.classList.add('collapsed');
            });
            document.querySelectorAll('.children').forEach(c => {
                c.classList.add('collapsed');
            });
        }
    </script>
</body>
</html>`;
    }

    /**
     * Render a tree node to HTML
     */
    private _renderTreeNode(node: MapNode): string {
        const hasChildren = node.children && node.children.length > 0;
        const toggleClass = hasChildren ? 'toggle expanded' : 'toggle empty';
        const nodeClasses = ['tree-node'];
        if (!node.exists) { nodeClasses.push('missing'); }
        if (node.hasErrors) { nodeClasses.push('has-errors'); }
        const nodeClass = nodeClasses.join(' ');
        const escapedPath = node.filePath ? node.filePath.replace(/\\/g, '\\\\').replace(/'/g, "\\'") : '';

        let childrenHtml = '';
        if (hasChildren) {
            const childNodes = node.children.map(child => this._renderTreeNode(child)).join('');
            childrenHtml = `<ul class="children">${childNodes}</ul>`;
        }

        const keysHtml = node.keys ? `<span class="node-keys">[${this._escapeHtml(node.keys)}]</span>` : '';
        const hrefHtml = node.href && !node.keys ? `<span class="node-href">${this._escapeHtml(node.href)}</span>` : '';

        return `
            <li onclick="event.stopPropagation(); toggleNode(this);">
                <div class="${nodeClass}" ondblclick="openFile('${escapedPath}')">
                    <span class="${toggleClass}"></span>
                    <span class="icon icon-${node.type}"></span>
                    <span class="node-label">${this._escapeHtml(node.label)}</span>
                    ${keysHtml}
                    ${hrefHtml}
                </div>
                ${childrenHtml}
            </li>
        `;
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

    /**
     * Generate error HTML content
     */
    private _getErrorHtml(error: unknown): string {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-errorForeground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
        }
        button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 6px 12px;
            cursor: pointer;
            border-radius: 2px;
            margin-top: 16px;
        }
        button:hover {
            background: var(--vscode-button-hoverBackground);
        }
    </style>
</head>
<body>
    <h2>Error Loading Map</h2>
    <p>${this._escapeHtml(message)}</p>
    <button onclick="acquireVsCodeApi().postMessage({ command: 'refresh' })">Retry</button>
</body>
</html>`;
    }
}
