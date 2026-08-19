import {
    Diagnostic,
    DiagnosticSeverity,
    DiagnosticRelatedInformation,
    Location,
    Range,
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';
import { XMLValidator } from 'fast-xml-parser';


import { DitaCraftSettings } from '../settings';
import { TOPIC_TYPE_NAMES, MAP_TYPE_NAMES } from '../data/ditaSpecialization';
import { DIAGNOSTIC_CODES } from '../utils/diagnosticCodes';
import { t } from '../utils/i18n';
import { stripCommentsAndCodeContent, offsetToRange, offsetToPosition, uriToPath } from '../utils/textUtils';

const SOURCE = 'dita-lsp';

// Diagnostic codes
const CODES = {
    XML_WELLFORMEDNESS: 'DITA-XML-001',
    MISSING_DOCTYPE: 'DITA-STRUCT-001',
    INVALID_ROOT: 'DITA-STRUCT-002',
    MISSING_ID: 'DITA-STRUCT-003',
    MISSING_TITLE: 'DITA-STRUCT-004',
    EMPTY_ELEMENT: 'DITA-STRUCT-005',
    DUPLICATE_ID: 'DITA-ID-001',
    INVALID_ID_FORMAT: 'DITA-ID-002',
    MISSING_BOOKTITLE: 'DITA-STRUCT-006',
    MISSING_MAINBOOKTITLE: 'DITA-STRUCT-007',
    TOPICREF_NO_HREF: 'DITA-STRUCT-008',
};

/** Maximum number of ENTITY declarations allowed in a DOCTYPE internal subset. */
const MAX_ENTITY_COUNT = 50;

/**
 * Main validation entry point.
 * Returns LSP Diagnostic[] for a given document.
 */
export function validateDITADocument(
    textDocument: TextDocument,
    settings: DitaCraftSettings
): Diagnostic[] {
    const text = textDocument.getText();
    const uri = textDocument.uri;
    const maxProblems = settings.maxNumberOfProblems ?? 100;
    const diagnostics: Diagnostic[] = [];

    // 1. Entity expansion pre-check (defense-in-depth against CVE-2026-26278)
    checkEntityExpansion(text, textDocument, diagnostics);

    // 2. XML well-formedness
    validateXML(text, diagnostics);

    // 3. DITA structure
    validateDITAStructure(text, uri, diagnostics);

    // 4. ID validation
    validateIDs(text, textDocument, diagnostics);

    // Cap diagnostics
    if (diagnostics.length > maxProblems) {
        return diagnostics.slice(0, maxProblems);
    }

    return diagnostics;
}

// Regex to locate the start of a DOCTYPE declaration. Only used to find where
// to begin the linear internal-subset scan below — never to match the whole
// declaration, so it can't itself become a backtracking hazard.
const DOCTYPE_START_RE = /<!DOCTYPE\s/i;

// Regex used only to COUNT entity declarations (both internal and external).
// Deliberately a bare `<!ENTITY` search rather than a full declaration match
// (which would need alternation up to a closing '>' — see #125) so counting
// can never itself become a backtracking hazard.
const ENTITY_COUNT_RE = /<!ENTITY\s/gi;

// Regex to match internal ENTITY declarations with a quoted value.
// Captures: (1) optional %, (2) name, (3) quote char, (4) value.
const ENTITY_INTERNAL_RE = /<!ENTITY\s+(%\s+)?(\S+)\s+(["'])([\s\S]*?)\3\s*>/gi;

// Regex to detect SYSTEM or PUBLIC keywords in an ENTITY declaration.
// Captures: (1) optional %, (2) entity name, (3) SYSTEM|PUBLIC.
const EXTERNAL_ENTITY_RE = /<!ENTITY\s+(%\s+)?(\S+)\s+(SYSTEM|PUBLIC)\s/gi;

// XML pre-defined entities that are safe and should not trigger false positives
const XML_PREDEFINED_ENTITIES = new Set(['amp', 'lt', 'gt', 'quot', 'apos']);

// Regex to detect entity references (&name; or %name;) inside an entity value
const ENTITY_REF_IN_VALUE_RE = /[&%]([a-zA-Z_][\w.-]*);/g;

/**
 * Returns a range covering the first line of the match (safe for multi-line declarations).
 */
function entityRange(textDocument: TextDocument, offset: number, matchText: string): Range {
    const pos = textDocument.positionAt(offset);
    const firstNewline = matchText.indexOf('\n');
    const endChar = firstNewline >= 0
        ? pos.character + firstNewline
        : pos.character + matchText.length;
    return {
        start: pos,
        end: { line: pos.line, character: endChar },
    };
}

/**
 * Returns true if an entity value contains references to non-predefined entities.
 */
function hasNonPredefinedEntityRef(value: string): boolean {
    const re = new RegExp(ENTITY_REF_IN_VALUE_RE.source, ENTITY_REF_IN_VALUE_RE.flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(value)) !== null) {
        // ENTITY_REF_IN_VALUE_RE requires [a-zA-Z_] as first char, so numeric refs
        // (&#160; &#x20;) never match here. Only named entity/param refs reach this point.
        if (!XML_PREDEFINED_ENTITIES.has(m[1])) return true;
    }
    return false;
}

/**
 * Locate a DOCTYPE's internal subset (the `[ ... ]` block) using a single
 * linear scan — quote-aware so a `]` or `>` inside a quoted literal (e.g. an
 * entity value) doesn't end the scan early, matching the intent of the
 * regex this replaces. XML comments (`<!-- ... -->`) are skipped wholesale
 * rather than scanned character-by-character: unlike the backtracking regex
 * this replaces, a linear quote-toggle scan cannot recover from a lone
 * unmatched quote (e.g. an apostrophe in prose like "don't"), so without
 * this a single such comment would desync the scan and make it treat the
 * rest of the document — including the real closing `]`/`>` — as still
 * "inside a quote", silently disabling the entity-expansion/XXE check.
 *
 * The previous implementation used `<!DOCTYPE\s[\s\S]*?\[(...)*\]\s*>` —
 * a lazy `[\s\S]*?` that, on a DOCTYPE with no internal subset, searched
 * past the declaration into the rest of the document for the next stray
 * `[`. A `[` far away (e.g. a JSON array inside a `<codeblock>`) combined
 * with enough quoted-looking content for the starred alternation to
 * backtrack over made the regex hang indefinitely on ordinary, well-formed
 * documents (catastrophic backtracking — see #125). A hand-rolled scan
 * can't backtrack, so it's immune by construction, and — as a side effect
 * of being correct — it also stops considering a `[` outside the DOCTYPE
 * declaration itself as the start of an internal subset.
 *
 * Returns the raw subset text, its offset in `text`, and the offset of the
 * `<!DOCTYPE` keyword itself — or null when there is no DOCTYPE, or the
 * DOCTYPE has no internal subset (or is malformed).
 */
function extractDoctypeInternalSubset(
    text: string
): { subset: string; offset: number; doctypeOffset: number } | null {
    const doctypeStart = DOCTYPE_START_RE.exec(text);
    if (!doctypeStart) return null;

    let quote: string | null = null;
    for (let i = doctypeStart.index + doctypeStart[0].length; i < text.length; i++) {
        const ch = text[i];
        if (quote) {
            if (ch === quote) quote = null;
            continue;
        }
        if (text.startsWith('<!--', i)) {
            const closeIdx = text.indexOf('-->', i + 4);
            if (closeIdx === -1) return null; // unterminated comment — malformed
            i = closeIdx + 2; // loop's i++ lands just past '-->'
            continue;
        }
        if (ch === '"' || ch === '\'') {
            quote = ch;
        } else if (ch === '[') {
            const bracketed = extractBracketedSubset(text, i + 1);
            return bracketed ? { ...bracketed, doctypeOffset: doctypeStart.index } : null;
        } else if (ch === '>') {
            // DOCTYPE closes with no internal subset.
            return null;
        }
    }
    return null; // Unterminated DOCTYPE — no subset to report.
}

/**
 * Scan forward from just after a DOCTYPE's opening `[`, tracking nested
 * brackets and quotes, to find the matching `]`. Linear in the subset's
 * length — no alternation, no backtracking. Comments are skipped wholesale
 * (see {@link extractDoctypeInternalSubset}) so a stray unmatched quote in
 * comment prose can't desync the quote-toggle tracking.
 */
function extractBracketedSubset(text: string, subsetStart: number): { subset: string; offset: number } | null {
    let depth = 1;
    let quote: string | null = null;
    let i = subsetStart;
    for (; i < text.length; i++) {
        const ch = text[i];
        if (quote) {
            if (ch === quote) quote = null;
            continue;
        }
        if (text.startsWith('<!--', i)) {
            const closeIdx = text.indexOf('-->', i + 4);
            if (closeIdx === -1) return null; // unterminated comment — malformed
            i = closeIdx + 2; // loop's i++ lands just past '-->'
            continue;
        }
        if (ch === '"' || ch === '\'') {
            quote = ch;
        } else if (ch === '[') {
            depth++;
        } else if (ch === ']') {
            depth--;
            if (depth === 0) break;
        }
    }
    if (depth !== 0) return null; // Unterminated subset — malformed DOCTYPE.
    return { subset: text.slice(subsetStart, i), offset: subsetStart };
}

/**
 * Defense-in-depth pre-check for dangerous entity patterns in DOCTYPE.
 * Detects: recursive entity expansion (billion laughs), XXE (external entities),
 * and excessive entity counts — before content reaches the XML parser.
 */
function checkEntityExpansion(
    text: string,
    textDocument: TextDocument,
    diagnostics: Diagnostic[]
): void {
    const subsetResult = extractDoctypeInternalSubset(text);
    if (!subsetResult) {
        return;
    }

    const { subset, offset: subsetOffset, doctypeOffset } = subsetResult;

    // Count ALL entity declarations (internal + external)
    const countRegex = new RegExp(ENTITY_COUNT_RE.source, ENTITY_COUNT_RE.flags);
    let totalEntityCount = 0;
    while (countRegex.exec(subset) !== null) {
        totalEntityCount++;
    }

    // Check internal entities for recursive references
    const entityDeclRegex = new RegExp(ENTITY_INTERNAL_RE.source, ENTITY_INTERNAL_RE.flags);
    let entityMatch: RegExpExecArray | null;

    while ((entityMatch = entityDeclRegex.exec(subset)) !== null) {
        const entityName = entityMatch[2];
        const entityValue = entityMatch[4];
        const entityOffset = subsetOffset + entityMatch.index;

        if (hasNonPredefinedEntityRef(entityValue)) {
            diagnostics.push({
                severity: DiagnosticSeverity.Error,
                range: entityRange(textDocument, entityOffset, entityMatch[0]),
                message: t('security.entityExpansion', entityName),
                source: SOURCE,
                code: DIAGNOSTIC_CODES.security.ENTITY_EXPANSION,
            });
        }
    }

    // Check for external entity declarations (SYSTEM/PUBLIC)
    const externalRegex = new RegExp(EXTERNAL_ENTITY_RE.source, EXTERNAL_ENTITY_RE.flags);
    let extMatch: RegExpExecArray | null;
    while ((extMatch = externalRegex.exec(subset)) !== null) {
        const extOffset = subsetOffset + extMatch.index;
        const entityName = extMatch[2];
        diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range: entityRange(textDocument, extOffset, extMatch[0]),
            message: t('security.externalEntity', entityName),
            source: SOURCE,
            code: DIAGNOSTIC_CODES.security.EXTERNAL_ENTITY,
        });
    }

    // Check for excessive entity count (includes both internal and external)
    if (totalEntityCount > MAX_ENTITY_COUNT) {
        const pos = textDocument.positionAt(doctypeOffset);
        diagnostics.push({
            severity: DiagnosticSeverity.Warning,
            range: {
                start: pos,
                end: { line: pos.line, character: pos.character + 9 }, // "<!DOCTYPE"
            },
            message: t('security.excessiveEntities', String(totalEntityCount), String(MAX_ENTITY_COUNT)),
            source: SOURCE,
            code: DIAGNOSTIC_CODES.security.EXCESSIVE_ENTITIES,
        });
    }
}

