/**
 * AI Quick Fix CodeActionProvider (F3)
 *
 * For diagnostics matching the AI-fixable code list, surfaces an additional
 * "Fix with DitaCraft AI" code action (spec §2.3).
 *
 * The actual repair is executed by AIServiceOrchestrator.fixFragment() which:
 *   1. Calls the LLM with a specialized repair prompt
 *   2. Validates the result via dita/validateFragment (LSP)
 *   3. Returns a WorkspaceEdit to apply
 *
 * Diagnostic code mapping (spec §2.3.2 → real codebase codes):
 *   DITA-001 (invalid element)         → DITA-CM-001, DITA-CM-002, DITA-CM-003
 *   DITA-002 (missing topicref target) → DITA-XREF-001, DITA-STRUCT-008
 *   DITA-003 (missing required attr)   → DITA-STRUCT-003, DITA-STRUCT-004
 *   DITA-010 (DTD/schema violation)    → DITA-DTD-001, DITA-RNG-001
 *   DITA-020 (broken conref)           → DITA-XREF-003, DITA-XREF-004
 */

import * as vscode from 'vscode';
import { AIServiceOrchestrator } from '../llm/aiServiceOrchestrator';
import { getErrorMessage } from '../utils/errorUtils';

const AI_FIXABLE_CODES = new Set([
    // Content model issues
    'DITA-CM-001', 'DITA-CM-002', 'DITA-CM-003',
    // Missing file / topicref target
    'DITA-XREF-001', 'DITA-STRUCT-008',
    // Missing required attributes / structural
    'DITA-STRUCT-003', 'DITA-STRUCT-004', 'DITA-STRUCT-005',
    // DTD / schema violations
    'DITA-DTD-001', 'DITA-RNG-001',
    // Broken conref / cross-ref
    'DITA-XREF-003', 'DITA-XREF-004',
    // XML well-formedness recoverable errors
    'DITA-XML-001',
]);

const AI_QUICKFIX_COMMAND = 'ditacraft.aiQuickFix';

export class AIQuickFixProvider implements vscode.CodeActionProvider {

    static readonly providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];

    constructor(private readonly orchestrator: AIServiceOrchestrator) {}

    provideCodeActions(
        document: vscode.TextDocument,
        _range: vscode.Range | vscode.Selection,
        context: vscode.CodeActionContext,
        _token: vscode.CancellationToken
    ): vscode.CodeAction[] | undefined {
        const cfg = vscode.workspace.getConfiguration('ditacraft.ai');
        if (!cfg.get<boolean>('quickfix.enabled', true)) { return; }
        if (!this.orchestrator) { return; }

        const fixable = context.diagnostics.filter(d => isAiFixable(d));
        if (fixable.length === 0) { return; }

        return fixable.map(diagnostic => buildAction(document, diagnostic));
    }
}

// ── Command handler ────────────────────────────────────────────────────────

/**
 * Execute an AI quick fix on the given diagnostic.
 * Called by the command registered in extension.ts.
 */
export async function executeAiQuickFix(
    orchestrator: AIServiceOrchestrator,
    documentUri: vscode.Uri,
    diagnostic: vscode.Diagnostic
): Promise<void> {
    const document = await vscode.workspace.openTextDocument(documentUri);

    // Extract the fragment: ±5 lines around the error
    const startLine = Math.max(0, diagnostic.range.start.line - 5);
    const endLine = Math.min(document.lineCount - 1, diagnostic.range.end.line + 5);
    const fragment = document.getText(
        new vscode.Range(new vscode.Position(startLine, 0), document.lineAt(endLine).range.end)
    );

    // The LLM call below takes seconds; the replacement range is only valid
    // against this exact document state.
    const versionBefore = document.version;

    const result = await vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: 'DitaCraft AI: Fixing diagnostic...',
            cancellable: true,
        },
        async (_progress, token) =>
            orchestrator.fixFragment(fragment, diagnostic, documentUri.toString(), token)
    );

    if (!result.success || !result.fixedXml) {
        vscode.window.showErrorMessage(
            `DitaCraft AI Quick Fix: ${result.error ?? 'Unable to generate a fix.'}`
        );
        return;
    }

    if (document.version !== versionBefore) {
        vscode.window.showWarningMessage(
            'DitaCraft AI: The document changed while the fix was being generated — fix not applied. Run the quick fix again.'
        );
        return;
    }

    // Replace the extracted fragment range
    const edit = new vscode.WorkspaceEdit();
    edit.replace(
        documentUri,
        new vscode.Range(new vscode.Position(startLine, 0), document.lineAt(endLine).range.end),
        result.fixedXml
    );

    const applied = await vscode.workspace.applyEdit(edit);
    if (applied) {
        vscode.window.showInformationMessage(
            `DitaCraft AI: Fix applied${result.model ? ` (via ${result.model})` : ''}.`
        );
    } else {
        vscode.window.showErrorMessage('DitaCraft AI: Failed to apply the edit.');
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────

function isAiFixable(diagnostic: vscode.Diagnostic): boolean {
    if (!diagnostic.source?.includes('DitaCraft')) { return false; }
    if (diagnostic.severity === vscode.DiagnosticSeverity.Information ||
        diagnostic.severity === vscode.DiagnosticSeverity.Hint) { return false; }
    const code = typeof diagnostic.code === 'object'
        ? String(diagnostic.code.value)
        : String(diagnostic.code ?? '');
    return AI_FIXABLE_CODES.has(code);
}

function buildAction(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic
): vscode.CodeAction {
    const action = new vscode.CodeAction(
        '$(wand) Fix with DitaCraft AI',
        vscode.CodeActionKind.QuickFix
    );
    action.diagnostics = [diagnostic];
    action.isPreferred = false;
    action.command = {
        command: AI_QUICKFIX_COMMAND,
        title: 'Fix with DitaCraft AI',
        arguments: [document.uri, diagnostic],
    };
    return action;
}

export { AI_QUICKFIX_COMMAND };

// Handle errors in the executeAiQuickFix catch scenario
export function safeExecuteAiQuickFix(
    orchestrator: AIServiceOrchestrator,
    documentUri: vscode.Uri,
    diagnostic: vscode.Diagnostic
): void {
    executeAiQuickFix(orchestrator, documentUri, diagnostic).catch((error: unknown) => {
        vscode.window.showErrorMessage(`DitaCraft AI Quick Fix error: ${getErrorMessage(error)}`);
    });
}
