/**
 * Grammar selection options for a document (spec §4.5): the project catalog
 * (`ditacraft.xmlCatalogPath`, trusted workspaces only) and `ditacraft.ditaVersion`.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import type { SelectOptions } from './grammarRegistry';

export function grammarSelectOptions(document: vscode.TextDocument): SelectOptions {
    return {
        externalCatalogPath: externalCatalog(document),
        ditaVersion: vscode.workspace.getConfiguration('ditacraft', document.uri).get<string>('ditaVersion', 'auto'),
    };
}

function externalCatalog(document: vscode.TextDocument): string | undefined {
    if (!vscode.workspace.isTrusted) {
        return undefined;
    }
    const setting = vscode.workspace.getConfiguration('ditacraft', document.uri).get<string>('xmlCatalogPath', '');
    if (!setting) {
        return undefined;
    }
    const folder = vscode.workspace.getWorkspaceFolder(document.uri) ?? vscode.workspace.workspaceFolders?.[0];
    const resolved = folder ? setting.replace(/\$\{workspaceFolder\}/g, folder.uri.fsPath) : setting;
    const absolute = path.isAbsolute(resolved) ? resolved : folder ? path.join(folder.uri.fsPath, resolved) : resolved;
    return fs.existsSync(absolute) ? absolute : undefined;
}
