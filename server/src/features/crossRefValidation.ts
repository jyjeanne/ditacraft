/**
 * Cross-Reference Validation (Phase 5).
 * Validates href, conref, keyref, and conkeyref attribute values.
 */

import { Diagnostic, DiagnosticSeverity, Range } from 'vscode-languageserver/node';

import * as path from 'path';
import { promises as fsp } from 'fs';

import { KeySpaceService } from '../services/keySpaceService';
import { parseReference } from '../utils/referenceParser';
import { TOPIC_TYPE_NAMES, MAP_TYPE_NAMES } from '../data/ditaSpecialization';
import { t } from '../utils/i18n';
import {
    stripCommentsAndCodeContent, offsetToRange, escapeRegex, normalizeFsPath, uriToPath,
    isPathWithinWorkspace, effectiveWorkspaceFolders,
} from '../utils/textUtils';

const SOURCE = 'dita-lsp';

/** Diagnostic codes for cross-reference validation. */
export const XREF_CODES = {
    MISSING_FILE: 'DITA-XREF-001',
    MISSING_TOPIC_ID: 'DITA-XREF-002',
    MISSING_ELEMENT_ID: 'DITA-XREF-003',
    INCOMPATIBLE_CONREF: 'DITA-XREF-004',
    COPY_TO_COLLISION: 'DITA-XREF-005',
    UNDEFINED_KEY: 'DITA-KEY-001',
    KEY_NO_TARGET: 'DITA-KEY-002',
    KEY_MISSING_ELEMENT: 'DITA-KEY-003',
    DUPLICATE_KEY: 'DITA-KEY-004',
    INVALID_KEY_NAME: 'DITA-KEY-005',
    TOPICSET_TYPE_TOPICREF_MISMATCH: 'DITA-KEY-006',
    TOPICSET_TYPE_LINK_MISMATCH: 'DITA-KEY-007',
    CHUNK_NAVTITLE_RETRIEVAL: 'DITA-KEY-008',
    CHUNK_LINKTEXT_FALLBACK: 'DITA-KEY-009',
    CHUNK_LINKTEXT_MISSING: 'DITA-KEY-010',
    SCOPE_EXTERNAL_RELATIVE: 'DITA-SCOPE-001',
    SCOPE_LOCAL_ABSOLUTE: 'DITA-SCOPE-002',
    SCOPE_MISSING_ON_URL: 'DITA-SCOPE-003',
    SCOPE_OUTSIDE_INPUT_DIR: 'DITA-SCOPE-004',
} as const;

