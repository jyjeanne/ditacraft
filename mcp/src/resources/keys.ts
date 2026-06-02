import type { McpContext } from '../server';
import { log } from '../logger';
import * as fs from 'fs';
import * as path from 'path';

interface KeyEntry {
    keyName: string;
    navtitle?: string;
    targetUri?: string;
    targetFragment?: string;
}

interface KeysResourceResult {
    totalKeys: number;
    keys: KeyEntry[];
}

export async function readKeysResource(
    params: Record<string, string>,
    ctx: McpContext,
): Promise<KeysResourceResult> {
    const includeScopes = params['includeScopes'] !== 'false';
    const search = params['search'] || undefined;

    log('debug', `Keys resource query: includeScopes=${includeScopes}, search=${search}`);

    // Auto-discover root map
    const rootMapPath = await discoverRootMap(ctx.workspaceRoot);
    if (!rootMapPath) {
        return { totalKeys: 0, keys: [] };
    }

    const allKeys = await ctx.keySpaceService.getAllKeys(rootMapPath);

    const keys: KeyEntry[] = [];

    for (const [keyName, def] of allKeys) {
        let displayName = keyName;

        if (includeScopes && def.scope) {
            displayName = `${def.scope}.${keyName}`;
        }

        if (search && !displayName.toLowerCase().includes(search.toLowerCase())) {
            continue;
        }

        keys.push({
            keyName: displayName,
            navtitle: def.metadata?.navtitle,
            targetUri: def.targetFile ? `file://${def.targetFile.replace(/\\/g, '/')}` : undefined,
            targetFragment: def.elementId,
        });
    }

    return {
        totalKeys: keys.length,
        keys,
    };
}

async function discoverRootMap(workspaceRoot: string): Promise<string | null> {
    const candidates: string[] = [];
    const scanDir = (dir: string, depth: number): void => {
        if (depth > 3) return;
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
