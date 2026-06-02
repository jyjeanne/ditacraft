"use strict";
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
exports.handleDitaMapStructure = handleDitaMapStructure;
const contextGraph_1 = require("../../../server/src/features/contextGraph");
const workspace_1 = require("../workspace");
function handleDitaMapStructure(args, ctx) {
    const { mapUri, depth = 4, includeMetadata = true, format = 'json' } = args;
    const resolvedUri = (0, workspace_1.resolvePath)(mapUri, ctx.workspaceRoot);
    if (!resolvedUri) {
        throw new Error(`Invalid or unsafe path: ${mapUri}`);
    }
    const params = {
        uri: resolvedUri,
        depth: depth ?? 4,
        includeMetadata: includeMetadata ?? true,
    };
    const graph = (0, contextGraph_1.handleGetContextGraph)(params);
    if (format === 'tree') {
        return formatAsTree(graph);
    }
    if (format === 'csv') {
        return formatAsCsv(graph);
    }
    return graph;
}
function formatAsTree(graph) {
    const lines = [];
    lines.push(`Map: ${graph.rootMap.title} (${graph.topics.length} topics)`);
    function renderNode(node, indent) {
        const prefix = '  '.repeat(indent);
        if ('href' in node) {
            const topicRef = node;
            lines.push(`${prefix}[?] ${topicRef.href}${topicRef.title ? ` — ${topicRef.title}` : ''}`);
        }
        else {
            const mapNode = node;
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
function formatAsCsv(graph) {
    const rows = ['type,uri,title'];
    for (const topic of graph.topics) {
        const escapedUri = topic.uri.includes(',') ? `"${topic.uri}"` : topic.uri;
        const escapedTitle = topic.title.includes(',') ? `"${topic.title}"` : topic.title;
        rows.push(`${topic.type},${escapedUri},${escapedTitle}`);
    }
    return rows.join('\n');
}
const path = __importStar(require("path"));
//# sourceMappingURL=ditaMapStructure.js.map