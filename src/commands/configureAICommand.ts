/**
 * "DITA Craft: Configure AI Settings" command.
 *
 * A webview panel (one at a time) showing:
 * - whether DITA Craft AI is on (`ditacraft.ai.enabled`), the AI mode selector (`ditacraft.ai.mode`)
 *   and the active provider
 * - every provider, whatever the configuration — GitHub Copilot, Anthropic, OpenAI, Ollama — with
 *   its state (available, unavailable, not configured, not used in the AI mode, turned off) and why
 * - API key fields for Anthropic and OpenAI (stored via vscode.SecretStorage); Ollama shows its
 *   server and model
 * - a Test button per provider: a real connection check (`ILLMProvider.checkConnection`: the key and
 *   model looked up, the Ollama model listed), shown in the provider's row; a provider that passes
 *   becomes the active one
 *
 * Saving or deleting a key, changing the mode and Refresh detect the providers again, so a change is
 * used at once. The page is drawn by its script from the state the host posts: the CSP allows only
 * that nonce'd script, so the page has no inline event handlers (they were blocked, and no button worked).
 */

import * as vscode from 'vscode';
import { LLMRouterService, MODE_PROVIDERS } from '../llm/llmRouterService';
import { SecretManager } from '../llm/secretManager';
import { isAiEnabled } from '../llm/aiEnabled';
import { AI_MODES, buildLLMConfig } from '../llm/llmConfig';
import { ConnectionCheck, DitaCraftLLMConfig, ProviderId } from '../llm/types';
import { getErrorMessage } from '../utils/errorUtils';

type Mode = DitaCraftLLMConfig['mode'];
type KeySource = 'stored' | 'env' | 'none';

export type ProviderState = 'available' | 'unavailable' | 'not-configured' | 'not-used' | 'off';

export interface ProviderRow {
    id: ProviderId;
    name: string;
    state: ProviderState;
    detail: string;
    /** Anthropic and OpenAI: where their key comes from. */
    key?: KeySource;
    /** Whether Test can check it: it is one of the providers the mode and settings let DITA Craft use. */
    testable: boolean;
}

export interface PanelState {
    aiEnabled: boolean;
    mode: Mode;
    modes: Array<{ id: Mode; description: string }>;
    activeName: string | null;
    providers: ProviderRow[];
    /** The outcome of the action the page asked for (the page waits for it). */
    message?: { text: string; ok: boolean };
}

const PROVIDERS: readonly ProviderId[] = ['copilot', 'anthropic', 'openai', 'ollama'];

const PROVIDER_NAMES: Record<ProviderId, string> = {
    copilot: 'GitHub Copilot',
    anthropic: 'Anthropic Claude',
    openai: 'OpenAI',
    ollama: 'Ollama (local)',
};

const MODE_DESCRIPTIONS: Record<Mode, string> = {
    'auto': 'The first available provider: Copilot, then your Anthropic or OpenAI key, then Ollama.',
    'copilot-only': 'GitHub Copilot only. Requires a Copilot subscription.',
    'byok-only': 'Your own Anthropic or OpenAI API key only.',
    'local-only': 'A local Ollama server only: no data is sent to external services.',
};

/**
 * One row per provider, in priority order. `available` holds the providers the router uses
 * (the mode allows them, their key or server is configured) and whether each one answered;
 * `checks` the connection checks (Test) made since the providers were last detected, which
 * say more than `available` (for an API key, only its format).
 */
