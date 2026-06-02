/**
 * OpenAILLMProvider — LLM provider backed by the OpenAI API (BYOK).
 *
 * Requires an API key stored via SecretManager under key `ditacraft.openai.apiKey`
 * or environment variable `OPENAI_API_KEY`.
 */

import OpenAI from 'openai';
import { ILLMProvider, LLMRequest, LLMResponse } from '../types';

export class OpenAILLMProvider implements ILLMProvider {
    readonly id = 'openai';
    readonly supportsStreaming = true;
    readonly maxContextTokens = 128_000;

    get displayName(): string {
        return `OpenAI (${this._model})`;
    }

    private readonly _model: string;
    private readonly _apiKey: string;
    private readonly _client: OpenAI;

    constructor(apiKey: string, model = 'gpt-4o') {
        this._model = model;
        this._apiKey = apiKey;
        this._client = new OpenAI({ apiKey });
    }

    async isAvailable(): Promise<boolean> {
        // Validate key format without network call: OpenAI keys start with 'sk-'
        return this._apiKey.startsWith('sk-') && this._apiKey.length > 20;
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
        const stream = await this._client.chat.completions.create(
            {
                model: this._model,
                max_tokens: request.maxTokens ?? 4096,
                temperature: request.temperature ?? 0.2,
                messages: [
                    { role: 'system', content: request.systemPrompt },
                    { role: 'user', content: request.userMessage },
                ],
                stream: true,
            },
            { signal }
        );

        for await (const chunk of stream) {
            if (signal.aborted) {
                break;
            }
            const content = chunk.choices?.[0]?.delta?.content ?? '';
            if (content) {
                onChunk(content);
            }
        }
    }

    estimateTokenCount(text: string): number {
        return Math.ceil(text.length / 4);
    }
}
