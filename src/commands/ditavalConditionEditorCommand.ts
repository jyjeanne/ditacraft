/**
 * Visual DITAVAL Condition Editor Command (§5.3)
 * Opens `DitavalConditionEditorPanel` for a `.ditaval` file, resolved from
 * the DITA Explorer tree item, the file explorer's context menu, or the
 * active editor — the same resolution order `ditacraft.showMapVisualizer`
 * already established for `.ditamap`/`.bookmap` files.
 */

import * as vscode from 'vscode';
import { DitaExplorerItem } from '../providers/ditaExplorerProvider';
import { DitavalConditionEditorPanel } from '../providers/ditavalConditionEditorPanel';

/**
 * Command: ditacraft.editDitavalConditions
 */
export async function editDitavalConditionsCommand(arg?: DitaExplorerItem | vscode.Uri): Promise<void> {
    let filePath: string | undefined;

    if (arg instanceof DitaExplorerItem) {
        filePath = arg.mapNode.filePath;
    } else if (arg instanceof vscode.Uri) {
        filePath = arg.fsPath;
    } else {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('DitaCraft: No file is currently open.');
            return;
        }
        filePath = editor.document.uri.fsPath;
    }

    if (!filePath) {
        vscode.window.showWarningMessage('DitaCraft: No file path available.');
        return;
    }

    if (!filePath.toLowerCase().endsWith('.ditaval')) {
        vscode.window.showWarningMessage('DitaCraft: The DITAVAL Condition Editor requires a .ditaval file.');
        return;
    }

    DitavalConditionEditorPanel.createOrShow(filePath);
}
