/**
 * Circular Reference Detection.
 * Detects href/conref/mapref cycles in DITA documents using DFS traversal.
 */

import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver/node';
import { URI } from 'vscode-uri';
import * as path from 'path';
import { promises as fsp } from 'fs';
import { t } from '../utils/i18n';
import { offsetToRange, stripCommentsAndCDATA } from '../utils/textUtils';

const SOURCE = 'dita-lsp';

export const CYCLE_CODES = {
    CIRCULAR_REF: 'DITA-CYCLE-001',
} as const;

/** Maximum traversal depth to prevent runaway DFS on very deep hierarchies. */
const MAX_DEPTH = 50;

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

/** Extract structural file references from text, resolving paths relative to baseDir.
 *  Only follows topicref/mapref/chapter/etc. href (not keydef, xref, link, coderef)
 *  and conref attributes on any element. */
function extractFileReferences(text: string, baseDir: string): FileRef[] {
    const refs: FileRef[] = [];
    // Strip comments and CDATA to avoid false matches
    const cleanText = stripCommentsAndCDATA(text);

    // Structural href references (topicref, mapref, chapter, etc.)
    let match: RegExpExecArray | null;
    const structuralRegex = new RegExp(STRUCTURAL_REF_REGEX.source, STRUCTURAL_REF_REGEX.flags);
    while ((match = structuralRegex.exec(cleanText)) !== null) {
        const refValue = match[2];
        const ref = resolveRef(refValue, baseDir, text, match);
        if (ref) refs.push(ref);
    }

    // Conref references (can create cycles from any element)
    const conrefRegex = new RegExp(CONREF_REGEX.source, CONREF_REGEX.flags);
    while ((match = conrefRegex.exec(cleanText)) !== null) {
        const refValue = match[1];
        const ref = resolveRef(refValue, baseDir, text, match);
        if (ref) refs.push(ref);
    }

    return refs;
}

/** Resolve a reference value to a FileRef, or null if it should be skipped. */
function resolveRef(refValue: string, baseDir: string, text: string, match: RegExpExecArray): FileRef | null {
    // Skip external URLs
    if (/^https?:\/\/|^mailto:|^ftp:\/\//.test(refValue)) return null;
    // Skip empty values
    if (!refValue.trim()) return null;

    const targetPath = path.resolve(baseDir, refValue);
    // Only consider DITA files (not generic .xml)
    if (!isDitaFile(targetPath)) return null;

    const range = offsetToRange(text, match.index, match.index + match[0].length);
    return { targetPath: normalizePath(targetPath), range };
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
    return ext === '.dita' || ext === '.ditamap' || ext === '.bookmap';
}

function normalizePath(filePath: string): string {
    return path.resolve(filePath).toLowerCase();
}

