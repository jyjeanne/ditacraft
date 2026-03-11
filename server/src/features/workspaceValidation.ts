/**
 * Workspace-Level Validation.
 * Cross-file duplicate ID detection and unused topic detection.
 * Uses the existing workspace scanner for file discovery.
 */

import * as path from 'path';
import * as fs from 'fs';
import { Diagnostic, DiagnosticSeverity, Range } from 'vscode-languageserver/node';
import { t } from '../utils/i18n';
import { collectDitaFiles } from '../utils/workspaceScanner';
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

/**
 * Build a workspace-wide index mapping root topic IDs to file paths.
 * Only considers .dita files (not maps).
 */
export function buildRootIdIndex(workspaceFolders: readonly string[]): Map<string, string[]> {
    const idToFiles = new Map<string, string[]>();
    const allFiles = collectDitaFiles(workspaceFolders);

    for (const filePath of allFiles) {
        const ext = path.extname(filePath).toLowerCase();
        // Only index topic files, not maps
        if (ext !== '.dita') continue;

        let content: string;
        try {
            content = fs.readFileSync(filePath, 'utf-8');
        } catch {
            continue;
        }

        const rootInfo = extractRootId(content);
        if (rootInfo) {
            const rootId = rootInfo.id;
            const existing = idToFiles.get(rootId);
            if (existing) {
                existing.push(filePath);
            } else {
                idToFiles.set(rootId, [filePath]);
            }
        }
    }

    return idToFiles;
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
    keySpaceService: KeySpaceService
): Promise<Set<string>> {
    const allFiles = collectDitaFiles(workspaceFolders);
    const topicFiles = allFiles.filter(f => path.extname(f).toLowerCase() === '.dita');
    const mapFiles = allFiles.filter(f => {
        const ext = path.extname(f).toLowerCase();
        return ext === '.ditamap' || ext === '.bookmap';
    });

    // Collect all referenced topic paths from all maps
    const referencedPaths = new Set<string>();

    for (const mapFile of mapFiles) {
        let content: string;
        try {
            content = fs.readFileSync(mapFile, 'utf-8');
        } catch {
            continue;
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
    }

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

