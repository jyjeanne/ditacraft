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
        // Strip DOCTYPE declaration — fast-xml-parser chokes on it
        const stripped = text.replace(/<!DOCTYPE[^>]*>/gi, '');

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

    // Missing DOCTYPE
    if (!text.includes('<!DOCTYPE')) {
        diagnostics.push({
            severity: DiagnosticSeverity.Warning,
            range: createRange(0, 0),
            message: 'Missing DOCTYPE declaration',
            source: SOURCE,
            code: CODES.MISSING_DOCTYPE,
        });
    }

    if (ext === '.dita') {
        validateTopicStructure(text, diagnostics);
    } else if (ext === '.ditamap') {
        validateMapStructure(text, diagnostics);
    } else if (ext === '.bookmap') {
        validateBookmapStructure(text, diagnostics);
    }

    // Empty elements check
    checkEmptyElements(text, diagnostics);
}

function validateTopicStructure(
    text: string,
    diagnostics: Diagnostic[]
): void {
    const topicTypes = ['<topic', '<concept', '<task', '<reference'];
    const hasTopicRoot = topicTypes.some((t) => text.includes(t));

    if (!hasTopicRoot) {
        diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range: createRange(0, 0),
            message:
                'DITA topic must have a valid root element (topic, concept, task, or reference)',
            source: SOURCE,
            code: CODES.INVALID_ROOT,
        });
        return;
    }

    // Check id attribute on root element
    const idMatch = text.match(
        /<(?:topic|concept|task|reference)\s+[^>]*id="([^"]*)"/
    );
    if (!idMatch) {
        const rootMatch = text.match(/<(?:topic|concept|task|reference)[\s>]/);
        const pos = rootMatch
            ? findLineAndColumn(text, rootMatch.index!)
            : { line: 0, col: 0 };
        diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range: createRange(pos.line, pos.col),
            message:
                'Root element must have an id attribute (required by DITA DTD)',
            source: SOURCE,
            code: CODES.MISSING_ID,
        });
    } else if (idMatch[1] === '') {
        const pos = findLineAndColumn(text, idMatch.index!);
        diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range: createRange(pos.line, pos.col),
            message: 'Root element id attribute cannot be empty',
            source: SOURCE,
            code: CODES.MISSING_ID,
        });
    }

    // Check for title element
    if (!text.includes('<title>') && !text.includes('<title ')) {
        diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range: createRange(0, 0),
            message:
                'DITA topic must contain a <title> element (required by DTD)',
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
            message: 'DITA map must have a <map> root element',
            source: SOURCE,
            code: CODES.INVALID_ROOT,
        });
    }

    if (!text.includes('<title>') && !text.includes('<title ')) {
        diagnostics.push({
            severity: DiagnosticSeverity.Warning,
            range: createRange(0, 0),
            message: 'DITA map should contain a <title> element',
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
            message: 'Bookmap must have a <bookmap> root element',
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
                message: `Empty <${name}> element should be removed or filled with content`,
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
        { line: number; col: number; index: number }[]
    >();

    let match;
    while ((match = idPattern.exec(cleanText)) !== null) {
        const idValue = match[1];
        // Use original text for line/col since we preserved line structure
        const pos = findLineAndColumn(text, match.index);
        const locations = idLocations.get(idValue) || [];
        locations.push({ ...pos, index: match.index });
        idLocations.set(idValue, locations);
    }

    for (const [idValue, locations] of idLocations) {
        // Invalid ID format
        if (idValue && !/^[a-zA-Z_][\w.-]*$/.test(idValue)) {
            const pos = locations[0];
            diagnostics.push({
                severity: DiagnosticSeverity.Warning,
                range: createRange(pos.line, pos.col),
                message: `ID "${idValue}" should start with a letter or underscore and contain only letters, digits, hyphens, underscores, and periods`,
                source: SOURCE,
                code: CODES.INVALID_ID_FORMAT,
            });
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
                                other.col + idValue.length + 4
                            )
                        ),
                        message: `"${idValue}" also defined here`,
                    }));

                diagnostics.push({
                    severity: DiagnosticSeverity.Error,
                    range: createRange(pos.line, pos.col),
                    message: `Duplicate id "${idValue}"`,
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
