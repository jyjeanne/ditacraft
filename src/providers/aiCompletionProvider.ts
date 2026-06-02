/**
 * AICompletionProvider — F4: AI-enriched DITA completion.
 *
 * Registers as a VS Code CompletionItemProvider for DITA files.
 * Non-blocking: if the AI takes > 500ms the promise races to empty.
 * All items are visually distinguished with a "(AI)" suffix and a lower
 * sort priority than native LSP completions.
 */

import * as vscode from 'vscode';
import { AIServiceOrchestrator } from '../llm/aiServiceOrchestrator';

const AI_COMPLETION_TIMEOUT_MS = 500;
const DITA_SELECTOR: vscode.DocumentSelector = [
    { language: 'dita', scheme: 'file' },
    { language: 'ditamap', scheme: 'file' },
    { language: 'xml', pattern: '**/*.{dita,ditamap}', scheme: 'file' },
];

export class AICompletionProvider implements vscode.CompletionItemProvider {
    constructor(private readonly _orchestrator: AIServiceOrchestrator) {}

    async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        _context: vscode.CompletionContext
    ): Promise<vscode.CompletionList | null> {
        const cfg = vscode.workspace.getConfiguration('ditacraft.ai');
        if (!cfg.get<boolean>('completion.enabled', true)) { return null; }

        const linePrefix = document.lineAt(position).text.slice(0, position.character);

        // Only trigger inside XML tags (after '<' or inside attribute values)
        if (!linePrefix.includes('<') && !linePrefix.includes('"')) {
            return null;
        }

        try {
            const items = await this._fetchWithTimeout(document, position, token);
            if (!items || items.length === 0) { return null; }
            // isIncomplete: false — we provide the full set for this context
            return new vscode.CompletionList(items, false);
        } catch {
            return null;
        }
    }

    private _fetchWithTimeout(
        document: vscode.TextDocument,
        position: vscode.Position,
        vsToken: vscode.CancellationToken
    ): Promise<vscode.CompletionItem[]> {
        // Internal controller to cancel the LLM call when the timeout fires
        const cts = new vscode.CancellationTokenSource();

        const timeout = new Promise<vscode.CompletionItem[]>(resolve =>
            setTimeout(() => {
                cts.cancel();
                resolve([]);
            }, AI_COMPLETION_TIMEOUT_MS)
        );

        const cancelled = new Promise<vscode.CompletionItem[]>(resolve => {
            vsToken.onCancellationRequested(() => {
                cts.cancel();
                resolve([]);
            });
        });

        // Use the internal token so the LLM call respects both timeout and external cancel
        const aiPromise = this._getAiCompletions(document, position, cts.token)
            .finally(() => cts.dispose());

        return Promise.race([aiPromise, timeout, cancelled]);
    }

    private async _getAiCompletions(
        document: vscode.TextDocument,
        position: vscode.Position,
        vsToken: vscode.CancellationToken
    ): Promise<vscode.CompletionItem[]> {
        // Extract ±3 lines of context around the cursor
        const startLine = Math.max(0, position.line - 3);
        const endLine = Math.min(document.lineCount - 1, position.line + 3);
        const contextFragment = document.getText(
            new vscode.Range(startLine, 0, endLine, document.lineAt(endLine).text.length)
        );
        const cursorInContext = position.line - startLine;
        const linePrefix = document.lineAt(position).text.slice(0, position.character);

        const prompt =
            `Complete the DITA XML at the cursor (marked with ▶).\n` +
            `Context:\n${this._insertCursor(contextFragment, cursorInContext, linePrefix)}\n\n` +
            `Return up to 5 completion suggestions, one per line, as plain text continuations ` +
            `(no XML wrapping). If no meaningful completion exists, return empty.`;

        const suggestions: string[] = [];

        await this._orchestrator.streamRaw(
            prompt,
            chunk => { suggestions.push(chunk); },
            vsToken
        );

        const raw = suggestions.join('').trim();
        if (!raw) { return []; }

        return raw
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .slice(0, 5)
            .map((suggestion, idx) => {
                const item = new vscode.CompletionItem(
                    `${suggestion} (AI)`,
                    vscode.CompletionItemKind.Snippet
                );
                item.insertText = suggestion;
                item.detail = 'DitaCraft AI';
                item.documentation = new vscode.MarkdownString(
                    `AI-suggested DITA completion via DitaCraft.`
                );
                // Sort below native LSP items (zzz prefix pushes to bottom)
                item.sortText = `zzz${String(idx).padStart(2, '0')}`;
                item.filterText = suggestion;
                return item;
            });
    }

    private _insertCursor(context: string, cursorLine: number, linePrefix: string): string {
        const lines = context.split('\n');
        if (cursorLine < lines.length) {
            lines[cursorLine] = linePrefix + '▶';
        }
        return lines.join('\n');
    }
}

/**
 * Register the AI completion provider.
 * Returns the disposable to add to context.subscriptions.
 */
export function registerAICompletionProvider(
    orchestrator: AIServiceOrchestrator
): vscode.Disposable {
    return vscode.languages.registerCompletionItemProvider(
        DITA_SELECTOR,
        new AICompletionProvider(orchestrator),
        '<', '"', ' '
    );
}
