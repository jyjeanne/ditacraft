/**
 * Validation Report WebView Panel
 * Displays DITA-OT guide validation results in a structured report.
 * Singleton panel with file navigation, filtering, search, and export.
 */

import * as vscode from 'vscode';
import { getDitaOtOutputChannel } from '../utils/ditaOtOutputChannel';

// ── Data Models ──────────────────────────────────────────────

export interface ValidationReport {
    rootMap: string;
    rootMapAbsolute: string;
    ditaOtVersion: string;
    transtype: string;
    timestamp: string;
    duration: number;
    success: boolean;
    summary: {
        errors: number;
        warnings: number;
        info: number;
        total: number;
        filesAffected: number;
    };
    issues: ValidationIssue[];
}

export interface ValidationIssue {
    severity: 'error' | 'warning' | 'info';
    code: string;
    message: string;
    file?: string;
    absolutePath?: string;
    line?: number;
    column?: number;
    /** Human-readable description from DITA-OT error catalog */
    description?: string;
    /** Module that produced this error (Core, Processing, Transform, etc.) */
    module?: string;
}

// ── Panel Class ──────────────────────────────────────────────

export class ValidationReportPanel {
    public static readonly viewType = 'ditacraftValidationReport';

    public static currentPanel: ValidationReportPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _report: ValidationReport;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(
        extensionUri: vscode.Uri,
        report: ValidationReport
    ): ValidationReportPanel {
        if (ValidationReportPanel.currentPanel) {
            ValidationReportPanel.currentPanel._panel.reveal(vscode.ViewColumn.Beside);
            ValidationReportPanel.currentPanel.update(report);
            return ValidationReportPanel.currentPanel;
        }

        const panel = vscode.window.createWebviewPanel(
            ValidationReportPanel.viewType,
            'DITA Guide Validation Report',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [extensionUri],
            }
        );