/**
 * XML well-formedness check using fast-xml-parser.
 * Strips DOCTYPE before validation since fast-xml-parser doesn't handle it.
 */
function validateXML(text: string, diagnostics: Diagnostic[]): void {
    try {
        // Strip DOCTYPE declaration — fast-xml-parser chokes on it.
        // Replace with whitespace (preserving newlines) to keep line/column offsets valid.
        // Handles internal subsets: <!DOCTYPE topic PUBLIC "..." "..." [ ... ]>
        const stripped = text.replace(
            /<!DOCTYPE\s[\s\S]*?(?:\[[\s\S]*?\]\s*)?>|<!DOCTYPE[^>]*>/gi,
            (m) => m.replace(/[^\n\r]/g, ' ')
        );

        const result = XMLValidator.validate(stripped, {
            allowBooleanAttributes: true,
        });

        if (result !== true) {
            const errorObj = result as Record<string, unknown>;
            const err = errorObj.err as Record<string, unknown> | undefined;

            const errorCode =
                err && typeof err.code === 'string' ? err.code : 'UNKNOWN';
            const errorMsg =
                err && typeof err.msg === 'string'
                    ? err.msg
                    : 'XML validation error';
            const errorLine =
                err && typeof err.line === 'number' ? err.line - 1 : 0;
            const errorCol =
                err && typeof err.col === 'number' ? err.col - 1 : 0;

            diagnostics.push({
                severity: DiagnosticSeverity.Error,
                range: createRange(errorLine, errorCol),
                message: `${errorCode}: ${errorMsg}`,
                source: SOURCE,
                code: CODES.XML_WELLFORMEDNESS,
            });
        }
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'XML parsing error';
        const lineMatch = msg.match(/line[:\s]+(\d+)/i);
        const line = lineMatch ? parseInt(lineMatch[1], 10) - 1 : 0;

        diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range: createRange(line, 0),
            message: msg,
            source: SOURCE,
            code: CODES.XML_WELLFORMEDNESS,
        });
    }
}

