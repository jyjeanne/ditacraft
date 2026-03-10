/**
 * Circular Reference Detection.
 * Detects href/conref/mapref cycles in DITA documents using DFS traversal.
 */

import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver/node';
import { URI } from 'vscode-uri';
import * as path from 'path';
import { promises as fsp } from 'fs';
import { t } from '../utils/i18n';

const SOURCE = 'dita-lsp';

export const CYCLE_CODES = {
    CIRCULAR_REF: 'DITA-CYCLE-001',
} as const;

/** Maximum traversal depth to prevent runaway DFS on very deep hierarchies. */
const MAX_DEPTH = 50;

/** Regex to extract href and conref values from DITA/map content. */
const REF_REGEX = /\b(?:href|conref)\s*=\s*["']([^"'#]+)/g;

/**
 * Detect circular references originating from a DITA document.
 * Uses DFS with path tracking to find and report cycles.
 *
 * @param text Document text content.
 * @param documentUri LSP document URI.
 * @returns Diagnostics for any detected cycles.
 */
export async function detectCircularReferences(
    text: string,
    documentUri: string,
): Promise<Diagnostic[]> {
    const filePath = URI.parse(documentUri).fsPath;
    const currentDir = path.dirname(filePath);
    const diagnostics: Diagnostic[] = [];

    // Extract all local file references from this document
    const refs = extractFileReferences(text, currentDir);

    // For each reference, do a DFS to detect cycles back to this file
    const normalizedSelf = normalizePath(filePath);

    for (const ref of refs) {
        const cyclePath: string[] = [normalizedSelf];
        const localVisited = new Set<string>();
        const detected = await dfsDetectCycle(
            ref.targetPath, normalizedSelf, cyclePath, localVisited, 0
        );
        if (detected) {
            const cycleDisplay = cyclePath.map(p => path.basename(p)).join(' → ');
            diagnostics.push({
                severity: DiagnosticSeverity.Warning,
                range: ref.range,
                message: t('cycle.detected', cycleDisplay),
                code: CYCLE_CODES.CIRCULAR_REF,
                source: SOURCE,
            });
        }
    }

    return diagnostics;
}

interface FileRef {
    targetPath: string;
    range: { start: { line: number; character: number }; end: { line: number; character: number } };
}

/** Extract local file references (href/conref) from text, resolving paths relative to baseDir. */
function extractFileReferences(text: string, baseDir: string): FileRef[] {
    const refs: FileRef[] = [];
    // Strip comments to avoid false matches
    const cleanText = text
        .replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n\r]/g, ' '));

    let match: RegExpExecArray | null;
    const regex = new RegExp(REF_REGEX.source, REF_REGEX.flags);

    while ((match = regex.exec(cleanText)) !== null) {
        const refValue = match[1];
        // Skip external URLs
        if (/^https?:\/\/|^mailto:|^ftp:\/\//.test(refValue)) continue;
        // Skip empty values
        if (!refValue.trim()) continue;

        const targetPath = path.resolve(baseDir, refValue);
        // Only consider DITA files
        if (!isDitaFile(targetPath)) continue;

        const range = offsetToRange(text, match.index, match.index + match[0].length);
        refs.push({ targetPath: normalizePath(targetPath), range });
    }

    return refs;
}

/**
 * DFS cycle detection. Returns true if a cycle back to `targetFile` is found.
 * Mutates `cyclePath` to contain the full cycle when detected.
 */
async function dfsDetectCycle(
    currentFile: string,
    targetFile: string,
    cyclePath: string[],
    globalVisited: Set<string>,
    depth: number
): Promise<boolean> {
    if (depth >= MAX_DEPTH) return false;

    const normalized = normalizePath(currentFile);

    // Cycle found: current file references back to the original file
    if (normalized === targetFile && depth > 0) {
        cyclePath.push(normalized);
        return true;
    }

    // Already explored this file (no cycle through it)
    if (globalVisited.has(normalized)) {
        return false;
    }
    globalVisited.add(normalized);
    cyclePath.push(normalized);

    // Read and parse the current file for references
    let content: string;
    try {
        content = await fsp.readFile(currentFile, 'utf-8');
    } catch {
        cyclePath.pop();
        return false;
    }

    const dir = path.dirname(currentFile);
    const refs = extractFileReferences(content, dir);

    for (const ref of refs) {
        const found = await dfsDetectCycle(
            ref.targetPath, targetFile, cyclePath, globalVisited, depth + 1
        );
        if (found) return true;
    }

    cyclePath.pop();
    return false;
}

function isDitaFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return ext === '.dita' || ext === '.ditamap' || ext === '.bookmap' || ext === '.xml';
}

function normalizePath(filePath: string): string {
    return path.resolve(filePath).toLowerCase();
}

/** Convert byte offsets to LSP Range. */
function offsetToRange(text: string, start: number, end: number) {
    let line = 0;
    let char = 0;
    let startLine = 0, startChar = 0, endLine = 0, endChar = 0;
    const safeStart = Math.min(start, text.length);
    const safeEnd = Math.min(end, text.length);

    for (let i = 0; i <= safeEnd; i++) {
        if (i === safeStart) { startLine = line; startChar = char; }
        if (i === safeEnd) { endLine = line; endChar = char; break; }
        if (text[i] === '\r') {
            line++; char = 0;
            if (i + 1 <= safeEnd && text[i + 1] === '\n') {
                i++;
                if (i === safeStart) { startLine = line; startChar = char; }
                if (i === safeEnd) { endLine = line; endChar = char; break; }
            }
        } else if (text[i] === '\n') {
            line++; char = 0;
        } else {
            char++;
        }
    }

    return {
        start: { line: startLine, character: startChar },
        end: { line: endLine, character: endChar },
    };
}
