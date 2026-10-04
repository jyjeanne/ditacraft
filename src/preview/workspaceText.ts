/**
 * Reading referenced files (reused content, key definitions, DITAVAL) for the visual preview
 * and the visual editor.
 */

import * as fs from 'fs';
import * as vscode from 'vscode';
import { isInside, realPath, samePath } from './paths';

/**
 * Text of a file: an open editor's (possibly unsaved) text wins over the disk. In Restricted
 * Mode only files inside the workspace folder of `context` (the topic) are read — symbolic
 * links included.
 */
export async function readWorkspaceText(filePath: string, context: vscode.Uri | undefined): Promise<string | null> {
    if (!vscode.workspace.isTrusted && context) {
        const folder = vscode.workspace.getWorkspaceFolder(context);
        if (!folder || !isInside(await realPath(filePath), await realPath(folder.uri.fsPath))) {
            return null;
        }
    }
    const open = vscode.workspace.textDocuments.find((d) => d.uri.scheme === 'file' && samePath(d.uri.fsPath, filePath));
    if (open) {
        return open.getText();
    }
    try {
        return await fs.promises.readFile(filePath, 'utf8');
    } catch {
        return null;
    }
}