/**
 * DITA structure validation (adapted from client-side ditaStructureValidator.ts)
 */
function validateDITAStructure(
    text: string,
    uri: string,
    diagnostics: Diagnostic[]
): void {
    const ext = getFileExtension(uri);

    // Strip comments to avoid matching elements inside them.
    // Line structure is preserved so offsets from the original text remain valid.
    const cleanText = stripCommentsAndCodeContent(text);

    // DITAVAL files have different structure — no DOCTYPE/title/id required
    if (ext === '.ditaval') {
        validateDitavalStructure(cleanText, diagnostics);
        return;
    }

    // Missing DOCTYPE (check raw text — DOCTYPE is not inside comments)
    if (!text.includes('<!DOCTYPE')) {
        diagnostics.push({
            severity: DiagnosticSeverity.Warning,
            range: createRange(0, 0),
            message: t('struct.missingDoctype'),
            source: SOURCE,
            code: CODES.MISSING_DOCTYPE,
        });
    }

    if (ext === '.dita') {
        validateTopicStructure(cleanText, diagnostics);
    } else if (ext === '.ditamap') {
        validateMapStructure(cleanText, diagnostics);
    } else if (ext === '.bookmap') {
        validateBookmapStructure(cleanText, diagnostics);
    }

    // Empty elements check
    checkEmptyElements(cleanText, diagnostics);
}

