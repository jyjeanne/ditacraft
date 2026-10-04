/**
 * LLMRouterService — selects and manages the active LLM provider using
 * a priority cascade:
 *   1. GitHub Copilot  (vscode.lm API — no key required)
 *   2. Anthropic       (BYOK — Phase 2)
 *   3. OpenAI          (BYOK — Phase 2)
 *   4. Ollama          (local — Phase 3)
 *   5. None            → user notification, LSP features remain functional
 *
 * The service is initialized once during extension activation and can be
 * re-initialized when settings change.
 */

import * as vscode from 'vscode';
import { ConnectionCheck, ILLMProvider, LLMRequest, LLMResponse, DitaCraftLLMConfig, ProviderId } from './types';
import { CopilotLLMProvider } from './providers/copilotProvider';
import { AnthropicLLMProvider } from './providers/anthropicProvider';
import { OpenAILLMProvider } from './providers/openaiProvider';
import { OllamaLLMProvider } from './providers/ollamaProvider';
import { CircuitBreaker } from './circuitBreaker';
import { MetricsCollector } from './metricsCollector';
import { isAiEnabled } from './aiEnabled';

/** Wraps an ILLMProvider with a CircuitBreaker. */
class BreakerWrappedProvider implements ILLMProvider {
    private readonly _breaker: CircuitBreaker;

    constructor(
        private readonly _inner: ILLMProvider,
        breaker?: CircuitBreaker
    ) {
        this._breaker = breaker ?? new CircuitBreaker();
    }

    get id(): string { return this._inner.id; }
    get displayName(): string { return this._inner.displayName; }
    get supportsStreaming(): boolean { return this._inner.supportsStreaming; }
    get maxContextTokens(): number { return this._inner.maxContextTokens; }
    estimateTokenCount(text: string): number { return this._inner.estimateTokenCount(text); }

    async isAvailable(): Promise<boolean> {
        if (this._breaker.isOpen()) { return false; }
        return this._inner.isAvailable();
    }

    /** Runs whatever the breaker's state (the user asked); a success closes it. */
    async checkConnection(signal: AbortSignal): Promise<ConnectionCheck> {
        const check = await this._inner.checkConnection(signal);
        if (check.ok) { this._breaker.recordSuccess(); }
        return check;
    }

    async complete(request: LLMRequest): Promise<LLMResponse> {
        if (this._breaker.isOpen()) {
            throw new Error(`Circuit open for provider ${this.id}`);
        }
        try {
            const result = await this._inner.complete(request);
            this._breaker.recordSuccess();
            return result;
        } catch (err: unknown) {
            // AbortError is an intentional cancellation — not a provider failure
            if (isAbortError(err)) { throw err; }
            this._breaker.recordFailure();
            throw err;
        }
    }

    async stream(
        request: LLMRequest,
        onChunk: (chunk: string) => void,
        signal: AbortSignal
    ): Promise<void> {
        if (this._breaker.isOpen()) {
            throw new Error(`Circuit open for provider ${this.id}`);
        }
        try {
            await this._inner.stream(request, onChunk, signal);
            // Do NOT record success if the stream was aborted — that's not a real completion
            if (!signal.aborted) {
                this._breaker.recordSuccess();
            }
        } catch (err: unknown) {
            if (isAbortError(err)) { throw err; }
            this._breaker.recordFailure();
            throw err;
        }
    }
}

/** Returns true if an error is an intentional abort (AbortError / CancellationError). */
function isAbortError(err: unknown): boolean {
    if (err instanceof Error) {
        return err.name === 'AbortError' || err.message.includes('aborted');
    }
    return false;
}

/**
 * The providers each `ditacraft.ai.mode` may use, in priority order. `copilot-only` is Copilot
 * alone, `byok-only` the user's Anthropic and OpenAI keys alone, `local-only` Ollama alone.
 */
export const MODE_PROVIDERS: Readonly<Record<DitaCraftLLMConfig['mode'], readonly ProviderId[]>> = {
    'auto': ['copilot', 'anthropic', 'openai', 'ollama'],
    'copilot-only': ['copilot'],
    'byok-only': ['anthropic', 'openai'],
    'local-only': ['ollama'],
};

export class LLMRouterService {
    private providers: ILLMProvider[] = [];
    private _activeProvider: ILLMProvider | null = null;
    private _metrics: MetricsCollector | undefined;
    private _initialized = false;
    private _generation = 0;
    private readonly _onDidInitialize = new vscode.EventEmitter<void>();

    /** Fires when `initialize` has detected the providers (the AI settings panel shows them). */
    readonly onDidInitialize = this._onDidInitialize.event;

