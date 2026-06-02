import * as fs from 'fs';
import * as path from 'path';

import type { McpContext } from '../types';
import { log } from '../logger';

interface MapEntry {
    uri: string;
    title: string;
    topicCount: number;
    isRoot: boolean;
    lastModified: string;
}

interface MapsResourceResult {
    maps: MapEntry[];
}

export async function readMapsResource(ctx: McpContext): Promise<MapsResourceResult> {
    const maps: MapEntry[] = [];

    const scanDir = (dir: string, depth: number): void => {
        if (depth > 5) return;
        let entries: fs.Dirent[];
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch {
            return;
        }
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                scanDir(fullPath, depth + 1);
            } else if (entry.isFile() && (entry.name.endsWith('.ditamap') || entry.name.endsWith('.bookmap'))) {
                try {
                    const stat = fs.statSync(fullPath);
                    const content = fs.readFileSync(fullPath, 'utf-8');
                    const titleMatch = content.match(/<title[^>]*>([^<]*)<\/title>/i);
                    const title = titleMatch ? titleMatch[1].trim() : path.basename(fullPath);
                    const topicrefCount = (content.match(/<topicref\b/gi) || []).length;

                    maps.push({
                        uri: `file://${fullPath.replace(/\\/g, '/')}`,
                        title,
                        topicCount: topicrefCount,
                        isRoot: path.dirname(fullPath) === ctx.workspaceRoot,
                        lastModified: stat.mtime.toISOString(),
                    });
                } catch {
                    // Skip unreadable files
                }
            }
        }
    };

    scanDir(ctx.workspaceRoot, 0);

    log('debug', `Workspace maps resource: found ${maps.length} maps`);

    return { maps };
}