function validateTopicStructure(
    text: string,
    diagnostics: Diagnostic[]
): void {
    const hasTopicRoot = [...TOPIC_TYPE_NAMES].some((name) => new RegExp(`<${name}[\\s>]`).test(text));

    if (!hasTopicRoot) {
        diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range: createRange(0, 0),
            message: t('struct.invalidTopicRoot', [...TOPIC_TYPE_NAMES].slice(0, 4).join(', ')),
            source: SOURCE,
            code: CODES.INVALID_ROOT,
        });
        return;
    }

    // Check id attribute on root element
    const topicPattern = [...TOPIC_TYPE_NAMES].join('|');
    const idMatch = text.match(
        new RegExp(`<(?:${topicPattern})\\s+[^>]*id=(?:"([^"]*)"|'([^']*)')`)
    );
    if (!idMatch) {
        const rootMatch = text.match(new RegExp(`<(?:${topicPattern})[\\s>]`));
        if (rootMatch) {
            diagnostics.push({
                severity: DiagnosticSeverity.Error,
                range: offsetToRange(text, rootMatch.index!, rootMatch.index! + rootMatch[0].length),
                message: t('struct.missingId'),
                source: SOURCE,
                code: CODES.MISSING_ID,
            });
        } else {
            diagnostics.push({
                severity: DiagnosticSeverity.Error,
                range: createRange(0, 0),
                message: t('struct.missingId'),
                source: SOURCE,
                code: CODES.MISSING_ID,
            });
        }
    } else if ((idMatch[1] ?? idMatch[2]) === '') {
        diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range: offsetToRange(text, idMatch.index!, idMatch.index! + idMatch[0].length),
            message: t('struct.emptyId'),
            source: SOURCE,
            code: CODES.MISSING_ID,
        });
    }

    // Glossentry uses <glossterm> instead of <title>
    const isGlossentry = /<glossentry[\s>]/.test(text);

    if (isGlossentry) {
        // Check for glossterm element
        if (!text.includes('<glossterm>') && !text.includes('<glossterm ')) {
            diagnostics.push({
                severity: DiagnosticSeverity.Error,
                range: createRange(0, 0),
                message: t('struct.missingGlossterm'),
                source: SOURCE,
                code: CODES.MISSING_TITLE,
            });
        }
    } else {
        // Check for title element
        if (!text.includes('<title>') && !text.includes('<title ')) {
            diagnostics.push({
                severity: DiagnosticSeverity.Error,
                range: createRange(0, 0),
                message: t('struct.missingTopicTitle'),
                source: SOURCE,
                code: CODES.MISSING_TITLE,
            });
        }
    }
}

