"use strict";
/**
 * Handler for `dita/getContextGraph` LSP request.
 *
 * Builds a structured representation of a DITA map for injection into LLM prompts.
 * Reads the file hierarchy via the KeySpaceService (which already handles caching)
 * and enriches each topic with type and short-description metadata.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGetContextGraph = handleGetContextGraph;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const textUtils_1 = require("../utils/textUtils");
const vscode_uri_1 = require("vscode-uri");
function readTitle(filePath) {
    try {
        const text = fs.readFileSync(filePath, 'utf-8');
        const m = text.match(/<title[^>]*>([\s\S]*?)<\/title>/);
        return m ? m[1].replace(/<[^>]+>/g, '').trim() : path.basename(filePath, path.extname(filePath));
    }
    catch {
        return path.basename(filePath, path.extname(filePath));
    }
}
function readTopicType(filePath) {
    try {
        const text = fs.readFileSync(filePath, 'utf-8').slice(0, 2000);
        for (const type of ['concept', 'task', 'reference', 'topic']) {
            if (new RegExp(`<${type}\\b`).test(text)) {
                return type === 'topic' ? 'generic' : type;
            }
        }
        return 'unknown';
    }
    catch {
        return 'unknown';
    }
}
function readShortDesc(filePath) {
    try {
        const text = fs.readFileSync(filePath, 'utf-8');
        const m = text.match(/<shortdesc[^>]*>([\s\S]*?)<\/shortdesc>/);
        if (!m) {
            return undefined;
        }
        const plain = m[1].replace(/<[^>]+>/g, '').trim();
        return plain.slice(0, 100);
    }
    catch {
        return undefined;
    }
}
function countElements(filePath) {
    try {
        const text = fs.readFileSync(filePath, 'utf-8');
        return (text.match(/<[a-zA-Z]/g) ?? []).length;
    }
    catch {
        return 0;
    }
}
function resolveHref(href, baseDir) {
    if (!href || href.startsWith('http://') || href.startsWith('https://')) {
        return null;
    }
    // Reject absolute paths — not valid in DITA href attributes
    if (path.isAbsolute(href)) {
        return null;
    }
    const withoutFragment = href.split('#')[0];
    if (!withoutFragment) {
        return null;
    }
    const normalized = path.normalize(withoutFragment);
    // Count upward traversals; reject excessive depth (> 8 levels up)
    const upCount = (normalized.match(/\.\.[/\\]/g) ?? []).length;
    if (upCount > 8) {
        return null;
    }
    const resolved = path.resolve(baseDir, normalized);
    return fs.existsSync(resolved) ? resolved : null;
}
function buildMapNode(mapPath, _baseDir, depth, maxDepth, visited, topics, relations, keyDefs) {
    const node = {
        uri: vscode_uri_1.URI.file(mapPath).toString(),
        title: readTitle(mapPath),
        children: [],
    };
    if (visited.has(mapPath) || depth > maxDepth) {
        return node;
    }
    visited.add(mapPath);
    let text;
    try {
        text = fs.readFileSync(mapPath, 'utf-8');
    }
    catch {
        return node;
    }
    // Extract topicrefs
    const topicrefRegex = /<topicref\b([^>]*)>/g;
    let m;
    while ((m = topicrefRegex.exec(text)) !== null) {
        const attrs = m[1];
        const hrefMatch = attrs.match(/href="([^"]*)"/);
        if (!hrefMatch) {
            continue;
        }
        const href = hrefMatch[1];
        const resolved = resolveHref(href, path.dirname(mapPath));
        if (!resolved) {
            continue;
        }
        const fromUri = vscode_uri_1.URI.file(mapPath).toString();
        const toUri = vscode_uri_1.URI.file(resolved).toString();
        const isMap = resolved.endsWith('.ditamap') || resolved.endsWith('.bookmap');
        if (isMap) {
            relations.push({ fromUri, toUri, relType: 'mapref' });
            const child = buildMapNode(resolved, path.dirname(resolved), depth + 1, maxDepth, visited, topics, relations, keyDefs);
            node.children.push(child);
        }
        else {
            relations.push({ fromUri, toUri, relType: 'topicref' });
            const titleMatch = attrs.match(/navtitle="([^"]*)"/);
            const childNode = {
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
        if (!keysMatch) {
            continue;
        }
        const keyName = keysMatch[1];
        const hrefMatch2 = attrs.match(/href="([^"]*)"/);
        const navtitleMatch = attrs.match(/navtitle="([^"]*)"/);
        keyDefs.set(keyName, {
            keyName,
            href: hrefMatch2?.[1],
            navtitle: navtitleMatch?.[1],
        });
        if (hrefMatch2) {
            relations.push({ fromUri: vscode_uri_1.URI.file(mapPath).toString(), toUri: hrefMatch2[1], relType: 'keydef' });
        }
    }
    return node;
}
// ── Handler ────────────────────────────────────────────────────────────────
function handleGetContextGraph(params, _keySpaceService) {
    const mapPath = (0, textUtils_1.uriToPath)(params.uri);
    const maxDepth = params.depth ?? 3;
    const topicsMap = new Map();
    const relations = [];
    const keyDefsMap = new Map();
    const visited = new Set();
    const rootMap = buildMapNode(mapPath, path.dirname(mapPath), 0, maxDepth, visited, topicsMap, relations, keyDefsMap);
    const topics = Array.from(topicsMap.values());
    const keyDefinitions = Array.from(keyDefsMap.values());
    // Rough token estimate: 1 token ≈ 4 chars of JSON
    const totalTokenEstimate = Math.ceil((JSON.stringify(rootMap).length + JSON.stringify(topics).length) / 4);
    return { rootMap, topics, relations, keyDefinitions, totalTokenEstimate };
}
//# sourceMappingURL=contextGraph.js.map