/**
 * Profiling Attribute Validation (Phase 7).
 * Validates profiling attribute values against subject scheme constraints.
 * When a subject scheme defines controlled values for attributes like
 * @audience, @platform, @product, @otherprops, this validates that
 * only allowed values are used.
 */

import { Diagnostic, DiagnosticSeverity, Range } from 'vscode-languageserver/node';
import { SubjectSchemeService } from '../services/subjectSchemeService';

const SOURCE = 'dita-lsp';

/** Diagnostic codes for profiling validation. */
export const PROFILING_CODES = {
    INVALID_VALUE: 'DITA-PROF-001',
} as const;

/** Profiling attributes that can be constrained by subject schemes. */
const PROFILING_ATTRIBUTES = [
    'audience', 'platform', 'product', 'otherprops', 'props',
    'deliveryTarget',
];

/**
 * Validate profiling attribute values against subject scheme constraints.
 * Only checks attributes that are controlled by a registered subject scheme.
 */
export function validateProfilingAttributes(
    text: string,
    subjectSchemeService: SubjectSchemeService,
    maxProblems: number
): Diagnostic[] {
    if (!subjectSchemeService.hasSchemeData()) {
        return [];
    }

    const diagnostics: Diagnostic[] = [];
    const cleanText = stripCommentsAndCDATA(text);

    // Match profiling attributes in element tags
    for (const attrName of PROFILING_ATTRIBUTES) {
        if (!subjectSchemeService.isControlledAttribute(attrName)) {
            continue;
        }

        const attrRegex = new RegExp(
            `<(\\w+)\\b([^>]*?)\\b${escapeRegex(attrName)}\\s*=\\s*["']([^"']+)["']`,
            'g'
        );

        let match: RegExpExecArray | null;
        while ((match = attrRegex.exec(cleanText)) !== null && diagnostics.length < maxProblems) {
            const elementName = match[1];
            const attrValue = match[3];

            // Attribute values can be space-separated tokens
            const tokens = attrValue.trim().split(/\s+/);
            const validValues = subjectSchemeService.getValidValues(attrName, elementName);

            if (!validValues) continue;

            let tokenSearchStart = 0;
            for (const token of tokens) {
                const tokenOffset = attrValue.indexOf(token, tokenSearchStart);
                if (!validValues.has(token)) {
                    // Calculate position of the invalid value
                    const valueStart = match.index + match[0].lastIndexOf(attrValue);
                    const tokenStart = valueStart + tokenOffset;
                    const range = offsetToRange(text, tokenStart, tokenStart + token.length);

                    const allowed = [...validValues].sort().join(', ');
                    diagnostics.push({
                        severity: DiagnosticSeverity.Warning,
                        range,
                        message: `Value "${token}" is not allowed for @${attrName}. Valid values: ${allowed}`,
                        code: PROFILING_CODES.INVALID_VALUE,
                        source: SOURCE,
                    });
                }
                tokenSearchStart = tokenOffset + token.length;
            }
        }
    }

    return diagnostics;
}

// --- Helpers ---

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
