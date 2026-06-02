/**
 * OllamaLLMProvider — local Ollama inference via HTTP API.
 *
 * Spec §3.5: isAvailable() probes /api/tags with a 2-second timeout.
 * Streaming uses POST /api/chat with stream:true (newline-delimited JSON).
 * Complete (non-streaming) uses the same endpoint with stream:false.
 */

import { ILLMProvider, LLMRequest, LLMResponse } from '../types';

export class OllamaLLMProvider implements ILLMProvider {
    readonly id = 'ollama';
    readonly supportsStreaming = true;
    readonly maxContextTokens = 8192;

    private readonly _baseUrl: string;
    private readonly _model: string;

    constructor(baseUrl = 'http://localhost:11434', model = 'llama3') {
        // Strip trailing slash
        this._baseUrl = baseUrl.replace(/\/$/, '');
        this._model = model;
    }

    get displayName(): string {
        return `Ollama (${this._model})`;
    }

    async isAvailable(): Promise<boolean> {
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 2000);
            try {
                const res = await fetch(`${this._baseUrl}/api/tags`, {
                    signal: controller.signal,
                });
                return res.ok;
            } finally {
                clearTimeout(timer);
            }
        } catch {
            return false;
        }
    }

    async complete(request: LLMRequest): Promise<LLMResponse> {
        const messages = this._buildMessages(request);
        const res = await fetch(`${this._baseUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: this._model, messages, stream: false }),
        });

        if (!res.ok) {
            throw new Error(`Ollama error ${res.status}: ${await res.text()}`);
        }

        const data = (await res.json()) as {
            message?: { content?: string };
            prompt_eval_count?: number;
            eval_count?: number;
        };

        const content = data.message?.content ?? '';
        return {
            content,
            model: this._model,
            promptTokens: data.prompt_eval_count ?? 0,
            completionTokens: data.eval_count ?? 0,
            finishReason: 'stop',
        };
    }

    async stream(
        request: LLMRequest,
        onChunk: (chunk: string) => void,
        signal: AbortSignal
    ): Promise<void> {
        const messages = this._buildMessages(request);
        const res = await fetch(`${this._baseUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: this._model, messages, stream: true }),
            signal,
        });

        if (!res.ok) {
            throw new Error(`Ollama error ${res.status}: ${await res.text()}`);
        }

        if (!res.body) { return; }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let streamCompleted = false;

        try {
            while (true) {
                if (signal.aborted) { break; }
                const { done, value } = await reader.read();
                if (done) { break; }

                buffer += decoder.decode(value, { stream: true });

                // Ollama sends one JSON object per line
                const lines = buffer.split('\n');
                buffer = lines.pop() ?? '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed) { continue; }
                    try {
                        const chunk = JSON.parse(trimmed) as {
                            message?: { content?: string };
                            done?: boolean;
                        };
                        const delta = chunk.message?.content;
                        if (delta) { onChunk(delta); }
                        if (chunk.done) {
                            streamCompleted = true;
                            return;
                        }
                    } catch {
                        // Malformed line — skip
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }

        // If the stream ended without a done:true marker and was not intentionally aborted,
        // throw so the circuit breaker can record a failure.
        if (!streamCompleted && !signal.aborted) {
            throw new Error(`Ollama stream ended without completion marker (model: ${this._model})`);
        }
    }

    estimateTokenCount(text: string): number {
        return Math.ceil(text.length / 4);
    }

    private _buildMessages(request: LLMRequest): Array<{ role: string; content: string }> {
        const messages: Array<{ role: string; content: string }> = [];
        if (request.systemPrompt) {
            messages.push({ role: 'system', content: request.systemPrompt });
        }
        if (request.history) {
            for (const m of request.history) {
                messages.push({ role: m.role, content: m.content });
            }
        }
        messages.push({ role: 'user', content: request.userMessage });
        return messages;
    }
}