        ValidationReportPanel.currentPanel = new ValidationReportPanel(
            panel, extensionUri, report
        );
        return ValidationReportPanel.currentPanel;
    }

    private constructor(
        panel: vscode.WebviewPanel,
        _extensionUri: vscode.Uri,
        report: ValidationReport
    ) {
        this._panel = panel;
        this._report = report;

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Note: No onDidChangeViewState handler here — retainContextWhenHidden: true
        // preserves the webview DOM (including filter/search/collapsed state) when the
        // panel loses focus. Re-rendering would destroy that state.

        this._panel.webview.onDidReceiveMessage(
            message => this._handleMessage(message),
            null,
            this._disposables
        );

        this.update(report);
    }

    public dispose(): void {
        ValidationReportPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const d = this._disposables.pop();
            d?.dispose();
        }
    }

    public update(report: ValidationReport): void {
        this._report = report;
        this._panel.title = `Validation: ${report.rootMap}`;
        this._panel.webview.html = this._getHtmlForWebview(report);
    }

    // ── Message Handling ─────────────────────────────────────

    private async _handleMessage(message: {
        command: string;
        path?: string;
        line?: number;
        column?: number;
        text?: string;
    }): Promise<void> {
        switch (message.command) {
            case 'openFile': {
                if (!message.path) { break; }
                try {
                    const uri = vscode.Uri.file(message.path);
                    const doc = await vscode.workspace.openTextDocument(uri);
                    const line = Math.max(0, (message.line ?? 1) - 1);
                    const col = Math.max(0, (message.column ?? 1) - 1);
                    const pos = new vscode.Position(line, col);
                    await vscode.window.showTextDocument(doc, {
                        selection: new vscode.Range(pos, pos),
                        viewColumn: vscode.ViewColumn.One,
                    });
                } catch {
                    vscode.window.showWarningMessage(
                        `Could not open file: ${message.path}`
                    );
                }
                break;
            }
            case 'exportReport': {
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri;
                const defaultUri = workspaceFolder
                    ? vscode.Uri.joinPath(workspaceFolder, 'validation-report.json')
                    : vscode.Uri.file('validation-report.json');
                const uri = await vscode.window.showSaveDialog({
                    defaultUri,
                    filters: { 'JSON': ['json'] },
                });
                if (uri) {
                    await vscode.workspace.fs.writeFile(uri,
                        Buffer.from(JSON.stringify(this._report, null, 2)));
                    vscode.window.showInformationMessage(
                        `Report exported to ${vscode.workspace.asRelativePath(uri)}`
                    );
                }
                break;
            }
            case 'viewBuildOutput': {
                getDitaOtOutputChannel().show(false);
                break;
            }
            case 'rerunValidation': {
                await vscode.commands.executeCommand('ditacraft.validateGuide');
                break;
            }
            case 'copyIssue': {
                if (message.text) {
                    await vscode.env.clipboard.writeText(message.text);
                }
                break;
            }
        }
    }

    // ── HTML Generation ──────────────────────────────────────

    private _getHtmlForWebview(report: ValidationReport): string {
        const nonce = this._getNonce();
        const webview = this._panel.webview;

        const reportJson = JSON.stringify(report)
            .replace(/</g, '\\u003c')
            .replace(/>/g, '\\u003e')
            .replace(/&/g, '\\u0026');

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy"
          content="default-src 'none';
                   style-src ${webview.cspSource} 'nonce-${nonce}';
                   script-src 'nonce-${nonce}';">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style nonce="${nonce}">
        :root {
            --bg: var(--vscode-editor-background);
            --fg: var(--vscode-editor-foreground);
            --border: var(--vscode-panel-border);
            --hover: var(--vscode-list-hoverBackground);
            --link: var(--vscode-textLink-foreground);
            --btn-bg: var(--vscode-button-background);
            --btn-fg: var(--vscode-button-foreground);
            --btn-hover: var(--vscode-button-hoverBackground);
            --badge-bg: var(--vscode-badge-background);
            --badge-fg: var(--vscode-badge-foreground);
            --input-bg: var(--vscode-input-background);
            --input-fg: var(--vscode-input-foreground);
            --input-border: var(--vscode-input-border);
            --error-fg: var(--vscode-errorForeground, #f44747);
            --warning-fg: var(--vscode-editorWarning-foreground, #cca700);
            --info-fg: var(--vscode-editorInfo-foreground, #3794ff);
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--fg);
            background: var(--bg);
            padding: 16px;
            line-height: 1.5;
        }
        h1 { font-size: 1.4em; margin-bottom: 4px; }
        .meta { opacity: 0.7; font-size: 0.9em; margin-bottom: 16px; }

        /* Summary cards */
        .summary {
            display: flex; gap: 12px; flex-wrap: wrap;
            margin-bottom: 16px;
        }
        .card {
            padding: 12px 20px; border-radius: 6px;
            text-align: center; min-width: 90px;
            background: var(--hover);
        }
        .card .count { font-size: 1.8em; font-weight: bold; display: block; }
        .card .label { font-size: 0.85em; opacity: 0.8; }
        .card.error .count { color: var(--error-fg); }
        .card.warning .count { color: var(--warning-fg); }
        .card.info .count { color: var(--info-fg); }

        /* Toolbar */
        .toolbar {
            display: flex; gap: 8px; align-items: center;
            flex-wrap: wrap; margin-bottom: 16px;
            padding-bottom: 12px; border-bottom: 1px solid var(--border);
        }
        .filter-btn {
            padding: 4px 12px; border: 1px solid var(--border);
            background: transparent; color: var(--fg);
            border-radius: 4px; cursor: pointer; font-size: 0.85em;
        }
        .filter-btn.active {
            background: var(--btn-bg); color: var(--btn-fg);
            border-color: var(--btn-bg);
        }
        .filter-btn:hover:not(.active) { background: var(--hover); }
        .search-input {
            padding: 4px 8px; border: 1px solid var(--input-border);
            background: var(--input-bg); color: var(--input-fg);
            border-radius: 4px; font-size: 0.85em; flex: 1;
            min-width: 150px; max-width: 300px;
        }
        .search-input:focus { outline: 1px solid var(--link); }
        .toolbar-spacer { flex: 1; }
        .group-btn {
            padding: 4px 10px; border: 1px solid var(--border);
            background: transparent; color: var(--fg);
            border-radius: 4px; cursor: pointer; font-size: 0.8em;
        }
        .group-btn.active {
            background: var(--btn-bg); color: var(--btn-fg);
            border-color: var(--btn-bg);
        }
        .group-btn:hover:not(.active) { background: var(--hover); }

        /* Issue groups */
        .group-header {
            display: flex; align-items: center; gap: 8px;
            padding: 8px 12px; margin-top: 8px;
            background: var(--hover); border-radius: 4px;
            cursor: pointer; user-select: none;
        }
        .group-header:hover { opacity: 0.9; }
        .group-toggle { font-size: 0.8em; width: 16px; }
        .group-name { font-weight: 600; flex: 1; }
        .group-count {
            font-size: 0.8em; padding: 2px 8px;
            background: var(--badge-bg); color: var(--badge-fg);
            border-radius: 10px;
        }
        .group-body { padding-left: 4px; }
        .group-body.collapsed { display: none; }

        /* Issue rows */
        .issue {
            display: flex; gap: 10px; align-items: flex-start;
            padding: 8px 12px; border-bottom: 1px solid var(--border);
        }
        .issue:hover { background: var(--hover); }
        .issue .sev-icon {
            width: 10px; height: 10px; border-radius: 50%;
            margin-top: 5px; flex-shrink: 0;
        }
        .sev-icon.error { background: var(--error-fg); }
        .sev-icon.warning { background: var(--warning-fg); }
        .sev-icon.info { background: var(--info-fg); }
        .issue-main { flex: 1; min-width: 0; }
        .issue-header {
            display: flex; gap: 6px; align-items: baseline;
            flex-wrap: wrap;
        }
        .issue .code {
            font-family: var(--vscode-editor-font-family, monospace);
            font-size: 0.8em; padding: 1px 6px;
            background: var(--badge-bg); color: var(--badge-fg);
            border-radius: 3px; white-space: nowrap;
            cursor: help;
        }
        .module-badge {
            font-size: 0.7em; padding: 1px 5px;
            border: 1px solid var(--border); border-radius: 3px;
            opacity: 0.7; white-space: nowrap;
        }
        .issue .msg { word-break: break-word; }
        .issue-desc {
            font-size: 0.85em; opacity: 0.65; margin-top: 2px;
            padding-left: 2px; font-style: italic;
        }
        .issue .loc {
            font-size: 0.85em; opacity: 0.7;
            white-space: nowrap;
        }
        .issue .file-link {
            color: var(--link); cursor: pointer;
            text-decoration: underline;
        }
        .issue .file-link:hover { opacity: 0.8; }
        .issue .copy-btn {
            background: transparent; border: 1px solid var(--border);
            color: var(--fg); cursor: pointer; padding: 2px 6px;
            border-radius: 3px; font-size: 0.75em; opacity: 0.6;
        }
        .issue .copy-btn:hover { opacity: 1; background: var(--hover); }

        /* Footer */
        .footer {
            margin-top: 16px; padding-top: 12px;
            border-top: 1px solid var(--border);
            display: flex; gap: 8px; align-items: center;
            flex-wrap: wrap;
        }
        .footer .status {
            font-weight: 600; margin-right: auto;
        }
        .footer .status.success { color: #89d185; }
        .footer .status.failure { color: var(--error-fg); }
        .footer-btn {
            padding: 6px 14px; border: none;
            background: var(--btn-bg); color: var(--btn-fg);
            border-radius: 4px; cursor: pointer; font-size: 0.85em;
        }
        .footer-btn:hover { background: var(--btn-hover); }
        .footer-btn.secondary {
            background: transparent; border: 1px solid var(--border);
            color: var(--fg);
        }
        .footer-btn.secondary:hover { background: var(--hover); }

        /* Success state */
        .success-banner {
            text-align: center; padding: 40px 20px;
        }
        .success-banner .check {
            font-size: 3em; color: #89d185;
        }
        .success-banner h2 { margin: 12px 0 8px; }
        .success-banner .detail { opacity: 0.7; }

        /* Hidden */
        .hidden { display: none !important; }
    </style>
</head>
<body>
    <div id="app"></div>
    <script nonce="${nonce}">
    (function() {
        const vscode = acquireVsCodeApi();
        const report = ${reportJson};
        const app = document.getElementById('app');

        let activeFilter = 'all';
        let searchQuery = '';
        let groupBy = 'file';
        let collapsedGroups = new Set();

        function esc(str) {
            const d = document.createElement('div');
            d.textContent = str;
            return d.innerHTML.replace(/"/g, '&quot;');
        }

        function formatDuration(ms) {
            return ms >= 1000 ? (ms / 1000).toFixed(1) + 's' : ms + 'ms';
        }

        function formatTime(iso) {
            try { return new Date(iso).toLocaleString(); }
            catch { return iso; }
        }

        function getFilteredIssues() {
            return report.issues.filter(issue => {
                if (activeFilter !== 'all' && issue.severity !== activeFilter) return false;
                if (searchQuery) {
                    const q = searchQuery.toLowerCase();
                    const hay = (issue.message + ' ' + (issue.code || '') + ' ' + (issue.file || '')
                        + ' ' + (issue.description || '') + ' ' + (issue.module || '')).toLowerCase();
                    if (!hay.includes(q)) return false;
                }
                return true;
            });
        }

        function groupIssues(issues) {
            const groups = new Map();
            for (const issue of issues) {
                let key;
                if (groupBy === 'file') key = issue.file || '(no file)';
                else if (groupBy === 'module') key = issue.module || 'Unknown';
                else key = issue.severity;
                if (!groups.has(key)) groups.set(key, []);
                groups.get(key).push(issue);
            }
            // Sort: errors-first for file groups, alphabetical otherwise
            if (groupBy === 'file') {
                return new Map([...groups.entries()].sort((a, b) => {
                    const aHasErr = a[1].some(i => i.severity === 'error');
                    const bHasErr = b[1].some(i => i.severity === 'error');
                    if (aHasErr !== bHasErr) return aHasErr ? -1 : 1;
                    return a[0].localeCompare(b[0]);
                }));
            }
            if (groupBy === 'severity') {
                const order = ['error', 'warning', 'info'];
                return new Map([...groups.entries()].sort((a, b) =>
                    order.indexOf(a[0]) - order.indexOf(b[0])
                ));
            }
            // module grouping: alphabetical
            return new Map([...groups.entries()].sort((a, b) => a[0].localeCompare(b[0])));
        }

        function render() {
            if (report.issues.length === 0 && report.success) {
                app.innerHTML = renderSuccessState();
                bindFooterEvents();
                return;
            }

            const filtered = getFilteredIssues();
            const grouped = groupIssues(filtered);

            // Auto-collapse: groups with only warnings/info start collapsed
            if (collapsedGroups.size === 0 && groupBy === 'file') {
                for (const [key, issues] of grouped) {
                    const hasError = issues.some(i => i.severity === 'error');
                    if (!hasError) collapsedGroups.add(key);
                }
            }

            let html = '';
            html += '<h1>DITA Guide Validation Report</h1>';
            html += '<div class="meta">'
                + esc(report.rootMap) + ' &middot; DITA-OT ' + esc(report.ditaOtVersion)
                + ' &middot; ' + esc(report.transtype)
                + ' &middot; ' + formatTime(report.timestamp)
                + ' &middot; ' + formatDuration(report.duration)
                + '</div>';

            // Summary cards
            html += '<div class="summary">';
            html += renderCard('error', report.summary.errors, 'Errors');
            html += renderCard('warning', report.summary.warnings, 'Warnings');
            html += renderCard('info', report.summary.info, 'Info');
            html += renderCard('', report.summary.filesAffected, 'Files');
            html += '</div>';

            // Toolbar
            html += '<div class="toolbar">';
            html += renderFilterBtn('all', 'All (' + report.summary.total + ')');
            html += renderFilterBtn('error', 'Errors (' + report.summary.errors + ')');
            html += renderFilterBtn('warning', 'Warnings (' + report.summary.warnings + ')');
            html += renderFilterBtn('info', 'Info (' + report.summary.info + ')');
            html += '<input class="search-input" type="text" placeholder="Search..." value="' + esc(searchQuery) + '" id="searchInput">';
            html += '<span class="toolbar-spacer"></span>';
            html += '<button class="group-btn' + (groupBy === 'file' ? ' active' : '') + '" data-group="file">By File</button>';
            html += '<button class="group-btn' + (groupBy === 'severity' ? ' active' : '') + '" data-group="severity">By Severity</button>';
            html += '<button class="group-btn' + (groupBy === 'module' ? ' active' : '') + '" data-group="module">By Module</button>';
            html += '</div>';

            // Groups
            if (filtered.length === 0) {
                html += '<p style="padding:20px;opacity:0.6;text-align:center;">No issues match the current filter.</p>';
            } else {
                for (const [key, issues] of grouped) {
                    const isCollapsed = collapsedGroups.has(key);
                    html += '<div class="group-header" data-key="' + esc(key) + '">';
                    html += '<span class="group-toggle">' + (isCollapsed ? '&#9654;' : '&#9660;') + '</span>';
                    html += '<span class="group-name">' + esc(key) + '</span>';
                    html += '<span class="group-count">' + issues.length + ' issue' + (issues.length !== 1 ? 's' : '') + '</span>';
                    html += '</div>';
                    html += '<div class="group-body' + (isCollapsed ? ' collapsed' : '') + '" data-key="' + esc(key) + '">';
                    for (const issue of issues) {
                        html += renderIssue(issue);
                    }
                    html += '</div>';
                }
            }

            // Footer
            html += renderFooter();
            app.innerHTML = html;
            bindEvents();
        }

        function renderCard(cls, count, label) {
            return '<div class="card ' + cls + '">'
                + '<span class="count">' + count + '</span>'
                + '<span class="label">' + label + '</span></div>';
        }

        function renderFilterBtn(value, text) {
            return '<button class="filter-btn' + (activeFilter === value ? ' active' : '')
                + '" data-filter="' + value + '">' + text + '</button>';
        }

        function renderIssue(issue) {
            let loc = '';
            if (issue.file) {
                loc = '<span class="file-link" data-path="' + esc(issue.absolutePath || '')
                    + '" data-line="' + (issue.line || '') + '" data-col="' + (issue.column || '')
                    + '">' + esc(issue.file) + '</span>';
                if (issue.line) loc += ':' + issue.line;
                if (issue.column) loc += ':' + issue.column;
            }
            const copyText = '[' + issue.code + '] ' + issue.message
                + (issue.file ? ' (' + issue.file + (issue.line ? ':' + issue.line : '') + ')' : '');

            const desc = issue.description
                ? '<div class="issue-desc">' + esc(issue.description) + '</div>'
                : '';
            const modBadge = issue.module
                ? '<span class="module-badge">' + esc(issue.module) + '</span>'
                : '';

            return '<div class="issue">'
                + '<span class="sev-icon ' + issue.severity + '"></span>'
                + '<div class="issue-main">'
                +   '<div class="issue-header">'
                +     '<span class="code" title="' + esc(issue.description || issue.code) + '">' + esc(issue.code) + '</span>'
                +     modBadge
                +     '<span class="msg">' + esc(issue.message) + '</span>'
                +   '</div>'
                +   desc
                + '</div>'
                + (loc ? '<span class="loc">' + loc + '</span>' : '')
                + '<button class="copy-btn" data-copy="' + esc(copyText) + '" title="Copy">Copy</button>'
                + '</div>';
        }

        function renderFooter() {
            const statusClass = report.success ? 'success' : 'failure';
            const statusText = report.success ? 'BUILD SUCCESSFUL' : 'BUILD FAILED';
            return '<div class="footer">'
                + '<span class="status ' + statusClass + '">' + statusText
                + ' &middot; ' + report.summary.errors + ' errors, '
                + report.summary.warnings + ' warnings'
                + ' &middot; ' + report.summary.filesAffected + ' files</span>'
                + '<button class="footer-btn secondary" id="btnExport">Export JSON</button>'
                + '<button class="footer-btn secondary" id="btnOutput">View Build Output</button>'
                + '<button class="footer-btn" id="btnRerun">Rerun Validation</button>'
                + '</div>';
        }

        function renderSuccessState() {
            return '<div class="success-banner">'
                + '<div class="check">&#10004;</div>'
                + '<h2>Your guide is valid!</h2>'
                + '<p class="detail">' + esc(report.rootMap) + ' &middot; '
                + formatDuration(report.duration) + '</p></div>'
                + renderFooter();
        }

        function bindEvents() {
            // Filters
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    activeFilter = btn.dataset.filter;
                    collapsedGroups.clear();
                    render();
                });
            });

            // Search
            const searchEl = document.getElementById('searchInput');
            if (searchEl) {
                let debounce;
                searchEl.addEventListener('input', () => {
                    clearTimeout(debounce);
                    debounce = setTimeout(() => {
                        searchQuery = searchEl.value;
                        collapsedGroups.clear();
                        render();
                        // Re-focus search after re-render
                        const newSearch = document.getElementById('searchInput');
                        if (newSearch) { newSearch.focus(); newSearch.selectionStart = newSearch.selectionEnd = newSearch.value.length; }
                    }, 200);
                });
            }

            // Group by
            document.querySelectorAll('.group-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    groupBy = btn.dataset.group;
                    collapsedGroups.clear();
                    render();
                });
            });

            // Group toggle
            document.querySelectorAll('.group-header').forEach(header => {
                header.addEventListener('click', () => {
                    const key = header.dataset.key;
                    if (collapsedGroups.has(key)) collapsedGroups.delete(key);
                    else collapsedGroups.add(key);
                    const body = document.querySelector('.group-body[data-key="' + CSS.escape(key) + '"]');
                    const toggle = header.querySelector('.group-toggle');
                    if (body) body.classList.toggle('collapsed');
                    if (toggle) toggle.innerHTML = body && body.classList.contains('collapsed') ? '&#9654;' : '&#9660;';
                });
            });

            // File links
            document.querySelectorAll('.file-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.stopPropagation();
                    vscode.postMessage({
                        command: 'openFile',
                        path: link.dataset.path,
                        line: link.dataset.line ? parseInt(link.dataset.line) : undefined,
                        column: link.dataset.col ? parseInt(link.dataset.col) : undefined,
                    });
                });
            });

            // Copy buttons
            document.querySelectorAll('.copy-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    vscode.postMessage({ command: 'copyIssue', text: btn.dataset.copy });
                });
            });

            bindFooterEvents();
        }

        function bindFooterEvents() {
            const btnExport = document.getElementById('btnExport');
            const btnOutput = document.getElementById('btnOutput');
            const btnRerun = document.getElementById('btnRerun');
            if (btnExport) btnExport.addEventListener('click', () => vscode.postMessage({ command: 'exportReport' }));
            if (btnOutput) btnOutput.addEventListener('click', () => vscode.postMessage({ command: 'viewBuildOutput' }));
            if (btnRerun) btnRerun.addEventListener('click', () => vscode.postMessage({ command: 'rerunValidation' }));
        }

        render();
    })();
    </script>
</body>
</html>`;
    }

    private _getNonce(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let nonce = '';
        for (let i = 0; i < 32; i++) {
            nonce += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return nonce;
    }
}
