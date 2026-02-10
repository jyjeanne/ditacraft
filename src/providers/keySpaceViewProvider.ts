/**
 * Key Space Tree View Provider
 * Shows all DITA keys grouped by status: Defined, Undefined (used but not defined), Unused (defined but not used).
 */

import * as vscode from 'vscode';
import { getGlobalKeySpaceResolver } from './ditaLinkProvider';
import { KeyDefinition, KeySpace } from '../utils/keySpaceResolver';
import { scanKeyUsages, KeyUsage } from '../utils/keyUsageScanner';
import { findAllMapsInWorkspace } from '../utils/mapHierarchyParser';
import { createDebounced } from '../utils/debounceUtils';
import { logger } from '../utils/logger';

type ItemKind = 'group' | 'key' | 'usage';

/**
 * Tree item for the Key Space view.
 */
export class KeySpaceItem extends vscode.TreeItem {
    constructor(
        label: string,
        public readonly kind: ItemKind,
        collapsible: vscode.TreeItemCollapsibleState,
        public readonly keyName?: string,
        public readonly keyDef?: KeyDefinition,
        public readonly usage?: KeyUsage,
        public readonly children?: KeySpaceItem[]
    ) {
        super(label, collapsible);

        switch (kind) {
            case 'group':
                this.iconPath = new vscode.ThemeIcon('symbol-folder');
                this.contextValue = 'keyGroup';
                break;
            case 'key':
                this.iconPath = new vscode.ThemeIcon('key');
                this.contextValue = 'keyItem';
                if (keyDef?.targetFile) {
                    this.description = keyDef.targetFile.replace(/.*[/\\]/, '');
                    this.command = {
                        command: 'vscode.open',
                        title: 'Go to Definition',
                        arguments: [vscode.Uri.file(keyDef.sourceMap)]
                    };
                } else if (keyDef?.inlineContent) {
                    this.description = '(inline)';
                }
                this.tooltip = this._buildKeyTooltip();
                break;
            case 'usage':
                if (usage) {
                    this.iconPath = new vscode.ThemeIcon('references');
                    this.description = `${usage.type} — line ${usage.range.start.line + 1}`;
                    this.contextValue = 'keyUsage';
                    this.command = {
                        command: 'vscode.open',
                        title: 'Go to Usage',
                        arguments: [usage.uri, { selection: usage.range }]
                    };
                    this.resourceUri = usage.uri;
                }
                break;
        }
    }

    private _buildKeyTooltip(): string {
        if (!this.keyDef) { return this.keyName || ''; }
        const parts: string[] = [`Key: ${this.keyName}`];
        if (this.keyDef.targetFile) { parts.push(`Target: ${this.keyDef.targetFile}`); }
        if (this.keyDef.inlineContent) { parts.push(`Content: ${this.keyDef.inlineContent}`); }
        parts.push(`Source: ${this.keyDef.sourceMap.replace(/.*[/\\]/, '')}`);
        if (this.keyDef.scope) { parts.push(`Scope: ${this.keyDef.scope}`); }
        return parts.join('\n');
    }
}

/**
 * Tree data provider for the Key Space view.
 */
export class KeySpaceViewProvider implements vscode.TreeDataProvider<KeySpaceItem>, vscode.Disposable {
    private readonly _onDidChangeTreeData = new vscode.EventEmitter<KeySpaceItem | undefined | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private _disposables: vscode.Disposable[] = [];
    private _cachedItems: KeySpaceItem[] | undefined;

    constructor() {
        // Watch for map file changes to auto-refresh (debounced 1000ms — key space rebuild is expensive)
        const watcher = vscode.workspace.createFileSystemWatcher('**/*.{ditamap,bookmap}');
        const debouncedRefresh = createDebounced<void>(
            () => { this.refresh(); },
            1000
        );

        watcher.onDidChange(() => debouncedRefresh.schedule(undefined!));
        watcher.onDidCreate(() => debouncedRefresh.schedule(undefined!));
        watcher.onDidDelete(() => debouncedRefresh.schedule(undefined!));
        this._disposables.push(watcher, debouncedRefresh);
    }

