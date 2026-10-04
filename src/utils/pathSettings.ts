/**
 * Keep the settings that name a file or folder pointing at it when it — or a
 * folder holding it — is moved or renamed in VS Code: `ditacraft.rootMap`,
 * `templatesPath`, `xmlCatalogPath`, `previewCustomCss`, `customRulesFile`.
 * A value is resolved and rewritten as the features read it
 * (`resolvePathSetting`/`pathSettingValue`), in the settings it lives in
 * (workspace or user).
 */

import * as vscode from 'vscode';
import { movedPath, pathSettingValue, resolvePathSetting, type PathMove } from './movedPaths';

/** The `ditacraft.*` settings holding a path in the workspace. */
export const PATH_SETTINGS = ['rootMap', 'templatesPath', 'xmlCatalogPath', 'previewCustomCss', 'customRulesFile'] as const;
export type PathSetting = typeof PATH_SETTINGS[number];

/** After files or folders moved: the path settings that named one follow it. Returns the settings changed. */
export async function followPathSettings(moves: readonly PathMove[]): Promise<PathSetting[]> {
    const config = vscode.workspace.getConfiguration('ditacraft');
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const changed: PathSetting[] = [];
    for (const key of PATH_SETTINGS) {
        const inspected = config.inspect<string>(key);
        const levels: [string | undefined, vscode.ConfigurationTarget][] = [
            [inspected?.workspaceValue, vscode.ConfigurationTarget.Workspace],
            [inspected?.globalValue, vscode.ConfigurationTarget.Global],
        ];
        for (const [value, target] of levels) {
            if (typeof value !== 'string') {
                continue;
            }
            const resolved = resolvePathSetting(value, workspaceFolder);
            const moved = resolved ? movedPath(resolved, moves) : undefined;
            if (!moved) {
                continue;
            }
            await config.update(key, pathSettingValue(value, moved, workspaceFolder), target);
            if (!changed.includes(key)) {
                changed.push(key);
            }
        }
    }
    return changed;
}