function validateMapStructure(text: string, diagnostics: Diagnostic[]): void {
    // Accept all DITA map specializations as valid root elements
    const hasMapRoot = [...MAP_TYPE_NAMES].some((name) => new RegExp(`<${name}[\\s>]`).test(text));

    if (!hasMapRoot) {
        diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range: createRange(0, 0),
            message: t('struct.invalidMapRoot'),
            source: SOURCE,
            code: CODES.INVALID_ROOT,
        });
        return;
    }

    // If this is actually a bookmap, delegate to bookmap validation
    if (/<bookmap[\s>]/.test(text)) {
        validateBookmapStructure(text, diagnostics);
        return;
    }

    // Only plain <map> requires title and topicref checks;
    // other specializations (subjectScheme, learning maps) have their own structure
    if (!/<map[\s>]/.test(text)) {
        return;
    }

    if (!text.includes('<title>') && !text.includes('<title ')) {
        diagnostics.push({
            severity: DiagnosticSeverity.Warning,
            range: createRange(0, 0),
            message: t('struct.missingMapTitle'),
            source: SOURCE,
            code: CODES.MISSING_TITLE,
        });
    }

    // Check for topicref without href/keyref/keys
    checkTopicrefsWithoutHref(text, diagnostics);
}

function validateBookmapStructure(
    text: string,
    diagnostics: Diagnostic[]
): void {
    if (!/<bookmap[\s>]/.test(text)) {
        diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range: createRange(0, 0),
            message: t('struct.invalidBookmapRoot'),
            source: SOURCE,
            code: CODES.INVALID_ROOT,
        });
        return;
    }

    // Check for <booktitle> element
    if (!/<booktitle[\s>]/.test(text)) {
        diagnostics.push({
            severity: DiagnosticSeverity.Warning,
            range: createRange(0, 0),
            message: t('struct.missingBooktitle'),
            source: SOURCE,
            code: CODES.MISSING_BOOKTITLE,
        });
    } else if (!/<mainbooktitle[\s>]/.test(text)) {
        // Only check <mainbooktitle> if <booktitle> exists
        diagnostics.push({
            severity: DiagnosticSeverity.Warning,
            range: createRange(0, 0),
            message: t('struct.missingMainbooktitle'),
            source: SOURCE,
            code: CODES.MISSING_MAINBOOKTITLE,
        });
    }

    // Check for topicref without href/keyref/keys
    checkTopicrefsWithoutHref(text, diagnostics);
}

