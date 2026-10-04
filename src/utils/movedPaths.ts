/**
 * Where a path is after files or folders moved (VS Code's `onDidRenameFiles`
 * reports a folder as one move). Used to keep paths stored outside the
 * documents — a publishing profile's DITAVAL file, the preview filter, the
 * path settings (`pathSettings.ts`) — pointing at the same file. No `vscode`
 * import.
 */

import * as path from 'path';

export interface PathMove {
    oldPath: string;
    newPath: string;
}

/**
 * The path `filePath` (absolute) has after `moves`: the new path of the move
 * that renamed it, or of a moved folder that held it; undefined when none
 * did. Paths compare as the platform does (case-insensitively on Windows).
 */
export function movedPath(filePath: string, moves: readonly PathMove[]): string | undefined {
    for (const move of moves) {
        const inside = path.relative(move.oldPath, filePath);
        if (inside === '') {
            return move.newPath;
        }
        if (!inside.startsWith('..') && !path.isAbsolute(inside)) {
            return path.join(move.newPath, inside);
        }
    }
    return undefined;
}

const WORKSPACE_FOLDER = '${workspaceFolder}';

/**
 * The absolute path a path setting names (`ditacraft.rootMap`,
 * `templatesPath`, `xmlCatalogPath`, `previewCustomCss`, `customRulesFile`):
 * `${workspaceFolder}` and a relative path stand for the first workspace
 * folder, `workspaceFolder`; undefined when empty or not resolvable.
 */
export function resolvePathSetting(value: string, workspaceFolder: string | undefined): string | undefined {
    const trimmed = value.trim();
    if (trimmed === '') {
        return undefined;
    }
    if (trimmed.includes(WORKSPACE_FOLDER)) {
        return workspaceFolder ? path.normalize(trimmed.split(WORKSPACE_FOLDER).join(workspaceFolder)) : undefined;
    }
    if (path.isAbsolute(trimmed)) {
        return trimmed;
    }
    return workspaceFolder ? path.join(workspaceFolder, trimmed) : undefined;
}

/**
 * The value of a path setting naming `newPath`, written like `original`:
 * `${workspaceFolder}/…` or relative (with `/`, as shared settings should be)
 * when it was and `newPath` is in the workspace folder, else absolute.
 */
export function pathSettingValue(original: string, newPath: string, workspaceFolder: string | undefined): string {
    const relative = workspaceFolder ? path.relative(workspaceFolder, newPath) : undefined;
    const inside = relative !== undefined && !relative.startsWith('..') && !path.isAbsolute(relative);
    if (!inside || path.isAbsolute(original.trim()) && !original.includes(WORKSPACE_FOLDER)) {
        return newPath;
    }
    const portable = relative.split(path.sep).join('/');
    return original.includes(WORKSPACE_FOLDER) ? `${WORKSPACE_FOLDER}/${portable}` : portable;
}
