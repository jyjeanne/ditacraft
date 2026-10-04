/**
 * Configure AI Settings panel: the provider rows it shows, and the router rules behind them
 * (the providers each AI mode uses, overlapping detections). The page itself is checked in a
 * real window.
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { describeProviders } from '../../commands/configureAICommand';
import { LLMRouterService } from '../../llm/llmRouterService';
import { SecretManager } from '../../llm/secretManager';
import { buildLLMConfig } from '../../llm/llmConfig';
import { AnthropicLLMProvider } from '../../llm/providers/anthropicProvider';
import { OpenAILLMProvider } from '../../llm/providers/openaiProvider';
import { DEFAULT_ANTHROPIC_MODEL, DEFAULT_OPENAI_MODEL, type DitaCraftLLMConfig } from '../../llm/types';

const BASE: DitaCraftLLMConfig = {
    mode: 'auto',
    anthropicModel: 'claude-model',
    openaiModel: 'gpt-model',
    ollamaEnabled: true,
    ollamaBaseUrl: 'http://localhost:11434',
    ollamaModel: 'llama3',
};
// fetch refuses the discard port at once ("bad port"): Ollama's probe fails without waiting.
const NO_OLLAMA = 'http://127.0.0.1:9';

function rows(config: Partial<DitaCraftLLMConfig>, available: Record<string, boolean>, keys: { anthropic?: 'stored' | 'env'; openai?: 'stored' | 'env' } = {}) {
    return describeProviders({ ...BASE, ...config }, new Map(Object.entries(available)),
        { anthropic: keys.anthropic ?? 'none', openai: keys.openai ?? 'none' })
        .map(r => `${r.id} ${r.state}${r.key ? ` key:${r.key}` : ''}${r.testable ? ' testable' : ''} | ${r.detail}`);
}

suite('Configure AI Settings Test Suite', () => {
    test('every provider is listed, Anthropic and OpenAI as "not configured" without a key (regression: their rows were missing, so no key could be entered)', () => {
        assert.deepStrictEqual(rows({}, { copilot: false, ollama: false }), [
            'copilot unavailable testable | No Copilot chat model found: install GitHub Copilot and sign in.',
            'anthropic not-configured key:none | No API key saved.',
            'openai not-configured key:none | No API key saved.',
            'ollama unavailable testable | Not reachable at http://localhost:11434: start Ollama, or change its server in the settings.',
        ]);
    });

    test('a saved or environment key, its model, a key that is not usable; providers outside the mode', () => {
        assert.deepStrictEqual(rows({ mode: 'byok-only' }, { anthropic: true, openai: false }, { anthropic: 'stored', openai: 'env' }), [
            'copilot not-used | Not used in the "byok-only" AI mode.',
            'anthropic available key:stored testable | Key saved; model claude-model.',
            'openai unavailable key:env testable | Key from the OPENAI_API_KEY environment variable, but it is not usable: OpenAI keys start with sk-.',
            'ollama not-used | Not used in the "byok-only" AI mode.',
        ]);
        assert.deepStrictEqual(rows({ mode: 'local-only' }, { ollama: true }), [
            'copilot not-used | Not used in the "local-only" AI mode.',
            'anthropic not-used key:none | Not used in the "local-only" AI mode.',
            'openai not-used key:none | Not used in the "local-only" AI mode.',
            'ollama available testable | Running at http://localhost:11434; model llama3.',
        ]);
        assert.deepStrictEqual(rows({ mode: 'copilot-only', ollamaEnabled: false }, { copilot: true }).map(r => r.split(' |')[0]),
            ['copilot available testable', 'anthropic not-used key:none', 'openai not-used key:none', 'ollama not-used']);
        assert.deepStrictEqual(rows({ ollamaEnabled: false }, { copilot: true }).slice(3),
            ['ollama off | Turned off (ditacraft.ai.provider.ollama.enabled).']);
    });

    test('the router uses the providers of the AI mode only (regression: copilot-only and byok-only also used Ollama and the API keys)', async function () {
        this.timeout(20000);
        const keys = { anthropicApiKey: 'sk-ant-0123456789012345678901234567890', openaiApiKey: 'sk-01234567890123456789012' };
        const ids = async (config: Partial<DitaCraftLLMConfig>) => {
            const router = new LLMRouterService();
            await router.initialize({ ...BASE, ollamaBaseUrl: NO_OLLAMA, ...keys, ...config }, { quiet: true });
            return (await router.getProviderStatuses()).map(s => s.provider.id);
        };
        assert.deepStrictEqual(await ids({ mode: 'auto' }), ['copilot', 'anthropic', 'openai', 'ollama']);
        assert.deepStrictEqual(await ids({ mode: 'copilot-only' }), ['copilot']);
        assert.deepStrictEqual(await ids({ mode: 'byok-only' }), ['anthropic', 'openai']);
        assert.deepStrictEqual(await ids({ mode: 'local-only' }), ['ollama']);
        assert.deepStrictEqual(await ids({ mode: 'auto', anthropicApiKey: undefined, ollamaEnabled: false }), ['copilot', 'openai']);
        assert.deepStrictEqual(await ids({ mode: 'typo' as DitaCraftLLMConfig['mode'] }), ['copilot', 'anthropic', 'openai', 'ollama'], 'an unknown mode is auto');
    });

    test('overlapping detections: the latest one wins, and each finished one is announced once', async function () {
        this.timeout(20000);
        const router = new LLMRouterService();
        let announced = 0;
        const sub = router.onDidInitialize(() => { announced++; });
        try {
            // auto without Copilot or keys probes Ollama at an address that never answers (its 2 s timeout)
            const slow = router.initialize({ ...BASE, ollamaBaseUrl: 'http://10.255.255.1:11434' }, { quiet: true });
            const fast = router.initialize({ ...BASE, mode: 'local-only', ollamaBaseUrl: NO_OLLAMA }, { quiet: true });
            await Promise.all([slow, fast]);
            assert.deepStrictEqual((await router.getProviderStatuses()).map(s => s.provider.id), ['ollama']);
            assert.strictEqual((await router.getProviderStatuses())[0].provider.displayName, 'Ollama (llama3)');
            assert.strictEqual(announced, 1, 'the superseded detection is not announced');
        } finally {
            sub.dispose();
        }
    });

    test('the default Anthropic and OpenAI models are current ones, the same in package.json and in the code (regression: claude-3-5-sonnet-20241022, retired; gpt-4o)', async () => {
        assert.strictEqual(DEFAULT_ANTHROPIC_MODEL, 'claude-sonnet-5-5');
        assert.strictEqual(DEFAULT_OPENAI_MODEL, 'gpt-6.1-sol');
        assert.strictEqual(new AnthropicLLMProvider('sk-ant-x').displayName, `Anthropic Claude (${DEFAULT_ANTHROPIC_MODEL})`, 'Anthropic provider default');
        assert.strictEqual(new OpenAILLMProvider('sk-x').displayName, `OpenAI (${DEFAULT_OPENAI_MODEL})`, 'OpenAI provider default');
        const secrets = { get: () => Promise.resolve(undefined) } as unknown as vscode.SecretStorage;
        const config = await buildLLMConfig(new SecretManager(secrets));
        const cfg = vscode.workspace.getConfiguration('ditacraft.ai');
        for (const [setting, expected, built] of [
            ['provider.anthropic.model', DEFAULT_ANTHROPIC_MODEL, config.anthropicModel],
            ['provider.openai.model', DEFAULT_OPENAI_MODEL, config.openaiModel],
        ] as const) {
            const inspected = cfg.inspect<string>(setting);
            assert.strictEqual(inspected?.defaultValue, expected, `package.json default of ${setting}`);
            if (inspected?.globalValue === undefined && inspected?.workspaceValue === undefined) {
                assert.strictEqual(built, expected, `configuration default of ${setting}`);
            }
        }
    });

    test('SecretManager.getApiKeySource: saved, from the environment, none', async () => {
        const store = new Map<string, string>();
        const secrets = {
            get: (k: string) => Promise.resolve(store.get(k)),
            store: (k: string, v: string) => { store.set(k, v); return Promise.resolve(); },
            delete: (k: string) => { store.delete(k); return Promise.resolve(); },
        } as unknown as vscode.SecretStorage;
        const manager = new SecretManager(secrets);
        const saved = process.env.ANTHROPIC_API_KEY;
        delete process.env.ANTHROPIC_API_KEY;
        try {
            assert.strictEqual(await manager.getApiKeySource('anthropic'), undefined);
            process.env.ANTHROPIC_API_KEY = 'sk-ant-env';
            assert.strictEqual(await manager.getApiKeySource('anthropic'), 'env');
            await manager.storeApiKey('anthropic', 'sk-ant-saved');
            assert.strictEqual(await manager.getApiKeySource('anthropic'), 'stored');
        } finally {
            if (saved === undefined) { delete process.env.ANTHROPIC_API_KEY; } else { process.env.ANTHROPIC_API_KEY = saved; }
        }
    });
});