function validateDitavalStructure(
    text: string,
    diagnostics: Diagnostic[]
): void {
    if (!/<val[\s>]/.test(text)) {
        diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range: createRange(0, 0),
            message: t('struct.invalidDitavalRoot'),
            source: SOURCE,
            code: CODES.INVALID_ROOT,
        });
        return;
    }

    // DITAVAL-001: <prop> requires att attribute
    const propRegex = /<prop\s([^>]*?)\/?>/g;
    let propMatch;
    while ((propMatch = propRegex.exec(text)) !== null) {
        const attrs = propMatch[1];
        if (!/\batt\s*=/.test(attrs)) {
            const pos = offsetToPosition(text, propMatch.index);
            diagnostics.push({
                severity: DiagnosticSeverity.Warning,
                range: createRange(pos.line, pos.character, propMatch[0].length),
                message: t('ditaval.propMissingAtt'),
                source: SOURCE,
                code: 'DITA-DITAVAL-001',
            });
        }
    }

    // DITAVAL-002: <prop> action must be a valid value
    const VALID_ACTIONS = new Set(['include', 'exclude', 'passthrough', 'flag']);
    const actionRegex = /<prop\s[^>]*\baction\s*=\s*["']([^"']*)["']/g;
    let actionMatch;
    while ((actionMatch = actionRegex.exec(text)) !== null) {
        const actionValue = actionMatch[1];
        if (!VALID_ACTIONS.has(actionValue)) {
            const valueStart = actionMatch.index + actionMatch[0].lastIndexOf(actionValue);
            const pos = offsetToPosition(text, valueStart);
            diagnostics.push({
                severity: DiagnosticSeverity.Error,
                range: createRange(pos.line, pos.character, actionValue.length),
                message: t('ditaval.invalidAction', actionValue),
                source: SOURCE,
                code: 'DITA-DITAVAL-002',
            });
        }
    }

    // DITAVAL-003: <revprop> requires val attribute
    const revpropRegex = /<revprop\s([^>]*?)\/?>/g;
    let revpropMatch;
    while ((revpropMatch = revpropRegex.exec(text)) !== null) {
        const attrs = revpropMatch[1];
        if (!/\bval\s*=/.test(attrs)) {
            const pos = offsetToPosition(text, revpropMatch.index);
            diagnostics.push({
                severity: DiagnosticSeverity.Warning,
                range: createRange(pos.line, pos.character, revpropMatch[0].length),
                message: t('ditaval.revpropMissingVal'),
                source: SOURCE,
                code: 'DITA-DITAVAL-003',
            });
        }
    }

    // DITAVAL-004: Duplicate <prop> with same att+val combination
    // Parse each <prop> to extract att and val independently (handles any attribute order,
    // and also <prop att="x"> without val which means "all values")
    const propDupRegex = /<prop\s([^>]*?)\/?>/g;
    const seenPropPairs = new Map<string, number>();
    let dupMatch;
    while ((dupMatch = propDupRegex.exec(text)) !== null) {
        const attrs = dupMatch[1];
        const attMatch = attrs.match(/\batt\s*=\s*["']([^"']*?)["']/);
        if (!attMatch) continue; // No att attribute — skip
        const att = attMatch[1];
        const valMatch = attrs.match(/\bval\s*=\s*["']([^"']*?)["']/);
        const val = valMatch ? valMatch[1] : '*'; // No val = all values
        const pairKey = `${att}|${val}`;
        if (seenPropPairs.has(pairKey)) {
            const pos = offsetToPosition(text, dupMatch.index);
            diagnostics.push({
                severity: DiagnosticSeverity.Warning,
                range: createRange(pos.line, pos.character, dupMatch[0].length),
                message: t('ditaval.duplicateProp', att, val === '*' ? '(all)' : val),
                source: SOURCE,
                code: 'DITA-DITAVAL-004',
            });
        } else {
            seenPropPairs.set(pairKey, dupMatch.index);
        }
    }

    // DITAVAL-005: <startflag>/<endflag> should have imageref or contain <alt-text>
    const flagRegex = /<(startflag|endflag)\s*([^>]*?)>([\s\S]*?)<\/\1>/g;
    let flagMatch;
    while ((flagMatch = flagRegex.exec(text)) !== null) {
        const attrs = flagMatch[2];
        const innerContent = flagMatch[3];
        const hasImageref = /\bimageref\s*=/.test(attrs);
        const hasAltText = /<alt-text[\s>]/.test(innerContent);
        if (!hasImageref && !hasAltText) {
            const pos = offsetToPosition(text, flagMatch.index);
            diagnostics.push({
                severity: DiagnosticSeverity.Warning,
                range: createRange(pos.line, pos.character, flagMatch[0].length),
                message: t('ditaval.flagMissingContent', flagMatch[1]),
                source: SOURCE,
                code: 'DITA-DITAVAL-005',
            });
        }
    }
}

