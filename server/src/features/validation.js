"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDITADocument = validateDITADocument;
const node_1 = require("vscode-languageserver/node");
const fast_xml_parser_1 = require("fast-xml-parser");
const ditaSpecialization_1 = require("../data/ditaSpecialization");
const diagnosticCodes_1 = require("../utils/diagnosticCodes");
const i18n_1 = require("../utils/i18n");
const textUtils_1 = require("../utils/textUtils");
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
function validateDITADocument(textDocument, settings) {
    const text = textDocument.getText();
    const uri = textDocument.uri;
    const maxProblems = settings.maxNumberOfProblems ?? 100;
    const diagnostics = [];
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
// Regex to extract the DOCTYPE internal subset (content between [ and ]).
// Uses quote-aware alternation so a ']>' sequence inside a quoted entity value
// does not terminate the match prematurely and bypass the entity security checks.
const DOCTYPE_INTERNAL_SUBSET_RE = /<!DOCTYPE\s[\s\S]*?\[((\"[^\"]*\"|'[^']*'|[^\]])*)\]\s*>/i;
// Regex to match ALL ENTITY declarations (both internal and external) for counting.
// Uses quote-aware alternation to avoid terminating early on '>' inside SYSTEM ids.
// Captures: (1) optional % for parameter entities, (2) entity name.
const ENTITY_ANY_RE = /<!ENTITY\s+(%\s+)?(\S+)\s+(?:"[^"]*"|'[^']*'|[^>])*>/gi;
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
function entityRange(textDocument, offset, matchText) {
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
function hasNonPredefinedEntityRef(value) {
    const re = new RegExp(ENTITY_REF_IN_VALUE_RE.source, ENTITY_REF_IN_VALUE_RE.flags);
    let m;
    while ((m = re.exec(value)) !== null) {
        // ENTITY_REF_IN_VALUE_RE requires [a-zA-Z_] as first char, so numeric refs
        // (&#160; &#x20;) never match here. Only named entity/param refs reach this point.
        if (!XML_PREDEFINED_ENTITIES.has(m[1]))
            return true;
    }
    return false;
}
/**
 * Defense-in-depth pre-check for dangerous entity patterns in DOCTYPE.
 * Detects: recursive entity expansion (billion laughs), XXE (external entities),
 * and excessive entity counts — before content reaches the XML parser.
 */
function checkEntityExpansion(text, textDocument, diagnostics) {
    const subsetMatch = DOCTYPE_INTERNAL_SUBSET_RE.exec(text);
    if (!subsetMatch) {
        return;
    }
    const subset = subsetMatch[1];
    const subsetOffset = subsetMatch.index + subsetMatch[0].indexOf('[') + 1;
    // Count ALL entity declarations (internal + external)
    const countRegex = new RegExp(ENTITY_ANY_RE.source, ENTITY_ANY_RE.flags);
    let totalEntityCount = 0;
    while (countRegex.exec(subset) !== null) {
        totalEntityCount++;
    }
    // Check internal entities for recursive references
    const entityDeclRegex = new RegExp(ENTITY_INTERNAL_RE.source, ENTITY_INTERNAL_RE.flags);
    let entityMatch;
    while ((entityMatch = entityDeclRegex.exec(subset)) !== null) {
        const entityName = entityMatch[2];
        const entityValue = entityMatch[4];
        const entityOffset = subsetOffset + entityMatch.index;
        if (hasNonPredefinedEntityRef(entityValue)) {
            diagnostics.push({
                severity: node_1.DiagnosticSeverity.Error,
                range: entityRange(textDocument, entityOffset, entityMatch[0]),
                message: (0, i18n_1.t)('security.entityExpansion', entityName),
                source: SOURCE,
                code: diagnosticCodes_1.DIAGNOSTIC_CODES.security.ENTITY_EXPANSION,
            });
        }
    }
    // Check for external entity declarations (SYSTEM/PUBLIC)
    const externalRegex = new RegExp(EXTERNAL_ENTITY_RE.source, EXTERNAL_ENTITY_RE.flags);
    let extMatch;
    while ((extMatch = externalRegex.exec(subset)) !== null) {
        const extOffset = subsetOffset + extMatch.index;
        const entityName = extMatch[2];
        diagnostics.push({
            severity: node_1.DiagnosticSeverity.Error,
            range: entityRange(textDocument, extOffset, extMatch[0]),
            message: (0, i18n_1.t)('security.externalEntity', entityName),
            source: SOURCE,
            code: diagnosticCodes_1.DIAGNOSTIC_CODES.security.EXTERNAL_ENTITY,
        });
    }
    // Check for excessive entity count (includes both internal and external)
    if (totalEntityCount > MAX_ENTITY_COUNT) {
        const doctypeOffset = subsetMatch.index;
        const pos = textDocument.positionAt(doctypeOffset);
        diagnostics.push({
            severity: node_1.DiagnosticSeverity.Warning,
            range: {
                start: pos,
                end: { line: pos.line, character: pos.character + 9 }, // "<!DOCTYPE"
            },
            message: (0, i18n_1.t)('security.excessiveEntities', String(totalEntityCount), String(MAX_ENTITY_COUNT)),
            source: SOURCE,
            code: diagnosticCodes_1.DIAGNOSTIC_CODES.security.EXCESSIVE_ENTITIES,
        });
    }
}
/**
 * XML well-formedness check using fast-xml-parser.
 * Strips DOCTYPE before validation since fast-xml-parser doesn't handle it.
 */
function validateXML(text, diagnostics) {
    try {
        // Strip DOCTYPE declaration — fast-xml-parser chokes on it.
        // Replace with whitespace (preserving newlines) to keep line/column offsets valid.
        // Handles internal subsets: <!DOCTYPE topic PUBLIC "..." "..." [ ... ]>
        const stripped = text.replace(/<!DOCTYPE\s[\s\S]*?(?:\[[\s\S]*?\]\s*)?>|<!DOCTYPE[^>]*>/gi, (m) => m.replace(/[^\n\r]/g, ' '));
        const result = fast_xml_parser_1.XMLValidator.validate(stripped, {
            allowBooleanAttributes: true,
        });
        if (result !== true) {
            const errorObj = result;
            const err = errorObj.err;
            const errorCode = err && typeof err.code === 'string' ? err.code : 'UNKNOWN';
            const errorMsg = err && typeof err.msg === 'string'
                ? err.msg
                : 'XML validation error';
            const errorLine = err && typeof err.line === 'number' ? err.line - 1 : 0;
            const errorCol = err && typeof err.col === 'number' ? err.col - 1 : 0;
            diagnostics.push({
                severity: node_1.DiagnosticSeverity.Error,
                range: createRange(errorLine, errorCol),
                message: `${errorCode}: ${errorMsg}`,
                source: SOURCE,
                code: CODES.XML_WELLFORMEDNESS,
            });
        }
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'XML parsing error';
        const lineMatch = msg.match(/line[:\s]+(\d+)/i);
        const line = lineMatch ? parseInt(lineMatch[1], 10) - 1 : 0;
        diagnostics.push({
            severity: node_1.DiagnosticSeverity.Error,
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
function validateDITAStructure(text, uri, diagnostics) {
    const ext = getFileExtension(uri);
    // Strip comments to avoid matching elements inside them.
    // Line structure is preserved so offsets from the original text remain valid.
    const cleanText = (0, textUtils_1.stripCommentsAndCodeContent)(text);
    // DITAVAL files have different structure — no DOCTYPE/title/id required
    if (ext === '.ditaval') {
        validateDitavalStructure(cleanText, diagnostics);
        return;
    }
    // Missing DOCTYPE (check raw text — DOCTYPE is not inside comments)
    if (!text.includes('<!DOCTYPE')) {
        diagnostics.push({
            severity: node_1.DiagnosticSeverity.Warning,
            range: createRange(0, 0),
            message: (0, i18n_1.t)('struct.missingDoctype'),
            source: SOURCE,
            code: CODES.MISSING_DOCTYPE,
        });
    }
    if (ext === '.dita') {
        validateTopicStructure(cleanText, diagnostics);
    }
    else if (ext === '.ditamap') {
        validateMapStructure(cleanText, diagnostics);
    }
    else if (ext === '.bookmap') {
        validateBookmapStructure(cleanText, diagnostics);
    }
    // Empty elements check
    checkEmptyElements(cleanText, diagnostics);
}
function validateTopicStructure(text, diagnostics) {
    const hasTopicRoot = [...ditaSpecialization_1.TOPIC_TYPE_NAMES].some((name) => new RegExp(`<${name}[\\s>]`).test(text));
    if (!hasTopicRoot) {
        diagnostics.push({
            severity: node_1.DiagnosticSeverity.Error,
            range: createRange(0, 0),
            message: (0, i18n_1.t)('struct.invalidTopicRoot', [...ditaSpecialization_1.TOPIC_TYPE_NAMES].slice(0, 4).join(', ')),
            source: SOURCE,
            code: CODES.INVALID_ROOT,
        });
        return;
    }
    // Check id attribute on root element
    const topicPattern = [...ditaSpecialization_1.TOPIC_TYPE_NAMES].join('|');
    const idMatch = text.match(new RegExp(`<(?:${topicPattern})\\s+[^>]*id=(?:"([^"]*)"|'([^']*)')`));
    if (!idMatch) {
        const rootMatch = text.match(new RegExp(`<(?:${topicPattern})[\\s>]`));
        if (rootMatch) {
            diagnostics.push({
                severity: node_1.DiagnosticSeverity.Error,
                range: (0, textUtils_1.offsetToRange)(text, rootMatch.index, rootMatch.index + rootMatch[0].length),
                message: (0, i18n_1.t)('struct.missingId'),
                source: SOURCE,
                code: CODES.MISSING_ID,
            });
        }
        else {
            diagnostics.push({
                severity: node_1.DiagnosticSeverity.Error,
                range: createRange(0, 0),
                message: (0, i18n_1.t)('struct.missingId'),
                source: SOURCE,
                code: CODES.MISSING_ID,
            });
        }
    }
    else if ((idMatch[1] ?? idMatch[2]) === '') {
        diagnostics.push({
            severity: node_1.DiagnosticSeverity.Error,
            range: (0, textUtils_1.offsetToRange)(text, idMatch.index, idMatch.index + idMatch[0].length),
            message: (0, i18n_1.t)('struct.emptyId'),
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
                severity: node_1.DiagnosticSeverity.Error,
                range: createRange(0, 0),
                message: (0, i18n_1.t)('struct.missingGlossterm'),
                source: SOURCE,
                code: CODES.MISSING_TITLE,
            });
        }
    }
    else {
        // Check for title element
        if (!text.includes('<title>') && !text.includes('<title ')) {
            diagnostics.push({
                severity: node_1.DiagnosticSeverity.Error,
                range: createRange(0, 0),
                message: (0, i18n_1.t)('struct.missingTopicTitle'),
                source: SOURCE,
                code: CODES.MISSING_TITLE,
            });
        }
    }
}
function validateMapStructure(text, diagnostics) {
    // Accept all DITA map specializations as valid root elements
    const hasMapRoot = [...ditaSpecialization_1.MAP_TYPE_NAMES].some((name) => new RegExp(`<${name}[\\s>]`).test(text));
    if (!hasMapRoot) {
        diagnostics.push({
            severity: node_1.DiagnosticSeverity.Error,
            range: createRange(0, 0),
            message: (0, i18n_1.t)('struct.invalidMapRoot'),
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
            severity: node_1.DiagnosticSeverity.Warning,
            range: createRange(0, 0),
            message: (0, i18n_1.t)('struct.missingMapTitle'),
            source: SOURCE,
            code: CODES.MISSING_TITLE,
        });
    }
    // Check for topicref without href/keyref/keys
    checkTopicrefsWithoutHref(text, diagnostics);
}
function validateBookmapStructure(text, diagnostics) {
    if (!/<bookmap[\s>]/.test(text)) {
        diagnostics.push({
            severity: node_1.DiagnosticSeverity.Error,
            range: createRange(0, 0),
            message: (0, i18n_1.t)('struct.invalidBookmapRoot'),
            source: SOURCE,
            code: CODES.INVALID_ROOT,
        });
        return;
    }
    // Check for <booktitle> element
    if (!/<booktitle[\s>]/.test(text)) {
        diagnostics.push({
            severity: node_1.DiagnosticSeverity.Warning,
            range: createRange(0, 0),
            message: (0, i18n_1.t)('struct.missingBooktitle'),
            source: SOURCE,
            code: CODES.MISSING_BOOKTITLE,
        });
    }
    else if (!/<mainbooktitle[\s>]/.test(text)) {
        // Only check <mainbooktitle> if <booktitle> exists
        diagnostics.push({
            severity: node_1.DiagnosticSeverity.Warning,
            range: createRange(0, 0),
            message: (0, i18n_1.t)('struct.missingMainbooktitle'),
            source: SOURCE,
            code: CODES.MISSING_MAINBOOKTITLE,
        });
    }
    // Check for topicref without href/keyref/keys
    checkTopicrefsWithoutHref(text, diagnostics);
}
function validateDitavalStructure(text, diagnostics) {
    if (!/<val[\s>]/.test(text)) {
        diagnostics.push({
            severity: node_1.DiagnosticSeverity.Error,
            range: createRange(0, 0),
            message: (0, i18n_1.t)('struct.invalidDitavalRoot'),
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
            const pos = (0, textUtils_1.offsetToPosition)(text, propMatch.index);
            diagnostics.push({
                severity: node_1.DiagnosticSeverity.Warning,
                range: createRange(pos.line, pos.character, propMatch[0].length),
                message: (0, i18n_1.t)('ditaval.propMissingAtt'),
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
            const pos = (0, textUtils_1.offsetToPosition)(text, valueStart);
            diagnostics.push({
                severity: node_1.DiagnosticSeverity.Error,
                range: createRange(pos.line, pos.character, actionValue.length),
                message: (0, i18n_1.t)('ditaval.invalidAction', actionValue),
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
            const pos = (0, textUtils_1.offsetToPosition)(text, revpropMatch.index);
            diagnostics.push({
                severity: node_1.DiagnosticSeverity.Warning,
                range: createRange(pos.line, pos.character, revpropMatch[0].length),
                message: (0, i18n_1.t)('ditaval.revpropMissingVal'),
                source: SOURCE,
                code: 'DITA-DITAVAL-003',
            });
        }
    }
    // DITAVAL-004: Duplicate <prop> with same att+val combination
    // Parse each <prop> to extract att and val independently (handles any attribute order,
    // and also <prop att="x"> without val which means "all values")
    const propDupRegex = /<prop\s([^>]*?)\/?>/g;
    const seenPropPairs = new Map();
    let dupMatch;
    while ((dupMatch = propDupRegex.exec(text)) !== null) {
        const attrs = dupMatch[1];
        const attMatch = attrs.match(/\batt\s*=\s*["']([^"']*?)["']/);
        if (!attMatch)
            continue; // No att attribute — skip
        const att = attMatch[1];
        const valMatch = attrs.match(/\bval\s*=\s*["']([^"']*?)["']/);
        const val = valMatch ? valMatch[1] : '*'; // No val = all values
        const pairKey = `${att}|${val}`;
        if (seenPropPairs.has(pairKey)) {
            const pos = (0, textUtils_1.offsetToPosition)(text, dupMatch.index);
            diagnostics.push({
                severity: node_1.DiagnosticSeverity.Warning,
                range: createRange(pos.line, pos.character, dupMatch[0].length),
                message: (0, i18n_1.t)('ditaval.duplicateProp', att, val === '*' ? '(all)' : val),
                source: SOURCE,
                code: 'DITA-DITAVAL-004',
            });
        }
        else {
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
            const pos = (0, textUtils_1.offsetToPosition)(text, flagMatch.index);
            diagnostics.push({
                severity: node_1.DiagnosticSeverity.Warning,
                range: createRange(pos.line, pos.character, flagMatch[0].length),
                message: (0, i18n_1.t)('ditaval.flagMissingContent', flagMatch[1]),
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
function checkTopicrefsWithoutHref(text, diagnostics) {
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
        const pos = (0, textUtils_1.offsetToPosition)(text, match.index);
        diagnostics.push({
            severity: node_1.DiagnosticSeverity.Information,
            range: createRange(pos.line, pos.character, match[0].length),
            message: (0, i18n_1.t)('struct.topicrefMissingHref'),
            source: SOURCE,
            code: CODES.TOPICREF_NO_HREF,
        });
    }
}
function checkEmptyElements(text, diagnostics) {
    const emptyPatterns = [
        { pattern: /<title><\/title>/g, name: 'title' },
        { pattern: /<p><\/p>/g, name: 'p' },
        { pattern: /<shortdesc><\/shortdesc>/g, name: 'shortdesc' },
    ];
    for (const { pattern, name } of emptyPatterns) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
            const pos = (0, textUtils_1.offsetToPosition)(text, match.index);
            diagnostics.push({
                severity: node_1.DiagnosticSeverity.Warning,
                range: {
                    start: { line: pos.line, character: pos.character },
                    end: {
                        line: pos.line,
                        character: pos.character + match[0].length,
                    },
                },
                message: (0, i18n_1.t)('struct.emptyElement', name),
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
    ...[...ditaSpecialization_1.TOPIC_TYPE_NAMES].map(n => n.toLowerCase()),
    ...[...ditaSpecialization_1.MAP_TYPE_NAMES].map(n => n.toLowerCase()),
]);
/**
 * Find the enclosing element name for an attribute match position.
 * Scans backward from the match to find the opening `<tagName`.
 */
function getEnclosingElement(text, matchIndex) {
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
function validateIDs(text, textDocument, diagnostics) {
    // Use cleaned text to avoid matching IDs inside comments/CDATA
    const cleanText = (0, textUtils_1.stripCommentsAndCodeContent)(text);
    const idPattern = /\bid=(["'])([^"']*)\1/g;
    const idLocations = new Map();
    let match;
    while ((match = idPattern.exec(cleanText)) !== null) {
        const idValue = match[2];
        // Use original text for line/col since we preserved line structure
        const pos = (0, textUtils_1.offsetToPosition)(text, match.index);
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
                        severity: node_1.DiagnosticSeverity.Warning,
                        range: node_1.Range.create(pos.line, pos.character, pos.line, pos.character + idAttrLen),
                        message: (0, i18n_1.t)('id.invalidXmlId', idValue),
                        source: SOURCE,
                        code: CODES.INVALID_ID_FORMAT,
                    });
                }
            }
            else {
                // NMTOKEN type: can start with digit but must contain only valid characters
                if (!/^[\w.-]+$/.test(idValue)) {
                    const pos = locations[0];
                    diagnostics.push({
                        severity: node_1.DiagnosticSeverity.Warning,
                        range: node_1.Range.create(pos.line, pos.character, pos.line, pos.character + idAttrLen),
                        message: (0, i18n_1.t)('id.invalidNmtoken', idValue),
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
                const relatedInfo = locations
                    .filter((_, j) => j !== i)
                    .map((other) => ({
                    location: node_1.Location.create(textDocument.uri, node_1.Range.create(other.line, other.character, other.line, other.character + idAttrLen)),
                    message: (0, i18n_1.t)('id.duplicateRelated', idValue),
                }));
                diagnostics.push({
                    severity: node_1.DiagnosticSeverity.Error,
                    range: node_1.Range.create(pos.line, pos.character, pos.line, pos.character + idAttrLen),
                    message: (0, i18n_1.t)('id.duplicate', idValue),
                    source: SOURCE,
                    code: CODES.DUPLICATE_ID,
                    relatedInformation: relatedInfo,
                });
            }
        }
    }
}
// --- Helpers ---
function getFileExtension(uri) {
    const fsPath = (0, textUtils_1.uriToPath)(uri);
    const dot = fsPath.lastIndexOf('.');
    return dot >= 0 ? fsPath.slice(dot).toLowerCase() : '';
}
// findLineAndColumn — replaced by shared offsetToPosition() from utils/textUtils.ts
/**
 * Create a range spanning from (line, col) to the end of the line.
 * An optional `length` parameter can be used for precise highlighting.
 */
function createRange(line, col, length) {
    if (length !== undefined && length > 0) {
        return node_1.Range.create(line, col, line, col + length);
    }
    // Default: highlight to a reasonable end-of-token position.
    // Use a generous width so the squiggly underline is clearly visible.
    return node_1.Range.create(line, col, line, col + 1000);
}
//# sourceMappingURL=validation.js.map