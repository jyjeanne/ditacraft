/**
 * Visual DITAVAL Condition Editor Panel (§5.3)
 * A WebView (same panel pattern as `mapVisualizerPanel.ts`/
 * `validationReportPanel.ts`) listing every profiling attribute/value pair
 * discovered via the LSP server's `SubjectSchemeService` — through the
 * `dita/getSubjectSchemeAttributes` request — with per-value
 * include/exclude/flag toggles that serialize back into the open
 * `.ditaval` document.
 *
 * Known v1 limitation, surfaced directly in the webview: saving from this
 * editor regenerates the file's `<prop>` rules from the current toggle
 * state (`buildDitavalDocument`, `ditavalParser.ts`). Value-specific rules
 * the editor doesn't have a chip for yet (a hand-typed value not offered
 * by the scheme) are still preserved — they get their own row via
 * `mergeAttributeState` — but anything the parser doesn't recognize at all
 * (comments, `<style-conflict>`, other non-`<prop>` content) is not
 * preserved. See `docs/V0.9-IMPLEMENTATION-PLAN.md` §5.3.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { logger } from '../utils/logger';
import { getLanguageClient } from '../languageClient';
import { parseDitavalRules, buildDitavalDocument, DitavalRule, PROFILING_ATTRIBUTES } from '../utils/ditavalParser';
import {
    mergeAttributeState,
    applyConditionToggle,
    nextConditionAction,
    ConditionAction,
    ConditionAttributeState,
    SchemeAttributeInfo
} from '../utils/ditavalConditionState';

interface GetSubjectSchemeAttributesResponse {
    attributes: SchemeAttributeInfo[];
}

interface WebviewMessage {
    command: string;
    attr?: string;
    val?: string;
    action?: ConditionAction | 'none';
}

export class DitavalConditionEditorPanel {
    public static currentPanel: DitavalConditionEditorPanel | undefined;
    public static readonly viewType = 'ditacraft.ditavalConditionEditor';

    private readonly _panel: vscode.WebviewPanel;
    private _ditavalPath: string;
    private _disposables: vscode.Disposable[] = [];
    private _valueRules: DitavalRule[] = [];
    private _otherRules: DitavalRule[] = [];
    private _schemeAttributes: SchemeAttributeInfo[] = [];
    private _loadError: string | undefined;

    private constructor(panel: vscode.WebviewPanel, ditavalPath: string) {
        this._panel = panel;
        this._ditavalPath = ditavalPath;

        this._updateTitle();

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.onDidReceiveMessage(
            message => this._handleMessage(message),
            null,
            this._disposables
        );

        void this._refresh();
    }

    public static createOrShow(ditavalPath: string): DitavalConditionEditorPanel {
        const column = vscode.ViewColumn.Beside;

        if (DitavalConditionEditorPanel.currentPanel) {
            DitavalConditionEditorPanel.currentPanel._ditavalPath = ditavalPath;
            DitavalConditionEditorPanel.currentPanel._updateTitle();
            DitavalConditionEditorPanel.currentPanel._panel.reveal(column);
            void DitavalConditionEditorPanel.currentPanel._refresh();
            return DitavalConditionEditorPanel.currentPanel;
        }

        const panel = vscode.window.createWebviewPanel(
            DitavalConditionEditorPanel.viewType,
            'DITAVAL Condition Editor',
            column,
            { enableScripts: true, retainContextWhenHidden: true }
        );

        DitavalConditionEditorPanel.currentPanel = new DitavalConditionEditorPanel(panel, ditavalPath);
        logger.info('DITAVAL condition editor panel created', { ditavalPath });
        return DitavalConditionEditorPanel.currentPanel;
    }

    private _updateTitle(): void {
        this._panel.title = `Conditions: ${path.basename(this._ditavalPath)}`;
    }

    public dispose(): void {
        DitavalConditionEditorPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            this._disposables.pop()?.dispose();
        }
    }

    // ── Message Handling ─────────────────────────────────────

    private async _handleMessage(message: WebviewMessage): Promise<void> {
        switch (message.command) {
            case 'toggleCondition':
                if (message.attr && message.val !== undefined) {
                    await this._toggleCondition(message.attr, message.val, this._parseAction(message.action));
                }
                break;
            case 'addCondition':
                if (message.attr && message.val) {
                    await this._toggleCondition(message.attr.trim(), message.val.trim(), 'exclude');
                }
                break;
            case 'refresh':
                await this._refresh();
                break;
        }
    }

    private _parseAction(action: ConditionAction | 'none' | undefined): ConditionAction | null {
        return action && action !== 'none' ? action : null;
    }

    private async _toggleCondition(attribute: string, value: string, action: ConditionAction | null): Promise<void> {
        // `value` may legitimately be an empty string (a scheme/file can
        // define `val=""`) -- only `attribute` being empty is a reason to
        // bail. `/code-review` fix: a truthy check on `value` here used to
        // silently swallow every toggle of such a chip.
        if (!attribute) return;
        this._valueRules = applyConditionToggle(this._valueRules, attribute, value, action);
        await this._writeDocument();
        this._render();
    }

    private async _writeDocument(): Promise<void> {
        const newText = buildDitavalDocument([...this._otherRules, ...this._valueRules]);
        try {
            const uri = vscode.Uri.file(this._ditavalPath);
            const document = await vscode.workspace.openTextDocument(uri);
            const fullRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(document.getText().length)
            );
            const edit = new vscode.WorkspaceEdit();
            edit.replace(uri, fullRange, newText);
            await vscode.workspace.applyEdit(edit);
        } catch (error) {
            logger.error('Failed to write DITAVAL condition edit', error);
            vscode.window.showErrorMessage('DitaCraft: Could not save DITAVAL changes.');
        }
    }

    // ── State Loading ─────────────────────────────────────────

    private async _refresh(): Promise<void> {
        this._loadError = undefined;
        try {
            const uri = vscode.Uri.file(this._ditavalPath);
            const document = await vscode.workspace.openTextDocument(uri);
            const rules = parseDitavalRules(document.getText());
            this._valueRules = rules.filter(r => r.att && r.val !== undefined);
            this._otherRules = rules.filter(r => !(r.att && r.val !== undefined));
        } catch (error) {
            logger.error('Failed to read DITAVAL file', error);
            this._valueRules = [];
            this._otherRules = [];
            this._loadError = error instanceof Error ? error.message : 'Unknown error';
        }

        this._schemeAttributes = await this._fetchSchemeAttributes();
        this._render();
    }

    private async _fetchSchemeAttributes(): Promise<SchemeAttributeInfo[]> {
        const client = getLanguageClient();
        if (!client) return [];
        try {
            const contextUri = client.code2ProtocolConverter.asUri(vscode.Uri.file(this._ditavalPath));
            const response = await client.sendRequest<GetSubjectSchemeAttributesResponse>(
                'dita/getSubjectSchemeAttributes',
                { contextUri }
            );
            return response.attributes;
        } catch (error) {
            logger.error('Failed to fetch subject scheme attributes', error);
            return [];
        }
    }

    // ── HTML Generation ──────────────────────────────────────

    private _render(): void {
        this._panel.webview.html = this._getHtmlContent();
    }

    private _getHtmlContent(): string {
        const nonce = this._getNonce();
        const state = mergeAttributeState(this._schemeAttributes, this._valueRules, this._otherRules);
        const fileName = path.basename(this._ditavalPath);

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
    <title>DITAVAL Condition Editor</title>
    <style nonce="${nonce}">
        :root {
            --bg: var(--vscode-editor-background);
            --fg: var(--vscode-editor-foreground);
            --border: var(--vscode-panel-border);
            --hover: var(--vscode-list-hoverBackground);
            --btn-bg: var(--vscode-button-background);
            --btn-fg: var(--vscode-button-foreground);
            --btn-hover: var(--vscode-button-hoverBackground);
            --input-bg: var(--vscode-input-background);
            --input-fg: var(--vscode-input-foreground);
            --input-border: var(--vscode-input-border, var(--border));
            --warning-fg: var(--vscode-editorWarning-foreground, #cca700);
            --exclude-bg: var(--vscode-editorError-foreground, #f44747);
            --include-bg: var(--vscode-terminal-ansiGreen, #89d185);
            --flag-bg: var(--vscode-editorWarning-foreground, #cca700);
        }
        * { box-sizing: border-box; }
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--fg);
            background: var(--bg);
            padding: 16px;
            margin: 0;
        }
        h1 { font-size: 1.2em; margin: 0 0 4px 0; }
        .meta { opacity: 0.7; font-size: 0.85em; margin-bottom: 12px; }
        .warning {
            background: var(--hover);
            border-left: 3px solid var(--warning-fg);
            padding: 8px 12px;
            margin-bottom: 16px;
            font-size: 0.85em;
        }
        .toolbar { display: flex; gap: 8px; margin-bottom: 16px; }
        button {
            background: var(--btn-bg);
            color: var(--btn-fg);
            border: none;
            padding: 5px 12px;
            cursor: pointer;
            border-radius: 2px;
            font-size: 0.9em;
        }
        button:hover { background: var(--btn-hover); }
        .attribute-group {
            border: 1px solid var(--border);
            border-radius: 4px;
            padding: 10px 12px;
            margin-bottom: 10px;
        }
        .attribute-name { font-weight: 600; margin-bottom: 8px; }
        .default-badge {
            font-weight: normal;
            font-size: 0.8em;
            opacity: 0.75;
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 1px 6px;
        }
        .default-badge[data-action="exclude"] { color: var(--exclude-bg); border-color: var(--exclude-bg); }
        .default-badge[data-action="include"] { color: var(--include-bg); border-color: var(--include-bg); }
        .default-badge[data-action="flag"] { color: var(--flag-bg); border-color: var(--flag-bg); }
        /* code-review fix: this page's CSP has no 'unsafe-inline' on
           style-src, so a static inline style="display:none" HTML
           attribute is silently ignored (confirmed against real Chromium)
           -- the "Other..." input used to render visible on first load
           regardless of the dropdown selection. Toggling visibility goes
           through this nonce-covered stylesheet class instead. */
        .hidden { display: none; }
        .chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .chip {
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 3px 10px;
            cursor: pointer;
            font-size: 0.85em;
            background: var(--hover);
            display: inline-flex;
            align-items: center;
            gap: 4px;
        }
        .chip[data-action="exclude"] { border-color: var(--exclude-bg); color: var(--exclude-bg); }
        .chip[data-action="include"] { border-color: var(--include-bg); color: var(--include-bg); }
        .chip[data-action="flag"] { border-color: var(--flag-bg); color: var(--flag-bg); }
        .chip .hier { opacity: 0.65; font-size: 0.9em; }
        .add-form {
            display: flex;
            gap: 6px;
            margin-top: 16px;
            padding-top: 12px;
            border-top: 1px solid var(--border);
        }
        .add-form input, .add-form select {
            background: var(--input-bg);
            color: var(--input-fg);
            border: 1px solid var(--input-border);
            padding: 4px 6px;
            border-radius: 2px;
            font-size: 0.9em;
        }
        .empty { opacity: 0.7; font-style: italic; }
    </style>
