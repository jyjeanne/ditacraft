/**
 * DITA Map Visualizer Panel
 * Provides a visual tree hierarchy of DITA maps and topics
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fsPromises from 'fs/promises';
import { logger } from '../utils/logger';

/**
 * Represents a node in the map visualization tree
 */
export interface MapNode {
    id: string;
    label: string;
    type: 'map' | 'topic' | 'chapter' | 'appendix' | 'part' | 'topicref' | 'keydef' | 'unknown';
    href?: string;
    filePath?: string;
    exists: boolean;
    hasErrors?: boolean;
    children: MapNode[];
    navtitle?: string;
    keys?: string;
}

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
        const mapTree = await this._parseMapFileAsync(this._mapFilePath);
        this._panel.webview.html = this._getHtmlContent(mapTree);
    }

    /**
     * Parse a DITA map file and return its tree structure
     * P1-1 Fix: Use async file operations
     */
    private async _parseMapFileAsync(mapFilePath: string): Promise<MapNode> {
        const mapDir = path.dirname(mapFilePath);
        const mapName = path.basename(mapFilePath);

        // Read and parse the map file asynchronously
        const content = await fsPromises.readFile(mapFilePath, 'utf-8');

        const rootNode: MapNode = {
            id: 'root',
            label: mapName,
            type: this._detectMapType(content),
            filePath: mapFilePath,
            href: mapName,
            exists: true,
            children: []
        };

        // Track visited files to prevent circular references
        const visitedFiles = new Set<string>([mapFilePath]);

        // Parse topicrefs and other references asynchronously
        rootNode.children = await this._parseReferencesAsync(content, mapDir, visitedFiles);

        return rootNode;
    }

    /**
     * Detect the type of DITA map (bookmap vs regular map)
     */
    private _detectMapType(content: string): MapNode['type'] {
        // Check for bookmap DOCTYPE or root element
        if (content.includes('<!DOCTYPE bookmap') || /<bookmap[\s>]/i.test(content)) {
            return 'map'; // Bookmaps use same icon as maps
        }
        return 'map';
    }

    /**
     * Parse topic references from map content
     * P1-1 Fix: Use async file operations
     * @param content - The XML content to parse
     * @param mapDir - The directory containing the map file
     * @param visitedFiles - Set of already visited file paths (for circular reference detection)
     */
    private async _parseReferencesAsync(content: string, mapDir: string, visitedFiles: Set<string>): Promise<MapNode[]> {
        const nodes: MapNode[] = [];

        // Element types to parse with their tag names
        const elementTypes: Array<{ tag: string; type: MapNode['type'] }> = [
            { tag: 'chapter', type: 'chapter' },
            { tag: 'appendix', type: 'appendix' },
            { tag: 'part', type: 'part' },
            { tag: 'topicref', type: 'topicref' },
            { tag: 'keydef', type: 'keydef' },
            { tag: 'mapref', type: 'map' }
        ];

        let nodeId = 0;

        for (const element of elementTypes) {
            // Match opening tags for this element type
            const tagRegex = new RegExp(`<${element.tag}\\b([^>]*)>`, 'gi');
            let match;

            while ((match = tagRegex.exec(content)) !== null) {
                const attributes = match[1];

                // Extract attributes separately to handle any order
                const href = this._extractAttribute(attributes, 'href');
                const navtitle = this._extractAttribute(attributes, 'navtitle');
                const keys = this._extractAttribute(attributes, 'keys');

                const node: MapNode = {
                    id: `node-${nodeId++}`,
                    label: navtitle || keys || (href ? path.basename(href) : 'Unknown'),
                    type: element.type,
                    href: href || undefined,
                    navtitle: navtitle || undefined,
                    keys: keys || undefined,
                    exists: true,
                    children: []
                };

                // Resolve full file path
                if (href) {
                    const fullPath = path.resolve(mapDir, href);
                    node.filePath = fullPath;

                    // Check if file exists asynchronously
                    try {
                        await fsPromises.access(fullPath);
                        node.exists = true;
                    } catch {
                        node.exists = false;
                    }

                    // If it's a map/ditamap, parse its children (but check for circular references)
                    if (node.exists && (href.endsWith('.ditamap') || href.endsWith('.bookmap') || element.type === 'map')) {
                        if (!visitedFiles.has(fullPath)) {
                            visitedFiles.add(fullPath);
                            try {
                                const subContent = await fsPromises.readFile(fullPath, 'utf-8');
                                node.children = await this._parseReferencesAsync(subContent, path.dirname(fullPath), visitedFiles);
                            } catch {
                                // Ignore errors parsing sub-maps
                            }
                        } else {
                            // Mark as circular reference
                            node.label = `${node.label} (circular ref)`;
                            node.hasErrors = true;
                        }
                    }
                }

                nodes.push(node);
            }
        }

        return nodes;
    }

    /**
     * Extract an attribute value from an attribute string
     */
    private _extractAttribute(attributes: string, name: string): string | null {
        const regex = new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, 'i');
        const match = attributes.match(regex);
        return match ? match[1] : null;
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
