/**
 * Profiling Attribute Validation (Phase 7).
 * Validates attribute values against subject scheme constraints: every attribute a
 * registered subject scheme binds with <enumerationdef> — the conditional processing
 * attributes (@audience, @platform, @product, @otherprops…) and any attribute
 * specialized from @props or @base — may only take the scheme's values.
 */

import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver/node';
import { SubjectSchemeQueries } from '../services/subjectSchemeService';
import { t } from '../utils/i18n';
import { stripCommentsAndCodeContent, offsetToRange } from '../utils/textUtils';

const SOURCE = 'dita-lsp';

/** Diagnostic codes for profiling validation. */
export const PROFILING_CODES = {
    INVALID_VALUE: 'DITA-PROF-001',
} as const;

/** A start tag (or empty-element tag) with its attributes. Element names may hold `-`, `.` and `:`. */
const START_TAG = /<([A-Za-z_][\w.:-]*)((?:\s+[\w.:-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*\/?>/g;

/** One attribute in a start tag: name, the `=` with its spaces, then the quoted value. */
const ATTRIBUTE = /([\w.:-]+)(\s*=\s*)(?:"([^"]*)"|'([^']*)')/g;

/**
 * Validate attribute values against subject scheme constraints.
 * Only checks attributes that are controlled by a registered subject scheme.
 */
export function validateProfilingAttributes(
    text: string,
    subjectSchemeService: SubjectSchemeQueries,
    maxProblems: number
): Diagnostic[] {
    if (!subjectSchemeService.hasSchemeData()) {
        return [];
    }

    const diagnostics: Diagnostic[] = [];
    // Comments and code content are blanked out, offsets unchanged.
    const cleanText = stripCommentsAndCodeContent(text);

    let tag: RegExpExecArray | null;
    START_TAG.lastIndex = 0;
    while ((tag = START_TAG.exec(cleanText)) !== null) {
        const elementName = tag[1];
        const attributesStart = tag.index + 1 + elementName.length;
        let attribute: RegExpExecArray | null;
        ATTRIBUTE.lastIndex = 0;
        while ((attribute = ATTRIBUTE.exec(tag[2])) !== null) {
            const attrName = attribute[1];
            if (!subjectSchemeService.isControlledAttribute(attrName)) continue;
            const validValues = subjectSchemeService.getValidValues(attrName, elementName);
            if (!validValues) continue;

            const attrValue = attribute[3] ?? attribute[4];
            // After the name, the `=` and the opening quote.
            const valueStart = attributesStart + attribute.index + attrName.length + attribute[2].length + 1;

            // Attribute values can be space-separated tokens
            const tokenRegex = /\S+/g;
            let token: RegExpExecArray | null;
            while ((token = tokenRegex.exec(attrValue)) !== null) {
                if (validValues.has(token[0])) continue;
                if (diagnostics.length >= maxProblems) return diagnostics;
                const tokenStart = valueStart + token.index;
                diagnostics.push({
                    severity: DiagnosticSeverity.Warning,
                    range: offsetToRange(text, tokenStart, tokenStart + token[0].length),
                    message: t('prof.invalidValue', token[0], attrName, [...validValues].sort().join(', ')),
                    code: PROFILING_CODES.INVALID_VALUE,
                    source: SOURCE,
                });
            }
        }
    }

    return diagnostics;
}
