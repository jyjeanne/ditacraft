import type { McpContext } from '../types';
import { log } from '../logger';
import { discoverRootMap } from '../utils/mapDiscovery';

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
    const rootMapPath = discoverRootMap(ctx.workspaceRoot);
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
