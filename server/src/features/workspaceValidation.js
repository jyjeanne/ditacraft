"use strict";
/**
 * Workspace-Level Validation.
 * Cross-file duplicate ID detection and unused topic detection.
 * Uses the existing workspace scanner for file discovery.
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
exports.WorkspaceIndex = exports.WORKSPACE_CODES = void 0;
exports.detectCrossFileDuplicateIds = detectCrossFileDuplicateIds;
exports.detectUnusedTopics = detectUnusedTopics;
exports.createUnusedTopicDiagnostic = createUnusedTopicDiagnostic;
const path = __importStar(require("path"));
const fs_1 = require("fs");
const node_1 = require("vscode-languageserver/node");
const i18n_1 = require("../utils/i18n");
const workspaceScanner_1 = require("../utils/workspaceScanner");
const textUtils_1 = require("../utils/textUtils");
const SOURCE = 'dita-lsp';
exports.WORKSPACE_CODES = {
    CROSS_FILE_DUPLICATE_ID: 'DITA-ID-003',
    UNUSED_TOPIC: 'DITA-ORPHAN-001',
};
/** Extract the root element's tag name and id attribute value. Skips XML prolog, DOCTYPE, comments, and PIs. */
function extractRootId(text) {
    // Strip XML declaration, DOCTYPE, comments, and PIs to find the first real element
    const stripped = (0, textUtils_1.stripCommentsAndCDATA)(text)
        .replace(/<\?[\s\S]*?\?>/g, (m) => ' '.repeat(m.length))
        .replace(/<!DOCTYPE[\s\S]*?>/g, (m) => ' '.repeat(m.length));
    const rootMatch = stripped.match(/<(\w[\w.-]*)\s[^>]*\bid\s*=\s*["']([^"']+)["']/);
    if (!rootMatch || rootMatch.index === undefined)
        return null;
    return { tagName: rootMatch[1], id: rootMatch[2], index: rootMatch.index };
}
/** Max concurrent file reads to avoid exhausting file descriptors. */
const MAX_CONCURRENT_READS = 10;
/** Run async tasks with bounded concurrency. */
async function mapWithConcurrency(items, limit, fn) {
    const results = new Array(items.length);
    let index = 0;
    async function worker() {
        while (index < items.length) {
            const i = index++;
            results[i] = await fn(items[i]);
        }
    }
    const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
    await Promise.all(workers);
    return results;
}
/**
 * Detect cross-file duplicate root IDs for a given document.
 * Returns diagnostics if this document's root ID conflicts with other files.
 */
function detectCrossFileDuplicateIds(text, documentPath, rootIdIndex) {
    const diagnostics = [];
    const rootInfo = extractRootId(text);
    if (!rootInfo)
        return diagnostics;
    const rootId = rootInfo.id;
    const files = rootIdIndex.get(rootId);
    if (!files || files.length <= 1)
        return diagnostics;
    // Find other files with the same root ID (not this file)
    const normalizedSelf = (0, textUtils_1.normalizeFsPath)(documentPath);
    const others = files.filter(f => (0, textUtils_1.normalizeFsPath)(f) !== normalizedSelf);
    if (others.length === 0)
        return diagnostics;
    // Find the position of the id value in the original text using the index from stripped text
    // The stripping preserves character positions, so the index maps directly
    const idValuePos = text.indexOf(rootId, rootInfo.index);
    let range;
    if (idValuePos !== -1) {
        range = (0, textUtils_1.offsetToRange)(text, idValuePos, idValuePos + rootId.length);
    }
    else {
        range = node_1.Range.create(0, 0, 0, 1);
    }
    const otherNames = others.map(f => path.basename(f)).join(', ');
    diagnostics.push({
        severity: node_1.DiagnosticSeverity.Warning,
        range,
        message: (0, i18n_1.t)('id.crossFileDuplicate', rootId, otherNames),
        code: exports.WORKSPACE_CODES.CROSS_FILE_DUPLICATE_ID,
        source: SOURCE,
    });
    return diagnostics;
}
/**
 * Detect unused topics — .dita files not referenced by any map.
 * Returns a set of file paths that are orphaned.
 */
