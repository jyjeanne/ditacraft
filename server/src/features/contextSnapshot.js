"use strict";
/**
 * Handler for `dita/buildContextSnapshot` LSP request.
 *
 * Produces a compact, token-budgeted textual representation of a DITA map
 * suitable for injection into an LLM prompt. The snapshot degrades gracefully:
 *   Level 1 — structural XML summary (fast, compact)
 *   Level 2 — tabular text outline (more compact, used when Level 1 exceeds budget)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleBuildContextSnapshot = handleBuildContextSnapshot;
const contextGraph_1 = require("./contextGraph");
// ── Token estimator ────────────────────────────────────────────────────────
function estimateTokens(text) {
    return Math.ceil(text.length / 4);
}
// ── Level 1: structural XML summary ───────────────────────────────────────
function isTopicRefNode(node) {
    return 'href' in node;
}
function renderMapNodeXml(node, topicsMap, depth, maxDepth) {
    const indent = '  '.repeat(depth);
    if (isTopicRefNode(node)) {
        const topic = topicsMap.get(node.uri);
        const typeAttr = topic ? ` type="${topic.type}"` : '';
        const title = node.title ?? topic?.title ?? '';
        return `${indent}<topicref href="${node.href}"${typeAttr} title="${escapeXml(title)}" />`;
    }
    // MapNode
    const lines = [];
    const titleAttr = node.title ? ` title="${escapeXml(node.title)}"` : '';
    if (depth === 0) {
        const topicCount = countTopicRefs(node);
        lines.push(`<ditamap-structure uri="${node.uri}"${titleAttr} topics="${topicCount}">`);
    }
    else {
        lines.push(`${indent}<mapref uri="${node.uri}"${titleAttr}>`);
    }
    if (depth < maxDepth) {
        for (const child of node.children) {
            lines.push(renderMapNodeXml(child, topicsMap, depth + 1, maxDepth));
        }
    }
    lines.push(depth === 0 ? `</ditamap-structure>` : `${indent}</mapref>`);
    return lines.join('\n');
}
function countTopicRefs(node) {
    let count = 0;
    for (const child of node.children) {
        if (isTopicRefNode(child)) {
            count++;
        }
        else {
            count += countTopicRefs(child);
        }
    }
    return count;
}
function escapeXml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function buildLevel1(graph) {
    const topicsMap = new Map(graph.topics.map(t => [t.uri, t]));
    return renderMapNodeXml(graph.rootMap, topicsMap, 0, 4);
}
// ── Level 2: tabular text outline ─────────────────────────────────────────
function renderMapNodeText(node, topicsMap, depth) {
    const indent = '  '.repeat(depth);
    if (isTopicRefNode(node)) {
        const topic = topicsMap.get(node.uri);
        const type = topic?.type ?? 'topic';
        const title = node.title ?? topic?.title ?? node.href;
        const desc = topic?.shortDescSummary ? ` — "${topic.shortDescSummary}"` : '';
        return [`${indent}[${type}] ${node.href} — "${title}"${desc}`];
    }
    const lines = [];
    if (depth === 0) {
        lines.push(`Map: ${node.title} (${countTopicRefs(node)} topics)`);
        lines.push('Structure:');
    }
    else {
        lines.push(`${indent}[map] ${node.uri} — "${node.title}"`);
    }
    for (const child of node.children) {
        lines.push(...renderMapNodeText(child, topicsMap, depth + 1));
    }
    return lines;
}
function buildLevel2(graph) {
    const topicsMap = new Map(graph.topics.map(t => [t.uri, t]));
    return renderMapNodeText(graph.rootMap, topicsMap, 0).join('\n');
}
// ── Level 3: sliding window for large maps (> 200 topics) ─────────────────
/**
 * Level 3 snapshot: takes up to `windowSize` contiguous topics starting from
 * the topic nearest to `focusUri`, if provided; otherwise uses the first
 * `windowSize` topics in BFS order. This limits token usage for very large maps.
 */
function buildLevel3(graph, maxTokens, focusUri) {
    const topicsMap = new Map(graph.topics.map(t => [t.uri, t]));
    // Flatten all topic refs in BFS order
    const allRefs = [];
    function collectRefs(node) {
        if (isTopicRefNode(node)) {
            allRefs.push(node);
        }
        else {
            for (const child of node.children) {
                collectRefs(child);
            }
        }
    }
    collectRefs(graph.rootMap);
    // Determine window start: find focus topic index, default 0
    let windowStart = 0;
    if (focusUri) {
        const idx = allRefs.findIndex(r => r.uri === focusUri || r.href === focusUri);
        if (idx >= 0) {
            // Centre the window around the focused topic
            const estimatedWindowSize = Math.floor((maxTokens * 4) / 120); // ~120 chars/topic
            windowStart = Math.max(0, idx - Math.floor(estimatedWindowSize / 2));
        }
    }
    const lines = [
        `Map: ${graph.rootMap.title} (${allRefs.length} topics total, sliding window)`,
        `Structure (from topic ${windowStart + 1}):`,
    ];
    const charsPerTopic = 120;
    const maxChars = maxTokens * 4;
    let chars = lines.join('\n').length;
    for (let i = windowStart; i < allRefs.length; i++) {
        const ref = allRefs[i];
        const topic = topicsMap.get(ref.uri);
        const type = topic?.type ?? 'topic';
        const title = ref.title ?? topic?.title ?? ref.href;
        const desc = topic?.shortDescSummary ? ` — "${topic.shortDescSummary}"` : '';
        const line = `  [${type}] ${ref.href} — "${title}"${desc}`;
        if (chars + line.length + 1 > maxChars) {
            lines.push('  ... [window limit reached]');
            break;
        }
        lines.push(line);
        chars += line.length + 1;
        if (chars > maxChars - charsPerTopic * 3) {
            // Leave some budget for the truncation marker
            lines.push(`  ... [${allRefs.length - i - 1} more topics not shown]`);
            break;
        }
    }
    return lines.join('\n');
}
// ── Handler ────────────────────────────────────────────────────────────────
function handleBuildContextSnapshot(params, keySpaceService) {
    const graphParams = {
        uri: params.uri,
        depth: 4,
        includeMetadata: true,
    };
    const graph = (0, contextGraph_1.handleGetContextGraph)(graphParams, keySpaceService);
    // Try Level 1 first
    const level1 = buildLevel1(graph);
    const l1Tokens = estimateTokens(level1);
    if (l1Tokens <= params.maxTokens) {
        return { snapshot: level1, tokenEstimate: l1Tokens, truncated: false, level: 1 };
    }
    // Fall back to Level 2 (more compact)
    const level2 = buildLevel2(graph);
    const l2Tokens = estimateTokens(level2);
    if (l2Tokens <= params.maxTokens) {
        return { snapshot: level2, tokenEstimate: l2Tokens, truncated: false, level: 2 };
    }
    // Level 3: sliding window (always used when Level 2 still exceeds budget)
    const level3 = buildLevel3(graph, params.maxTokens, params.focusUri);
    const l3Tokens = estimateTokens(level3);
    return { snapshot: level3, tokenEstimate: l3Tokens, truncated: true, level: 3 };
}
//# sourceMappingURL=contextSnapshot.js.map