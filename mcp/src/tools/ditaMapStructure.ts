import type { McpContext } from '../server';
import { handleGetContextGraph, GetContextGraphParams, ContextGraph, MapNode, TopicRefNode } from '../../../server/src/features/contextGraph';
import { resolvePath } from '../workspace';
import * as path from 'path';

interface DitaMapStructureArgs {
    mapUri: string;
    depth?: number;
    includeMetadata?: boolean;
    format?: 'json' | 'tree' | 'csv';
}

export function handleDitaMapStructure(
    args: unknown,
    ctx: McpContext,
): ContextGraph | string {
    const { mapUri, depth = 4, includeMetadata = true, format = 'json' } = args as DitaMapStructureArgs;

    const resolvedUri = resolvePath(mapUri, ctx.workspaceRoot);
    if (!resolvedUri) {
        throw new Error(`Invalid or unsafe path: ${mapUri}`);
    }

    const params: GetContextGraphParams = {
        uri: resolvedUri,
        depth: depth ?? 4,
        includeMetadata: includeMetadata ?? true,
    };

    const graph = handleGetContextGraph(params);

    if (format === 'tree') {
        return formatAsTree(graph);
    }

    if (format === 'csv') {
        return formatAsCsv(graph);
    }

    return graph;
}

function formatAsTree(graph: ContextGraph): string {
    const lines: string[] = [];
    lines.push(`Map: ${graph.rootMap.title} (${graph.topics.length} topics)`);

    function renderNode(node: MapNode | TopicRefNode, indent: number): void {
        const prefix = '  '.repeat(indent);
        if ('href' in node) {
            const topicRef = node as TopicRefNode;
            lines.push(`${prefix}[?] ${topicRef.href}${topicRef.title ? ` — ${topicRef.title}` : ''}`);
        } else {
            const mapNode = node as MapNode;
            const childCount = mapNode.children.length;
            lines.push(`${prefix}[map] ${mapNode.title || path.basename(mapNode.uri)} (${childCount} children)`);
            for (const child of mapNode.children) {
                renderNode(child, indent + 1);
            }
        }
    }

    // Render topic nodes from ContextGraph
    for (const topic of graph.topics) {
        lines.push(`  [${topic.type}] ${topic.uri} — ${topic.title}`);
    }

    return lines.join('\n');
}

function formatAsCsv(graph: ContextGraph): string {
    const rows: string[] = ['type,uri,title'];
    for (const topic of graph.topics) {
        const escapedUri = topic.uri.includes(',') ? `"${topic.uri}"` : topic.uri;
        const escapedTitle = topic.title.includes(',') ? `"${topic.title}"` : topic.title;
        rows.push(`${topic.type},${escapedUri},${escapedTitle}`);
    }
    return rows.join('\n');
}
