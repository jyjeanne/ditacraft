/**
 * AnthropicLLMProvider — LLM provider backed by the Anthropic Claude API (BYOK).
 *
 * Requires an API key stored via SecretManager under key `ditacraft.anthropic.apiKey`
 * or environment variable `ANTHROPIC_API_KEY`.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { RawMessageStreamEvent } from '@anthropic-ai/sdk/resources/messages/messages';
import { ILLMProvider, LLMRequest, LLMResponse } from '../types';

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

    constructor(apiKey: string, model = 'claude-3-5-sonnet-20241022') {
        this._model = model;
        this._apiKey = apiKey;
        this._client = new Anthropic({ apiKey });
    }

    async isAvailable(): Promise<boolean> {
        // Validate key format without network call: Anthropic keys start with 'sk-ant-'
        return this._apiKey.startsWith('sk-ant-') && this._apiKey.length > 30;
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