/**
 * Warn about <topicref> elements that have no target attribute.
 * Self-closing topicrefs are skipped — they are intentional grouping/nesting containers.
 */
function checkTopicrefsWithoutHref(text: string, diagnostics: Diagnostic[]): void {
    // Only match non-self-closing <topicref ...> (exclude <topicref .../>)
    const topicrefPattern = /<topicref\s([^>]*?)>/g;
    let match;
    while ((match = topicrefPattern.exec(text)) !== null) {
        // Skip self-closing tags (matched content ends with /)
        if (match[1].endsWith('/')) {
            continue;
        }
        const attrs = match[1];
        // Skip if it has any target reference attribute
        if (/\b(?:href|keyref|keys|conref|conkeyref)\s*=/.test(attrs)) {
            continue;
        }
        const pos = offsetToPosition(text, match.index);
        diagnostics.push({
            severity: DiagnosticSeverity.Information,
            range: createRange(pos.line, pos.character, match[0].length),
            message: t('struct.topicrefMissingHref'),
            source: SOURCE,
            code: CODES.TOPICREF_NO_HREF,
        });
    }
}

function checkEmptyElements(text: string, diagnostics: Diagnostic[]): void {
    const emptyPatterns = [
        { pattern: /<title><\/title>/g, name: 'title' },
        { pattern: /<p><\/p>/g, name: 'p' },
        { pattern: /<shortdesc><\/shortdesc>/g, name: 'shortdesc' },
    ];

    for (const { pattern, name } of emptyPatterns) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
            const pos = offsetToPosition(text, match.index);
            diagnostics.push({
                severity: DiagnosticSeverity.Warning,
                range: {
                    start: { line: pos.line, character: pos.character },
                    end: {
                        line: pos.line,
                        character: pos.character + match[0].length,
                    },
                },
                message: t('struct.emptyElement', name),
                source: SOURCE,
                code: CODES.EMPTY_ELEMENT,
            });
        }
    }
}


// DITA topic/map root elements use XML ID type (must start with letter/underscore).
// All other elements use NMTOKEN type (can start with digits).
// Derived from the canonical sets in ditaSpecialization.ts (lowercased for case-insensitive matching).
const DITA_ROOT_ELEMENTS = new Set([
    ...[...TOPIC_TYPE_NAMES].map(n => n.toLowerCase()),
    ...[...MAP_TYPE_NAMES].map(n => n.toLowerCase()),
]);

/**
 * Find the enclosing element name for an attribute match position.
 * Scans backward from the match to find the opening `<tagName`.
 */
function getEnclosingElement(text: string, matchIndex: number): string {
    for (let i = matchIndex - 1; i >= 0; i--) {
        if (text[i] === '<') {
            const after = text.substring(i + 1, matchIndex);
            const tagMatch = after.match(/^([\w][\w.-]*)/);
            return tagMatch ? tagMatch[1].toLowerCase() : '';
        }
    }
    return '';
}

