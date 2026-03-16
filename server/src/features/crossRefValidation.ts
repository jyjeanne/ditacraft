/**
 * Cross-Reference Validation (Phase 5).
 * Validates href, conref, keyref, and conkeyref attribute values.
 */

import { Diagnostic, DiagnosticSeverity, Range } from 'vscode-languageserver/node';
import { URI } from 'vscode-uri';
import * as path from 'path';
import { promises as fsp } from 'fs';

import { KeySpaceService } from '../services/keySpaceService';
import { parseReference } from '../utils/referenceParser';
import { TOPIC_TYPE_NAMES, MAP_TYPE_NAMES } from '../data/ditaSpecialization';
import { t } from '../utils/i18n';
import { stripCommentsAndCodeContent, offsetToRange, escapeRegex, normalizeFsPath } from '../utils/textUtils';

const SOURCE = 'dita-lsp';

/** Diagnostic codes for cross-reference validation. */
export const XREF_CODES = {
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
} as const;

/** DITA topic-type element names for topic ID validation (regex alternation). */
const TOPIC_ELEMENTS_PATTERN = [...TOPIC_TYPE_NAMES].join('|');

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
    const cleanText = stripCommentsAndCodeContent(text);

    // --- Validate href and conref attributes ---
    const hrefRegex = /\b(href|conref)\s*=\s*["']([^"']+)["']/g;
    let match: RegExpExecArray | null;

    while ((match = hrefRegex.exec(cleanText)) !== null && diagnostics.length < maxProblems) {
        const attrName = match[1];
        const value = match[2];
        // Use original text offsets (comment stripping preserves them)
        // Find the opening quote after '=' to reliably locate the value
        const openQuote = match[0].match(/=\s*["']/);
        const valueStart = match.index + (openQuote ? openQuote.index! + openQuote[0].length : match[0].length - value.length - 1);
        const range = offsetToRange(text, valueStart, valueStart + value.length);

        const isAbsoluteUrl = /^https?:\/\/|^mailto:|^ftp:\/\//.test(value);
        const scopeValue = getScopeValue(cleanText, match.index);

        // Scope validation (DITA-SCOPE-001/002/003)
        if (scopeValue === 'external' && !isAbsoluteUrl) {
            diagnostics.push({
                severity: DiagnosticSeverity.Warning,
                range,
                message: t('scope.externalRelativeHref'),
                code: XREF_CODES.SCOPE_EXTERNAL_RELATIVE,
                source: SOURCE,
            });
            continue;
        }
        if (scopeValue === 'local' && isAbsoluteUrl) {
            diagnostics.push({
                severity: DiagnosticSeverity.Warning,
                range,
                message: t('scope.localAbsoluteHref'),
                code: XREF_CODES.SCOPE_LOCAL_ABSOLUTE,
                source: SOURCE,
            });
            continue;
        }
        if (isAbsoluteUrl && !scopeValue) {
            diagnostics.push({
                severity: DiagnosticSeverity.Information,
                range,
                message: t('scope.missingOnUrl'),
                code: XREF_CODES.SCOPE_MISSING_ON_URL,
                source: SOURCE,
            });
            continue;
        }

        // Skip external references from further file-based checks
        if (isAbsoluteUrl) continue;
        if (scopeValue === 'external') continue;

        const parsed = parseReference(value);
        const isConref = attrName === 'conref';

        // Check file existence
        if (parsed.filePath) {
            const targetPath = path.resolve(currentDir, parsed.filePath);
            try {
                await fsp.access(targetPath);
            } catch {
                diagnostics.push({
                    severity: DiagnosticSeverity.Warning,
                    range,
                    message: t('xref.missingFile', parsed.filePath),
                    code: XREF_CODES.MISSING_FILE,
                    source: SOURCE,
                });
                continue; // No point checking fragment if file missing
            }

            // Check fragment (topic ID / element ID)
            if (parsed.fragment) {
                let targetContent: string;
                try {
                    targetContent = await fsp.readFile(targetPath, 'utf-8');
                } catch {
                    continue;
                }
                const fragmentValid = validateFragment(
                    parsed.fragment, targetContent, range,
                    parsed.filePath, diagnostics
                );

                // Conref compatibility: source and target elements must match
                if (fragmentValid && isConref) {
                    const sourceElement = getContainingElementName(cleanText, match.index);
                    if (sourceElement) {
                        validateConrefCompatibility(
                            sourceElement, parsed.fragment, targetContent,
                            range, diagnostics
                        );
                    }
                }
            }
        } else if (parsed.fragment) {
            // Same-file reference (e.g., "#topicid/elementid")
            const sameFileValid = validateFragment(
                parsed.fragment, text, range,
                '(current file)', diagnostics
            );

            // Conref compatibility for same-file references
            if (sameFileValid && isConref) {
                const sourceElement = getContainingElementName(cleanText, match.index);
                if (sourceElement) {
                    validateConrefCompatibility(
                        sourceElement, parsed.fragment, text,
                        range, diagnostics
                    );
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
            let keyMatch: RegExpExecArray | null;
            while ((keyMatch = keydefRegex.exec(cleanText)) !== null && diagnostics.length < maxProblems) {
                const keyNames = keyMatch[1].split(/\s+/);
                for (const keyName of keyNames) {
                    const dups = duplicateKeys.get(keyName);
                    if (!dups) continue;
                    // Only warn if this map's definition is NOT the effective one
                    const effective = dups[0];
                    if (normalizeFsPath(effective.sourceMap) === normalizeFsPath(filePath)) continue;
                    const range = offsetToRange(text, keyMatch.index, keyMatch.index + keyMatch[0].length);
                    diagnostics.push({
                        severity: DiagnosticSeverity.Warning,
                        range,
                        message: t('key.duplicate', keyName, path.basename(effective.sourceMap)),
                        code: XREF_CODES.DUPLICATE_KEY,
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
            const valueStart = match.index + (openQuote ? openQuote.index! + openQuote[0].length : match[0].length - value.length - 1);
            const range = offsetToRange(text, valueStart, valueStart + value.length);

            // Parse key name and optional element ID
            const slashPos = value.indexOf('/');
            const keyName = slashPos !== -1 ? value.substring(0, slashPos) : value;
            const elementId = slashPos !== -1 ? value.substring(slashPos + 1) : null;

            // Skip variable references (e.g. ${var}) — not real keys
            if (keyName.includes('${')) continue;
            // Skip values that look like file paths (backward-compat fallback)
            if (/\.dita(map)?$/i.test(keyName)) continue;

            const keyDef = await keySpaceService.resolveKey(keyName, filePath);

            if (!keyDef) {
                diagnostics.push({
                    severity: DiagnosticSeverity.Warning,
                    range,
                    message: t('key.undefined', keyName),
                    code: XREF_CODES.UNDEFINED_KEY,
                    source: SOURCE,
                });
                continue;
            }

            if (!keyDef.targetFile && !keyDef.inlineContent) {
                diagnostics.push({
                    severity: DiagnosticSeverity.Warning,
                    range,
                    message: t('key.noTarget', keyName),
                    code: XREF_CODES.KEY_NO_TARGET,
                    source: SOURCE,
                });
                continue;
            }

            // Check element ID within key's target and conkeyref compatibility
            if (elementId && keyDef.targetFile) {
                let targetContent: string | null = null;
                try {
                    targetContent = await fsp.readFile(keyDef.targetFile, 'utf-8');
                } catch {
                    // File missing or unreadable — skip element ID check
                }
                if (targetContent !== null) {
                    const escaped = escapeRegex(elementId);
                    const idRegex = new RegExp(`\\bid\\s*=\\s*["']${escaped}["']`);
                    if (!idRegex.test(targetContent)) {
                        diagnostics.push({
                            severity: DiagnosticSeverity.Warning,
                            range,
                            message: t('key.missingElement', elementId, keyName),
                            code: XREF_CODES.KEY_MISSING_ELEMENT,
                            source: SOURCE,
                        });
                    } else if (match[1] === 'conkeyref') {
                        // conkeyref compatibility: source and target elements must match
                        const sourceElement = getContainingElementName(cleanText, match.index);
                        if (sourceElement) {
                            const targetElement = findTargetElementByIdOnly(elementId, targetContent);
                            if (targetElement && !areConrefCompatible(sourceElement, targetElement)) {
                                diagnostics.push({
                                    severity: DiagnosticSeverity.Error,
                                    range,
                                    message: t('xref.incompatibleConref', sourceElement, targetElement),
                                    code: XREF_CODES.INCOMPATIBLE_CONREF,
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
function getScopeValue(text: string, refOffset: number): string | null {
    const tagStart = text.lastIndexOf('<', refOffset);
    if (tagStart === -1) return null;
    const closeAngle = text.indexOf('>', refOffset);
    const endPos = closeAngle !== -1 ? closeAngle : refOffset + 200;
    const tag = text.substring(tagStart, endPos);
    const scopeMatch = tag.match(/\bscope\s*=\s*["'](local|peer|external)["']/);
    return scopeMatch ? scopeMatch[1] : null;
}

/** Check if the reference is inside a scope="external" element. Used by external callers. */
export function isExternalScope(text: string, refOffset: number): boolean {
    return getScopeValue(text, refOffset) === 'external';
}

/**
 * Validate a URI fragment (topicid or topicid/elementid) against file content.
 * Returns true if the fragment is valid, false if a diagnostic was emitted.
 */
function validateFragment(
    fragment: string,
    content: string,
    range: Range,
    fileName: string,
    diagnostics: Diagnostic[]
): boolean {
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
            message: t('xref.missingTopicId', topicId, fileName),
            code: XREF_CODES.MISSING_TOPIC_ID,
            source: SOURCE,
        });
        return false;
    }

    // Check element ID exists (if provided)
    if (elementId) {
        const escapedElemId = escapeRegex(elementId);
        const elemIdRegex = new RegExp(`\\bid\\s*=\\s*["']${escapedElemId}["']`);
        if (!elemIdRegex.test(content)) {
            diagnostics.push({
                severity: DiagnosticSeverity.Warning,
                range,
                message: t('xref.missingElementId', elementId, topicId, fileName),
                code: XREF_CODES.MISSING_ELEMENT_ID,
                source: SOURCE,
            });
            return false;
        }
    }

    return true;
}

/** Extract the element name from the tag containing the attribute at the given offset. */
function getContainingElementName(text: string, attrOffset: number): string | null {
    const tagStart = text.lastIndexOf('<', attrOffset);
    if (tagStart === -1) return null;
    const nameMatch = text.substring(tagStart).match(/^<([a-zA-Z_][\w.-]*)/);
    return nameMatch ? nameMatch[1] : null;
}

/**
 * DITA specialization groups for conref compatibility.
 * Elements within the same group are conref-compatible.
 * Key = base element, Value = set of specialized element names.
 */
const CONREF_COMPAT_GROUPS: Map<string, ReadonlySet<string>> = new Map([
    // Topic types (all specialize topic/topic)
    ['topic', TOPIC_TYPE_NAMES],
    // Map types (all specialize map/map)
    ['map', MAP_TYPE_NAMES],
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
const elementToBaseGroup: Map<string, string> = (() => {
    const map = new Map<string, string>();
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
function areConrefCompatible(sourceElement: string, targetElement: string): boolean {
    if (sourceElement === targetElement) return true;
    const sourceBase = elementToBaseGroup.get(sourceElement);
    const targetBase = elementToBaseGroup.get(targetElement);
    if (sourceBase && sourceBase === targetBase) return true;
    return false;
}

/**
 * Find the element name of a target identified by fragment (topicid/elementid or topicid).
 * Returns the element name, or null if not found.
 */
function findTargetElementName(fragment: string, content: string): string | null {
    const slashPos = fragment.indexOf('/');
    const targetId = slashPos !== -1 ? fragment.substring(slashPos + 1) : fragment;
    const escaped = escapeRegex(targetId);
    const regex = new RegExp(`<([a-zA-Z_][\\w.-]*)\\b[^>]*\\bid\\s*=\\s*["']${escaped}["']`);
    const match = content.match(regex);
    return match ? match[1] : null;
}

/**
 * Find the element name of a target identified by element ID only (no topic qualifier).
 * Used for conkeyref where the value is "key/elementid".
 */
function findTargetElementByIdOnly(elementId: string, content: string): string | null {
    const escaped = escapeRegex(elementId);
    const regex = new RegExp(`<([a-zA-Z_][\\w.-]*)\\b[^>]*\\bid\\s*=\\s*["']${escaped}["']`);
    const match = content.match(regex);
    return match ? match[1] : null;
}

/** Validate conref source/target element compatibility. */
function validateConrefCompatibility(
    sourceElement: string,
    fragment: string,
    targetContent: string,
    range: Range,
    diagnostics: Diagnostic[]
): void {
    const targetElement = findTargetElementName(fragment, targetContent);
    if (!targetElement) return; // Target not found — already reported by validateFragment

    if (!areConrefCompatible(sourceElement, targetElement)) {
        diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range,
            message: t('xref.incompatibleConref', sourceElement, targetElement),
            code: XREF_CODES.INCOMPATIBLE_CONREF,
            source: SOURCE,
        });
    }
}