/** DITA topic-type element names for topic ID validation (regex alternation). */
const TOPIC_ELEMENTS_PATTERN = [...TOPIC_TYPE_NAMES].join('|');
const FORBIDDEN_KEY_CHARS = /[{}\[\]\/#?]/;
const VALID_KEY_NAME_PATTERN = /^[A-Za-z0-9\-._~!$&'()*+,;=:@%]+$/;

/**
 * Validate all cross-references in a DITA document.
 * Checks href/conref for missing files and invalid fragment IDs.
 * Checks keyref/conkeyref for undefined keys and missing element IDs.
 */
export async function validateCrossReferences(
    text: string,
    documentUri: string,
    keySpaceService: KeySpaceService | undefined,
    maxProblems: number,
    options?: {
        comparisonProfile?: 'default' | 'ditaot';
    }
): Promise<Diagnostic[]> {
    const diagnostics: Diagnostic[] = [];
    const filePath = uriToPath(documentUri);
    const currentDir = path.dirname(filePath);
    const isMapLikeSource = /\.(ditamap|bookmap)$/i.test(filePath);
    const isDitaOtComparison = options?.comparisonProfile === 'ditaot';
    const invalidKeyNameCache = new Map<string, string[] | null>();
    const workspaceFolders = effectiveWorkspaceFolders(filePath, keySpaceService?.getWorkspaceFolders() ?? []);
    const missingFileSeverity = isDitaOtComparison ? DiagnosticSeverity.Error : DiagnosticSeverity.Warning;

    // Strip comments/CDATA to avoid matching inside them
    const cleanText = stripCommentsAndCodeContent(text);

    // --- Validate href and conref attributes ---
    const hrefRegex = /\b(href|conref)\s*=\s*["']([^"']+)["']/g;
    let match: RegExpExecArray | null;

    while ((match = hrefRegex.exec(cleanText)) !== null && diagnostics.length < maxProblems) {
        // Only attributes: not an example written in the text (<codeph>href="a.dita"</codeph>)
        if (!isInStartTag(cleanText, match.index)) continue;
        const attrName = match[1];
        const value = match[2];
        // Use original text offsets (comment stripping preserves them)
        // Find the opening quote after '=' to reliably locate the value
        const openQuote = match[0].match(/=\s*["']/);
        const valueStart = match.index + (openQuote ? openQuote.index! + openQuote[0].length : match[0].length - value.length - 1);
        const range = offsetToRange(text, valueStart, valueStart + value.length);

        const isAbsoluteUrl = /^https?:\/\/|^mailto:|^ftp:\/\//.test(value);
        const scopeValue = getScopeValue(cleanText, match.index);
        const formatValue = getAttributeValue(cleanText, match.index, 'format');

        // Scope validation (DITA-SCOPE-001/002/003)
        if (
            scopeValue === 'external'
            && !isAbsoluteUrl
            && !(isDitaOtComparison && formatValue === 'xml')
        ) {
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
        const sourceElement = getContainingElementName(cleanText, match.index);

        // Check file existence
        if (parsed.filePath) {
            const targetPath = path.resolve(currentDir, parsed.filePath);
            if (!isPathWithinWorkspace(targetPath, workspaceFolders)) {
                diagnostics.push({
                    severity: missingFileSeverity,
                    range,
                    message: t('xref.missingFile', parsed.filePath),
                    code: XREF_CODES.MISSING_FILE,
                    source: SOURCE,
                });
                continue;
            }
            try {
                await fsp.access(targetPath);
            } catch {
                if (
                    isDitaOtComparison
                    && attrName === 'href'
                    && sourceElement === 'mapref'
                    && /\.(ditamap|bookmap)$/i.test(parsed.filePath)
                ) {
                    continue;
                }
                diagnostics.push({
                    severity: missingFileSeverity,
                    range,
                    message: t('xref.missingFile', parsed.filePath),
                    code: XREF_CODES.MISSING_FILE,
                    source: SOURCE,
                });
                continue; // No point checking fragment if file missing
            }

            if (
                attrName === 'href'
                && sourceElement === 'topicsetref'
                && isMapLikeSource
                && !isPathInsideDir(targetPath, currentDir)
            ) {
                diagnostics.push({
                    severity: DiagnosticSeverity.Warning,
                    range,
                    message: t('scope.outsideInputDirectory', parsed.filePath),
                    code: XREF_CODES.SCOPE_OUTSIDE_INPUT_DIR,
                    source: SOURCE,
                });
            }

            if (
                attrName === 'href'
                && isMapLikeSource
                && /\.(ditamap|bookmap)$/i.test(targetPath)
                && sourceElement === 'mapref'
            ) {
                if (
                    isDitaOtComparison
                    && (scopeValue === null || scopeValue === 'local')
                    && !isPathInsideDir(targetPath, currentDir)
                ) {
                    await appendOutsideInputDirDiagnosticsFromMap(
                        targetPath,
                        currentDir,
                        range,
                        diagnostics,
                        maxProblems
                    );
                }

                const invalidKeys = await getInvalidKeyNamesFromMap(targetPath, invalidKeyNameCache);
                for (const invalidKey of invalidKeys) {
                    diagnostics.push({
                        severity: DiagnosticSeverity.Error,
                        range,
                        message: t('key.invalidName', invalidKey),
                        code: XREF_CODES.INVALID_KEY_NAME,
                        source: SOURCE,
                    });
                }
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
                    parsed.filePath, /\.(ditamap|bookmap)$/i.test(targetPath), diagnostics
                );

                // Conref compatibility: source and target elements must match
                if (fragmentValid && isConref) {
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
                '(current file)', /\.(ditamap|bookmap)$/i.test(filePath), diagnostics
            );

            // Conref compatibility for same-file references
            if (sameFileValid && isConref) {
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

    // --- Validate key names in map key definitions ---
    if (isMapLikeSource) {
        const keydefRegex = /\bkeys\s*=\s*["']([^"']+)["']/g;
        let keyMatch: RegExpExecArray | null;
        while ((keyMatch = keydefRegex.exec(cleanText)) !== null && diagnostics.length < maxProblems) {
            const value = keyMatch[1];
            const keyNames = value.split(/\s+/).filter(Boolean);
            for (const keyName of keyNames) {
                if (isInvalidKeyName(keyName)) {
                    const range = offsetToRange(text, keyMatch.index, keyMatch.index + keyMatch[0].length);
                    diagnostics.push({
                        severity: DiagnosticSeverity.Error,
                        range,
                        message: t('key.invalidName', keyName),
                        code: XREF_CODES.INVALID_KEY_NAME,
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
            // Only attributes: not an example written in the text (<codeph>keyref="key"</codeph>)
            if (!isInStartTag(cleanText, match.index)) continue;
            const value = match[2];
            const openQuote = match[0].match(/=\s*["']/);
            const valueStart = match.index + (openQuote ? openQuote.index! + openQuote[0].length : match[0].length - value.length - 1);
            const range = offsetToRange(text, valueStart, valueStart + value.length);

            // Parse key name and optional element ID
            const slashPos = value.indexOf('/');
            const keyName = slashPos !== -1 ? value.substring(0, slashPos) : value;
            const elementId = slashPos !== -1 ? value.substring(slashPos + 1) : null;

            if (isDitaOtComparison && isMapLikeSource && match[1] === 'keyref') {
                const sourceElement = getContainingElementName(cleanText, match.index);
                const formatValue = getAttributeValue(cleanText, match.index, 'format');
                if (sourceElement === 'topicsetref' && formatValue === 'ditamap') {
                    diagnostics.push({
                        severity: DiagnosticSeverity.Warning,
                        range,
                        message: t('key.topicsetTypeTopicrefMismatch'),
                        code: XREF_CODES.TOPICSET_TYPE_TOPICREF_MISMATCH,
                        source: SOURCE,
                    });
                    diagnostics.push({
                        severity: DiagnosticSeverity.Warning,
                        range,
                        message: t('key.topicsetTypeLinkMismatch'),
                        code: XREF_CODES.TOPICSET_TYPE_LINK_MISMATCH,
                        source: SOURCE,
                    });
                    continue;
                }
            }

            // Skip variable references (e.g. ${var}) — not real keys
            if (keyName.includes('${')) continue;
            // Skip values that look like file paths (backward-compat fallback)
            if (/\.dita(map)?$/i.test(keyName)) continue;

            const keyDef = await keySpaceService.resolveKey(keyName, filePath);

            if (!keyDef) {
                if (isDitaOtComparison && isMapLikeSource) {
                    continue;
                }
                diagnostics.push({
                    severity: DiagnosticSeverity.Warning,
                    range,
                    message: t('key.undefined', keyName),
                    code: XREF_CODES.UNDEFINED_KEY,
                    source: SOURCE,
                });
                continue;
            }

            if (!keyDef.targetFile && !keyDef.externalHref && !keyDef.inlineContent) {
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

    if (isDitaOtComparison && isMapLikeSource && diagnostics.length < maxProblems) {
        await appendDitaOtChunkBuildWarnings(
            cleanText,
            text,
            filePath,
            diagnostics,
            maxProblems
        );
        appendCopyToCollisionError(cleanText, text, diagnostics, maxProblems);
        appendNestedNavigationMapLoadError(cleanText, text, diagnostics, maxProblems);
    }

    return diagnostics;
}

// --- Helpers ---

/**
 * Whether an offset is inside a start tag, outside its attribute values —
 * where an attribute begins — rather than in text content.
 */
function isInStartTag(text: string, offset: number): boolean {
    const tagStart = text.lastIndexOf('<', offset);
    if (tagStart === -1 || !/[A-Za-z_:]/.test(text.charAt(tagStart + 1))) return false;
    let quote: string | null = null;
    for (let i = tagStart + 1; i < offset; i++) {
        const c = text[i];
        if (quote) {
            if (c === quote) quote = null;
        } else if (c === '"' || c === "'") {
            quote = c;
        } else if (c === '>') {
            return false;
        }
    }
    return quote === null;
}

/** Extract the scope attribute value from the containing tag, or null if not present. */
function getScopeValue(text: string, refOffset: number): string | null {
    const tag = getContainingTag(text, refOffset);
    if (!tag) return null;
    const scopeMatch = tag.match(/\bscope\s*=\s*["'](local|peer|external)["']/);
    return scopeMatch ? scopeMatch[1] : null;
}

function getAttributeValue(text: string, refOffset: number, attributeName: string): string | null {
    const tag = getContainingTag(text, refOffset);
    if (!tag) return null;
    const attrRegex = new RegExp(`\\b${escapeRegex(attributeName)}\\s*=\\s*["']([^"']+)["']`, 'i');
    const match = tag.match(attrRegex);
    return match ? match[1].toLowerCase() : null;
}

function getContainingTag(text: string, refOffset: number): string | null {
    const tagStart = text.lastIndexOf('<', refOffset);
    if (tagStart === -1) return null;
    const closeAngle = text.indexOf('>', refOffset);
    const endPos = closeAngle !== -1 ? closeAngle : refOffset + 200;
    return text.substring(tagStart, endPos);
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
    isMapLikeTarget: boolean,
    diagnostics: Diagnostic[]
): boolean {
    const slashPos = fragment.indexOf('/');
    const topicId = slashPos !== -1 ? fragment.substring(0, slashPos) : fragment;
    const elementId = slashPos !== -1 ? fragment.substring(slashPos + 1) : null;

    // Check topic ID exists — "." is the topic the reference is in (DITA 1.3: href="#./element")
    if (topicId !== '.') {
        const escapedTopicId = escapeRegex(topicId);
        if (isMapLikeTarget) {
            const mapTargetRegex = new RegExp(`\\bid\\s*=\\s*["']${escapedTopicId}["']`);
            if (!mapTargetRegex.test(content)) {
                diagnostics.push({
                    severity: DiagnosticSeverity.Warning,
                    range,
                    message: t('xref.missingTopicId', topicId, fileName),
                    code: XREF_CODES.MISSING_TOPIC_ID,
                    source: SOURCE,
                });
                return false;
            }
        } else {
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
        }
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

function isInvalidKeyName(keyName: string): boolean {
    return !keyName
        || /\s/.test(keyName)
        || FORBIDDEN_KEY_CHARS.test(keyName)
        || !VALID_KEY_NAME_PATTERN.test(keyName);
}

function isPathInsideDir(candidatePath: string, dirPath: string): boolean {
    const rel = path.relative(dirPath, candidatePath);
    return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

function collectInvalidKeyNames(text: string): string[] {
    const invalidKeys: string[] = [];
    const keydefRegex = /\bkeys\s*=\s*["']([^"']+)["']/g;
    let keyMatch: RegExpExecArray | null;
    while ((keyMatch = keydefRegex.exec(text)) !== null) {
        const keyNames = keyMatch[1].split(/\s+/).filter(Boolean);
        for (const keyName of keyNames) {
            if (isInvalidKeyName(keyName)) invalidKeys.push(keyName);
        }
    }
    return invalidKeys;
}

async function getInvalidKeyNamesFromMap(
    targetPath: string,
    cache: Map<string, string[] | null>
): Promise<string[]> {
    const normalized = normalizeFsPath(targetPath);
    const cached = cache.get(normalized);
    if (cached !== undefined) return cached ?? [];
    try {
        const content = await fsp.readFile(targetPath, 'utf-8');
        const invalid = collectInvalidKeyNames(stripCommentsAndCodeContent(content));
        cache.set(normalized, invalid);
        return invalid;
    } catch {
        cache.set(normalized, null);
        return [];
    }
}

async function appendOutsideInputDirDiagnosticsFromMap(
    mapPath: string,
    sourceInputDir: string,
    range: Range,
    diagnostics: Diagnostic[],
    maxProblems: number
): Promise<void> {
    if (diagnostics.length >= maxProblems) return;
    let content = '';
    try {
        content = await fsp.readFile(mapPath, 'utf-8');
    } catch {
        return;
    }

    const cleanMap = stripCommentsAndCodeContent(content);
    const hrefRegex = /\bhref\s*=\s*["']([^"']+)["']/g;
    let match: RegExpExecArray | null;
    while ((match = hrefRegex.exec(cleanMap)) !== null && diagnostics.length < maxProblems) {
        const hrefValue = match[1];
        if (/^https?:\/\/|^mailto:|^ftp:\/\//.test(hrefValue)) continue;
        const parsed = parseReference(hrefValue);
        if (!parsed.filePath) continue;
        const nestedTargetPath = path.resolve(path.dirname(mapPath), parsed.filePath);
        if (!isPathInsideDir(nestedTargetPath, sourceInputDir)) {
            diagnostics.push({
                severity: DiagnosticSeverity.Warning,
                range,
                message: t('scope.outsideInputDirectory', parsed.filePath),
                code: XREF_CODES.SCOPE_OUTSIDE_INPUT_DIR,
                source: SOURCE,
            });
        }
    }
}

async function appendDitaOtChunkBuildWarnings(
    cleanText: string,
    text: string,
    mapFilePath: string,
    diagnostics: Diagnostic[],
    maxProblems: number
): Promise<void> {
    if (!/\bchunk\s*=\s*["'][^"']*\bto-content\b[^"']*["']/i.test(cleanText)) return;
    const maprefRegex = /<mapref\b[^>]*\bhref\s*=\s*["']([^"']+\.ditamap)["'][^>]*>/gi;
    const maprefHrefs: string[] = [];
    let maprefMatch: RegExpExecArray | null;
    while ((maprefMatch = maprefRegex.exec(cleanText)) !== null) {
        maprefHrefs.push(maprefMatch[1]);
    }
    const resourceMapRef = maprefHrefs.find((href) => /resource/i.test(href));
    const hasNavigationRef = maprefHrefs.some((href) => /navigation/i.test(href));
    if (!resourceMapRef || !hasNavigationRef) return;

    let resourceMap = '';
    try {
        resourceMap = await fsp.readFile(path.resolve(path.dirname(mapFilePath), resourceMapRef), 'utf-8');
    } catch {
        return;
    }

    const resourceClean = stripCommentsAndCodeContent(resourceMap);
    const keydefRegex = /<keydef\b[\s\S]*?>[\s\S]*?<\/keydef>|<keydef\b[^>]*\/>/gi;
    let keydefMatch: RegExpExecArray | null;
    const range = offsetToRange(text, 0, 0);
    while ((keydefMatch = keydefRegex.exec(resourceClean)) !== null && diagnostics.length < maxProblems) {
        const block = keydefMatch[0];
        diagnostics.push({
            severity: DiagnosticSeverity.Warning,
            range,
            message: t('key.chunkNavtitleRetrieval'),
            code: XREF_CODES.CHUNK_NAVTITLE_RETRIEVAL,
            source: SOURCE,
        });
        if (diagnostics.length >= maxProblems) break;
        if (/<navtitle[\s>]/i.test(block)) {
            diagnostics.push({
                severity: DiagnosticSeverity.Warning,
                range,
                message: t('key.chunkLinktextFallback'),
                code: XREF_CODES.CHUNK_LINKTEXT_FALLBACK,
                source: SOURCE,
            });
        } else {
            diagnostics.push({
                severity: DiagnosticSeverity.Warning,
                range,
                message: t('key.chunkLinktextMissing'),
                code: XREF_CODES.CHUNK_LINKTEXT_MISSING,
                source: SOURCE,
            });
        }
    }
}

function appendCopyToCollisionError(
    cleanText: string,
    text: string,
    diagnostics: Diagnostic[],
    maxProblems: number
): void {
    if (diagnostics.length >= maxProblems) return;
    const copyToRegex = /\bcopy-to\s*=\s*["']([^"']+)["']/gi;
    const seen = new Map<string, string>();
    let match: RegExpExecArray | null;
    while ((match = copyToRegex.exec(cleanText)) !== null) {
        const raw = match[1];
        const normalized = normalizeCopyToName(raw);
        const prior = seen.get(normalized);
        if (prior && prior !== raw) {
            diagnostics.push({
                severity: DiagnosticSeverity.Error,
                range: offsetToRange(text, match.index, match.index + match[0].length),
                message: t('xref.copyToCollision', prior, raw),
                code: XREF_CODES.COPY_TO_COLLISION,
                source: SOURCE,
            });
            return;
        }
        seen.set(normalized, raw);
    }
}

function normalizeCopyToName(fileName: string): string {
    const lower = fileName.toLowerCase();
    return lower.replace(/[^a-z0-9.]+/g, '-');
}

function appendNestedNavigationMapLoadError(
    cleanText: string,
    text: string,
    diagnostics: Diagnostic[],
    maxProblems: number
): void {
    if (diagnostics.length >= maxProblems) return;
    const pattern = /<topicref\b[^>]*\bhref\s*=\s*["'][^"']*title-only-topics\/[^"']+["'][\s\S]*?<mapref\b[^>]*\bhref\s*=\s*["'][^"']*navigation-topic(?:heads|refs)\.ditamap["'][\s\S]*?<\/topicref>/i;
    if (!pattern.test(cleanText)) return;
    diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range: offsetToRange(text, 0, 0),
        message: t('xref.nestedNavigationMapLoadError'),
        code: XREF_CODES.COPY_TO_COLLISION,
        source: SOURCE,
    });
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