/**
 * ID validation: duplicates and format
 */
function validateIDs(
    text: string,
    textDocument: TextDocument,
    diagnostics: Diagnostic[]
): void {
    // Use cleaned text to avoid matching IDs inside comments/CDATA
    const cleanText = stripCommentsAndCodeContent(text);
    const idPattern = /\bid=(["'])([^"']*)\1/g;
    const idLocations = new Map<
        string,
        { line: number; character: number; index: number; element: string }[]
    >();

    let match;
    while ((match = idPattern.exec(cleanText)) !== null) {
        const idValue = match[2];
        // Use original text for line/col since we preserved line structure
        const pos = offsetToPosition(text, match.index);
        const element = getEnclosingElement(cleanText, match.index);
        const locations = idLocations.get(idValue) || [];
        locations.push({ ...pos, index: match.index, element });
        idLocations.set(idValue, locations);
    }

    for (const [idValue, locations] of idLocations) {
        // id="value" or id='value' is 4 + value.length chars (id=" + value + ")
        const idAttrLen = 4 + idValue.length + 1;

        // Invalid ID format
        if (idValue) {
            const isRootElement = DITA_ROOT_ELEMENTS.has(locations[0].element);
            if (isRootElement) {
                // XML ID type: must start with letter or underscore
                if (!/^[a-zA-Z_][\w.-]*$/.test(idValue)) {
                    const pos = locations[0];
                    diagnostics.push({
                        severity: DiagnosticSeverity.Warning,
                        range: Range.create(pos.line, pos.character, pos.line, pos.character + idAttrLen),
                        message: t('id.invalidXmlId', idValue),
                        source: SOURCE,
                        code: CODES.INVALID_ID_FORMAT,
                    });
                }
            } else {
                // NMTOKEN type: can start with digit but must contain only valid characters
                if (!/^[\w.-]+$/.test(idValue)) {
                    const pos = locations[0];
                    diagnostics.push({
                        severity: DiagnosticSeverity.Warning,
                        range: Range.create(pos.line, pos.character, pos.line, pos.character + idAttrLen),
                        message: t('id.invalidNmtoken', idValue),
                        source: SOURCE,
                        code: CODES.INVALID_ID_FORMAT,
                    });
                }
            }
        }

        // Duplicate IDs
        if (locations.length > 1) {
            for (let i = 0; i < locations.length; i++) {
                const pos = locations[i];
                const relatedInfo: DiagnosticRelatedInformation[] = locations
                    .filter((_, j) => j !== i)
                    .map((other) => ({
                        location: Location.create(
                            textDocument.uri,
                            Range.create(
                                other.line,
                                other.character,
                                other.line,
                                other.character + idAttrLen
                            )
                        ),
                        message: t('id.duplicateRelated', idValue),
                    }));

                diagnostics.push({
                    severity: DiagnosticSeverity.Error,
                    range: Range.create(pos.line, pos.character, pos.line, pos.character + idAttrLen),
                    message: t('id.duplicate', idValue),
                    source: SOURCE,
                    code: CODES.DUPLICATE_ID,
                    relatedInformation: relatedInfo,
                });
            }
        }
    }
}

// --- Helpers ---

function getFileExtension(uri: string): string {
    const fsPath = uriToPath(uri);
    const dot = fsPath.lastIndexOf('.');
    return dot >= 0 ? fsPath.slice(dot).toLowerCase() : '';
}

// findLineAndColumn — replaced by shared offsetToPosition() from utils/textUtils.ts

/**
 * Create a range spanning from (line, col) to the end of the line.
 * An optional `length` parameter can be used for precise highlighting.
 */
function createRange(line: number, col: number, length?: number): Range {
    if (length !== undefined && length > 0) {
        return Range.create(line, col, line, col + length);
    }
    // Default: highlight to a reasonable end-of-token position.
    // Use a generous width so the squiggly underline is clearly visible.
    return Range.create(line, col, line, col + 1000);
}

