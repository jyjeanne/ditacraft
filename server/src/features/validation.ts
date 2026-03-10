import {
    Diagnostic,
    DiagnosticSeverity,
    DiagnosticRelatedInformation,
    Location,
    Range,
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';
import { XMLValidator } from 'fast-xml-parser';
import { URI } from 'vscode-uri';

import { DitaCraftSettings } from '../settings';
import { TOPIC_TYPE_NAMES, MAP_TYPE_NAMES } from '../data/ditaSpecialization';
import { t } from '../utils/i18n';

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
};

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

    // 1. XML well-formedness
    validateXML(text, diagnostics);

    // 2. DITA structure
    validateDITAStructure(text, uri, diagnostics);

    // 3. ID validation
    validateIDs(text, textDocument, diagnostics);

    // Cap diagnostics
    if (diagnostics.length > maxProblems) {
        return diagnostics.slice(0, maxProblems);
    }

    return diagnostics;
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
    const cleanText = stripCommentsAndCDATA(text);

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
        const pos = rootMatch
            ? findLineAndColumn(text, rootMatch.index!)
            : { line: 0, col: 0 };
        diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range: createRange(pos.line, pos.col),
            message: t('struct.missingId'),
            source: SOURCE,
            code: CODES.MISSING_ID,
        });
    } else if ((idMatch[1] ?? idMatch[2]) === '') {
        const pos = findLineAndColumn(text, idMatch.index!);
        diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range: createRange(pos.line, pos.col),
            message: t('struct.emptyId'),
            source: SOURCE,
            code: CODES.MISSING_ID,
        });
    }

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

function validateMapStructure(text: string, diagnostics: Diagnostic[]): void {
    if (!/<map[\s>]/.test(text)) {
        diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range: createRange(0, 0),
            message: t('struct.invalidMapRoot'),
            source: SOURCE,
            code: CODES.INVALID_ROOT,
        });
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
    }
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
            const pos = findLineAndColumn(text, match.index);
            diagnostics.push({
                severity: DiagnosticSeverity.Warning,
                range: {
                    start: { line: pos.line, character: pos.col },
                    end: {
                        line: pos.line,
                        character: pos.col + match[0].length,
                    },
                },
                message: t('struct.emptyElement', name),
                source: SOURCE,
                code: CODES.EMPTY_ELEMENT,
            });
        }
    }
}

/**
 * Strip XML comments and CDATA sections, preserving line structure
 * so that line/column offsets from the original text remain valid.
 */
function stripCommentsAndCDATA(text: string): string {
    return text
        .replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n\r]/g, ' '))
        .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, (m) => m.replace(/[^\n\r]/g, ' '));
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
    const cleanText = stripCommentsAndCDATA(text);
    const idPattern = /\bid="([^"]*)"/g;
    const idLocations = new Map<
        string,
        { line: number; col: number; index: number; element: string }[]
    >();

    let match;
    while ((match = idPattern.exec(cleanText)) !== null) {
        const idValue = match[1];
        // Use original text for line/col since we preserved line structure
        const pos = findLineAndColumn(text, match.index);
        const element = getEnclosingElement(cleanText, match.index);
        const locations = idLocations.get(idValue) || [];
        locations.push({ ...pos, index: match.index, element });
        idLocations.set(idValue, locations);
    }

    for (const [idValue, locations] of idLocations) {
        // id="value" is 4 + value.length chars (id=" + value + ")
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
                        range: Range.create(pos.line, pos.col, pos.line, pos.col + idAttrLen),
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
                        range: Range.create(pos.line, pos.col, pos.line, pos.col + idAttrLen),
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
                                other.col,
                                other.line,
                                other.col + idAttrLen
                            )
                        ),
                        message: t('id.duplicateRelated', idValue),
                    }));

                diagnostics.push({
                    severity: DiagnosticSeverity.Error,
                    range: Range.create(pos.line, pos.col, pos.line, pos.col + idAttrLen),
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
    const fsPath = URI.parse(uri).fsPath;
    const dot = fsPath.lastIndexOf('.');
    return dot >= 0 ? fsPath.slice(dot).toLowerCase() : '';
}

function findLineAndColumn(
    text: string,
    index: number
): { line: number; col: number } {
    let line = 0;
    let lastNewline = -1;
    for (let i = 0; i < index; i++) {
        if (text[i] === '\n') {
            line++;
            lastNewline = i;
        } else if (text[i] === '\r') {
            line++;
            lastNewline = i;
            // Skip \n in \r\n pair
            if (i + 1 < index && text[i + 1] === '\n') {
                i++;
                lastNewline = i;
            }
        }
    }
    return { line, col: index - lastNewline - 1 };
}

function createRange(line: number, col: number): Range {
    return Range.create(line, col, line, col + 1);
}
