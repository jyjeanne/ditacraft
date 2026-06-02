import * as fs from 'fs';
import * as path from 'path';

const DEFAULT_SCAN_DEPTH = 3;

/**
 * Heuristic search for a root DITA map within a workspace directory.
 * Prefers maps at the workspace root; falls back to the first found.
 * Returns the absolute filesystem path, or null if no maps are found.
 */
export function discoverRootMap(workspaceRoot: string, maxDepth = DEFAULT_SCAN_DEPTH): string | null {
    const candidates: string[] = [];

    const scanDir = (dir: string, depth: number): void => {
        if (depth > maxDepth) return;
        let entries: fs.Dirent[];
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch {
            return;
        }
        for (const entry of entries) {
            if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                scanDir(path.join(dir, entry.name), depth + 1);
            } else if (entry.isFile() && entry.name.endsWith('.ditamap')) {
                candidates.push(path.join(dir, entry.name));
            }
        }
    };

    scanDir(workspaceRoot, 0);

    const rootMaps = candidates.filter((c) => path.dirname(c) === workspaceRoot);
    return rootMaps.length > 0 ? rootMaps[0] : (candidates.length > 0 ? candidates[0] : null);
}
