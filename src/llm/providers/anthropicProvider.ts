/**
 * AnthropicLLMProvider — LLM provider backed by the Anthropic Claude API (BYOK).
 *
 * Requires an API key stored via SecretManager under key `ditacraft.anthropic.apiKey`
 * or environment variable `ANTHROPIC_API_KEY`.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { RawMessageStreamEvent } from '@anthropic-ai/sdk/resources/messages/messages';
import { CHECK_TIMEOUT_MS, ConnectionCheck, DEFAULT_ANTHROPIC_MODEL, ILLMProvider, LLMRequest, LLMResponse, ProviderOptions } from '../types';
import { ApiFailure, connectionReason, describeApiFailure } from './connectionCheck';

export class AnthropicLLMProvider implements ILLMProvider {
    readonly id = 'anthropic';
    readonly supportsStreaming = true;
    readonly maxContextTokens = 200_000;

    get displayName(): string {
        return `Anthropic Claude (${this._model})`;
    }

    private readonly _model: string;
    private readonly _apiKey: string;
    private readonly _client: Anthropic;
    private readonly _checkTimeoutMs: number;

    constructor(apiKey: string, model = DEFAULT_ANTHROPIC_MODEL, options: ProviderOptions = {}) {
        this._model = model;
        this._apiKey = apiKey;
        this._client = new Anthropic({ apiKey, baseURL: options.baseURL });
        this._checkTimeoutMs = options.checkTimeoutMs ?? CHECK_TIMEOUT_MS;
    }

    async isAvailable(): Promise<boolean> {
        // Validate key format without network call: Anthropic keys start with 'sk-ant-'
        return this._apiKey.startsWith('sk-ant-') && this._apiKey.length > 30;
    }

    /** Looks the model up with the key (GET /v1/models/{model}): checks both, generates nothing. */
    async checkConnection(signal: AbortSignal): Promise<ConnectionCheck> {
        try {
            const info = await this._client.models.retrieve(this._model, {}, {
                signal, timeout: this._checkTimeoutMs, maxRetries: 0,
            });
            const name = info.display_name && info.display_name !== info.id ? `${info.display_name} (${info.id})` : info.id;
            return { ok: true, detail: `Connected to Anthropic: the key works and model ${name} is available.` };
        } catch (error: unknown) {
            return { ok: false, detail: describeApiFailure(anthropicFailure(error), 'Anthropic', this._model, this._checkTimeoutMs) };
        }
    }

    async complete(request: LLMRequest): Promise<LLMResponse> {
        const chunks: string[] = [];
        const controller = new AbortController();
        await this.stream(request, chunk => chunks.push(chunk), controller.signal);
        const content = chunks.join('');
        return {
            content,
            model: this._model,
            promptTokens: this.estimateTokenCount(request.systemPrompt + request.userMessage),
            completionTokens: this.estimateTokenCount(content),
            finishReason: 'stop',
        };
    }

    async stream(
        request: LLMRequest,
        onChunk: (chunk: string) => void,
        signal: AbortSignal
    ): Promise<void> {
        const stream = this._client.messages.stream({
            model: this._model,
            max_tokens: request.maxTokens ?? 4096,
            system: request.systemPrompt,
            messages: [{ role: 'user', content: request.userMessage }],
        });

        // Register abort listener before the loop to avoid the race window
        const abortListener = () => stream.abort();
        signal.addEventListener('abort', abortListener, { once: true });

        try {
            for await (const event of stream as AsyncIterable<RawMessageStreamEvent>) {
                if (signal.aborted) { break; }
                if (
                    event.type === 'content_block_delta' &&
                    event.delta.type === 'text_delta'
                ) {
                    onChunk((event.delta as { type: 'text_delta'; text: string }).text);
                }
            }
        } finally {
            signal.removeEventListener('abort', abortListener);
        }
    }

    estimateTokenCount(text: string): number {
        return Math.ceil(text.length / 4);
    }
}

function anthropicFailure(error: unknown): ApiFailure {
    // Subclasses first: a timeout is a connection error, which is an API error without a status.
    if (error instanceof Anthropic.APIUserAbortError) { return { kind: 'abort', message: error.message }; }
    if (error instanceof Anthropic.APIConnectionTimeoutError) { return { kind: 'timeout', message: error.message }; }
    if (error instanceof Anthropic.APIConnectionError) { return { kind: 'connection', message: connectionReason(error) }; }
    if (error instanceof Anthropic.APIError) { return { status: error.status, message: error.message }; }
    return { message: error instanceof Error ? error.message : String(error) };
}
