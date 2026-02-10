/**
 * Diagnostics Tree View Provider
 * Aggregated DITA validation diagnostics with group-by-file or group-by-severity modes.
 */

import * as vscode from 'vscode';
import { createDebounced } from '../utils/debounceUtils';
import { isDitaFilePath } from '../utils/constants';

const DITA_SOURCES = new Set(['dita', 'dita-lsp', 'ditacraft-keys']);

type GroupMode = 'byFile' | 'byType';

function isDitaUri(uri: vscode.Uri): boolean {
    return isDitaFilePath(uri.fsPath);
}

/**
 * Tree item for the Diagnostics view.
 */
export class DiagnosticItem extends vscode.TreeItem {
    constructor(
        label: string,
        collapsible: vscode.TreeItemCollapsibleState,
        public readonly children?: DiagnosticItem[],
        public readonly diagnosticUri?: vscode.Uri,
        public readonly diagnostic?: vscode.Diagnostic
    ) {
        super(label, collapsible);

        if (diagnostic && diagnosticUri) {
            this.command = {
                command: 'vscode.open',
                title: 'Go to Diagnostic',
                arguments: [diagnosticUri, { selection: diagnostic.range }]
            };
            this.resourceUri = diagnosticUri;

            switch (diagnostic.severity) {
                case vscode.DiagnosticSeverity.Error:
                    this.iconPath = new vscode.ThemeIcon('error', new vscode.ThemeColor('list.errorForeground'));
                    break;
                case vscode.DiagnosticSeverity.Warning:
                    this.iconPath = new vscode.ThemeIcon('warning', new vscode.ThemeColor('list.warningForeground'));
                    break;
                case vscode.DiagnosticSeverity.Information:
                    this.iconPath = new vscode.ThemeIcon('info');
                    break;
                default:
                    this.iconPath = new vscode.ThemeIcon('circle-outline');
                    break;
            }

            this.description = `line ${diagnostic.range.start.line + 1}`;
            this.tooltip = `${diagnostic.message}\n\nSource: ${diagnostic.source || 'unknown'}\nLine: ${diagnostic.range.start.line + 1}`;
        }
    }
}

/**
 * Tree data provider for the Diagnostics view.
 */
export class DiagnosticsViewProvider implements vscode.TreeDataProvider<DiagnosticItem>, vscode.Disposable {
    private readonly _onDidChangeTreeData = new vscode.EventEmitter<DiagnosticItem | undefined | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private _disposables: vscode.Disposable[] = [];
    private _groupMode: GroupMode = 'byFile';

    constructor() {
        const debouncedRefresh = createDebounced<void>(
            () => { this._onDidChangeTreeData.fire(); },
            300
        );

        const diagListener = vscode.languages.onDidChangeDiagnostics(() => {
            debouncedRefresh.schedule(undefined!);
        });

        this._disposables.push(diagListener, debouncedRefresh);
    }

    setGroupMode(mode: GroupMode): void {
        this._groupMode = mode;
        this._onDidChangeTreeData.fire();
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: DiagnosticItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: DiagnosticItem): Promise<DiagnosticItem[]> {
        if (element) {
            return element.children || [];
        }

        const allDiagnostics = this._collectDitaDiagnostics();
        if (allDiagnostics.length === 0) {
            return [];
        }

        return this._groupMode === 'byFile'
            ? this._groupByFile(allDiagnostics)
            : this._groupByType(allDiagnostics);
    }

    private _collectDitaDiagnostics(): Array<{ uri: vscode.Uri; diagnostic: vscode.Diagnostic }> {
        const result: Array<{ uri: vscode.Uri; diagnostic: vscode.Diagnostic }> = [];

        for (const [uri, diagnostics] of vscode.languages.getDiagnostics()) {
            if (!isDitaUri(uri)) { continue; }

            for (const d of diagnostics) {
                if (!d.source || DITA_SOURCES.has(d.source)) {
                    result.push({ uri, diagnostic: d });
                }
            }
        }

        return result;
    }

