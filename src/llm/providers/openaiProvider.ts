/**
 * OpenAILLMProvider — LLM provider backed by the OpenAI API (BYOK).
 *
 * Requires an API key stored via SecretManager under key `ditacraft.openai.apiKey`
 * or environment variable `OPENAI_API_KEY`.
 */

import OpenAI from 'openai';
import type { ChatCompletionCreateParamsStreaming } from 'openai/resources/chat/completions';
import { CHECK_TIMEOUT_MS, ConnectionCheck, DEFAULT_OPENAI_MODEL, ILLMProvider, LLMRequest, LLMResponse, ProviderOptions } from '../types';
import { ApiFailure, connectionReason, describeApiFailure } from './connectionCheck';

/**
 * OpenAI's reasoning models: the o-series, and GPT-5 and later except their `-chat` variants.
 * They think before answering, accept only the default temperature, and count their reasoning
 * tokens in `max_completion_tokens` (they refuse `max_tokens`).
 */
export function isReasoningModel(model: string): boolean {
    if (/^o\d/.test(model)) { return true; }
    const major = /^gpt-(\d+)/.exec(model);
    return major !== null && Number(major[1]) >= 5 && !model.includes('-chat');
}

/** Room for a reasoning model's thinking on top of the answer: OpenAI advises reserving 25,000 tokens. */
const REASONING_HEADROOM = 25_000;

/** The request's length and sampling parameters for the model. Exported for testing. */
export function chatParameters(model: string, request: LLMRequest):
    Pick<ChatCompletionCreateParamsStreaming, 'max_completion_tokens' | 'temperature' | 'reasoning_effort'> {
    const maxTokens = request.maxTokens ?? 4096;
    if (isReasoningModel(model)) {
        // Low effort: the requests are short, focused edits, and the answer stays quick.
        return { max_completion_tokens: maxTokens + REASONING_HEADROOM, reasoning_effort: 'low' };
    }
    return { max_completion_tokens: maxTokens, temperature: request.temperature ?? 0.2 };
}

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
    private readonly _checkTimeoutMs: number;

    constructor(apiKey: string, model = DEFAULT_OPENAI_MODEL, options: ProviderOptions = {}) {
        this._model = model;
        this._apiKey = apiKey;
        this._client = new OpenAI({ apiKey, baseURL: options.baseURL });
        this._checkTimeoutMs = options.checkTimeoutMs ?? CHECK_TIMEOUT_MS;
    }

    async isAvailable(): Promise<boolean> {
        // Validate key format without network call: OpenAI keys start with 'sk-'
        return this._apiKey.startsWith('sk-') && this._apiKey.length > 20;
    }

    /** Looks the model up with the key (GET /v1/models/{model}): checks both, generates nothing. */
    async checkConnection(signal: AbortSignal): Promise<ConnectionCheck> {
        try {
            const model = await this._client.models.retrieve(this._model, {
                signal, timeout: this._checkTimeoutMs, maxRetries: 0,
            });
            return { ok: true, detail: `Connected to OpenAI: the key works and model ${model.id} is available.` };
        } catch (error: unknown) {
            return { ok: false, detail: describeApiFailure(openaiFailure(error), 'OpenAI', this._model, this._checkTimeoutMs) };
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
        const stream = await this._client.chat.completions.create(
            {
                model: this._model,
                ...chatParameters(this._model, request),
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

function openaiFailure(error: unknown): ApiFailure {
    // Subclasses first: a timeout is a connection error, which is an API error without a status.
    if (error instanceof OpenAI.APIUserAbortError) { return { kind: 'abort', message: error.message }; }
    if (error instanceof OpenAI.APIConnectionTimeoutError) { return { kind: 'timeout', message: error.message }; }
    if (error instanceof OpenAI.APIConnectionError) { return { kind: 'connection', message: connectionReason(error) }; }
    if (error instanceof OpenAI.APIError) { return { status: error.status, message: error.message }; }
    return { message: error instanceof Error ? error.message : String(error) };
}