    /** Whether `initialize` has run (it doesn't at startup while DITA Craft AI is turned off). */
    get initialized(): boolean {
        return this._initialized;
    }

    /** The currently active provider, or null if none is available or DITA Craft AI is turned off. */
    get activeProvider(): ILLMProvider | null {
        return isAiEnabled() ? this._activeProvider : null;
    }

    /** Attach an optional MetricsCollector to record call stats. */
    setMetrics(metrics: MetricsCollector): void {
        this._metrics = metrics;
    }

    /**
     * Build the provider list from config and probe each one in priority order.
     * Must be called after extension activation (awaited inside fireAndForget).
     * `quiet` leaves out the "no provider" and configuration-conflict notifications
     * (the AI settings panel, opened while AI is turned off, shows the statuses itself).
     */
    async initialize(config: DitaCraftLLMConfig, { quiet = false }: { quiet?: boolean } = {}): Promise<void> {
        // Initializations can overlap (a setting changed while one probes): the latest one wins.
        const generation = ++this._generation;
        this._initialized = true;
        const providers = this.buildProviders(config, quiet);

        let active: ILLMProvider | null = null;
        for (const provider of providers) {
            if (await provider.isAvailable()) {
                active = provider;
                break;
            }
        }
        if (generation !== this._generation) { return; }
        this.providers = providers;
        this._activeProvider = active;
        this._onDidInitialize.fire();

        if (!this._activeProvider) {
            if (quiet) { return; }
            void vscode.window.showWarningMessage(
                'DITA Craft AI: No LLM provider available. ' +
                'Configure GitHub Copilot or an API key in Settings → DITA Craft AI.'
            );
        } else {
            this._metrics?.record({
                provider: this._activeProvider.id,
                command: 'initialize',
                durationMs: 0,
                promptTokens: 0,
                completionTokens: 0,
                success: true,
                fallback: false,
            });
        }
    }

    /**
     * The Configure AI panel's Test: a real connection check of a provider (its service reached with
     * its key and model). A provider that passes becomes the active one; an active provider that
     * fails gives way to the next available one.
     */
    async testProvider(providerId: ProviderId, signal: AbortSignal = new AbortController().signal): Promise<ConnectionCheck> {
        const provider = this.providers.find(p => p.id === providerId);
        if (!provider) {
            return { ok: false, detail: 'Not checked: it has no key, or the AI mode or settings leave it out.' };
        }
        const check = await provider.checkConnection(signal);
        if (check.ok) {
            this._activeProvider = provider;
        } else if (this._activeProvider === provider) {
            this._activeProvider = null;
            for (const other of this.providers) {
                if (other !== provider && await other.isAvailable()) {
                    this._activeProvider = other;
                    break;
                }
            }
        }
        return check;
    }

    /** Probe all providers and return their availability status. */
    async getProviderStatuses(): Promise<Array<{ provider: ILLMProvider; available: boolean }>> {
        return Promise.all(
            this.providers.map(async provider => ({
                provider,
                available: await provider.isAvailable(),
            }))
        );
    }

    private buildProviders(config: DitaCraftLLMConfig, quiet: boolean): ILLMProvider[] {
        // Detect unsolvable config conflict before building the list
        if (!quiet && config.mode === 'local-only' && config.ollamaEnabled === false) {
            void vscode.window.showErrorMessage(
                'DITA Craft AI: Configuration conflict — "local-only" mode requires Ollama, ' +
                'but Ollama is disabled. Enable Ollama or change the AI mode in Settings → DITA Craft AI.'
            );
        }

        const list: ILLMProvider[] = [];
        // An unknown mode (a typo in settings.json) counts as `auto`.
        const allowed = MODE_PROVIDERS[config.mode] ?? MODE_PROVIDERS.auto;

        if (allowed.includes('copilot')) {
            list.push(new BreakerWrappedProvider(new CopilotLLMProvider()));
        }
        if (allowed.includes('anthropic') && config.anthropicApiKey) {
            list.push(new BreakerWrappedProvider(
                new AnthropicLLMProvider(config.anthropicApiKey, config.anthropicModel)
            ));
        }
        if (allowed.includes('openai') && config.openaiApiKey) {
            list.push(new BreakerWrappedProvider(
                new OpenAILLMProvider(config.openaiApiKey, config.openaiModel)
            ));
        }
        if (allowed.includes('ollama') && config.ollamaEnabled !== false) {
            list.push(new BreakerWrappedProvider(
                new OllamaLLMProvider(config.ollamaBaseUrl, config.ollamaModel)
            ));
        }

        return list;
    }
}
