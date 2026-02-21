/**
 * Cross-Reference Validation (Phase 5).
 * Validates href, conref, keyref, and conkeyref attribute values.
 */

import { Diagnostic, DiagnosticSeverity, Range } from 'vscode-languageserver/node';
import { URI } from 'vscode-uri';
import * as path from 'path';
import * as fs from 'fs';

import { KeySpaceService } from '../services/keySpaceService';
import { parseReference } from '../utils/referenceParser';

const SOURCE = 'dita-lsp';

/** Diagnostic codes for cross-reference validation. */
export const XREF_CODES = {
    MISSING_FILE: 'DITA-XREF-001',
    MISSING_TOPIC_ID: 'DITA-XREF-002',
    MISSING_ELEMENT_ID: 'DITA-XREF-003',
    UNDEFINED_KEY: 'DITA-KEY-001',
    KEY_NO_TARGET: 'DITA-KEY-002',
    KEY_MISSING_ELEMENT: 'DITA-KEY-003',
} as const;

/** DITA topic-type element names for topic ID validation. */
const TOPIC_ELEMENTS_PATTERN =
    'topic|concept|task|reference|glossentry|glossgroup|troubleshooting';

/**
 * Validate all cross-references in a DITA document.
 * Checks href/conref for missing files and invalid fragment IDs.
 * Checks keyref/conkeyref for undefined keys and missing element IDs.
 */
