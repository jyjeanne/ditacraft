/**
 * Handler for `dita/getContextGraph` LSP request.
 *
 * Builds a structured representation of a DITA map for injection into LLM prompts.
 * Reads the file hierarchy via the KeySpaceService (which already handles caching)
 * and enriches each topic with type and short-description metadata.
 */

import * as fs from 'fs';
import * as path from 'path';
import { IKeySpaceService } from '../services/interfaces';
import { uriToPath, isPathWithinWorkspace } from '../utils/textUtils';
import { URI } from 'vscode-uri';

// ── Request / Response types (mirrored on the client) ─────────────────────

export interface GetContextGraphParams {
    uri: string;
    depth?: number;
    includeMetadata?: boolean;
}

export interface MapNode {
    uri: string;
    title: string;
    children: (MapNode | TopicRefNode)[];
}

export interface TopicRefNode {
    href: string;
    uri: string;
    title?: string;
}

export interface TopicNode {
    uri: string;
    title: string;
    type: 'concept' | 'task' | 'reference' | 'generic' | 'unknown';
    shortDescSummary?: string;
    elementCount: number;
}

export interface KeyDef {
    keyName: string;
    href?: string;
    navtitle?: string;
}

export interface RelationNode {
    fromUri: string;
    toUri: string;
    relType: 'topicref' | 'mapref' | 'keydef';
}

export interface ContextGraph {
    rootMap: MapNode;
    topics: TopicNode[];
    relations: RelationNode[];
    keyDefinitions: KeyDef[];
    totalTokenEstimate: number;
}

function readTitle(filePath: string): string {
    try {
        const text = fs.readFileSync(filePath, 'utf-8');
        const m = text.match(/<title[^>]*>([\s\S]*?)<\/title>/);
        return m ? m[1].replace(/<[^>]+>/g, '').trim() : path.basename(filePath, path.extname(filePath));
    } catch {
        return path.basename(filePath, path.extname(filePath));
    }
}

function readTopicType(filePath: string): TopicNode['type'] {
    try {
        const text = fs.readFileSync(filePath, 'utf-8').slice(0, 2000);
        for (const type of ['concept', 'task', 'reference', 'topic'] as const) {
            if (new RegExp(`<${type}\\b`).test(text)) {
                return type === 'topic' ? 'generic' : type;
            }
        }
        return 'unknown';
    } catch {
        return 'unknown';
    }
}

function readShortDesc(filePath: string): string | undefined {
    try {
        const text = fs.readFileSync(filePath, 'utf-8');
        const m = text.match(/<shortdesc[^>]*>([\s\S]*?)<\/shortdesc>/);
        if (!m) { return undefined; }
        const plain = m[1].replace(/<[^>]+>/g, '').trim();
        return plain.slice(0, 100);
    } catch {
        return undefined;
    }
}

function countElements(filePath: string): number {
    try {
        const text = fs.readFileSync(filePath, 'utf-8');
        return (text.match(/<[a-zA-Z]/g) ?? []).length;
    } catch {
        return 0;
    }
}

function resolveHref(href: string, baseDir: string, workspaceFolders: readonly string[]): string | null {
    if (!href || href.startsWith('http://') || href.startsWith('https://')) {
        return null;
    }
    // Reject absolute paths — not valid in DITA href attributes
    if (path.isAbsolute(href)) { return null; }

    const withoutFragment = href.split('#')[0];
    if (!withoutFragment) { return null; }

    const normalized = path.normalize(withoutFragment);
    // Count upward traversals; reject excessive depth (> 8 levels up)
    const upCount = (normalized.match(/\.\.[/\\]/g) ?? []).length;
    if (upCount > 8) { return null; }

    const resolved = path.resolve(baseDir, normalized);
    // Hard boundary check — the upward-traversal count above is only a
    // heuristic and does not guarantee the resolved path stays inside the
    // workspace (e.g. a deeply nested workspace root vs. a shallow one).
    if (!isPathWithinWorkspace(resolved, workspaceFolders)) { return null; }
    return fs.existsSync(resolved) ? resolved : null;
}

