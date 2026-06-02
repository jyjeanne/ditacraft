/**
 * Core type definitions for DitaCraft LLM integration.
 * All LLM providers implement ILLMProvider; all requests/responses
 * flow through LLMRequest / LLMResponse for provider-agnostic handling.
 */

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface LLMRequest {
    systemPrompt: string;
    userMessage: string;
    history?: ChatMessage[];
    maxTokens?: number;
    temperature?: number;
    responseFormat?: 'text' | 'json';
}

export interface LLMResponse {
    content: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    finishReason: 'stop' | 'length' | 'error';
}

/**
 * Common interface for all LLM providers (Copilot, Anthropic, OpenAI, Ollama).
 * Providers are stateless streaming sources; state/routing lives in LLMRouterService.
 */
export interface ILLMProvider {
    /** Stable identifier used by LLMRouterService (e.g. "copilot", "anthropic"). */
    readonly id: string;
    /** Human-readable label shown in the UI (e.g. "GitHub Copilot (GPT-4o)"). */
    readonly displayName: string;
    readonly supportsStreaming: boolean;
    readonly maxContextTokens: number;

    /** Returns true when this provider is usable in the current environment. */
    isAvailable(): Promise<boolean>;

    /** Non-streaming completion — use for quick fixes and short responses. */
    complete(request: LLMRequest): Promise<LLMResponse>;

    /**
     * Streaming completion — calls onChunk for each text delta.
     * Implementors must respect signal.aborted and stop producing chunks.
     */
    stream(
        request: LLMRequest,
        onChunk: (chunk: string) => void,
        signal: AbortSignal
    ): Promise<void>;

    /** Rough token count estimate (characters ÷ 4 is acceptable). */
    estimateTokenCount(text: string): number;
}

/** Union of all supported provider identifiers. */
export type ProviderId = 'copilot' | 'anthropic' | 'openai' | 'ollama';

/** Configuration snapshot passed to LLMRouterService.initialize(). */
export interface DitaCraftLLMConfig {
    mode: 'auto' | 'copilot-only' | 'byok-only' | 'local-only';
    anthropicApiKey?: string;
    anthropicModel?: string;
    openaiApiKey?: string;
    openaiModel?: string;
    ollamaEnabled?: boolean;
    ollamaBaseUrl?: string;
    ollamaModel?: string;
}
