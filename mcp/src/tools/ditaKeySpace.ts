import * as path from 'path';
import * as fs from 'fs';

import type { McpContext } from '../types';
import { resolvePath } from '../workspace';
import { log } from '../logger';
import { discoverRootMap } from '../utils/mapDiscovery';

interface DitaKeySpaceArgs {
    mapUri?: string;
    includeScopes?: boolean;
    includeProvenance?: boolean;
}

interface KeyEntry {
    keyName: string;
    navtitle?: string;
    targetUri?: string;
    targetFragment?: string;
    scope?: string;
    sourceFile?: string;
    sourceLine?: number;
}

interface DitaKeySpaceResult {
    mapUri: string;
    totalKeys: number;
    keys: KeyEntry[];
}

export async function handleDitaKeySpace(
    args: unknown,
    ctx: McpContext,
): Promise<DitaKeySpaceResult> {
    const { mapUri, includeScopes = true, includeProvenance = false } = args as DitaKeySpaceArgs;

    let rootMapPath: string;

    if (mapUri) {
        const resolved = resolvePath(mapUri, ctx.workspaceRoot);
        if (!resolved) {
            throw new Error(`Invalid or unsafe path: ${mapUri}`);
        }
        rootMapPath = resolved.replace(/^file:\/\/\/?/, '');
    } else {
        // Auto-discover root map
        const discovered = discoverRootMap(ctx.workspaceRoot);
        if (!discovered) {
            return { mapUri: '', totalKeys: 0, keys: [] };
        }
        rootMapPath = discovered;
    }
    log('debug', `Building key space for root map: ${rootMapPath}`);

    const _keySpace = await ctx.keySpaceService.buildKeySpace(rootMapPath);
    const allKeys = await ctx.keySpaceService.getAllKeys(rootMapPath);

    const keys: KeyEntry[] = [];

    for (const [keyName, def] of allKeys) {
        let displayName = keyName;
        let scope: string | undefined;

        if (includeScopes && def.scope) {
            displayName = `${def.scope}.${keyName}`;
            scope = def.scope;
        }

        const entry: KeyEntry = {
            keyName: displayName,
            navtitle: def.metadata?.navtitle,
            targetUri: def.targetFile ? `file://${def.targetFile.replace(/\\/g, '/')}` : undefined,
            targetFragment: def.elementId,
            scope,
        };

        if (includeProvenance) {
            entry.sourceFile = def.sourceMap ? `file://${def.sourceMap.replace(/\\/g, '/')}` : undefined;
            entry.sourceLine = def.sourceLine;
        }

        keys.push(entry);
    }

    const resultMapUri = mapUri
        ? resolvePath(mapUri, ctx.workspaceRoot) ?? mapUri
        : `file://${rootMapPath.replace(/\\/g, '/')}`;

    return {
        mapUri: resultMapUri,
        totalKeys: keys.length,
        keys,
    };
}
