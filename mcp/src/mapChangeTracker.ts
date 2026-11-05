/**
 * Map change detection for the MCP server.
 *
 * The language server learns that a map changed from the editor's file events and drops
 * the key spaces and subject schemes built from it. The MCP server gets no such events, so
 * before each request it compares the workspace's maps (path, modification time, size)
 * with those it saw at the previous request, and reports the ones added, changed or removed.
 * The comparison runs right before the request, so an edit made just before it is never missed.
 */
import * as fs from 'fs';
import * as path from 'path';
import { collectDitaFiles } from '../../server/src/utils/ditaFileWalker';

const MAP_EXTENSIONS = new Set(['.ditamap', '.bookmap']);

export interface MapChange {
    file: string;
    /** True when the map was added or removed (not only edited). */
    pathChanged: boolean;
}

export class MapChangeTracker {
    private known = new Map<string, string>();

    constructor(private readonly workspaceRoot: string) {
        this.known = this.scan();
    }

    /** The maps added, changed or removed since the previous call (or since construction). */
    detectChanges(): MapChange[] {
        const current = this.scan();
        const changes: MapChange[] = [];
        for (const [file, signature] of current) {
            const previous = this.known.get(file);
            if (previous === undefined) {
                changes.push({ file, pathChanged: true });
            } else if (previous !== signature) {
                changes.push({ file, pathChanged: false });
            }
        }
        for (const file of this.known.keys()) {
            if (!current.has(file)) {
                changes.push({ file, pathChanged: true });
            }
        }
        this.known = current;
        return changes;
    }

    private scan(): Map<string, string> {
        const maps = new Map<string, string>();
        for (const file of collectDitaFiles([this.workspaceRoot])) {
            if (!MAP_EXTENSIONS.has(path.extname(file).toLowerCase())) continue;
            try {
                const stat = fs.statSync(file);
                maps.set(file, `${stat.mtimeMs}:${stat.size}`);
            } catch {
                // Removed between the directory walk and the stat: reported as removed next time.
            }
        }
        return maps;
    }
}
