/**
 * AI Quick Fix provider: which diagnostics get the "Fix with DITA Craft AI" action.
 * The repair itself (an LLM call) is not exercised here.
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { AIQuickFixProvider, isAiFixable } from '../../providers/aiQuickFixProvider';
import type { AIServiceOrchestrator } from '../../llm/aiServiceOrchestrator';

function diagnostic(source: string | undefined, code: string | { value: string; target: vscode.Uri }, severity = vscode.DiagnosticSeverity.Error): vscode.Diagnostic {
    const d = new vscode.Diagnostic(new vscode.Range(0, 0, 0, 5), 'problem', severity);
    d.source = source;
    d.code = code;
    return d;
}

suite('AI Quick Fix Provider Test Suite', () => {
    test('isAiFixable: the language server\'s own diagnostics with an AI-fixable code (regression: it required a "DitaCraft" source, which none has)', () => {
        assert.strictEqual(isAiFixable(diagnostic('dita-lsp', 'DITA-CM-001')), true, 'content model, dita-lsp');
        assert.strictEqual(isAiFixable(diagnostic('dita-lsp', 'DITA-STRUCT-004', vscode.DiagnosticSeverity.Warning)), true, 'a warning');
        assert.strictEqual(isAiFixable(diagnostic('dita-dtd', 'DITA-DTD-001')), true, 'DTD validation');
        assert.strictEqual(isAiFixable(diagnostic('dita-rng', 'DITA-RNG-001')), true, 'RelaxNG validation');
        assert.strictEqual(isAiFixable(diagnostic('dita-lsp', { value: 'DITA-XREF-003', target: vscode.Uri.parse('https://example.com') })), true, 'a code with a link');
    });

    test('isAiFixable: not another extension\'s diagnostic, not information or hints, not other codes', () => {
        assert.strictEqual(isAiFixable(diagnostic('other-extension', 'DITA-CM-001')), false);
        assert.strictEqual(isAiFixable(diagnostic(undefined, 'DITA-CM-001')), false);
        assert.strictEqual(isAiFixable(diagnostic('dita-lsp', 'DITA-CM-001', vscode.DiagnosticSeverity.Information)), false);
        assert.strictEqual(isAiFixable(diagnostic('dita-lsp', 'DITA-CM-001', vscode.DiagnosticSeverity.Hint)), false);
        assert.strictEqual(isAiFixable(diagnostic('dita-lsp', 'DITA-ID-001')), false, 'not an AI-fixable code');
    });

    test('provideCodeActions: one "Fix with DITA Craft AI" per fixable diagnostic, none when AI is turned off', async () => {
        const provider = new AIQuickFixProvider({} as AIServiceOrchestrator);
        const document = await vscode.workspace.openTextDocument({ language: 'dita', content: '<topic id="t"><body/></topic>' });
        const context = (diagnostics: vscode.Diagnostic[]): vscode.CodeActionContext =>
            ({ diagnostics, only: undefined, triggerKind: vscode.CodeActionTriggerKind.Invoke });
        const token = new vscode.CancellationTokenSource().token;
        const range = new vscode.Range(0, 0, 0, 5);

        const actions = provider.provideCodeActions(document, range, context([diagnostic('dita-lsp', 'DITA-STRUCT-004'), diagnostic('dita-lsp', 'DITA-ID-001')]), token);
        assert.deepStrictEqual(actions?.map(a => a.title), ['$(wand) Fix with DITA Craft AI']);

        const config = vscode.workspace.getConfiguration('ditacraft.ai');
        await config.update('enabled', false, vscode.ConfigurationTarget.Global);
        try {
            assert.strictEqual(provider.provideCodeActions(document, range, context([diagnostic('dita-lsp', 'DITA-STRUCT-004')]), token), undefined, 'ditacraft.ai.enabled off');
        } finally {
            await config.update('enabled', undefined, vscode.ConfigurationTarget.Global);
        }
    });
});