function buildMapNode(
    mapPath: string,
    _baseDir: string,
    depth: number,
    maxDepth: number,
    visited: Set<string>,
    topics: Map<string, TopicNode>,
    relations: RelationNode[],
    keyDefs: Map<string, KeyDef>,
    workspaceFolders: readonly string[]
): MapNode {
    const node: MapNode = {
        uri: URI.file(mapPath).toString(),
        title: readTitle(mapPath),
        children: [],
    };

    if (visited.has(mapPath) || depth > maxDepth) {
        return node;
    }
    visited.add(mapPath);

    let text: string;
    try {
        text = fs.readFileSync(mapPath, 'utf-8');
    } catch {
        return node;
    }

    // Extract topicrefs
    const topicrefRegex = /<topicref\b([^>]*)>/g;
    let m: RegExpExecArray | null;
    while ((m = topicrefRegex.exec(text)) !== null) {
        const attrs = m[1];
        const hrefMatch = attrs.match(/href="([^"]*)"/);
        if (!hrefMatch) { continue; }
        const href = hrefMatch[1];
        const resolved = resolveHref(href, path.dirname(mapPath), workspaceFolders);
        if (!resolved) { continue; }

        const fromUri = URI.file(mapPath).toString();
        const toUri = URI.file(resolved).toString();
        const isMap = resolved.endsWith('.ditamap') || resolved.endsWith('.bookmap');

        if (isMap) {
            relations.push({ fromUri, toUri, relType: 'mapref' });
            const child = buildMapNode(
                resolved, path.dirname(resolved), depth + 1, maxDepth, visited, topics, relations,
                keyDefs, workspaceFolders
            );
            node.children.push(child);
        } else {
            relations.push({ fromUri, toUri, relType: 'topicref' });
            const titleMatch = attrs.match(/navtitle="([^"]*)"/);
            const childNode: TopicRefNode = {
                href,
                uri: toUri,
                title: titleMatch?.[1] ?? readTitle(resolved),
            };
            node.children.push(childNode);

            // Collect topic metadata
            if (!topics.has(toUri)) {
                topics.set(toUri, {
                    uri: toUri,
                    title: childNode.title ?? path.basename(resolved, path.extname(resolved)),
                    type: readTopicType(resolved),
                    shortDescSummary: readShortDesc(resolved),
                    elementCount: countElements(resolved),
                });
            }
        }
    }

    // Extract key definitions
    const keydefRegex = /<keydef\b([^>]*)>/g;
    while ((m = keydefRegex.exec(text)) !== null) {
        const attrs = m[1];
        const keysMatch = attrs.match(/keys="([^"]*)"/);
        if (!keysMatch) { continue; }
        const keyName = keysMatch[1];
        const hrefMatch2 = attrs.match(/href="([^"]*)"/);
        const navtitleMatch = attrs.match(/navtitle="([^"]*)"/);
        keyDefs.set(keyName, {
            keyName,
            href: hrefMatch2?.[1],
            navtitle: navtitleMatch?.[1],
        });
        if (hrefMatch2) {
            relations.push({ fromUri: URI.file(mapPath).toString(), toUri: hrefMatch2[1], relType: 'keydef' });
        }
    }

    return node;
}

// ── Handler ────────────────────────────────────────────────────────────────

export function handleGetContextGraph(
    params: GetContextGraphParams,
    keySpaceService?: IKeySpaceService
): ContextGraph {
    const mapPath = uriToPath(params.uri);
    const maxDepth = params.depth ?? 3;
    const workspaceFolders = keySpaceService?.getWorkspaceFolders() ?? [];

    const topicsMap = new Map<string, TopicNode>();
    const relations: RelationNode[] = [];
    const keyDefsMap = new Map<string, KeyDef>();
    const visited = new Set<string>();

    const rootMap = buildMapNode(
        mapPath,
        path.dirname(mapPath),
        0,
        maxDepth,
        visited,
        topicsMap,
        relations,
        keyDefsMap,
        workspaceFolders
    );

    const topics = Array.from(topicsMap.values());
    const keyDefinitions = Array.from(keyDefsMap.values());

    // Rough token estimate: 1 token ≈ 4 chars of JSON
    const totalTokenEstimate = Math.ceil(
        (JSON.stringify(rootMap).length + JSON.stringify(topics).length) / 4
    );

    return { rootMap, topics, relations, keyDefinitions, totalTokenEstimate };
}
