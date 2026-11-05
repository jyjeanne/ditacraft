/**
 * Recursive search for the DITA files of a workspace.
 *
 * No dependency beyond Node's own modules, so the MCP server's code (and its
 * tests, run without the language server's node_modules) can use it too.
 * workspaceScanner.ts re-exports collectDitaFiles.
 */
import * as fs from 'fs';
import * as path from 'path';

/** File extensions considered DITA files. */
export const DITA_EXTENSIONS = new Set(['.dita', '.ditamap', '.bookmap']);

/** Directories to skip during recursive scanning. */
export const SKIP_DIRS = new Set(['node_modules', '.git', 'out', '.vscode', '.vscode-test']);

/** Whether a directory is searched: not a skipped or hidden one. */
export function isScannedDirectory(name: string): boolean {
    return !SKIP_DIRS.has(name) && !name.startsWith('.');
}

/**
 * Collect all DITA files in the given workspace folders.
 * Synchronous recursive directory walk.
 */
export function collectDitaFiles(workspaceFolders: readonly string[]): string[] {
    const files: string[] = [];

    function walk(dir: string): void {
        let entries: fs.Dirent[];
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch {
            return;
        }
        for (const entry of entries) {
            if (entry.isDirectory()) {
                if (isScannedDirectory(entry.name)) {
                    walk(path.join(dir, entry.name));
                }
            } else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                if (DITA_EXTENSIONS.has(ext)) {
                    files.push(path.join(dir, entry.name));
                }
            }
        }
    }

    for (const folder of workspaceFolders) {
        walk(folder);
    }
    return files;
}