export function describeProviders(
    config: DitaCraftLLMConfig,
    available: ReadonlyMap<string, boolean>,
    keys: Readonly<Record<'anthropic' | 'openai', KeySource>>,
    checks: ReadonlyMap<string, ConnectionCheck> = new Map()
): ProviderRow[] {
    const allowed = MODE_PROVIDERS[config.mode] ?? MODE_PROVIDERS.auto;
    return PROVIDERS.map((id): ProviderRow => {
        const row = { id, name: PROVIDER_NAMES[id], testable: available.has(id) };
        const key = id === 'anthropic' || id === 'openai' ? keys[id] : undefined;
        const withKey = key ? { ...row, key } : row;
        if (!allowed.includes(id)) {
            return { ...withKey, state: 'not-used', detail: `Not used in the "${config.mode}" AI mode.` };
        }
        if (id === 'ollama' && config.ollamaEnabled === false) {
            return { ...withKey, state: 'off', detail: 'Turned off (ditacraft.ai.provider.ollama.enabled).' };
        }
        if (key === 'none') {
            return { ...withKey, state: 'not-configured', detail: 'No API key saved.' };
        }
        const check = checks.get(id);
        if (check && available.has(id)) {
            return { ...withKey, state: check.ok ? 'available' : 'unavailable', detail: check.detail };
        }
        const ok = available.get(id);
        if (ok === undefined) {
            return { ...withKey, state: 'unavailable', detail: 'Not checked yet: press Refresh.' };
        }
        const state: ProviderState = ok ? 'available' : 'unavailable';
        const keyFrom = key === 'env' ? `Key from the ${id.toUpperCase()}_API_KEY environment variable` : 'Key saved';
        switch (id) {
            case 'copilot':
                return { ...withKey, state, detail: ok
                    ? 'Uses your GitHub Copilot subscription: no key needed.'
                    : 'No Copilot chat model found: install GitHub Copilot and sign in.' };
            case 'anthropic':
                return { ...withKey, state, detail: ok
                    ? `${keyFrom}; model ${config.anthropicModel}.`
                    : `${keyFrom}, but it is not usable: Anthropic keys start with sk-ant-.` };
            case 'openai':
                return { ...withKey, state, detail: ok
                    ? `${keyFrom}; model ${config.openaiModel}.`
                    : `${keyFrom}, but it is not usable: OpenAI keys start with sk-.` };
            case 'ollama':
                return { ...withKey, state, detail: ok
                    ? `Running at ${config.ollamaBaseUrl}; model ${config.ollamaModel}.`
                    : `Not reachable at ${config.ollamaBaseUrl}: start Ollama, or change its server in the settings.` };
        }
    });
}

let current: AiSettingsPanel | undefined;

export async function configureAICommand(router: LLMRouterService, secretManager: SecretManager): Promise<void> {
    if (current) {
        current.reveal();
        return;
    }
    current = new AiSettingsPanel(router, secretManager);
    if (!router.initialized) {
        // DITA Craft AI was off at startup: detect the providers for the panel, without notifications.
        await current.redetect();
    }
}

interface PageMessage {
    command: 'ready' | 'saveKey' | 'deleteKey' | 'test' | 'setMode' | 'refresh' | 'openSetting';
    provider?: string;
    key?: string;
    mode?: string;
    setting?: string;
}

class AiSettingsPanel {
    private readonly panel: vscode.WebviewPanel;
    private readonly disposables: vscode.Disposable[] = [];
    private pendingMessage: PanelState['message'];
    private postSequence = 0;
    /** The connection checks made since the providers were last detected. */
    private readonly checks = new Map<string, ConnectionCheck>();
    /** Closing the panel cancels a check still waiting for an answer. */
    private readonly closed = new AbortController();

