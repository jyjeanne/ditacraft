import * as fs from 'fs';
import { promises as fsp } from 'fs';
import * as path from 'path';
import { Location, TextDocuments } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { URI } from 'vscode-uri';
import { findReferencesToId, parseReference } from './referenceParser';
import { offsetToPosition, normalizeFsPath } from './textUtils';
import { KeySpaceService } from '../services/keySpaceService';

/** File extensions considered DITA files. */
const DITA_EXTENSIONS = new Set(['.dita', '.ditamap', '.bookmap']);

/** Directories to skip during recursive scanning. */
const SKIP_DIRS = new Set(['node_modules', '.git', 'out', '.vscode', '.vscode-test']);

/**
 * Collect all DITA files in the given workspace folders.
 * Synchronous recursive directory walk.
 */
export function collectDitaFiles(workspaceFolders: readonly string[]): string[] {
    const files: string[] = [];

    function walk(dir: string): void {
        let entries: fs.Dirent[];
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch {
            return;
        }
        for (const entry of entries) {
            if (entry.isDirectory()) {
                if (!SKIP_DIRS.has(entry.name) && !entry.name.startsWith('.')) {
                    walk(path.join(dir, entry.name));
                }
            } else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                if (DITA_EXTENSIONS.has(ext)) {
                    files.push(path.join(dir, entry.name));
                }
            }
        }
    }

    for (const folder of workspaceFolders) {
        walk(folder);
    }
    return files;
}

/**
 * Collect all DITA files in the given workspace folders.
 * Async recursive directory walk — does not block the server thread.
 */
export async function collectDitaFilesAsync(workspaceFolders: readonly string[]): Promise<string[]> {
    const files: string[] = [];

    async function walk(dir: string): Promise<void> {
        let entries: fs.Dirent[];
        try {
            entries = await fsp.readdir(dir, { withFileTypes: true });
        } catch {
            return;
        }
        const subdirs: Promise<void>[] = [];
        for (const entry of entries) {
            if (entry.isDirectory()) {
                if (!SKIP_DIRS.has(entry.name) && !entry.name.startsWith('.')) {
                    subdirs.push(walk(path.join(dir, entry.name)));
                }
            } else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                if (DITA_EXTENSIONS.has(ext)) {
                    files.push(path.join(dir, entry.name));
                }
            }
        }
        await Promise.all(subdirs);
    }

    await Promise.all(workspaceFolders.map(folder => walk(folder)));
    return files;
}

/**
 * Find all references to a target ID across all DITA files in the workspace.
 *
 * Filtering:
 * - href/conref with file path: only included if the path resolves to targetFilePath
 * - href/conref fragment-only: only included if found in the target file itself
 * - conkeyref: only included if its key resolves (via keySpaceService) to targetFilePath;
 *   without a keySpaceService this cannot be verified, so conkeyref matches are excluded
 *   rather than reported by element-ID text match alone (which can false-positive on an
 *   unrelated file whose element merely shares the same id)
 */
export async function findCrossFileReferences(
    targetId: string,
    targetFilePath: string,
    workspaceFolders: readonly string[],
    excludeUri?: string,
    documents?: TextDocuments<TextDocument>,
    keySpaceService?: KeySpaceService
): Promise<Location[]> {
    const results: Location[] = [];
    const ditaFiles = collectDitaFiles(workspaceFolders);
    const normalizedTargetPath = normalizeFsPath(targetFilePath);

    for (const filePath of ditaFiles) {
        const fileUri = URI.file(filePath).toString();

        // Skip the current document (already searched by the caller)
        if (excludeUri && fileUri === excludeUri) {
            continue;
        }

        // Prefer in-memory content for open documents (may have unsaved changes)
        const openDoc = documents?.get(fileUri);
        let content: string;
        if (openDoc) {
            content = openDoc.getText();
        } else {
            try {
                content = fs.readFileSync(filePath, 'utf-8');
            } catch {
                continue;
            }
        }

        const refs = findReferencesToId(content, targetId);
        if (refs.length === 0) continue;

        const fileDir = path.dirname(filePath);

        for (const ref of refs) {
            if (ref.type === 'href' || ref.type === 'conref') {
                const parsed = parseReference(ref.value);
                if (parsed.filePath) {
                    // Cross-file ref: check path resolves to target
                    const resolvedPath = normalizeFsPath(
                        path.resolve(fileDir, parsed.filePath)
                    );
                    if (resolvedPath !== normalizedTargetPath) {
                        continue;
                    }
                } else {
                    // Fragment-only ref: only relevant if in the target file itself
                    if (normalizeFsPath(filePath) !== normalizedTargetPath) {
                        continue;
                    }
                }
            } else if (ref.type === 'conkeyref') {
                if (!keySpaceService) continue;
                const slashIdx = ref.value.indexOf('/');
                const keyName = slashIdx >= 0 ? ref.value.slice(0, slashIdx) : ref.value;
                const keyDef = await keySpaceService.resolveKey(keyName, filePath);
                const resolvedTarget = keyDef?.targetFile ? normalizeFsPath(keyDef.targetFile) : null;
                if (resolvedTarget !== normalizedTargetPath) continue;
            }

            const startPos = offsetToPosition(content, ref.valueStart);
            const endPos = offsetToPosition(content, ref.valueEnd);
            results.push(Location.create(fileUri, { start: startPos, end: endPos }));
        }
    }

    return results;
}
