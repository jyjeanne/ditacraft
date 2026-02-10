/**
 * Map Hierarchy Parser
 * Shared utility for parsing DITA map files into tree structures.
 * Used by both MapVisualizerPanel (WebView) and DitaExplorerProvider (TreeView).
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fsPromises from 'fs/promises';

/**
 * Represents a node in the DITA map hierarchy tree
 */
export interface MapNode {
    id: string;
    label: string;
    type: 'map' | 'topic' | 'chapter' | 'appendix' | 'part' | 'topicref' | 'keydef' | 'unknown';
    href?: string;
    filePath?: string;
    exists: boolean;
    hasErrors?: boolean;
    children: MapNode[];
    navtitle?: string;
    keys?: string;
    keyref?: string;
}

/**
 * Extract an attribute value from an XML attribute string.
 */
export function extractAttribute(attributes: string, name: string): string | null {
    const regex = new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, 'i');
    const match = attributes.match(regex);
    return match ? match[1] : null;
}

/**
 * Detect the type of a DITA map from its content.
 */
export function detectMapType(content: string): MapNode['type'] {
    if (content.includes('<!DOCTYPE bookmap') || /<bookmap[\s>]/i.test(content)) {
        return 'map';
    }
    return 'map';
}

/**
 * Parse topic references from map content (regex-based).
 * Handles recursive submap resolution and circular reference detection.
 */
const TAG_TYPE_MAP: Record<string, MapNode['type']> = {
    chapter: 'chapter',
    appendix: 'appendix',
    part: 'part',
    topicref: 'topicref',
    keydef: 'keydef',
    mapref: 'map'
};

const COMBINED_TAG_REGEX = /<(chapter|appendix|part|topicref|keydef|mapref)\b([^>]*)>/gi;
const COMMENT_REGEX = /<!--[\s\S]*?-->/g;

export async function parseReferences(
    content: string,
    mapDir: string,
    visitedFiles: Set<string>
): Promise<MapNode[]> {
    const nodes: MapNode[] = [];
    let nodeId = 0;

    // Strip XML comments to avoid matching commented-out elements
    const cleanContent = content.replace(COMMENT_REGEX, '');

    // Single-pass regex preserves document order
    const regex = new RegExp(COMBINED_TAG_REGEX.source, 'gi');
    let match;

    while ((match = regex.exec(cleanContent)) !== null) {
        const tagName = match[1].toLowerCase();
        const attributes = match[2];
        const type = TAG_TYPE_MAP[tagName] || 'unknown';

        const href = extractAttribute(attributes, 'href');
        const navtitle = extractAttribute(attributes, 'navtitle');
        const keys = extractAttribute(attributes, 'keys');
        const keyref = extractAttribute(attributes, 'keyref');

        const node: MapNode = {
            id: `node-${nodeId++}`,
            label: navtitle || keys || keyref || (href ? path.basename(href) : 'Unknown'),
            type,
            href: href || undefined,
            navtitle: navtitle || undefined,
            keys: keys || undefined,
            keyref: keyref || undefined,
            exists: true,
            children: []
        };

        if (href) {
            const fullPath = path.resolve(mapDir, href);
            node.filePath = fullPath;

            try {
                await fsPromises.access(fullPath);
                node.exists = true;
            } catch {
                node.exists = false;
            }

            if (node.exists && (href.endsWith('.ditamap') || href.endsWith('.bookmap') || type === 'map')) {
                if (!visitedFiles.has(fullPath)) {
                    visitedFiles.add(fullPath);
                    try {
                        const subContent = await fsPromises.readFile(fullPath, 'utf-8');
                        node.children = await parseReferences(subContent, path.dirname(fullPath), visitedFiles);
                    } catch {
                        // Ignore errors parsing sub-maps
                    }
                } else {
                    node.label = `${node.label} (circular ref)`;
                    node.hasErrors = true;
                }
            }
        }

        nodes.push(node);
    }

    return nodes;
}

/**
 * Parse a DITA map file into a tree of MapNodes.
 */
export async function parseMapHierarchy(mapFilePath: string): Promise<MapNode> {
    const mapDir = path.dirname(mapFilePath);
    const mapName = path.basename(mapFilePath);

    const content = await fsPromises.readFile(mapFilePath, 'utf-8');

    const rootNode: MapNode = {
        id: 'root',
        label: mapName,
        type: detectMapType(content),
        filePath: mapFilePath,
        href: mapName,
        exists: true,
        children: []
    };

    const visitedFiles = new Set<string>([mapFilePath]);
    rootNode.children = await parseReferences(content, mapDir, visitedFiles);

    return rootNode;
}

/**
 * Find all DITA map files in the workspace.
 * Returns sorted list of absolute paths.
 */
export async function findAllMapsInWorkspace(): Promise<string[]> {
    const uris = await vscode.workspace.findFiles(
        '**/*.{ditamap,bookmap}',
        '{**/node_modules/**,**/.vscode-test/**,**/out/**,**/.git/**}'
    );
    return uris
        .map(uri => uri.fsPath)
        .sort((a, b) => a.localeCompare(b));
}