    constructor(private readonly router: LLMRouterService, private readonly secrets: SecretManager) {
        this.panel = vscode.window.createWebviewPanel(
            'ditacraftAISettings',
            'DITA Craft: Configure AI Settings',
            vscode.ViewColumn.One,
            { enableScripts: true, retainContextWhenHidden: true }
        );
        this.panel.webview.html = buildSettingsHtml();
        this.disposables.push(
            this.panel.webview.onDidReceiveMessage((msg: PageMessage) => { void this.handle(msg); }),
            // Every detection (this panel's, a settings change, AI turned on) redraws the panel. The
            // providers are new ones then (another key, model or server): earlier checks no longer apply.
            router.onDidInitialize(() => {
                this.checks.clear();
                void this.post();
            }),
            vscode.workspace.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('ditacraft.ai.mode') || e.affectsConfiguration('ditacraft.ai.provider')) {
                    void this.redetect();
                } else if (e.affectsConfiguration('ditacraft.ai.enabled')) {
                    void this.post();
                }
            })
        );
        this.panel.onDidDispose(() => {
            current = undefined;
            this.closed.abort();
            this.disposables.forEach(d => d.dispose());
        });
    }

    reveal(): void {
        this.panel.reveal();
    }

    /** Detects the providers again with the current settings and keys (the panel redraws when done). */
    async redetect(): Promise<void> {
        await this.router.initialize(await buildLLMConfig(this.secrets), { quiet: true });
    }

    private async handle(msg: PageMessage): Promise<void> {
        try {
            const provider = PROVIDERS.find(p => p === msg.provider);
            const name = provider ? PROVIDER_NAMES[provider] : '';
            switch (msg.command) {
                case 'ready':
                    await this.post();
                    return;
                case 'saveKey': {
                    const key = msg.key?.trim();
                    if ((provider !== 'anthropic' && provider !== 'openai') || !key) { return; }
                    await this.secrets.storeApiKey(provider, key);
                    this.pendingMessage = { text: `${name} key saved.`, ok: true };
                    await this.redetect();
                    return;
                }
                case 'deleteKey': {
                    if (provider !== 'anthropic' && provider !== 'openai') { return; }
                    await this.secrets.deleteApiKey(provider);
                    this.pendingMessage = await this.secrets.getApiKeySource(provider) === 'env'
                        ? { text: `${name} key deleted. The ${provider.toUpperCase()}_API_KEY environment variable still provides one.`, ok: true }
                        : { text: `${name} key deleted.`, ok: true };
                    await this.redetect();
                    return;
                }
                case 'setMode': {
                    const mode = AI_MODES.find(m => m === msg.mode);
                    if (!mode) { return; }
                    const cfg = vscode.workspace.getConfiguration('ditacraft.ai');
                    // Where it is set: a workspace value would hide a change made in the user settings.
                    const target = cfg.inspect('mode')?.workspaceValue !== undefined
                        ? vscode.ConfigurationTarget.Workspace
                        : vscode.ConfigurationTarget.Global;
                    await cfg.update('mode', mode, target);
                    this.pendingMessage = { text: `AI mode: ${mode}.`, ok: true };
                    await this.redetect();
                    return;
                }
                case 'test': {
                    if (!provider) { return; }
                    const check = await this.router.testProvider(provider, this.closed.signal);
                    if (this.closed.signal.aborted) { return; }
                    this.checks.set(provider, check);
                    this.pendingMessage = !check.ok
                        ? { text: `${name} failed the connection check.`, ok: false }
                        : isAiEnabled()
                            ? { text: `${name} passed the connection check. It is now the active provider.`, ok: true }
                            : { text: `${name} passed the connection check.`, ok: true };
                    await this.post();
                    return;
                }
                case 'refresh':
                    this.pendingMessage = { text: 'Providers checked.', ok: true };
                    await this.redetect();
                    return;
                case 'openSetting':
                    if (msg.setting?.startsWith('ditacraft.ai.')) {
                        await vscode.commands.executeCommand('workbench.action.openSettings', msg.setting);
                    }
                    return;
            }
        } catch (error: unknown) {
            this.pendingMessage = { text: `DITA Craft AI: ${getErrorMessage(error)}`, ok: false };
            await this.post();
        }
    }

    private async post(): Promise<void> {
        const sequence = ++this.postSequence;
        const config = await buildLLMConfig(this.secrets);
        const [statuses, anthropic, openai] = await Promise.all([
            this.router.getProviderStatuses(),
            this.secrets.getApiKeySource('anthropic'),
            this.secrets.getApiKeySource('openai'),
        ]);
        // A later post has newer statuses; it takes the message with it.
        if (sequence !== this.postSequence) { return; }
        const state: PanelState = {
            aiEnabled: isAiEnabled(),
            mode: config.mode,
            modes: AI_MODES.map(id => ({ id, description: MODE_DESCRIPTIONS[id] })),
            activeName: this.router.activeProvider?.displayName ?? null,
            providers: describeProviders(
                config,
                new Map(statuses.map(s => [s.provider.id, s.available])),
                { anthropic: anthropic ?? 'none', openai: openai ?? 'none' },
                this.checks
            ),
            message: this.pendingMessage,
        };
        this.pendingMessage = undefined;
        await this.panel.webview.postMessage({ type: 'state', state });
    }
}