    refresh(): void {
        this._cachedItems = undefined;
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: KeySpaceItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: KeySpaceItem): Promise<KeySpaceItem[]> {
        if (element) {
            return element.children || [];
        }

        // Root: compute groups
        if (this._cachedItems) {
            return this._cachedItems;
        }

        try {
            this._cachedItems = await this._buildTree();
            return this._cachedItems;
        } catch (error) {
            logger.error('Failed to build key space tree', error);
            return [];
        }
    }

    private async _buildTree(): Promise<KeySpaceItem[]> {
        const resolver = getGlobalKeySpaceResolver();
        const mapFiles = await findAllMapsInWorkspace();

        // Build key spaces for all root maps
        const allKeys = new Map<string, KeyDefinition>();
        for (const mapFile of mapFiles) {
            try {
                const keySpace: KeySpace = await resolver.buildKeySpace(mapFile);
                for (const [name, def] of keySpace.keys) {
                    if (!allKeys.has(name)) {
                        allKeys.set(name, def);
                    }
                }
            } catch {
                // Skip maps that fail to parse
            }
        }

        // Scan for usages
        const usages = await scanKeyUsages();

        // Categorize keys
        const definedKeys = new Set(allKeys.keys());
        const usedKeys = new Set(usages.keys());

        const defined: KeySpaceItem[] = [];
        const undefinedKeys: KeySpaceItem[] = [];
        const unused: KeySpaceItem[] = [];

        // Defined & used keys
        for (const [keyName, keyDef] of allKeys) {
            const keyUsages = usages.get(keyName);
            const usageItems = keyUsages?.map(u =>
                new KeySpaceItem(
                    u.uri.fsPath.replace(/.*[/\\]/, ''),
                    'usage',
                    vscode.TreeItemCollapsibleState.None,
                    keyName,
                    undefined,
                    u
                )
            ) || [];

            const collapsible = usageItems.length > 0
                ? vscode.TreeItemCollapsibleState.Collapsed
                : vscode.TreeItemCollapsibleState.None;

            const item = new KeySpaceItem(
                keyName,
                'key',
                collapsible,
                keyName,
                keyDef,
                undefined,
                usageItems
            );

            if (usedKeys.has(keyName)) {
                defined.push(item);
            } else {
                unused.push(item);
            }
        }

        // Undefined keys (used but not defined)
        for (const [keyName, keyUsages] of usages) {
            if (definedKeys.has(keyName)) { continue; }

            const usageItems = keyUsages.map(u =>
                new KeySpaceItem(
                    u.uri.fsPath.replace(/.*[/\\]/, ''),
                    'usage',
                    vscode.TreeItemCollapsibleState.None,
                    keyName,
                    undefined,
                    u
                )
            );

            const item = new KeySpaceItem(
                keyName,
                'key',
                vscode.TreeItemCollapsibleState.Collapsed,
                keyName,
                undefined,
                undefined,
                usageItems
            );
            item.iconPath = new vscode.ThemeIcon('warning');
            undefinedKeys.push(item);
        }

        const groups: KeySpaceItem[] = [];

        if (defined.length > 0) {
            groups.push(new KeySpaceItem(
                `Defined Keys (${defined.length})`,
                'group',
                vscode.TreeItemCollapsibleState.Expanded,
                undefined,
                undefined,
                undefined,
                defined
            ));
        }

        if (undefinedKeys.length > 0) {
            groups.push(new KeySpaceItem(
                `Undefined Keys (${undefinedKeys.length})`,
                'group',
                vscode.TreeItemCollapsibleState.Expanded,
                undefined,
                undefined,
                undefined,
                undefinedKeys
            ));
        }

        if (unused.length > 0) {
            groups.push(new KeySpaceItem(
                `Unused Keys (${unused.length})`,
                'group',
                vscode.TreeItemCollapsibleState.Collapsed,
                undefined,
                undefined,
                undefined,
                unused
            ));
        }

        return groups;
    }

    dispose(): void {
        this._onDidChangeTreeData.dispose();
        for (const d of this._disposables) {
            d.dispose();
        }
        this._disposables = [];
    }
}