    private _groupByFile(items: Array<{ uri: vscode.Uri; diagnostic: vscode.Diagnostic }>): DiagnosticItem[] {
        const byFile = new Map<string, Array<{ uri: vscode.Uri; diagnostic: vscode.Diagnostic }>>();

        for (const item of items) {
            const key = item.uri.fsPath;
            const list = byFile.get(key);
            if (list) {
                list.push(item);
            } else {
                byFile.set(key, [item]);
            }
        }

        const groups: DiagnosticItem[] = [];
        for (const [filePath, fileItems] of byFile) {
            const fileName = filePath.replace(/.*[/\\]/, '');
            const children = fileItems.map(fi =>
                new DiagnosticItem(
                    fi.diagnostic.message,
                    vscode.TreeItemCollapsibleState.None,
                    undefined,
                    fi.uri,
                    fi.diagnostic
                )
            );

            const errors = fileItems.filter(fi => fi.diagnostic.severity === vscode.DiagnosticSeverity.Error).length;
            const warnings = fileItems.filter(fi => fi.diagnostic.severity === vscode.DiagnosticSeverity.Warning).length;

            const group = new DiagnosticItem(
                `${fileName} (${fileItems.length})`,
                vscode.TreeItemCollapsibleState.Expanded,
                children
            );
            group.resourceUri = fileItems[0].uri;
            group.iconPath = errors > 0
                ? new vscode.ThemeIcon('file', new vscode.ThemeColor('list.errorForeground'))
                : warnings > 0
                    ? new vscode.ThemeIcon('file', new vscode.ThemeColor('list.warningForeground'))
                    : new vscode.ThemeIcon('file');
            group.description = [
                errors > 0 ? `${errors} error${errors > 1 ? 's' : ''}` : '',
                warnings > 0 ? `${warnings} warning${warnings > 1 ? 's' : ''}` : ''
            ].filter(Boolean).join(', ');

            groups.push(group);
        }

        return groups;
    }

    private _groupByType(items: Array<{ uri: vscode.Uri; diagnostic: vscode.Diagnostic }>): DiagnosticItem[] {
        const errors: DiagnosticItem[] = [];
        const warnings: DiagnosticItem[] = [];
        const info: DiagnosticItem[] = [];
        const hints: DiagnosticItem[] = [];

        for (const item of items) {
            const fileName = item.uri.fsPath.replace(/.*[/\\]/, '');
            const di = new DiagnosticItem(
                `${fileName}: ${item.diagnostic.message}`,
                vscode.TreeItemCollapsibleState.None,
                undefined,
                item.uri,
                item.diagnostic
            );

            switch (item.diagnostic.severity) {
                case vscode.DiagnosticSeverity.Error: errors.push(di); break;
                case vscode.DiagnosticSeverity.Warning: warnings.push(di); break;
                case vscode.DiagnosticSeverity.Information: info.push(di); break;
                default: hints.push(di); break;
            }
        }

        const groups: DiagnosticItem[] = [];

        if (errors.length > 0) {
            const g = new DiagnosticItem(
                `Errors (${errors.length})`,
                vscode.TreeItemCollapsibleState.Expanded,
                errors
            );
            g.iconPath = new vscode.ThemeIcon('error', new vscode.ThemeColor('list.errorForeground'));
            groups.push(g);
        }

        if (warnings.length > 0) {
            const g = new DiagnosticItem(
                `Warnings (${warnings.length})`,
                vscode.TreeItemCollapsibleState.Expanded,
                warnings
            );
            g.iconPath = new vscode.ThemeIcon('warning', new vscode.ThemeColor('list.warningForeground'));
            groups.push(g);
        }

        if (info.length > 0) {
            const g = new DiagnosticItem(
                `Information (${info.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                info
            );
            g.iconPath = new vscode.ThemeIcon('info');
            groups.push(g);
        }

        if (hints.length > 0) {
            const g = new DiagnosticItem(
                `Hints (${hints.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                hints
            );
            g.iconPath = new vscode.ThemeIcon('circle-outline');
            groups.push(g);
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
