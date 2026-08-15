/**
 * Inline Conref
 * Place the cursor on (or inside) an element carrying a `conref` or
 * `conkeyref` attribute and inline the referenced element's content in
 * place, removing the reference attribute — the "un-conref" counterpart to
 * authoring reusable content.
 *
 * Applies the resulting single-file edit directly, without VS Code's
 * refactor-preview UI — unlike Find & Replace / Batch Metadata Update
 * (which touch many files across the workspace and so warrant a review
 * step), this is a single, cursor-scoped edit in the active file, the same
 * shape as Extract Topic From Section's own direct-apply precedent.
 */

import * as vscode from 'vscode';
import { getLanguageClient } from '../languageClient';
import { logger } from '../utils/logger';
import { isDitaContentUri } from '../utils/constants';

// Mirrors server/src/features/inlineConref.ts's InlineConrefResult response
// shape (raw LSP protocol shape, before conversion to a
// vscode.WorkspaceEdit) — client and server can't share types across the
// package boundary this project maintains, so this is a parallel,
// hand-mirrored copy, matching the established pattern for every other
// custom `dita/*` request's types (see extension.ts's own
// LspTextEdit/LspWorkspaceEdit for `dita/computeMoveEdits`).
interface LspTextEdit {
    range: { start: { line: number; character: number }; end: { line: number; character: number } };
    newText: string;
}
interface LspWorkspaceEdit {
    changes?: { [uri: string]: LspTextEdit[] };
}
interface InlineConrefResponse {
    edit: LspWorkspaceEdit | null;
    reason?: string;
}

/**
 * Command: ditacraft.inlineConref
 */
export async function inlineConrefCommand(): Promise<void> {
    const client = getLanguageClient();
    if (!client) {
        vscode.window.showWarningMessage('DitaCraft: Language server is not ready yet.');
        return;
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('DitaCraft: No file is currently open.');
        return;
    }
    if (!isDitaContentUri(editor.document.uri)) {
        vscode.window.showWarningMessage('DitaCraft: Inline Conref requires a DITA topic, map, or bookmap file.');
        return;
    }

    const document = editor.document;
    const uri = client.code2ProtocolConverter.asUri(document.uri);
    const offset = document.offsetAt(editor.selection.active);

    let response: InlineConrefResponse;
    try {
        response = await client.sendRequest<InlineConrefResponse>('dita/computeInlineConrefEdit', { uri, offset });
    } catch (error) {
        logger.error('Inline Conref request failed', error);
        vscode.window.showErrorMessage(
            `DitaCraft: Inline Conref failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        return;
    }

    if (!response.edit) {
        vscode.window.showWarningMessage(`DitaCraft: ${response.reason ?? 'Could not inline this reference.'}`);
        return;
    }

    const edit = await client.protocol2CodeConverter.asWorkspaceEdit(response.edit);
    const applied = await vscode.workspace.applyEdit(edit);

    if (applied) {
        logger.info('Inline Conref applied', { uri });
    } else {
        logger.warn('Inline Conref: edit was not applied', { uri });
        vscode.window.showWarningMessage('DitaCraft: Could not apply the inline edit.');
    }
}
