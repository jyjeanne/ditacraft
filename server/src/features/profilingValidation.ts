/**
 * Profiling Attribute Validation (Phase 7).
 * Validates profiling attribute values against subject scheme constraints.
 * When a subject scheme defines controlled values for attributes like
 * @audience, @platform, @product, @otherprops, this validates that
 * only allowed values are used.
 */

import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver/node';
import { SubjectSchemeService } from '../services/subjectSchemeService';
import { t } from '../utils/i18n';
import { stripCommentsAndCodeContent, offsetToRange, escapeRegex } from '../utils/textUtils';

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

/** Pre-compiled regexes for each profiling attribute (compiled once at module load). */
const PROFILING_ATTR_REGEXES = new Map<string, RegExp>(
    PROFILING_ATTRIBUTES.map(attrName => [
        attrName,
        new RegExp(
            `<(\\w+)\\b([^>]*?)\\b${escapeRegex(attrName)}\\s*=\\s*["']([^"']+)["']`,
            'g'
        ),
    ])
);

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
    const cleanText = stripCommentsAndCodeContent(text);

    // Match profiling attributes in element tags
    for (const attrName of PROFILING_ATTRIBUTES) {
        if (!subjectSchemeService.isControlledAttribute(attrName)) {
            continue;
        }

        const attrRegex = PROFILING_ATTR_REGEXES.get(attrName)!;
        attrRegex.lastIndex = 0;

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
                    // Calculate position of the attribute value inside the match.
                    // Find the attribute name + '=' to anchor the search, avoiding false
                    // hits if attrValue appears earlier in the tag (element/attribute names).
                    const attrNamePos = match[0].indexOf(attrName);
                    const valueStart = match.index + match[0].indexOf(attrValue, attrNamePos + attrName.length);
                    const tokenStart = valueStart + tokenOffset;
                    const range = offsetToRange(text, tokenStart, tokenStart + token.length);

                    const allowed = [...validValues].sort().join(', ');
                    diagnostics.push({
                        severity: DiagnosticSeverity.Warning,
                        range,
                        message: t('prof.invalidValue', token, attrName, allowed),
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

