/**
 * Workspace-Level Validation.
 * Cross-file duplicate ID detection and unused topic detection.
 * Uses the existing workspace scanner for file discovery.
 */

import * as path from 'path';
import { promises as fsp } from 'fs';
import { Diagnostic, DiagnosticSeverity, Range } from 'vscode-languageserver/node';
import { t } from '../utils/i18n';
import { collectDitaFilesAsync } from '../utils/workspaceScanner';
import { KeySpaceService } from '../services/keySpaceService';
import { normalizeFsPath, offsetToRange, stripCommentsAndCDATA } from '../utils/textUtils';

const SOURCE = 'dita-lsp';

export const WORKSPACE_CODES = {
    CROSS_FILE_DUPLICATE_ID: 'DITA-ID-003',
    UNUSED_TOPIC: 'DITA-ORPHAN-001',
} as const;

/** Extract the root element's tag name and id attribute value. Skips XML prolog, DOCTYPE, comments, and PIs. */
function extractRootId(text: string): { tagName: string; id: string; index: number } | null {
    // Strip XML declaration, DOCTYPE, comments, and PIs to find the first real element
    const stripped = stripCommentsAndCDATA(text)
        .replace(/<\?[\s\S]*?\?>/g, (m) => ' '.repeat(m.length))
        .replace(/<!DOCTYPE[\s\S]*?>/g, (m) => ' '.repeat(m.length));
    const rootMatch = stripped.match(/<(\w[\w.-]*)\s[^>]*\bid\s*=\s*["']([^"']+)["']/);
    if (!rootMatch || rootMatch.index === undefined) return null;
    return { tagName: rootMatch[1], id: rootMatch[2], index: rootMatch.index };
}

/** Max concurrent file reads to avoid exhausting file descriptors. */
const MAX_CONCURRENT_READS = 10;