function buildSettingsHtml(): string {
    // Random nonce for the page script (CSP)
    const nonce = [...crypto.getRandomValues(new Uint8Array(16))]
        .map(b => b.toString(16).padStart(2, '0')).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline';">
  <style>
    body { font-family: var(--vscode-font-family); padding: 16px; color: var(--vscode-foreground); }
    table { border-collapse: collapse; width: 100%; margin-top: 8px; }
    td, th { padding: 8px 12px; border-bottom: 1px solid var(--vscode-panel-border); text-align: left; vertical-align: middle; }
    th { color: var(--vscode-descriptionForeground); font-weight: normal; }
    input, select { background: var(--vscode-input-background); color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border, transparent); padding: 4px 6px; }
    input { width: 180px; }
    .key { margin-top: 6px; white-space: nowrap; }
    .key > :first-child { margin-left: 0; }
    button { background: var(--vscode-button-background); color: var(--vscode-button-foreground);
             border: 1px solid var(--vscode-button-border, transparent); padding: 4px 10px; cursor: pointer; margin-left: 4px; }
    button:hover:not(:disabled) { background: var(--vscode-button-hoverBackground); }
    button.secondary { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground);
                       border-color: var(--vscode-button-border, var(--vscode-panel-border)); }
    button.secondary:hover:not(:disabled) { background: var(--vscode-button-secondaryHoverBackground); }
    button:disabled, select:disabled, input:disabled { opacity: 0.5; cursor: default; }
    .notice { padding: 8px 12px; border-left: 3px solid var(--vscode-editorWarning-foreground);
              background: var(--vscode-textBlockQuote-background); }
    .hint, .not-used, .off { color: var(--vscode-descriptionForeground); }
    .available { color: var(--vscode-testing-iconPassed, #4caf50); }
    .unavailable, .error { color: var(--vscode-errorForeground, #f44336); }
    .not-configured { color: var(--vscode-editorWarning-foreground, #cca700); }
    .state { white-space: nowrap; }
    #message { min-height: 1.4em; }
    #message.ok { color: var(--vscode-foreground); }
  </style>
</head>
<body>
  <h2>DITA Craft AI Settings</h2>
  <p id="off" class="notice" hidden>DITA Craft AI is turned off (<code>ditacraft.ai.enabled</code>): its features
     stay unavailable until you turn it on.
     <button data-action="openSetting" data-setting="ditacraft.ai.enabled">Open Setting</button></p>
  <p><label for="mode">AI mode</label> <select id="mode"></select> <span id="mode-description" class="hint"></span></p>
  <p>Active provider: <strong id="active">…</strong> <button data-action="refresh" class="secondary">Refresh</button></p>
  <p id="message" role="status" aria-live="polite"></p>

  <table>
    <thead><tr><th>Provider</th><th>Status</th><th>Details</th><th></th></tr></thead>
    <tbody id="providers"></tbody>
  </table>
  <p class="hint">API keys are kept in VS Code's secret storage (your system's keychain), never in settings files.</p>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const STATES = {
      'available': '✅ Available',
      'unavailable': '❌ Unavailable',
      'not-configured': '⚠️ Not configured',
      'not-used': '— Not used',
      'off': '— Turned off'
    };
    const BUSY = {
      saveKey: 'Saving the key…', deleteKey: 'Deleting the key…', test: 'Checking the connection…',
      setMode: 'Changing the AI mode…', refresh: 'Checking the providers…'
    };

    function el(tag, attrs, children) {
      const e = document.createElement(tag);
      for (const [name, value] of Object.entries(attrs || {})) {
        if (name === 'text') { e.textContent = value; } else if (value !== false && value !== undefined) { e.setAttribute(name, value === true ? '' : value); }
      }
      for (const child of children || []) { e.append(child); }
      return e;
    }

    function showMessage(text, ok) {
      const m = document.getElementById('message');
      m.textContent = text;
      m.className = ok ? 'ok' : 'error';
    }

    // While an action runs, the controls wait for its outcome.
    let busy = false;
    function setBusy(value) {
      busy = value;
      document.querySelectorAll('button, select, input').forEach((e) => { e.disabled = busy || e.hasAttribute('data-never'); });
    }

    function send(message) {
      setBusy(true);
      showMessage(BUSY[message.command] || '', true);
      vscode.postMessage(message);
    }

    // Under the details: the API key field (Anthropic, OpenAI) or Ollama's settings.
    function keyLine(p, typed) {
      if (p.key === undefined) {
        return p.id !== 'ollama' ? [] : [el('div', { class: 'key' }, [
          el('button', { class: 'secondary', 'data-action': 'openSetting', 'data-setting': 'ditacraft.ai.provider.ollama', text: 'Server Settings' })
        ])];
      }
      const input = el('input', { type: 'password', autocomplete: 'off', 'data-provider': p.id, 'aria-label': p.name + ' API key',
                                  placeholder: p.key === 'stored' ? 'Replace the saved key…' : 'Paste an API key…' });
      input.value = typed[p.id] || '';
      const line = [input, el('button', { 'data-action': 'saveKey', 'data-provider': p.id, text: 'Save' })];
      if (p.key === 'stored') {
        line.push(el('button', { class: 'secondary', 'data-action': 'deleteKey', 'data-provider': p.id, text: 'Delete' }));
      }
      return [el('div', { class: 'key' }, line)];
    }

    function render(state) {
      const typed = {};
      document.querySelectorAll('input[data-provider]').forEach((i) => { typed[i.dataset.provider] = i.value; });
      document.getElementById('off').hidden = state.aiEnabled;
      const select = document.getElementById('mode');
      select.replaceChildren(...state.modes.map((m) => el('option', { value: m.id, text: m.id })));
      select.value = state.mode;
      const mode = state.modes.find((m) => m.id === state.mode);
      document.getElementById('mode-description').textContent = mode ? mode.description : '';
      document.getElementById('active').textContent = state.activeName || (state.aiEnabled ? 'None' : 'None (DITA Craft AI is turned off)');
      document.getElementById('providers').replaceChildren(...state.providers.map((p) => el('tr', { 'data-row': p.id }, [
        el('td', {}, [el('strong', { text: p.name })]),
        el('td', { class: 'state ' + p.state, text: STATES[p.state] }),
        el('td', {}, [el('div', { text: p.detail }), ...keyLine(p, typed)]),
        el('td', {}, [el('button', { class: 'secondary', 'data-action': 'test', 'data-provider': p.id, 'data-never': !p.testable,
                                     title: p.testable ? 'Check the connection to ' + p.name + ' (no tokens used); if it passes, it becomes the active provider' : p.detail, text: 'Test' })])
      ])));
      if (state.message) {
        showMessage(state.message.text, state.message.ok);
        setBusy(false);
      } else {
        setBusy(busy);
      }
    }

    document.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-action]');
      if (!button || button.disabled) { return; }
      const action = button.dataset.action;
      const provider = button.dataset.provider;
      if (action === 'openSetting') {
        vscode.postMessage({ command: 'openSetting', setting: button.dataset.setting });
      } else if (action === 'saveKey') {
        const input = document.querySelector('input[data-provider="' + provider + '"]');
        const key = input.value.trim();
        if (!key) { showMessage('Paste a key first.', false); input.focus(); return; }
        input.value = '';
        send({ command: 'saveKey', provider, key });
      } else {
        send({ command: action, provider });
      }
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && event.target.matches('input[data-provider]')) {
        const save = document.querySelector('button[data-action="saveKey"][data-provider="' + event.target.dataset.provider + '"]');
        if (save) { save.click(); }
      }
    });
    document.getElementById('mode').addEventListener('change', (event) => send({ command: 'setMode', mode: event.target.value }));
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'state') { render(event.data.state); }
    });
    vscode.postMessage({ command: 'ready' });
  </script>
</body>
</html>`;
}