export async function validateCrossReferences(
    text: string,
    documentUri: string,
    keySpaceService: KeySpaceService | undefined,
    maxProblems: number
): Promise<Diagnostic[]> {
    const diagnostics: Diagnostic[] = [];
    const filePath = URI.parse(documentUri).fsPath;
    const currentDir = path.dirname(filePath);

    // Strip comments/CDATA to avoid matching inside them
    const cleanText = stripCommentsAndCDATA(text);

    // --- Validate href and conref attributes ---
    const hrefRegex = /\b(href|conref)\s*=\s*["']([^"']+)["']/g;
    let match: RegExpExecArray | null;

    while ((match = hrefRegex.exec(cleanText)) !== null && diagnostics.length < maxProblems) {
        const value = match[2];
        // Use original text offsets (comment stripping preserves them)
        const valueStart = match.index + match[0].lastIndexOf(value);

        // Skip external references
        if (/^https?:\/\/|^mailto:|^ftp:\/\//.test(value)) continue;
        if (isExternalScope(cleanText, match.index)) continue;

        const range = offsetToRange(text, valueStart, valueStart + value.length);
        const parsed = parseReference(value);

        // Check file existence
        if (parsed.filePath) {
            const targetPath = path.resolve(currentDir, parsed.filePath);
            if (!fs.existsSync(targetPath)) {
                diagnostics.push({
                    severity: DiagnosticSeverity.Warning,
                    range,
                    message: `Target file not found: ${parsed.filePath}`,
                    code: XREF_CODES.MISSING_FILE,
                    source: SOURCE,
                });
                continue; // No point checking fragment if file missing
            }

            // Check fragment (topic ID / element ID)
            if (parsed.fragment) {
                let targetContent: string;
                try {
                    targetContent = fs.readFileSync(targetPath, 'utf-8');
                } catch {
                    continue;
                }
                validateFragment(
                    parsed.fragment, targetContent, range,
                    parsed.filePath, diagnostics
                );
            }
        } else if (parsed.fragment) {
            // Same-file reference (e.g., "#topicid/elementid")
            validateFragment(
                parsed.fragment, text, range,
                '(current file)', diagnostics
            );
        }
    }

    // --- Validate keyref and conkeyref attributes ---
    if (keySpaceService) {
        const keyrefRegex = /\b(keyref|conkeyref)\s*=\s*["']([^"']+)["']/g;

        while ((match = keyrefRegex.exec(cleanText)) !== null && diagnostics.length < maxProblems) {
            const value = match[2];
            const valueStart = match.index + match[0].lastIndexOf(value);
            const range = offsetToRange(text, valueStart, valueStart + value.length);

            // Parse key name and optional element ID
            const slashPos = value.indexOf('/');
            const keyName = slashPos !== -1 ? value.substring(0, slashPos) : value;
            const elementId = slashPos !== -1 ? value.substring(slashPos + 1) : null;

            const keyDef = await keySpaceService.resolveKey(keyName, filePath);

            if (!keyDef) {
                diagnostics.push({
                    severity: DiagnosticSeverity.Warning,
                    range,
                    message: `Key "${keyName}" is not defined in any map`,
                    code: XREF_CODES.UNDEFINED_KEY,
                    source: SOURCE,
                });
                continue;
            }

            if (!keyDef.targetFile && !keyDef.inlineContent) {
                diagnostics.push({
                    severity: DiagnosticSeverity.Warning,
                    range,
                    message: `Key "${keyName}" has no target (no href on keydef)`,
                    code: XREF_CODES.KEY_NO_TARGET,
                    source: SOURCE,
                });
                continue;
            }

            // Check element ID within key's target
            if (elementId && keyDef.targetFile) {
                if (fs.existsSync(keyDef.targetFile)) {
                    let targetContent: string;
                    try {
                        targetContent = fs.readFileSync(keyDef.targetFile, 'utf-8');
                    } catch {
                        continue;
                    }
                    const escaped = escapeRegex(elementId);
                    const idRegex = new RegExp(`\\bid\\s*=\\s*["']${escaped}["']`);
                    if (!idRegex.test(targetContent)) {
                        diagnostics.push({
                            severity: DiagnosticSeverity.Warning,
                            range,
                            message: `Element ID "${elementId}" not found in target of key "${keyName}"`,
                            code: XREF_CODES.KEY_MISSING_ELEMENT,
                            source: SOURCE,
                        });
                    }
                }
            }
        }
    }

    return diagnostics;
}

// --- Helpers ---

/** Check if the reference is inside a scope="external" element. */
function isExternalScope(text: string, refOffset: number): boolean {
    const tagStart = text.lastIndexOf('<', refOffset);
    if (tagStart === -1) return false;
    const closeAngle = text.indexOf('>', refOffset);
    const endPos = closeAngle !== -1 ? closeAngle : refOffset + 200;
    const tag = text.substring(tagStart, endPos);
    return /\bscope\s*=\s*["']external["']/.test(tag);
}

/** Validate a URI fragment (topicid or topicid/elementid) against file content. */
function validateFragment(
    fragment: string,
    content: string,
    range: Range,
    fileName: string,
    diagnostics: Diagnostic[]
): void {
    const slashPos = fragment.indexOf('/');
    const topicId = slashPos !== -1 ? fragment.substring(0, slashPos) : fragment;
    const elementId = slashPos !== -1 ? fragment.substring(slashPos + 1) : null;

    // Check topic ID exists
    const escapedTopicId = escapeRegex(topicId);
    const topicIdRegex = new RegExp(
        `<(?:${TOPIC_ELEMENTS_PATTERN})\\b[^>]*\\bid\\s*=\\s*["']${escapedTopicId}["']`
    );
    if (!topicIdRegex.test(content)) {
        diagnostics.push({
            severity: DiagnosticSeverity.Warning,
            range,
            message: `Topic ID "${topicId}" not found in ${fileName}`,
            code: XREF_CODES.MISSING_TOPIC_ID,
            source: SOURCE,
        });
        return;
    }

    // Check element ID exists (if provided)
    if (elementId) {
        const escapedElemId = escapeRegex(elementId);
        const elemIdRegex = new RegExp(`\\bid\\s*=\\s*["']${escapedElemId}["']`);
        if (!elemIdRegex.test(content)) {
            diagnostics.push({
                severity: DiagnosticSeverity.Warning,
                range,
                message: `Element ID "${elementId}" not found in topic "${topicId}" of ${fileName}`,
                code: XREF_CODES.MISSING_ELEMENT_ID,
                source: SOURCE,
            });
        }
    }
}

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Strip XML comments and CDATA sections, preserving line structure. */
function stripCommentsAndCDATA(text: string): string {
    return text
        .replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n\r]/g, ' '))
        .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, (m) => m.replace(/[^\n\r]/g, ' '));
}

/** Convert byte offsets to LSP Range. Handles \r\n correctly. */
function offsetToRange(text: string, start: number, end: number): Range {
    let line = 0;
    let char = 0;
    let startLine = 0;
    let startChar = 0;
    let endLine = 0;
    let endChar = 0;

    const safeStart = Math.min(start, text.length);
    const safeEnd = Math.min(end, text.length);

    for (let i = 0; i <= safeEnd; i++) {
        if (i === safeStart) { startLine = line; startChar = char; }
        if (i === safeEnd) { endLine = line; endChar = char; break; }
        if (text[i] === '\r') {
            line++;
            char = 0;
            // Skip \n in \r\n pair
            if (i + 1 <= safeEnd && text[i + 1] === '\n') {
                i++;
                if (i === safeStart) { startLine = line; startChar = char; }
                if (i === safeEnd) { endLine = line; endChar = char; break; }
            }
        } else if (text[i] === '\n') {
            line++;
            char = 0;
        } else {
            char++;
        }
    }

    return {
        start: { line: startLine, character: startChar },
        end: { line: endLine, character: endChar },
    };
}
