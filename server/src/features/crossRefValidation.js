"use strict";
/**
 * Cross-Reference Validation (Phase 5).
 * Validates href, conref, keyref, and conkeyref attribute values.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.XREF_CODES = void 0;
exports.validateCrossReferences = validateCrossReferences;
exports.isExternalScope = isExternalScope;
const node_1 = require("vscode-languageserver/node");
const path = __importStar(require("path"));
const fs_1 = require("fs");
const referenceParser_1 = require("../utils/referenceParser");
const ditaSpecialization_1 = require("../data/ditaSpecialization");
const i18n_1 = require("../utils/i18n");
const textUtils_1 = require("../utils/textUtils");
const SOURCE = 'dita-lsp';
/** Diagnostic codes for cross-reference validation. */
exports.XREF_CODES = {
    MISSING_FILE: 'DITA-XREF-001',
    MISSING_TOPIC_ID: 'DITA-XREF-002',
    MISSING_ELEMENT_ID: 'DITA-XREF-003',
    INCOMPATIBLE_CONREF: 'DITA-XREF-004',
    UNDEFINED_KEY: 'DITA-KEY-001',
    KEY_NO_TARGET: 'DITA-KEY-002',
    KEY_MISSING_ELEMENT: 'DITA-KEY-003',
    DUPLICATE_KEY: 'DITA-KEY-004',
    SCOPE_EXTERNAL_RELATIVE: 'DITA-SCOPE-001',
    SCOPE_LOCAL_ABSOLUTE: 'DITA-SCOPE-002',
    SCOPE_MISSING_ON_URL: 'DITA-SCOPE-003',
};
/** DITA topic-type element names for topic ID validation (regex alternation). */
const TOPIC_ELEMENTS_PATTERN = [...ditaSpecialization_1.TOPIC_TYPE_NAMES].join('|');
/**
 * Validate all cross-references in a DITA document.
 * Checks href/conref for missing files and invalid fragment IDs.
 * Checks keyref/conkeyref for undefined keys and missing element IDs.
 */
