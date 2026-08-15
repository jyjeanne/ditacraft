/**
 * Batch Metadata Update
 * Multi-select a set of files in the DITA Explorer, pick a profiling
 * attribute and a value, and set (or, for an empty value, remove) it on
 * every selected file's root element in one operation — validated
 * server-side against `SubjectSchemeService`'s controlled values
 * (`server/src/features/batchMetadata.ts`) so a batch edit can't
 * introduce a `DITA-PROF-001` violation across many files at once.
 *
 * Reuses the same review-before-write mechanism as Find & Replace
 * (`findReplaceCommand.ts`'s `buildConfirmableWorkspaceEdit`): every edit
 * is tagged `needsConfirmation: true`, so `vscode.workspace.applyEdit()`
 * shows VS Code's native multi-file "Refactor Preview" UI before
 * anything is written.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { getLanguageClient } from '../languageClient';
import { logger } from '../utils/logger';
import { DitaExplorerItem } from '../providers/ditaExplorerProvider';
import { buildConfirmableWorkspaceEdit } from './findReplaceCommand';

/** The standard DITA profiling attributes — matches server/src/features/profilingValidation.ts's own list, the canonical set this project already validates. */
const KNOWN_PROFILING_ATTRIBUTES = ['audience', 'platform', 'product', 'otherprops', 'props', 'deliveryTarget'];

interface BatchMetadataSkippedFile {
    uri: string;
    reason: string;
}
interface BatchMetadataResponse {
    edit: { changes?: { [uri: string]: { range: { start: { line: number; character: number }; end: { line: number; character: number } }; newText: string }[] } } | null;
    updatedCount: number;
    skipped: BatchMetadataSkippedFile[];
}

/**
 * Command: ditacraft.batchUpdateMetadata
 * Registered against the DITA Explorer's multi-select context menu — VS
 * Code passes `(clickedItem, allSelectedItems)`; `allSelectedItems` is
 * only populated when more than one item is selected.
 */
export async function batchUpdateMetadataCommand(
    item?: DitaExplorerItem,
    allSelected?: DitaExplorerItem[]
): Promise<void> {
    const client = getLanguageClient();
    if (!client) {
        vscode.window.showWarningMessage('DitaCraft: Language server is not ready yet.');
        return;
    }

    const fileItems = resolveSelectedFileItems(item, allSelected);
    if (fileItems.length === 0) {
        vscode.window.showWarningMessage('DitaCraft: Select one or more DITA files in the explorer first.');
        return;
    }

    const attribute = await promptForAttribute();
    if (!attribute) return;

    const value = await vscode.window.showInputBox({
        title: `Set @${attribute}`,
        prompt: `Value for ${fileItems.length} file(s) — space-separated for multiple values, leave empty to remove @${attribute}`
    });
    if (value === undefined) return; // escape cancels

    const fileUris = fileItems.map(fileItem =>
        client.code2ProtocolConverter.asUri(vscode.Uri.file(fileItem.mapNode.filePath!))
    );

    let response: BatchMetadataResponse;
    try {
        response = await client.sendRequest<BatchMetadataResponse>('dita/computeBatchMetadataEdits', {
            fileUris,
            attribute,
            value
        });
    } catch (error) {
        logger.error('Batch metadata update request failed', error);
        vscode.window.showErrorMessage(
            `DitaCraft: Batch metadata update failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        return;
    }

    if (!response.edit || response.updatedCount === 0) {
        if (response.skipped.length > 0) {
            vscode.window.showWarningMessage(`DitaCraft: No files updated. ${summarizeSkipped(response.skipped)}`);
        } else {
            vscode.window.showInformationMessage('DitaCraft: No changes to make.');
        }
        return;
    }

    const label = describeBatchLabel(attribute, value, response.updatedCount);
    const edit = buildConfirmableWorkspaceEdit(response.edit, label);
    const applied = await vscode.workspace.applyEdit(edit);

    if (applied) {
        logger.info('Batch metadata update applied', { attribute, updatedCount: response.updatedCount, skippedCount: response.skipped.length });
        if (response.skipped.length > 0) {
            vscode.window.showWarningMessage(`DitaCraft: ${response.skipped.length} file(s) skipped. ${summarizeSkipped(response.skipped)}`);
        }
    } else {
        logger.debug('Batch metadata edit was not applied (declined or cancelled in the preview)');
    }
}

/**
 * Reduce the tree view's (clickedItem, allSelectedItems) callback shape
 * into the actual list of file-backed items to operate on — preferring
 * the full multi-selection when there is one, falling back to just the
 * clicked item for a single-item invocation, and filtering out any
 * non-file node (a `keydef` entry, or a file the tree already knows is
 * missing on disk). Exported for testing.
 */
export function resolveSelectedFileItems(
    item: DitaExplorerItem | undefined,
    allSelected: DitaExplorerItem[] | undefined
): DitaExplorerItem[] {
    const items = allSelected && allSelected.length > 0 ? allSelected : (item ? [item] : []);
    return items.filter(candidate => candidate.mapNode.filePath && candidate.mapNode.exists);
}

/** Build the label shown atop VS Code's refactor-preview UI. Exported for testing. */
export function describeBatchLabel(attribute: string, value: string, updatedCount: number): string {
    const fileWord = updatedCount === 1 ? 'file' : 'files';
    const action = value.length === 0 ? `Remove @${attribute}` : `Set @${attribute}="${value}"`;
    return `Batch Metadata: ${action} (${updatedCount} ${fileWord})`;
}

/** Summarize up to 3 skipped files by name, plus a "and N more" tail. Exported for testing. */
export function summarizeSkipped(skipped: readonly BatchMetadataSkippedFile[]): string {
    const names = skipped.map(entry => path.basename(vscode.Uri.parse(entry.uri).fsPath));
    const shown = names.slice(0, 3).join(', ');
    const more = names.length > 3 ? ` and ${names.length - 3} more` : '';
    return `Skipped: ${shown}${more}.`;
}

async function promptForAttribute(): Promise<string | undefined> {
    const choice = await vscode.window.showQuickPick(
        [
            ...KNOWN_PROFILING_ATTRIBUTES.map(attr => ({ label: attr, isOther: false })),
            { label: '$(edit) Other…', isOther: true }
        ],
        { title: 'Profiling Attribute to Set' }
    );
    if (!choice) return undefined;
    if (!choice.isOther) return choice.label;

    const custom = await vscode.window.showInputBox({
        title: 'Attribute Name',
        prompt: 'A custom profiling attribute name',
        validateInput: v => (v.trim().length === 0 ? 'Enter an attribute name' : undefined)
    });
    return custom?.trim();
}
