/**
 * SecretManager — secure storage for LLM API keys.
 *
 * Primary store: vscode.SecretStorage (encrypted, not in settings.json).
 * Fallback: environment variables (CI/CD and power-user scenarios).
 * Keys never appear in logs.
 */

import * as vscode from 'vscode';

const KEY_PREFIX = 'ditacraft';

export class SecretManager {
    constructor(private readonly secrets: vscode.SecretStorage) {}

    async storeApiKey(provider: string, key: string): Promise<void> {
        await this.secrets.store(`${KEY_PREFIX}.${provider}.apiKey`, key);
    }

    async getApiKey(provider: string): Promise<string | undefined> {
        const stored = await this.secrets.get(`${KEY_PREFIX}.${provider}.apiKey`);
        if (stored) {
            return stored;
        }
        // Fallback to environment variable (e.g. ANTHROPIC_API_KEY, OPENAI_API_KEY)
        return process.env[`${provider.toUpperCase()}_API_KEY`];
    }

    async deleteApiKey(provider: string): Promise<void> {
        await this.secrets.delete(`${KEY_PREFIX}.${provider}.apiKey`);
    }

    /** Returns true if a key is configured (stored or env var). */
    async hasApiKey(provider: string): Promise<boolean> {
        return (await this.getApiKey(provider)) !== undefined;
    }
}
