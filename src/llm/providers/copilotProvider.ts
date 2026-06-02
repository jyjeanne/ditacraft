/**
 * CopilotLLMProvider — LLM provider backed by the GitHub Copilot subscription
 * via the VS Code `vscode.lm` API.
 *
 * No API key required: works transparently when the user has an active
 * Copilot subscription and VS Code 1.90+.
 */

import * as vscode from 'vscode';
import { ILLMProvider, LLMRequest, LLMResponse } from '../types';

export class CopilotLLMProvider implements ILLMProvider {
    readonly id = 'copilot';
    readonly supportsStreaming = true;
    readonly maxContextTokens = 128_000;

    get displayName(): string {
        return 'GitHub Copilot';
    }

    async isAvailable(): Promise<boolean> {
        try {
            const models = await vscode.lm.selectChatModels({ vendor: 'copilot' });
            return models.length > 0;
        } catch {
            return false;
        }
    }

    async complete(request: LLMRequest): Promise<LLMResponse> {
        const chunks: string[] = [];
        let model = 'copilot';
        await this.stream(
            request,
            chunk => chunks.push(chunk),
            new AbortController().signal
        );
        // selectChatModels is used inside stream; capture model id separately
        try {
            const [selected] = await vscode.lm.selectChatModels({ vendor: 'copilot' });
            if (selected) {
                model = selected.id;
            }
        } catch { /* keep default */ }

        const content = chunks.join('');
        return {
            content,
            model,
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
        const models = await vscode.lm.selectChatModels({ vendor: 'copilot' });
        if (models.length === 0) {
            throw new Error('No Copilot model available. Ensure GitHub Copilot is installed and signed in.');
        }
        const [model] = models;

        const messages: vscode.LanguageModelChatMessage[] = [
            vscode.LanguageModelChatMessage.User(request.systemPrompt),
            vscode.LanguageModelChatMessage.User(request.userMessage),
        ];

        const cts = new vscode.CancellationTokenSource();
        signal.addEventListener('abort', () => cts.cancel());
        const response = await model.sendRequest(messages, {}, cts.token);
        try {
            for await (const chunk of response.text) {
                if (signal.aborted) {
                    break;
                }
                onChunk(chunk);
            }
        } finally {
            cts.dispose();
        }
    }

    estimateTokenCount(text: string): number {
        // Rough estimate: ~4 chars per token (GPT-class models)
        return Math.ceil(text.length / 4);
    }
}
