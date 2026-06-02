/**
 * DitaCraft: Restructure Active DITA Map (F2)
 *
 * Workflow (spec §2.2.2):
 *   1. Verify active editor is a .ditamap
 *   2. Show InputBox with preset suggestions for the restructuring intention
 *   3. Stream context snapshot + call LLM via AIServiceOrchestrator
 *   4. Write proposed XML to a temp file
 *   5. Open vscode.diff side-by-side
 *   6. Accept/Reject via notification buttons → apply WorkspaceEdit or discard
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { AIServiceOrchestrator } from '../llm/aiServiceOrchestrator';
import { getErrorMessage } from '../utils/errorUtils';

const PRESET_INTENTIONS = [
    'Group topics by audience: developer, administrator, end user',
    'Group topics by functional module',
    'Flatten the hierarchy for API documentation',
    'Separate concepts from tasks into distinct sections',
    'Alphabetize topics within each section',
];

/**
 * Entry point — triggered by the command palette, editor title button,
 * or context menu on a .ditamap file.
 */
export async function restructureMapCommand(
    orchestrator: AIServiceOrchestrator,
    mapUri?: vscode.Uri
): Promise<void> {
    // Resolve the target map URI
    const resolvedUri = mapUri ?? vscode.window.activeTextEditor?.document.uri;

    if (!resolvedUri || !isDitaMap(resolvedUri)) {
        vscode.window.showWarningMessage(
            'DitaCraft: Open or select a .ditamap file to restructure with AI.'
        );
        return;
    }

    // ── Gather restructuring intention ────────────────────────────────────
    const intention = await vscode.window.showInputBox({
        title: 'DitaCraft AI: Restructure DITA Map',
        prompt: 'Describe how you want to reorganize this map (AI will generate a restructured proposal):',
        placeHolder: PRESET_INTENTIONS[0],
        validateInput: v => (v.trim() ? null : 'Please enter a restructuring intention.'),
        value: '',
        ignoreFocusOut: true,
    });

    if (!intention) { return; } // User cancelled

    // ── Run with progress indicator ───────────────────────────────────────
    await vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: 'DitaCraft AI: Restructuring DITA Map',
            cancellable: true,
        },
        async (progress, token) => {
            progress.report({ message: 'Building context snapshot...' });

            const chunks: string[] = [];

            try {
                const result = await orchestrator.restructureMap(
                    resolvedUri.toString(),
                    intention,
                    chunk => {
                        chunks.push(chunk);
                        progress.report({ message: 'Generating restructured map...' });
                    },
                    token
                );

                if (token.isCancellationRequested) { return; }

                if (!result.success || !result.xmlContent) {
                    vscode.window.showErrorMessage(
                        `DitaCraft AI: Restructuring failed — ${result.error ?? 'unknown error'}`
                    );
                    return;
                }

                progress.report({ message: 'Opening diff view...' });
                await showDiffAndApply(resolvedUri, result.xmlContent, result.model, token);
            } catch (error: unknown) {
                vscode.window.showErrorMessage(
                    `DitaCraft AI: ${getErrorMessage(error)}`
                );
            }
        }
    );
}

// ── Diff + Apply ──────────────────────────────────────────────────────────

async function showDiffAndApply(
    originalUri: vscode.Uri,
    proposedXml: string,
    model: string | undefined,
    _token: vscode.CancellationToken
): Promise<void> {
    // Write proposed content to a temp file
    const tmpDir = os.tmpdir();
    const tmpName = `ditacraft-ai-${Date.now()}.ditamap`;
    const tmpPath = path.join(tmpDir, tmpName);

    try {
        fs.writeFileSync(tmpPath, proposedXml, 'utf-8');
        const proposedUri = vscode.Uri.file(tmpPath);

        const modelLabel = model ? ` (via ${model})` : '';
        const diffTitle = `DITA Map Restructuring${modelLabel}: Original ↔ Proposed`;

        // Open side-by-side diff
        await vscode.commands.executeCommand(
            'vscode.diff',
            originalUri,
            proposedUri,
            diffTitle
        );

        // Use modal dialog so the user must respond before temp file is touched.
        // This also prevents them from interacting with the diff while the notification floats.
        const choice = await vscode.window.showInformationMessage(
            `DitaCraft AI generated a restructured map. Apply the changes?`,
            { modal: true },
            'Apply',
            'Discard'
        );

        if (choice === 'Apply') {
            const document = await vscode.workspace.openTextDocument(originalUri);
            const fullRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(document.getText().length)
            );
            const edit = new vscode.WorkspaceEdit();
            edit.replace(originalUri, fullRange, proposedXml);
            await vscode.workspace.applyEdit(edit);
            await vscode.workspace.save(originalUri);
            vscode.window.showInformationMessage('DitaCraft AI: Map restructuring applied.');
        }
    } finally {
        // Cleanup temp file
        try { fs.unlinkSync(tmpPath); } catch { /* ignore cleanup errors */ }
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────

function isDitaMap(uri: vscode.Uri): boolean {
    const lower = uri.fsPath.toLowerCase();
    return lower.endsWith('.ditamap') || lower.endsWith('.bookmap');
}
