/**
 * Path Utilities
 * Small, shared filesystem/path helpers used by client commands that
 * read from or write to the workspace.
 */

import * as vscode from 'vscode';
import * as fs from 'fs/promises';

/**
 * Replace every `${workspaceFolder}` occurrence in `value` with the first
 * workspace folder's path (or `''` if none is open). Shared by every
 * setting that supports this placeholder (`ditacraft.outputDirectory` via
 * `DitaOtWrapper`, `ditacraft.templatesPath`, publishing profiles'
 * `outputDir`) so the substitution rule — and any future fix to it, e.g.
 * multi-root awareness — lives in one place instead of drifting across
 * independent copies. A global replace, not a single `.replace()` call:
 * a path that happens to reference the placeholder twice (unusual, but
 * not invalid) must have every occurrence substituted, not just the first.
 */
export function substituteWorkspaceFolderVar(value: string): string {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? '';
    return value.replace(/\$\{workspaceFolder\}/g, workspaceFolder);
}

/** True if `targetPath` exists on disk (file, directory, or otherwise), false if not. */
export async function pathExists(targetPath: string): Promise<boolean> {
    try {
        await fs.access(targetPath);
        return true;
    } catch {
        return false;
    }
}
