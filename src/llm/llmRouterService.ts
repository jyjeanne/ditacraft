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
import { ILLMProvider, LLMRequest, LLMResponse, DitaCraftLLMConfig, ProviderId } from './types';
import { CopilotLLMProvider } from './providers/copilotProvider';
import { AnthropicLLMProvider } from './providers/anthropicProvider';
import { OpenAILLMProvider } from './providers/openaiProvider';
import { OllamaLLMProvider } from './providers/ollamaProvider';
import { CircuitBreaker } from './circuitBreaker';
import { MetricsCollector } from './metricsCollector';

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

export class LLMRouterService {
    private providers: ILLMProvider[] = [];
    private _activeProvider: ILLMProvider | null = null;
    private _metrics: MetricsCollector | undefined;

    /** The currently active provider, or null if none is available. */
    get activeProvider(): ILLMProvider | null {
        return this._activeProvider;
    }

    /** Attach an optional MetricsCollector to record call stats. */
    setMetrics(metrics: MetricsCollector): void {
        this._metrics = metrics;
    }

    /**
     * Build the provider list from config and probe each one in priority order.
     * Must be called after extension activation (awaited inside fireAndForget).
     */
    async initialize(config: DitaCraftLLMConfig): Promise<void> {
        this.providers = this.buildProviders(config);
        this._activeProvider = null;

        for (const provider of this.providers) {
            if (await provider.isAvailable()) {
                this._activeProvider = provider;
                break;
            }
        }

        if (!this._activeProvider) {
            void vscode.window.showWarningMessage(
                'DitaCraft AI: No LLM provider available. ' +
                'Configure GitHub Copilot or an API key in Settings → DitaCraft AI.'
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
     * Attempt to force a specific provider (e.g. from the Configure AI panel).
     * Returns true if the provider is available and is now active.
     */
    async forceProvider(providerId: ProviderId): Promise<boolean> {
        const provider = this.providers.find(p => p.id === providerId);
        if (provider && (await provider.isAvailable())) {
            this._activeProvider = provider;
            return true;
        }
        return false;
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

    private buildProviders(config: DitaCraftLLMConfig): ILLMProvider[] {
        // Detect unsolvable config conflict before building the list
        if (config.mode === 'local-only' && config.ollamaEnabled === false) {
            void vscode.window.showErrorMessage(
                'DitaCraft AI: Configuration conflict — "local-only" mode requires Ollama, ' +
                'but Ollama is disabled. Enable Ollama or change the AI mode in Settings → DitaCraft AI.'
            );
        }

        const list: ILLMProvider[] = [];

        if (config.mode !== 'byok-only' && config.mode !== 'local-only') {
            list.push(new BreakerWrappedProvider(new CopilotLLMProvider()));
        }

        if (config.mode !== 'local-only') {
            if (config.anthropicApiKey) {
                list.push(new BreakerWrappedProvider(
                    new AnthropicLLMProvider(config.anthropicApiKey, config.anthropicModel)
                ));
            }
            if (config.openaiApiKey) {
                list.push(new BreakerWrappedProvider(
                    new OpenAILLMProvider(config.openaiApiKey, config.openaiModel)
                ));
            }
        }

        if (config.ollamaEnabled !== false) {
            list.push(new BreakerWrappedProvider(
                new OllamaLLMProvider(config.ollamaBaseUrl, config.ollamaModel)
            ));
        }

        return list;
    }
}
