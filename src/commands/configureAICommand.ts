/**
 * "DitaCraft: Configure AI Settings" command.
 *
 * Shows a WebView panel with:
 * - The currently active provider (auto-detected)
 * - Availability status for each provider (✅ / ❌ / ⚠️)
 * - Secure API key input fields (stored via vscode.SecretStorage)
 * - A "Test Connection" button per provider
 */

import * as vscode from 'vscode';
import { LLMRouterService } from '../llm/llmRouterService';
import { SecretManager } from '../llm/secretManager';
import { getErrorMessage } from '../utils/errorUtils';

export async function configureAICommand(
    context: vscode.ExtensionContext,
    router: LLMRouterService,
    secretManager: SecretManager
): Promise<void> {
    const panel = vscode.window.createWebviewPanel(
        'ditacraftAISettings',
        'DitaCraft: Configure AI Settings',
        vscode.ViewColumn.One,
        { enableScripts: true, retainContextWhenHidden: true }
    );

    context.subscriptions.push(panel);

    // Gather current status
    const statuses = await router.getProviderStatuses();
    const active = router.activeProvider;

    panel.webview.html = buildSettingsHtml(
        statuses.map(s => ({ id: s.provider.id, name: s.provider.displayName, available: s.available })),
        active?.id ?? null
    );

    // Handle messages from the WebView
    panel.webview.onDidReceiveMessage(async (msg: WebViewMessage) => {
        try {
            if (msg.command === 'saveKey') {
                await secretManager.storeApiKey(msg.provider, msg.key ?? '');
                void vscode.window.showInformationMessage(`API key for ${msg.provider} saved securely.`);
            } else if (msg.command === 'deleteKey') {
                await secretManager.deleteApiKey(msg.provider);
                void vscode.window.showInformationMessage(`API key for ${msg.provider} deleted.`);
            } else if (msg.command === 'testConnection') {
                const ok = await router.forceProvider(msg.provider as 'copilot' | 'anthropic' | 'openai' | 'ollama');
                void panel.webview.postMessage({ type: 'testResult', provider: msg.provider, success: ok });
            } else if (msg.command === 'refresh') {
                const updated = await router.getProviderStatuses();
                void panel.webview.postMessage({
                    type: 'statusUpdate',
                    statuses: updated.map(s => ({ id: s.provider.id, available: s.available })),
                    activeId: router.activeProvider?.id ?? null,
                });
            }
        } catch (error: unknown) {
            void vscode.window.showErrorMessage(`DitaCraft AI: ${getErrorMessage(error)}`);
        }
    }, undefined, context.subscriptions);
}

interface WebViewMessage {
    command: 'saveKey' | 'deleteKey' | 'testConnection' | 'refresh';
    provider: string;
    key?: string;
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function buildSettingsHtml(
    providers: Array<{ id: string; name: string; available: boolean }>,
    activeId: string | null
): string {
    // Random nonce for inline script CSP
    const nonce = [...crypto.getRandomValues(new Uint8Array(16))]
        .map(b => b.toString(16).padStart(2, '0')).join('');

    const providerRows = providers.map(p => {
        const safeId = escapeHtml(p.id);
        const safeName = escapeHtml(p.name);
        const statusIcon = p.available ? '✅' : '❌';
        const isActive = p.id === activeId ? ' <strong>(active)</strong>' : '';
        const keyInput = p.id !== 'copilot'
            ? `<input type="password" id="key-${safeId}" placeholder="Paste API key…" style="width:280px" />
               <button onclick="saveKey('${safeId}')">Save</button>
               <button onclick="deleteKey('${safeId}')">Delete</button>`
            : `<em>Uses GitHub Copilot subscription — no key needed.</em>`;

        return `
        <tr>
          <td>${statusIcon}${isActive}</td>
          <td><strong>${safeName}</strong></td>
          <td>${keyInput}</td>
          <td><button onclick="testConnection('${safeId}')">Test</button></td>
        </tr>
        <tr id="result-${safeId}"></tr>`;
    }).join('\n');

    const safeActiveId = escapeHtml(activeId ?? 'None');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline';">
  <style>
    body { font-family: var(--vscode-font-family); padding: 16px; }
    table { border-collapse: collapse; width: 100%; }
    td, th { padding: 8px 12px; border-bottom: 1px solid var(--vscode-panel-border); }
    th { text-align: left; color: var(--vscode-descriptionForeground); }
    input { background: var(--vscode-input-background); color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border); padding: 4px 6px; }
    button { background: var(--vscode-button-background); color: var(--vscode-button-foreground);
             border: none; padding: 4px 10px; cursor: pointer; margin-left: 4px; }
    .success { color: #4caf50; } .error { color: #f44336; }
  </style>
</head>
<body>
  <h2>DitaCraft AI Settings</h2>
  <p>Active provider: <strong>${safeActiveId}</strong>
     &nbsp;<button onclick="refresh()">🔄 Refresh</button></p>

  <table>
    <thead><tr><th>Status</th><th>Provider</th><th>API Key</th><th>Test</th></tr></thead>
    <tbody>${providerRows}</tbody>
  </table>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    function saveKey(id) {
      const key = document.getElementById('key-'+id).value.trim();
      if (!key) return;
      vscode.postMessage({ command: 'saveKey', provider: id, key });
    }
    function deleteKey(id) {
      vscode.postMessage({ command: 'deleteKey', provider: id });
    }
    function testConnection(id) {
      document.getElementById('result-'+id).innerHTML = '<td colspan="4"><em>Testing\u2026</em></td>';
      vscode.postMessage({ command: 'testConnection', provider: id });
    }
    function refresh() {
      vscode.postMessage({ command: 'refresh' });
    }
    window.addEventListener('message', e => {
      const msg = e.data;
      if (msg.type === 'testResult') {
        const row = document.getElementById('result-'+msg.provider);
        if (row) {
          row.innerHTML = '<td colspan="4" class="'+(msg.success?'success':'error')+'">'
            + (msg.success ? '\u2705 Connection successful' : '\u274C Connection failed') + '</td>';
        }
      }
    });
  </script>
</body>
</html>`;
}