</head>
<body>
    <h1>DITAVAL Conditions</h1>
    <div class="meta">${this._esc(fileName)}</div>
    <div class="warning">Saving from this editor regenerates the file's &lt;prop&gt; rules from the toggle state below. Other content (comments, &lt;style-conflict&gt;, etc.) is not preserved.</div>
    ${this._loadError ? `<div class="warning">Could not read ${this._esc(fileName)}: ${this._esc(this._loadError)}</div>` : ''}
    <div class="toolbar">
        <button id="refresh-btn">Refresh</button>
    </div>
    <div id="groups">
        ${state.length > 0 ? state.map(g => this._renderGroup(g)).join('') : '<p class="empty">No conditions yet — add one below.</p>'}
    </div>
    <div class="add-form">
        <select id="add-attr">
            ${PROFILING_ATTRIBUTES.map(a => `<option value="${this._esc(a)}">${this._esc(a)}</option>`).join('')}
            <option value="">Other…</option>
        </select>
        <input id="add-attr-custom" type="text" placeholder="attribute name" class="hidden">
        <input id="add-val" type="text" placeholder="value">
        <button id="add-btn">Add Condition</button>
    </div>

    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();

        document.getElementById('refresh-btn').addEventListener('click', () => {
            vscode.postMessage({ command: 'refresh' });
        });

        const attrSelect = document.getElementById('add-attr');
        const attrCustom = document.getElementById('add-attr-custom');
        attrSelect.addEventListener('change', () => {
            attrCustom.classList.toggle('hidden', attrSelect.value !== '');
        });

        document.getElementById('add-btn').addEventListener('click', () => {
            const attr = attrSelect.value === '' ? attrCustom.value.trim() : attrSelect.value;
            const val = document.getElementById('add-val').value.trim();
            if (!attr || !val) return;
            vscode.postMessage({ command: 'addCondition', attr, val });
        });

        document.querySelectorAll('.chip').forEach(chip => {
            chip.addEventListener('click', () => {
                vscode.postMessage({
                    command: 'toggleCondition',
                    attr: chip.getAttribute('data-attr'),
                    val: chip.getAttribute('data-val'),
                    action: chip.getAttribute('data-next-action')
                });
            });
        });
    </script>