async function detectUnusedTopics(workspaceFolders, keySpaceService, preScannedFiles) {
    const allFiles = preScannedFiles ?? await (0, workspaceScanner_1.collectDitaFilesAsync)(workspaceFolders);
    const topicFiles = allFiles.filter(f => path.extname(f).toLowerCase() === '.dita');
    const mapFiles = allFiles.filter(f => {
        const ext = path.extname(f).toLowerCase();
        return ext === '.ditamap' || ext === '.bookmap';
    });
    // Collect all referenced topic paths from all maps
    const referencedPaths = new Set();
    await mapWithConcurrency(mapFiles, MAX_CONCURRENT_READS, async (mapFile) => {
        let content;
        try {
            content = await fs_1.promises.readFile(mapFile, 'utf-8');
        }
        catch {
            return;
        }
        const mapDir = path.dirname(mapFile);
        const cleanContent = (0, textUtils_1.stripCommentsAndCDATA)(content);
        const hrefRegex = /\b(?:href|conref)\s*=\s*["']([^"'#]+)/g;
        let match;
        while ((match = hrefRegex.exec(cleanContent)) !== null) {
            const refValue = match[1];
            if (/^https?:\/\/|^mailto:/.test(refValue))
                continue;
            const resolved = (0, textUtils_1.normalizeFsPath)(path.resolve(mapDir, refValue));
            referencedPaths.add(resolved);
        }
    });
    // Also add hrefs from key space (keys may reference topics indirectly)
    for (const mapFile of mapFiles) {
        try {
            const keySpace = await keySpaceService.buildKeySpace(mapFile);
            for (const [, keyDef] of keySpace.keys) {
                if (keyDef.targetFile) {
                    referencedPaths.add((0, textUtils_1.normalizeFsPath)(keyDef.targetFile));
                }
            }
        }
        catch {
            // Skip maps that fail to parse
        }
    }
    // Find topics not in the referenced set
    const unusedTopics = new Set();
    for (const topicFile of topicFiles) {
        const normalized = (0, textUtils_1.normalizeFsPath)(topicFile);
        if (!referencedPaths.has(normalized)) {
            unusedTopics.add(normalized);
        }
    }
    return unusedTopics;
}
/**
 * Incremental workspace index.
 * Maintains the root-ID-to-files map with per-file updates
 * instead of requiring a full rebuild on every change.
 */
class WorkspaceIndex {
    constructor() {
        /** Root ID → file paths. */
        this.idToFiles = new Map();
        /** File path → root ID (reverse index for fast removal). */
        this.fileToId = new Map();
        /** Whether the index has been built at least once. */
        this._initialized = false;
    }
    get rootIdIndex() {
        return this.idToFiles;
    }
    get initialized() {
        return this._initialized;
    }
    /** Full rebuild from scratch. */
    async buildFull(workspaceFolders, preScannedFiles) {
        const allFiles = preScannedFiles ?? await (0, workspaceScanner_1.collectDitaFilesAsync)(workspaceFolders);
        const topicFiles = allFiles.filter(f => path.extname(f).toLowerCase() === '.dita');
        this.idToFiles.clear();
        this.fileToId.clear();
        await mapWithConcurrency(topicFiles, MAX_CONCURRENT_READS, async (filePath) => {
            await this.indexFile(filePath);
        });
        this._initialized = true;
    }
    /** Update the index for a single file (create or change). */
    async updateFile(filePath) {
        if (!this._initialized)
            return;
        const ext = path.extname(filePath).toLowerCase();
        if (ext !== '.dita')
            return;
        // Remove old entry first
        this.removeFile(filePath);
        // Re-index
        await this.indexFile(filePath);
    }
    /** Remove a file from the index (delete event). */
    removeFile(filePath) {
        if (!this._initialized)
            return;
        const normalized = (0, textUtils_1.normalizeFsPath)(filePath);
        const oldId = this.fileToId.get(normalized);
        if (oldId !== undefined) {
            this.fileToId.delete(normalized);
            const files = this.idToFiles.get(oldId);
            if (files) {
                const filtered = files.filter(f => f !== normalized);
                if (filtered.length === 0) {
                    this.idToFiles.delete(oldId);
                }
                else {
                    this.idToFiles.set(oldId, filtered);
                }
            }
        }
    }
    /** Clear the entire index. */
    clear() {
        this.idToFiles.clear();
        this.fileToId.clear();
        this._initialized = false;
    }
    /** Read a single file and add its root ID to the index. */
    async indexFile(filePath) {
        let content;
        try {
            content = await fs_1.promises.readFile(filePath, 'utf-8');
        }
        catch {
            return;
        }
        const rootInfo = extractRootId(content);
        if (rootInfo) {
            const normalized = (0, textUtils_1.normalizeFsPath)(filePath);
            this.fileToId.set(normalized, rootInfo.id);
            const existing = this.idToFiles.get(rootInfo.id);
            if (existing) {
                existing.push(normalized);
            }
            else {
                this.idToFiles.set(rootInfo.id, [normalized]);
            }
        }
    }
}
exports.WorkspaceIndex = WorkspaceIndex;
/**
 * Create a diagnostic for an unused topic file.
 */
function createUnusedTopicDiagnostic() {
    return {
        severity: node_1.DiagnosticSeverity.Information,
        range: node_1.Range.create(0, 0, 0, 1),
        message: (0, i18n_1.t)('orphan.unusedTopic'),
        code: exports.WORKSPACE_CODES.UNUSED_TOPIC,
        source: SOURCE,
    };
}
//# sourceMappingURL=workspaceValidation.js.map