/** Run async tasks with bounded concurrency. */
async function mapWithConcurrency<T, R>(
    items: T[],
    limit: number,
    fn: (item: T) => Promise<R>
): Promise<R[]> {
    const results: R[] = new Array(items.length);
    let index = 0;

    async function worker(): Promise<void> {
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
export function detectCrossFileDuplicateIds(
    text: string,
    documentPath: string,
    rootIdIndex: Map<string, string[]>
): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    const rootInfo = extractRootId(text);
    if (!rootInfo) return diagnostics;

    const rootId = rootInfo.id;
    const files = rootIdIndex.get(rootId);
    if (!files || files.length <= 1) return diagnostics;

    // Find other files with the same root ID (not this file)
    const normalizedSelf = normalizeFsPath(documentPath);
    const others = files.filter(f => normalizeFsPath(f) !== normalizedSelf);
    if (others.length === 0) return diagnostics;

    // Find the position of the id value in the original text using the index from stripped text
    // The stripping preserves character positions, so the index maps directly
    const idValuePos = text.indexOf(rootId, rootInfo.index);
    let range: Range;
    if (idValuePos !== -1) {
        range = offsetToRange(text, idValuePos, idValuePos + rootId.length);
    } else {
        range = Range.create(0, 0, 0, 1);
    }

    const otherNames = others.map(f => path.basename(f)).join(', ');
    diagnostics.push({
        severity: DiagnosticSeverity.Warning,
        range,
        message: t('id.crossFileDuplicate', rootId, otherNames),
        code: WORKSPACE_CODES.CROSS_FILE_DUPLICATE_ID,
        source: SOURCE,
    });

    return diagnostics;
}

/**
 * Detect unused topics — .dita files not referenced by any map.
 * Returns a set of file paths that are orphaned.
 */
export async function detectUnusedTopics(
    workspaceFolders: readonly string[],
    keySpaceService: KeySpaceService,
    preScannedFiles?: string[]
): Promise<Set<string>> {
    const allFiles = preScannedFiles ?? await collectDitaFilesAsync(workspaceFolders);
    const topicFiles = allFiles.filter(f => path.extname(f).toLowerCase() === '.dita');
    const mapFiles = allFiles.filter(f => {
        const ext = path.extname(f).toLowerCase();
        return ext === '.ditamap' || ext === '.bookmap';
    });

    // Collect all referenced topic paths from all maps
    const referencedPaths = new Set<string>();

    await mapWithConcurrency(mapFiles, MAX_CONCURRENT_READS, async (mapFile) => {
        let content: string;
        try {
            content = await fsp.readFile(mapFile, 'utf-8');
        } catch {
            return;
        }

        const mapDir = path.dirname(mapFile);
        const cleanContent = stripCommentsAndCDATA(content);
        const hrefRegex = /\b(?:href|conref)\s*=\s*["']([^"'#]+)/g;
        let match: RegExpExecArray | null;

        while ((match = hrefRegex.exec(cleanContent)) !== null) {
            const refValue = match[1];
            if (/^https?:\/\/|^mailto:/.test(refValue)) continue;
            const resolved = normalizeFsPath(path.resolve(mapDir, refValue));
            referencedPaths.add(resolved);
        }
    });

    // Also add hrefs from key space (keys may reference topics indirectly)
    for (const mapFile of mapFiles) {
        try {
            const keySpace = await keySpaceService.buildKeySpace(mapFile);
            for (const [, keyDef] of keySpace.keys) {
                if (keyDef.targetFile) {
                    referencedPaths.add(normalizeFsPath(keyDef.targetFile));
                }
            }
        } catch {
            // Skip maps that fail to parse
        }
    }

    // Find topics not in the referenced set
    const unusedTopics = new Set<string>();
    for (const topicFile of topicFiles) {
        const normalized = normalizeFsPath(topicFile);
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
export class WorkspaceIndex {
    /** Root ID → file paths. */
    private idToFiles = new Map<string, string[]>();
    /** File path → root ID (reverse index for fast removal). */
    private fileToId = new Map<string, string>();
    /** Whether the index has been built at least once. */
    private _initialized = false;

    get rootIdIndex(): Map<string, string[]> {
        return this.idToFiles;
    }

    get initialized(): boolean {
        return this._initialized;
    }

    /** Full rebuild from scratch. */
    async buildFull(workspaceFolders: readonly string[], preScannedFiles?: string[]): Promise<void> {
        const allFiles = preScannedFiles ?? await collectDitaFilesAsync(workspaceFolders);
        const topicFiles = allFiles.filter(f => path.extname(f).toLowerCase() === '.dita');

        this.idToFiles.clear();
        this.fileToId.clear();

        await mapWithConcurrency(topicFiles, MAX_CONCURRENT_READS, async (filePath) => {
            await this.indexFile(filePath);
        });

        this._initialized = true;
    }

    /** Update the index for a single file (create or change). */
    async updateFile(filePath: string): Promise<void> {
        if (!this._initialized) return;
        const ext = path.extname(filePath).toLowerCase();
        if (ext !== '.dita') return;

        // Remove old entry first
        this.removeFile(filePath);
        // Re-index
        await this.indexFile(filePath);
    }

    /** Remove a file from the index (delete event). */
    removeFile(filePath: string): void {
        if (!this._initialized) return;
        const normalized = normalizeFsPath(filePath);
        const oldId = this.fileToId.get(normalized);
        if (oldId !== undefined) {
            this.fileToId.delete(normalized);
            const files = this.idToFiles.get(oldId);
            if (files) {
                const filtered = files.filter(f => f !== normalized);
                if (filtered.length === 0) {
                    this.idToFiles.delete(oldId);
                } else {
                    this.idToFiles.set(oldId, filtered);
                }
            }
        }
    }

    /** Clear the entire index. */
    clear(): void {
        this.idToFiles.clear();
        this.fileToId.clear();
        this._initialized = false;
    }

    /** Read a single file and add its root ID to the index. */
    private async indexFile(filePath: string): Promise<void> {
        let content: string;
        try {
            content = await fsp.readFile(filePath, 'utf-8');
        } catch {
            return;
        }

        const rootInfo = extractRootId(content);
        if (rootInfo) {
            const normalized = normalizeFsPath(filePath);
            this.fileToId.set(normalized, rootInfo.id);
            const existing = this.idToFiles.get(rootInfo.id);
            if (existing) {
                existing.push(normalized);
            } else {
                this.idToFiles.set(rootInfo.id, [normalized]);
            }
        }
    }
}

/**
 * Create a diagnostic for an unused topic file.
 */
export function createUnusedTopicDiagnostic(): Diagnostic {
    return {
        severity: DiagnosticSeverity.Information,
        range: Range.create(0, 0, 0, 1),
        message: t('orphan.unusedTopic'),
        code: WORKSPACE_CODES.UNUSED_TOPIC,
        source: SOURCE,
    };
}