</body>
</html>`;
    }

    private _renderGroup(group: ConditionAttributeState): string {
        const chips = group.values.map(v => this._renderChip(group.attribute, v, group.defaultAction)).join('');
        // `/code-review` fix: a value-less "default for this attribute"
        // rule (e.g. `<prop action="exclude" att="platform"/>`) used to be
        // preserved on save but never shown here at all, so every value
        // with no rule of its own looked neutral even when this default
        // was actually excluding/including/flagging it. Surfaced as a
        // badge on the group, plus a per-chip hint below.
        const defaultBadge = group.defaultAction
            ? `<span class="default-badge" data-action="${this._esc(group.defaultAction)}">default: ${this._esc(group.defaultAction)}</span>`
            : '';
        return `
            <div class="attribute-group">
                <div class="attribute-name">${this._esc(group.attribute)} ${defaultBadge}</div>
                <div class="chips">${chips}</div>
            </div>
        `;
    }

    private _renderChip(
        attribute: string,
        value: { value: string; hierarchyPath?: string; action: ConditionAction | null },
        groupDefaultAction: ConditionAction | null
    ): string {
        const nextAction = nextConditionAction(value.action) ?? 'none';
        const effectiveDefault = value.action === null ? groupDefaultAction : null;
        const label = value.action
            ? `${value.action}: ${value.value}`
            : effectiveDefault
                ? `${value.value} (default: ${effectiveDefault})`
                : value.value;
        const hier = value.hierarchyPath ? `<span class="hier">${this._esc(value.hierarchyPath)}</span>` : '';
        const actionAttr = value.action ? ` data-action="${this._esc(value.action)}"` : '';
        return `<span class="chip" data-attr="${this._esc(attribute)}" data-val="${this._esc(value.value)}" data-next-action="${this._esc(nextAction)}"${actionAttr}>${this._esc(label)}${hier}</span>`;
    }

    private _esc(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
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
