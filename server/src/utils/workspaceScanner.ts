import * as fs from 'fs';
import { promises as fsp } from 'fs';
import * as path from 'path';
import { Location, TextDocuments } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { URI } from 'vscode-uri';
import { findReferencesToId, parseReference, ReferenceOccurrence } from './referenceParser';
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
 * Test whether a single reference occurrence found in `contextFilePath`
 * actually targets `normalizedTargetPath`.
 *
 * - href/conref with a file part: matches only if that path resolves to the target.
 * - href/conref fragment-only (e.g. "#topicid"): matches only if contextFilePath
 *   IS the target file itself.
 * - conkeyref: the key must be resolved via keySpaceService to know which file it
 *   targets; without one this cannot be verified, so it's excluded (and logged via
 *   `log`, if given) rather than matched by element-ID text alone, which can
 *   false-positive on an unrelated file whose element merely shares the same id.
 * - keyref (no element-id sub-part): always matches — there is no file part to
 *   verify against.
 *
 * Shared by rename.ts, references.ts, and findCrossFileReferences below so the
 * same matching rules apply consistently across Rename, Find All References,
 * and cross-file reference scanning.
 */
export async function referenceMatchesTarget(
    ref: ReferenceOccurrence,
    contextFilePath: string,
    normalizedTargetPath: string,
    keySpaceService: KeySpaceService | undefined,
    log?: (msg: string) => void
): Promise<boolean> {
    if (ref.type === 'href' || ref.type === 'conref') {
        const parsed = parseReference(ref.value);
        if (parsed.filePath) {
            const resolvedPath = normalizeFsPath(path.resolve(path.dirname(contextFilePath), parsed.filePath));
            return resolvedPath === normalizedTargetPath;
        }
        return normalizeFsPath(contextFilePath) === normalizedTargetPath;
    }
    if (ref.type === 'conkeyref') {
        if (!keySpaceService) {
            log?.(
                `Skipping unverifiable conkeyref "${ref.value}" in ${contextFilePath} ` +
                '(no KeySpaceService available to resolve the key target)'
            );
            return false;
        }
        const slashIdx = ref.value.indexOf('/');
        const keyName = slashIdx >= 0 ? ref.value.slice(0, slashIdx) : ref.value;
        const keyDef = await keySpaceService.resolveKey(keyName, contextFilePath);
        const resolvedTarget = keyDef?.targetFile ? normalizeFsPath(keyDef.targetFile) : null;
        return resolvedTarget === normalizedTargetPath;
    }
    return true;
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
    keySpaceService?: KeySpaceService,
    log?: (msg: string) => void
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

        for (const ref of refs) {
            const matches = await referenceMatchesTarget(
                ref, filePath, normalizedTargetPath, keySpaceService, log
            );
            if (!matches) continue;

            const startPos = offsetToPosition(content, ref.valueStart);
            const endPos = offsetToPosition(content, ref.valueEnd);
            results.push(Location.create(fileUri, { start: startPos, end: endPos }));
        }
    }

    return results;
}
