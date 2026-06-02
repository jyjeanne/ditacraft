"use strict";
/**
 * Circular Reference Detection.
 * Detects href/conref/mapref cycles in DITA documents using DFS traversal.
 * Finds all cycles reachable from the current document, not only those
 * that loop back to the current file.
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
exports.CYCLE_CODES = void 0;
exports.detectCircularReferences = detectCircularReferences;
const node_1 = require("vscode-languageserver/node");
const path = __importStar(require("path"));
const fs_1 = require("fs");
const i18n_1 = require("../utils/i18n");
const textUtils_1 = require("../utils/textUtils");
const SOURCE = 'dita-lsp';
exports.CYCLE_CODES = {
    CIRCULAR_REF: 'DITA-CYCLE-001',
};
/** Safety depth limit to prevent stack overflow on pathological hierarchies. */
const MAX_DEPTH = 100;
/**
 * Regex to extract structural map references (topicref, mapref, chapter, etc.)
 * while skipping keydef elements and topic-level references (xref, link, coderef, etc.).
 * Only matches href/conref on elements that represent structural map includes.
 */
const STRUCTURAL_REF_REGEX = /<(topicref|mapref|chapter|part|appendix|appendices|frontmatter|backmatter|booklists|notices|preface|colophon|dedication|amendments|glossarylist|abbrevlist|bibliolist|figurelist|indexlist|tablelist|trademarklist|toc|topicgroup|topicset|topicsetref|anchorref|glossref)\b(?:"[^"]*"|'[^']*'|[^>"'])*?\bhref\s*=\s*["']([^"'#]+)/g;
/** Regex for conref which can create real circular dependencies in any element. */
const CONREF_REGEX = /\bconref\s*=\s*["']([^"'#]+)/g;
/**
 * Detect circular references originating from a DITA document.
 * Uses DFS with path tracking to find and report all reachable cycles.
 *
 * @param text Document text content.
 * @param documentUri LSP document URI.
 * @returns Diagnostics for any detected cycles.
 */
async function detectCircularReferences(text, documentUri) {
    const filePath = (0, textUtils_1.uriToPath)(documentUri);
    const currentDir = path.dirname(filePath);
    const diagnostics = [];
    const refs = extractFileReferences(text, currentDir);
    const normalizedSelf = normalizePath(filePath);
    // Cache file contents to avoid re-reading the same file from multiple DFS paths
    const fileCache = new Map();
    // Track which cycle signatures have already been reported
    const reportedCycles = new Set();
    for (const ref of refs) {
        const pathStack = new Set([normalizedSelf]);
        const pathList = [normalizedSelf];
        const cyclePath = await dfsDetectAnyCycle(ref.targetPath, pathStack, pathList, fileCache);
        if (cyclePath) {
            // Deduplicate: same cycle found via different refs
            const cycleKey = canonicalizeCycle(cyclePath);
            if (!reportedCycles.has(cycleKey)) {
                reportedCycles.add(cycleKey);
                const cycleDisplay = cyclePath.map(p => path.basename(p)).join(' → ');
                diagnostics.push({
                    severity: node_1.DiagnosticSeverity.Warning,
                    range: ref.range,
                    message: (0, i18n_1.t)('cycle.detected', cycleDisplay),
                    code: exports.CYCLE_CODES.CIRCULAR_REF,
                    source: SOURCE,
                });
            }
        }
    }
    return diagnostics;
}
/** Extract structural file references from text, resolving paths relative to baseDir.
 *  Only follows topicref/mapref/chapter/etc. href (not keydef, xref, link, coderef)
 *  and conref attributes on any element. */
function extractFileReferences(text, baseDir) {
    const refs = [];
    // Strip comments and CDATA to avoid false matches
    const cleanText = (0, textUtils_1.stripCommentsAndCDATA)(text);
    // Structural href references (topicref, mapref, chapter, etc.)
    let match;
    const structuralRegex = new RegExp(STRUCTURAL_REF_REGEX.source, STRUCTURAL_REF_REGEX.flags);
    while ((match = structuralRegex.exec(cleanText)) !== null) {
        const refValue = match[2];
        const ref = resolveRef(refValue, baseDir, text, match);
        if (ref)
            refs.push(ref);
    }
    // Conref references (can create cycles from any element)
    const conrefRegex = new RegExp(CONREF_REGEX.source, CONREF_REGEX.flags);
    while ((match = conrefRegex.exec(cleanText)) !== null) {
        const refValue = match[1];
        const ref = resolveRef(refValue, baseDir, text, match);
        if (ref)
            refs.push(ref);
    }
    return refs;
}
/** Resolve a reference value to a FileRef, or null if it should be skipped. */
function resolveRef(refValue, baseDir, text, match) {
    // Skip external URLs
    if (/^https?:\/\/|^mailto:|^ftp:\/\//.test(refValue))
        return null;
    // Skip empty values
    if (!refValue.trim())
        return null;
    const targetPath = path.resolve(baseDir, refValue);
    // Only consider DITA files (not generic .xml)
    if (!isDitaFile(targetPath))
        return null;
    const range = (0, textUtils_1.offsetToRange)(text, match.index, match.index + match[0].length);
    return { targetPath: normalizePath(targetPath), range };
}
/**
 * DFS cycle detection. Returns the cycle path if any cycle is found
 * (not just cycles back to the root file), or null if no cycle exists.
 *
 * Uses pathStack (Set) for O(1) cycle detection and pathList (array)
 * for building the display path when a cycle is found.
 *
 * Note: we intentionally do NOT cache "cycle-free" status across DFS
 * invocations. Whether a subtree contains a cycle is path-dependent:
 * node X may be cycle-free when explored from path {A,B} but part of
 * a cycle when explored from path {A,C} (if X can reach C).
 */
async function dfsDetectAnyCycle(currentFile, pathStack, pathList, fileCache) {
    // Safety depth limit to prevent stack overflow on pathological hierarchies
    if (pathList.length >= MAX_DEPTH)
        return null;
    const normalized = normalizePath(currentFile);
    // Cycle found: this file is already on the current DFS path
    if (pathStack.has(normalized)) {
        const cycleStart = pathList.indexOf(normalized);
        return [...pathList.slice(cycleStart), normalized];
    }
    // Read file (with cache)
    let content;
    if (fileCache.has(normalized)) {
        content = fileCache.get(normalized);
    }
    else {
        try {
            content = await fs_1.promises.readFile(currentFile, 'utf-8');
        }
        catch (e) {
            // File unreadable (deleted, permissions, etc.) — skip silently in cycle detection
            content = null;
        }
        fileCache.set(normalized, content);
    }
    if (content === null)
        return null;
    pathStack.add(normalized);
    pathList.push(normalized);
    const dir = path.dirname(currentFile);
    const refs = extractFileReferences(content, dir);
    for (const ref of refs) {
        const cycle = await dfsDetectAnyCycle(ref.targetPath, pathStack, pathList, fileCache);
        if (cycle) {
            pathStack.delete(normalized);
            pathList.pop();
            return cycle;
        }
    }
    pathStack.delete(normalized);
    pathList.pop();
    return null;
}
/**
 * Produce a canonical string for a cycle so that the same cycle
 * discovered from different entry points is reported only once.
 * Rotates the cycle to start from the lexicographically smallest element.
 */
function canonicalizeCycle(cyclePath) {
    // cyclePath is [a, b, c, a] — the core is [a, b, c]
    const core = cyclePath.slice(0, -1);
    if (core.length === 0)
        return '';
    let minIdx = 0;
    for (let i = 1; i < core.length; i++) {
        if (core[i] < core[minIdx])
            minIdx = i;
    }
    const rotated = [...core.slice(minIdx), ...core.slice(0, minIdx)];
    return rotated.join('|');
}
function isDitaFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return ext === '.dita' || ext === '.ditamap' || ext === '.bookmap';
}
function normalizePath(filePath) {
    return (0, textUtils_1.normalizeFsPath)(filePath);
}
//# sourceMappingURL=circularRefDetection.js.map