async function validateCrossReferences(text, documentUri, keySpaceService, maxProblems) {
    const diagnostics = [];
    const filePath = (0, textUtils_1.uriToPath)(documentUri);
    const currentDir = path.dirname(filePath);
    // Strip comments/CDATA to avoid matching inside them
    const cleanText = (0, textUtils_1.stripCommentsAndCodeContent)(text);
    // --- Validate href and conref attributes ---
    const hrefRegex = /\b(href|conref)\s*=\s*["']([^"']+)["']/g;
    let match;
    while ((match = hrefRegex.exec(cleanText)) !== null && diagnostics.length < maxProblems) {
        const attrName = match[1];
        const value = match[2];
        // Use original text offsets (comment stripping preserves them)
        // Find the opening quote after '=' to reliably locate the value
        const openQuote = match[0].match(/=\s*["']/);
        const valueStart = match.index + (openQuote ? openQuote.index + openQuote[0].length : match[0].length - value.length - 1);
        const range = (0, textUtils_1.offsetToRange)(text, valueStart, valueStart + value.length);
        const isAbsoluteUrl = /^https?:\/\/|^mailto:|^ftp:\/\//.test(value);
        const scopeValue = getScopeValue(cleanText, match.index);
        // Scope validation (DITA-SCOPE-001/002/003)
        if (scopeValue === 'external' && !isAbsoluteUrl) {
            diagnostics.push({
                severity: node_1.DiagnosticSeverity.Warning,
                range,
                message: (0, i18n_1.t)('scope.externalRelativeHref'),
                code: exports.XREF_CODES.SCOPE_EXTERNAL_RELATIVE,
                source: SOURCE,
            });
            continue;
        }
        if (scopeValue === 'local' && isAbsoluteUrl) {
            diagnostics.push({
                severity: node_1.DiagnosticSeverity.Warning,
                range,
                message: (0, i18n_1.t)('scope.localAbsoluteHref'),
                code: exports.XREF_CODES.SCOPE_LOCAL_ABSOLUTE,
                source: SOURCE,
            });
            continue;
        }
        if (isAbsoluteUrl && !scopeValue) {
            diagnostics.push({
                severity: node_1.DiagnosticSeverity.Information,
                range,
                message: (0, i18n_1.t)('scope.missingOnUrl'),
                code: exports.XREF_CODES.SCOPE_MISSING_ON_URL,
                source: SOURCE,
            });
            continue;
        }
        // Skip external references from further file-based checks
        if (isAbsoluteUrl)
            continue;
        if (scopeValue === 'external')
            continue;
        const parsed = (0, referenceParser_1.parseReference)(value);
        const isConref = attrName === 'conref';
        // Check file existence
        if (parsed.filePath) {
            const targetPath = path.resolve(currentDir, parsed.filePath);
            try {
                await fs_1.promises.access(targetPath);
            }
            catch {
                diagnostics.push({
                    severity: node_1.DiagnosticSeverity.Warning,
                    range,
                    message: (0, i18n_1.t)('xref.missingFile', parsed.filePath),
                    code: exports.XREF_CODES.MISSING_FILE,
                    source: SOURCE,
                });
                continue; // No point checking fragment if file missing
            }
            // Check fragment (topic ID / element ID)
            if (parsed.fragment) {
                let targetContent;
                try {
                    targetContent = await fs_1.promises.readFile(targetPath, 'utf-8');
                }
                catch {
                    continue;
                }
                const fragmentValid = validateFragment(parsed.fragment, targetContent, range, parsed.filePath, diagnostics);
                // Conref compatibility: source and target elements must match
                if (fragmentValid && isConref) {
                    const sourceElement = getContainingElementName(cleanText, match.index);
                    if (sourceElement) {
                        validateConrefCompatibility(sourceElement, parsed.fragment, targetContent, range, diagnostics);
                    }
                }
            }
        }
        else if (parsed.fragment) {
            // Same-file reference (e.g., "#topicid/elementid")
            const sameFileValid = validateFragment(parsed.fragment, text, range, '(current file)', diagnostics);
            // Conref compatibility for same-file references
            if (sameFileValid && isConref) {
                const sourceElement = getContainingElementName(cleanText, match.index);
                if (sourceElement) {
                    validateConrefCompatibility(sourceElement, parsed.fragment, text, range, diagnostics);
                }
            }
        }
    }
    // --- Validate duplicate key definitions in map files ---
    if (keySpaceService && /\.(ditamap|bookmap)$/i.test(filePath)) {
        const duplicateKeys = await keySpaceService.getDuplicateKeys(filePath);
        if (duplicateKeys.size > 0) {
            // Find keydefs in THIS map that are duplicates
            const keydefRegex = /\bkeys\s*=\s*["']([^"']+)["']/g;
            let keyMatch;
            while ((keyMatch = keydefRegex.exec(cleanText)) !== null && diagnostics.length < maxProblems) {
                const keyNames = keyMatch[1].split(/\s+/);
                for (const keyName of keyNames) {
                    const dups = duplicateKeys.get(keyName);
                    if (!dups)
                        continue;
                    // Only warn if this map's definition is NOT the effective one
                    const effective = dups[0];
                    if ((0, textUtils_1.normalizeFsPath)(effective.sourceMap) === (0, textUtils_1.normalizeFsPath)(filePath))
                        continue;
                    const range = (0, textUtils_1.offsetToRange)(text, keyMatch.index, keyMatch.index + keyMatch[0].length);
                    diagnostics.push({
                        severity: node_1.DiagnosticSeverity.Warning,
                        range,
                        message: (0, i18n_1.t)('key.duplicate', keyName, path.basename(effective.sourceMap)),
                        code: exports.XREF_CODES.DUPLICATE_KEY,
                        source: SOURCE,
                    });
                }
            }
        }
    }
    // --- Validate keyref and conkeyref attributes ---
    if (keySpaceService) {
        const keyrefRegex = /\b(keyref|conkeyref)\s*=\s*["']([^"']+)["']/g;
        while ((match = keyrefRegex.exec(cleanText)) !== null && diagnostics.length < maxProblems) {
            const value = match[2];
            const openQuote = match[0].match(/=\s*["']/);
            const valueStart = match.index + (openQuote ? openQuote.index + openQuote[0].length : match[0].length - value.length - 1);
            const range = (0, textUtils_1.offsetToRange)(text, valueStart, valueStart + value.length);
            // Parse key name and optional element ID
            const slashPos = value.indexOf('/');
            const keyName = slashPos !== -1 ? value.substring(0, slashPos) : value;
            const elementId = slashPos !== -1 ? value.substring(slashPos + 1) : null;
            // Skip variable references (e.g. ${var}) — not real keys
            if (keyName.includes('${'))
                continue;
            // Skip values that look like file paths (backward-compat fallback)
            if (/\.dita(map)?$/i.test(keyName))
                continue;
            const keyDef = await keySpaceService.resolveKey(keyName, filePath);
            if (!keyDef) {
                diagnostics.push({
                    severity: node_1.DiagnosticSeverity.Warning,
                    range,
                    message: (0, i18n_1.t)('key.undefined', keyName),
                    code: exports.XREF_CODES.UNDEFINED_KEY,
                    source: SOURCE,
                });
                continue;
            }
            if (!keyDef.targetFile && !keyDef.inlineContent) {
                diagnostics.push({
                    severity: node_1.DiagnosticSeverity.Warning,
                    range,
                    message: (0, i18n_1.t)('key.noTarget', keyName),
                    code: exports.XREF_CODES.KEY_NO_TARGET,
                    source: SOURCE,
                });
                continue;
            }
            // Check element ID within key's target and conkeyref compatibility
            if (elementId && keyDef.targetFile) {
                let targetContent = null;
                try {
                    targetContent = await fs_1.promises.readFile(keyDef.targetFile, 'utf-8');
                }
                catch {
                    // File missing or unreadable — skip element ID check
                }
                if (targetContent !== null) {
                    const escaped = (0, textUtils_1.escapeRegex)(elementId);
                    const idRegex = new RegExp(`\\bid\\s*=\\s*["']${escaped}["']`);
                    if (!idRegex.test(targetContent)) {
                        diagnostics.push({
                            severity: node_1.DiagnosticSeverity.Warning,
                            range,
                            message: (0, i18n_1.t)('key.missingElement', elementId, keyName),
                            code: exports.XREF_CODES.KEY_MISSING_ELEMENT,
                            source: SOURCE,
                        });
                    }
                    else if (match[1] === 'conkeyref') {
                        // conkeyref compatibility: source and target elements must match
                        const sourceElement = getContainingElementName(cleanText, match.index);
                        if (sourceElement) {
                            const targetElement = findTargetElementByIdOnly(elementId, targetContent);
                            if (targetElement && !areConrefCompatible(sourceElement, targetElement)) {
                                diagnostics.push({
                                    severity: node_1.DiagnosticSeverity.Error,
                                    range,
                                    message: (0, i18n_1.t)('xref.incompatibleConref', sourceElement, targetElement),
                                    code: exports.XREF_CODES.INCOMPATIBLE_CONREF,
                                    source: SOURCE,
                                });
                            }
                        }
                    }
                }
            }
        }
    }
    return diagnostics;
}
// --- Helpers ---
/** Extract the scope attribute value from the containing tag, or null if not present. */
function getScopeValue(text, refOffset) {
    const tagStart = text.lastIndexOf('<', refOffset);
    if (tagStart === -1)
        return null;
    const closeAngle = text.indexOf('>', refOffset);
    const endPos = closeAngle !== -1 ? closeAngle : refOffset + 200;
    const tag = text.substring(tagStart, endPos);
    const scopeMatch = tag.match(/\bscope\s*=\s*["'](local|peer|external)["']/);
    return scopeMatch ? scopeMatch[1] : null;
}
/** Check if the reference is inside a scope="external" element. Used by external callers. */
function isExternalScope(text, refOffset) {
    return getScopeValue(text, refOffset) === 'external';
}
/**
 * Validate a URI fragment (topicid or topicid/elementid) against file content.
 * Returns true if the fragment is valid, false if a diagnostic was emitted.
 */
function validateFragment(fragment, content, range, fileName, diagnostics) {
    const slashPos = fragment.indexOf('/');
    const topicId = slashPos !== -1 ? fragment.substring(0, slashPos) : fragment;
    const elementId = slashPos !== -1 ? fragment.substring(slashPos + 1) : null;
    // Check topic ID exists
    const escapedTopicId = (0, textUtils_1.escapeRegex)(topicId);
    const topicIdRegex = new RegExp(`<(?:${TOPIC_ELEMENTS_PATTERN})\\b[^>]*\\bid\\s*=\\s*["']${escapedTopicId}["']`);
    if (!topicIdRegex.test(content)) {
        diagnostics.push({
            severity: node_1.DiagnosticSeverity.Warning,
            range,
            message: (0, i18n_1.t)('xref.missingTopicId', topicId, fileName),
            code: exports.XREF_CODES.MISSING_TOPIC_ID,
            source: SOURCE,
        });
        return false;
    }
    // Check element ID exists (if provided)
    if (elementId) {
        const escapedElemId = (0, textUtils_1.escapeRegex)(elementId);
        const elemIdRegex = new RegExp(`\\bid\\s*=\\s*["']${escapedElemId}["']`);
        if (!elemIdRegex.test(content)) {
            diagnostics.push({
                severity: node_1.DiagnosticSeverity.Warning,
                range,
                message: (0, i18n_1.t)('xref.missingElementId', elementId, topicId, fileName),
                code: exports.XREF_CODES.MISSING_ELEMENT_ID,
                source: SOURCE,
            });
            return false;
        }
    }
    return true;
}
/** Extract the element name from the tag containing the attribute at the given offset. */
function getContainingElementName(text, attrOffset) {
    const tagStart = text.lastIndexOf('<', attrOffset);
    if (tagStart === -1)
        return null;
    const nameMatch = text.substring(tagStart).match(/^<([a-zA-Z_][\w.-]*)/);
    return nameMatch ? nameMatch[1] : null;
}
/**
 * DITA specialization groups for conref compatibility.
 * Elements within the same group are conref-compatible.
 * Key = base element, Value = set of specialized element names.
 */
const CONREF_COMPAT_GROUPS = new Map([
    // Topic types (all specialize topic/topic)
    ['topic', ditaSpecialization_1.TOPIC_TYPE_NAMES],
    // Map types (all specialize map/map)
    ['map', ditaSpecialization_1.MAP_TYPE_NAMES],
    // Body types (specialize topic/body)
    ['body', new Set(['body', 'conbody', 'taskbody', 'refbody', 'glossBody', 'troublebody'])],
    // Section types
    ['section', new Set(['section', 'refsyn', 'prereq', 'context', 'steps-informal', 'result', 'postreq', 'example', 'glossdef'])],
    // List item types
    ['li', new Set(['li', 'step', 'substep', 'choice'])],
    // List types
    ['ol', new Set(['ol', 'steps', 'substeps', 'steps-unordered'])],
    ['ul', new Set(['ul', 'choices'])],
    // Definition list types (parml specializes dl)
    ['dl', new Set(['dl', 'parml'])],
    ['dlentry', new Set(['dlentry', 'plentry'])],
    ['dt', new Set(['dt', 'pt'])],
    ['dd', new Set(['dd', 'pd'])],
    // Figure types
    ['fig', new Set(['fig', 'syntaxdiagram'])],
]);
/** Reverse lookup: element name → base group name. */
const elementToBaseGroup = (() => {
    const map = new Map();
    for (const [base, members] of CONREF_COMPAT_GROUPS) {
        for (const member of members) {
            map.set(member, base);
        }
    }
    return map;
})();
/**
 * Check whether two element names are conref-compatible.
 * Same name → always compatible.
 * Same specialization group → compatible.
 */
function areConrefCompatible(sourceElement, targetElement) {
    if (sourceElement === targetElement)
        return true;
    const sourceBase = elementToBaseGroup.get(sourceElement);
    const targetBase = elementToBaseGroup.get(targetElement);
    if (sourceBase && sourceBase === targetBase)
        return true;
    return false;
}
/**
 * Find the element name of a target identified by fragment (topicid/elementid or topicid).
 * Returns the element name, or null if not found.
 */
function findTargetElementName(fragment, content) {
    const slashPos = fragment.indexOf('/');
    const targetId = slashPos !== -1 ? fragment.substring(slashPos + 1) : fragment;
    const escaped = (0, textUtils_1.escapeRegex)(targetId);
    const regex = new RegExp(`<([a-zA-Z_][\\w.-]*)\\b[^>]*\\bid\\s*=\\s*["']${escaped}["']`);
    const match = content.match(regex);
    return match ? match[1] : null;
}
/**
 * Find the element name of a target identified by element ID only (no topic qualifier).
 * Used for conkeyref where the value is "key/elementid".
 */
function findTargetElementByIdOnly(elementId, content) {
    const escaped = (0, textUtils_1.escapeRegex)(elementId);
    const regex = new RegExp(`<([a-zA-Z_][\\w.-]*)\\b[^>]*\\bid\\s*=\\s*["']${escaped}["']`);
    const match = content.match(regex);
    return match ? match[1] : null;
}
/** Validate conref source/target element compatibility. */
function validateConrefCompatibility(sourceElement, fragment, targetContent, range, diagnostics) {
    const targetElement = findTargetElementName(fragment, targetContent);
    if (!targetElement)
        return; // Target not found — already reported by validateFragment
    if (!areConrefCompatible(sourceElement, targetElement)) {
        diagnostics.push({
            severity: node_1.DiagnosticSeverity.Error,
            range,
            message: (0, i18n_1.t)('xref.incompatibleConref', sourceElement, targetElement),
            code: exports.XREF_CODES.INCOMPATIBLE_CONREF,
            source: SOURCE,
        });
    }
}
//# sourceMappingURL=crossRefValidation.js.map