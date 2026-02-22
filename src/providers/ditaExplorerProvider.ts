/**
 * DITA Explorer Tree View Provider
 * Shows all workspace DITA maps with expandable hierarchy in the activity bar.
 */

import * as vscode from 'vscode';
import {
    MapNode,
    findAllMapsInWorkspace,
    parseMapHierarchy
} from '../utils/mapHierarchyParser';
import { createDebounced } from '../utils/debounceUtils';
import { logger } from '../utils/logger';

const ICON_MAP: Record<MapNode['type'], vscode.ThemeIcon> = {
    map: new vscode.ThemeIcon('type-hierarchy'),
    chapter: new vscode.ThemeIcon('book'),
    topic: new vscode.ThemeIcon('file'),
    topicref: new vscode.ThemeIcon('file'),
    keydef: new vscode.ThemeIcon('key'),
    appendix: new vscode.ThemeIcon('file-add'),
    part: new vscode.ThemeIcon('folder'),
    unknown: new vscode.ThemeIcon('question')
};

/**
 * A tree item wrapping a MapNode for display in the DITA Explorer.
 */
export class DitaExplorerItem extends vscode.TreeItem {
    constructor(public readonly mapNode: MapNode) {
        const hasChildren = mapNode.children.length > 0;
        super(
            mapNode.label,
            hasChildren
                ? vscode.TreeItemCollapsibleState.Collapsed
                : vscode.TreeItemCollapsibleState.None
        );

        this.iconPath = mapNode.exists
            ? ICON_MAP[mapNode.type] || ICON_MAP.unknown
            : new vscode.ThemeIcon('warning');

        this.tooltip = this._buildTooltip();
        this.description = mapNode.href || mapNode.keyref || undefined;

        // Context value for menus (e.g. ditaMap-ditaFile, ditaTopic-ditaFile)
        if (mapNode.type === 'map') {
            this.contextValue = 'ditaMap-ditaFile';
        } else if (mapNode.type === 'keydef') {
            this.contextValue = 'ditaKeydef';
        } else {
            this.contextValue = 'ditaTopic-ditaFile';
        }

        // Click to open the file
        if (mapNode.filePath && mapNode.exists) {
            const fileUri = vscode.Uri.file(mapNode.filePath);
            this.command = {
                command: 'ditacraft.openFile',
                title: 'Open File',
                arguments: [fileUri]
            };
            this.resourceUri = fileUri;
        }
    }

    private _buildTooltip(): string {
        const parts: string[] = [this.mapNode.label];
        if (this.mapNode.type !== 'unknown') {
            parts.push(`Type: ${this.mapNode.type}`);
        }
        if (this.mapNode.href) {
            parts.push(`Href: ${this.mapNode.href}`);
        }
        if (this.mapNode.keys) {
            parts.push(`Keys: ${this.mapNode.keys}`);
        }
        if (this.mapNode.keyref) {
            parts.push(`Keyref: ${this.mapNode.keyref}`);
        }
        if (!this.mapNode.exists) {
            parts.push('(file not found)');
        }
        if (this.mapNode.hasErrors) {
            parts.push('(has errors)');
        }
        return parts.join('\n');
    }
}

/**
 * Tree data provider for the DITA Explorer view.
 */
export class DitaExplorerProvider implements vscode.TreeDataProvider<DitaExplorerItem>, vscode.Disposable {
    private readonly _onDidChangeTreeData = new vscode.EventEmitter<DitaExplorerItem | undefined | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private _disposables: vscode.Disposable[] = [];
    private _rootNodes: MapNode[] = [];

    constructor() {
        // Watch for DITA file changes to auto-refresh (debounced 500ms)
        const watcher = vscode.workspace.createFileSystemWatcher('**/*.{ditamap,bookmap,dita}');
        const debouncedRefresh = createDebounced<void>(
            () => { this.refresh(); },
            500
        );

        watcher.onDidCreate(() => debouncedRefresh.schedule(undefined!));
        watcher.onDidDelete(() => debouncedRefresh.schedule(undefined!));
        watcher.onDidChange(() => debouncedRefresh.schedule(undefined!));

        this._disposables.push(watcher, debouncedRefresh);
    }

    /**
     * Refresh the tree view data.
     */
    refresh(): void {
        this._rootNodes = [];
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: DitaExplorerItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: DitaExplorerItem): Promise<DitaExplorerItem[]> {
        if (element) {
            return element.mapNode.children.map(child => new DitaExplorerItem(child));
        }

        // Root level: find all maps and parse each
        try {
            const mapFiles = await findAllMapsInWorkspace();
            if (mapFiles.length === 0) {
                return [];
            }

            const results = await Promise.allSettled(
                mapFiles.map(mapFile => parseMapHierarchy(mapFile))
            );

            this._rootNodes = [];
            for (const result of results) {
                if (result.status === 'fulfilled') {
                    this._rootNodes.push(result.value);
                } else {
                    logger.warn('Failed to parse map for explorer', result.reason);
                }
            }

            return this._rootNodes.map(node => new DitaExplorerItem(node));
        } catch (error) {
            logger.error('Failed to load DITA maps for explorer', error);
            return [];
        }
    }

    dispose(): void {
        this._onDidChangeTreeData.dispose();
        for (const d of this._disposables) {
            d.dispose();
        }
        this._disposables = [];
    }
}
