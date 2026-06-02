"use strict";
/**
 * Profiling Attribute Validation (Phase 7).
 * Validates profiling attribute values against subject scheme constraints.
 * When a subject scheme defines controlled values for attributes like
 * @audience, @platform, @product, @otherprops, this validates that
 * only allowed values are used.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROFILING_CODES = void 0;
exports.validateProfilingAttributes = validateProfilingAttributes;
const node_1 = require("vscode-languageserver/node");
const i18n_1 = require("../utils/i18n");
const textUtils_1 = require("../utils/textUtils");
const SOURCE = 'dita-lsp';
/** Diagnostic codes for profiling validation. */
exports.PROFILING_CODES = {
    INVALID_VALUE: 'DITA-PROF-001',
};
/** Profiling attributes that can be constrained by subject schemes. */
const PROFILING_ATTRIBUTES = [
    'audience', 'platform', 'product', 'otherprops', 'props',
    'deliveryTarget',
];
/**
 * Validate profiling attribute values against subject scheme constraints.
 * Only checks attributes that are controlled by a registered subject scheme.
 */
function validateProfilingAttributes(text, subjectSchemeService, maxProblems) {
    if (!subjectSchemeService.hasSchemeData()) {
        return [];
    }
    const diagnostics = [];
    const cleanText = (0, textUtils_1.stripCommentsAndCodeContent)(text);
    // Match profiling attributes in element tags
    for (const attrName of PROFILING_ATTRIBUTES) {
        if (!subjectSchemeService.isControlledAttribute(attrName)) {
            continue;
        }
        const attrRegex = new RegExp(`<(\\w+)\\b([^>]*?)\\b${(0, textUtils_1.escapeRegex)(attrName)}\\s*=\\s*["']([^"']+)["']`, 'g');
        let match;
        while ((match = attrRegex.exec(cleanText)) !== null && diagnostics.length < maxProblems) {
            const elementName = match[1];
            const attrValue = match[3];
            // Attribute values can be space-separated tokens
            const tokens = attrValue.trim().split(/\s+/);
            const validValues = subjectSchemeService.getValidValues(attrName, elementName);
            if (!validValues)
                continue;
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
                    const range = (0, textUtils_1.offsetToRange)(text, tokenStart, tokenStart + token.length);
                    const allowed = [...validValues].sort().join(', ');
                    diagnostics.push({
                        severity: node_1.DiagnosticSeverity.Warning,
                        range,
                        message: (0, i18n_1.t)('prof.invalidValue', token, attrName, allowed),
                        code: exports.PROFILING_CODES.INVALID_VALUE,
                        source: SOURCE,
                    });
                }
                tokenSearchStart = tokenOffset + token.length;
            }
        }
    }
    return diagnostics;
}
//# sourceMappingURL=profilingValidation.js.map