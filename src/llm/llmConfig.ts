/**
 * The LLM configuration snapshot: `ditacraft.ai.*` settings + API keys from SecretManager.
 */

import * as vscode from 'vscode';
import { DEFAULT_ANTHROPIC_MODEL, DEFAULT_OPENAI_MODEL, DitaCraftLLMConfig } from './types';
import { SecretManager } from './secretManager';
import { MODE_PROVIDERS } from './llmRouterService';

export const AI_MODES = Object.keys(MODE_PROVIDERS) as DitaCraftLLMConfig['mode'][];

export function aiMode(): DitaCraftLLMConfig['mode'] {
    const mode = vscode.workspace.getConfiguration('ditacraft.ai').get<string>('mode', 'auto');
    return (AI_MODES as string[]).includes(mode) ? mode as DitaCraftLLMConfig['mode'] : 'auto';
}

export async function buildLLMConfig(sm: SecretManager): Promise<DitaCraftLLMConfig> {
    const cfg = vscode.workspace.getConfiguration('ditacraft.ai');
    const [anthropicKey, openaiKey] = await Promise.all([
        sm.getApiKey('anthropic'),
        sm.getApiKey('openai'),
    ]);
    return {
        mode: aiMode(),
        anthropicApiKey: anthropicKey,
        anthropicModel: cfg.get<string>('provider.anthropic.model', DEFAULT_ANTHROPIC_MODEL),
        openaiApiKey: openaiKey,
        openaiModel: cfg.get<string>('provider.openai.model', DEFAULT_OPENAI_MODEL),
        ollamaEnabled: cfg.get<boolean>('provider.ollama.enabled', true),
        ollamaBaseUrl: cfg.get<string>('provider.ollama.baseUrl', 'http://localhost:11434'),
        ollamaModel: cfg.get<string>('provider.ollama.model', 'llama3'),
    };
}
