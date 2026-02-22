import {
    CodeAction,
    CodeActionKind,
    CodeActionParams,
    Diagnostic,
    TextDocuments,
    Range,
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';

// Diagnostic codes from validation.ts
const CODES = {
    MISSING_DOCTYPE: 'DITA-STRUCT-001',
    MISSING_ID: 'DITA-STRUCT-003',
    MISSING_TITLE: 'DITA-STRUCT-004',
    EMPTY_ELEMENT: 'DITA-STRUCT-005',
    DUPLICATE_ID: 'DITA-ID-001',
};

// Diagnostic codes from ditaRulesValidator.ts (Phase 6)
const RULE_CODES = {
    ROLE_OTHER_MISSING_OTHERROLE: 'DITA-SCH-001',
    DEPRECATED_INDEXTERMREF: 'DITA-SCH-003',
    DEPRECATED_ALT_ATTR: 'DITA-SCH-011',
    IMAGE_MISSING_ALT: 'DITA-SCH-030',
};

/** Sources that we handle code actions for. */
const HANDLED_SOURCES = new Set(['dita-lsp', 'dita-rules']);

/**
 * Handle Code Action requests.
 * Provides quick fixes for diagnostics produced by the validation engine.
 */
export function handleCodeActions(
    params: CodeActionParams,
    documents: TextDocuments<TextDocument>
): CodeAction[] {
    const document = documents.get(params.textDocument.uri);
    if (!document) return [];

    const actions: CodeAction[] = [];
    const text = document.getText();

    for (const diagnostic of params.context.diagnostics) {
        // Only process diagnostics from our server
        if (!diagnostic.source || !HANDLED_SOURCES.has(diagnostic.source)) continue;

        const fixes = getFixesForDiagnostic(diagnostic, text, document);
        for (const fix of fixes) {
            fix.diagnostics = [diagnostic];
            actions.push(fix);
        }
    }

    return actions;
}

function getFixesForDiagnostic(
    diagnostic: Diagnostic,
    text: string,
    document: TextDocument
): CodeAction[] {
    const code = diagnostic.code as string | undefined;
    if (!code) return [];

    switch (code) {
        case CODES.MISSING_DOCTYPE:
            return fixMissingDoctype(text, document);
        case CODES.MISSING_ID:
            return fixMissingId(text, document);
        case CODES.MISSING_TITLE:
            return fixMissingTitle(text, document);
        case CODES.EMPTY_ELEMENT:
            return fixEmptyElement(diagnostic, text, document);
        case CODES.DUPLICATE_ID:
            return fixDuplicateId(diagnostic, text, document);
        case RULE_CODES.ROLE_OTHER_MISSING_OTHERROLE:
            return fixMissingOtherrole(diagnostic, text, document);
        case RULE_CODES.DEPRECATED_INDEXTERMREF:
            return fixDeprecatedIndextermref(diagnostic, text, document);
        case RULE_CODES.DEPRECATED_ALT_ATTR:
            return fixDeprecatedAltAttr(diagnostic, text, document);
        case RULE_CODES.IMAGE_MISSING_ALT:
            return fixMissingAlt(diagnostic, text, document);
        default:
            return [];
    }
}

/**
 * Fix: Add DOCTYPE declaration before the root element.
 */
function fixMissingDoctype(text: string, document: TextDocument): CodeAction[] {
    // Detect root element type
    const rootMatch = text.match(/<(topic|concept|task|reference|map|bookmap)[\s>]/);
    if (!rootMatch) return [];

    const rootType = rootMatch[1];
    const doctypeMap: Record<string, string> = {
        topic: '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">',
        concept: '<!DOCTYPE concept PUBLIC "-//OASIS//DTD DITA Concept//EN" "concept.dtd">',
        task: '<!DOCTYPE task PUBLIC "-//OASIS//DTD DITA Task//EN" "task.dtd">',
        reference: '<!DOCTYPE reference PUBLIC "-//OASIS//DTD DITA Reference//EN" "reference.dtd">',
        map: '<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA Map//EN" "map.dtd">',
        bookmap: '<!DOCTYPE bookmap PUBLIC "-//OASIS//DTD DITA BookMap//EN" "bookmap.dtd">',
    };

    const doctype = doctypeMap[rootType];
    if (!doctype) return [];

    // Find insertion point: after <?xml ...?> if present, otherwise at start
    let insertOffset = 0;
    const xmlDeclMatch = text.match(/^<\?xml[^?]*\?>\s*/);
    if (xmlDeclMatch) {
        insertOffset = xmlDeclMatch[0].length;
    }
    const insertPos = document.positionAt(insertOffset);

    return [{
        title: `Add DOCTYPE for ${rootType}`,
        kind: CodeActionKind.QuickFix,
        edit: {
            changes: {
                [document.uri]: [{
                    range: Range.create(insertPos, insertPos),
                    newText: doctype + '\n',
                }],
            },
        },
    }];
}

/**
 * Fix: Add id attribute to root element.
 */
function fixMissingId(text: string, document: TextDocument): CodeAction[] {
    const rootMatch = text.match(/<(topic|concept|task|reference)\s/);
    if (!rootMatch || rootMatch.index === undefined) return [];

    // Generate an id from the filename
    const uriParts = document.uri.split('/');
    const filename = uriParts[uriParts.length - 1]
        .replace(/\.[^.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_');
    const id = filename || 'topic_id';

    // Insert id attribute right after the tag name
    const insertOffset = rootMatch.index + rootMatch[0].length;
    const insertPos = document.positionAt(insertOffset);

    return [{
        title: `Add id="${id}" to root element`,
        kind: CodeActionKind.QuickFix,
        edit: {
            changes: {
                [document.uri]: [{
                    range: Range.create(insertPos, insertPos),
                    newText: `id="${id}" `,
                }],
            },
        },
    }];
}

/**
 * Fix: Add <title> element after root element opening tag.
 */
function fixMissingTitle(text: string, document: TextDocument): CodeAction[] {
    const rootMatch = text.match(/<(topic|concept|task|reference|map|bookmap)[^>]*>/);
    if (!rootMatch || rootMatch.index === undefined) return [];

    // Insert after the root element's opening tag
    const insertOffset = rootMatch.index + rootMatch[0].length;
    const insertPos = document.positionAt(insertOffset);

    return [{
        title: 'Add <title> element',
        kind: CodeActionKind.QuickFix,
        edit: {
            changes: {
                [document.uri]: [{
                    range: Range.create(insertPos, insertPos),
                    newText: '\n  <title></title>',
                }],
            },
        },
    }];
}

/**
 * Fix: Remove an empty element.
 */
function fixEmptyElement(
    diagnostic: Diagnostic,
    text: string,
    document: TextDocument
): CodeAction[] {
    const range = diagnostic.range;

    // Find the full empty element text from the diagnostic range
    const startOffset = document.offsetAt(range.start);
    const endOffset = document.offsetAt(range.end);
    const elementText = text.slice(startOffset, endOffset);

    // Verify it looks like an empty element
    const emptyMatch = elementText.match(/^<(\w+)><\/\1>$/);
    if (!emptyMatch) return [];

    // Also remove any surrounding whitespace/newline for clean deletion
    let deleteStart = startOffset;
    let deleteEnd = endOffset;

    // Extend backward to eat leading whitespace on the line
    while (deleteStart > 0 && (text[deleteStart - 1] === ' ' || text[deleteStart - 1] === '\t')) {
        deleteStart--;
    }
    // Extend forward to eat trailing newline
    if (deleteEnd < text.length && text[deleteEnd] === '\r') deleteEnd++;
    if (deleteEnd < text.length && text[deleteEnd] === '\n') deleteEnd++;

    return [{
        title: `Remove empty <${emptyMatch[1]}>`,
        kind: CodeActionKind.QuickFix,
        edit: {
            changes: {
                [document.uri]: [{
                    range: Range.create(
                        document.positionAt(deleteStart),
                        document.positionAt(deleteEnd)
                    ),
                    newText: '',
                }],
            },
        },
    }];
}

/**
 * Fix: Make a duplicate ID unique by appending a suffix.
 */
function fixDuplicateId(
    diagnostic: Diagnostic,
    text: string,
    document: TextDocument
): CodeAction[] {
    const range = diagnostic.range;
    const startOffset = document.offsetAt(range.start);

    // Extract the id value from the text at the diagnostic location
    const textAtPos = text.slice(startOffset);
    const idMatch = textAtPos.match(/\bid=(["'])([^"']*)\1/);
    if (!idMatch) return [];

    const quoteChar = idMatch[1];
    const oldId = idMatch[2];
    const suffix = Math.random().toString(36).slice(2, 6);
    const newId = `${oldId}_${suffix}`;

    // Replace the id value
    const idValueStart = startOffset + idMatch.index! + idMatch[0].indexOf(quoteChar) + 1;
    const idValueEnd = idValueStart + oldId.length;

    return [{
        title: `Rename to "${newId}" to make unique`,
        kind: CodeActionKind.QuickFix,
        edit: {
            changes: {
                [document.uri]: [{
                    range: Range.create(
                        document.positionAt(idValueStart),
                        document.positionAt(idValueEnd)
                    ),
                    newText: newId,
                }],
            },
        },
    }];
}

// =============================================
//  Quick fixes for DITA rules (Phase 10)
// =============================================

/**
 * Fix DITA-SCH-001: Insert otherrole="" when role="other" is present.
 */
function fixMissingOtherrole(
    diagnostic: Diagnostic,
    text: string,
    document: TextDocument
): CodeAction[] {
    const startOffset = document.offsetAt(diagnostic.range.start);
    const textAtPos = text.slice(startOffset);

    // Find role="other" and insert otherrole="" after it
    const roleMatch = textAtPos.match(/\brole\s*=\s*["']other["']/);
    if (!roleMatch) return [];

    const insertOffset = startOffset + roleMatch.index! + roleMatch[0].length;
    const insertPos = document.positionAt(insertOffset);

    return [{
        title: 'Add otherrole attribute',
        kind: CodeActionKind.QuickFix,
        edit: {
            changes: {
                [document.uri]: [{
                    range: Range.create(insertPos, insertPos),
                    newText: ' otherrole=""',
                }],
            },
        },
    }];
}

/**
 * Fix DITA-SCH-003: Delete the deprecated <indextermref> element.
 */
function fixDeprecatedIndextermref(
    diagnostic: Diagnostic,
    text: string,
    document: TextDocument
): CodeAction[] {
    const startOffset = document.offsetAt(diagnostic.range.start);
    const textAtPos = text.slice(startOffset);

    // Find the full element (self-closing or with content)
    const elemMatch = textAtPos.match(/<indextermref\b[^>]*\/>/);
    if (!elemMatch) return [];

    let deleteStart = startOffset;
    let deleteEnd = startOffset + elemMatch[0].length;

    // Clean up surrounding whitespace
    while (deleteStart > 0 && (text[deleteStart - 1] === ' ' || text[deleteStart - 1] === '\t')) {
        deleteStart--;
    }
    if (deleteEnd < text.length && text[deleteEnd] === '\r') deleteEnd++;
    if (deleteEnd < text.length && text[deleteEnd] === '\n') deleteEnd++;

    return [{
        title: 'Remove deprecated <indextermref>',
        kind: CodeActionKind.QuickFix,
        edit: {
            changes: {
                [document.uri]: [{
                    range: Range.create(
                        document.positionAt(deleteStart),
                        document.positionAt(deleteEnd)
                    ),
                    newText: '',
                }],
            },
        },
    }];
}

/**
 * Fix DITA-SCH-011: Convert alt="text" attribute to <alt>text</alt> child element.
 */
function fixDeprecatedAltAttr(
    diagnostic: Diagnostic,
    text: string,
    document: TextDocument
): CodeAction[] {
    const startOffset = document.offsetAt(diagnostic.range.start);
    const textAtPos = text.slice(startOffset);

    // Find the <image> tag and extract alt attribute value
    const imageMatch = textAtPos.match(/<image\b([^>]*)/);
    if (!imageMatch) return [];

    const attrs = imageMatch[1];
    const altMatch = attrs.match(/\balt\s*=\s*["']([^"']*)["']/);
    if (!altMatch) return [];

    const altValue = altMatch[1];

    // Remove the alt attribute from the tag
    const altAttrStart = startOffset + imageMatch[0].indexOf(altMatch[0]);
    const altAttrEnd = altAttrStart + altMatch[0].length;

    // Also remove leading space before the attribute
    let cleanStart = altAttrStart;
    while (cleanStart > 0 && text[cleanStart - 1] === ' ') {
        cleanStart--;
    }

    // Find where to insert the <alt> element — after the image opening tag
    const tagEnd = text.indexOf('>', startOffset);
    if (tagEnd === -1) return [];

    const isSelfClosing = text[tagEnd - 1] === '/';
    const edits = [];

    // Remove alt attribute (with leading space)
    edits.push({
        range: Range.create(
            document.positionAt(cleanStart),
            document.positionAt(altAttrEnd)
        ),
        newText: '',
    });

    if (isSelfClosing) {
        // Convert self-closing to open/close with <alt> child
        // Replace /> with ><alt>text</alt></image>
        edits.push({
            range: Range.create(
                document.positionAt(tagEnd - 1),
                document.positionAt(tagEnd + 1)
            ),
            newText: `><alt>${altValue}</alt></image>`,
        });
    } else {
        // Insert <alt> element after the opening tag >
        const insertPos = document.positionAt(tagEnd + 1);
        edits.push({
            range: Range.create(insertPos, insertPos),
            newText: `<alt>${altValue}</alt>`,
        });
    }

    return [{
        title: 'Convert alt attribute to <alt> element',
        kind: CodeActionKind.QuickFix,
        edit: {
            changes: {
                [document.uri]: edits,
            },
        },
    }];
}

/**
 * Fix DITA-SCH-030: Insert empty <alt></alt> child element in <image>.
 */
function fixMissingAlt(
    diagnostic: Diagnostic,
    text: string,
    document: TextDocument
): CodeAction[] {
    const startOffset = document.offsetAt(diagnostic.range.start);
    const textAtPos = text.slice(startOffset);

    // Find the <image> tag
    const imageMatch = textAtPos.match(/<image\b[^>]*?(\/?)>/);
    if (!imageMatch) return [];

    const isSelfClosing = imageMatch[1] === '/';
    const tagEnd = startOffset + imageMatch[0].length;

    if (isSelfClosing) {
        // Convert self-closing to open/close with <alt> child
        // Replace /> with ><alt></alt></image>
        const slashPos = tagEnd - 2; // position of '/'
        return [{
            title: 'Add <alt> element',
            kind: CodeActionKind.QuickFix,
            edit: {
                changes: {
                    [document.uri]: [{
                        range: Range.create(
                            document.positionAt(slashPos),
                            document.positionAt(tagEnd)
                        ),
                        newText: '><alt></alt></image>',
                    }],
                },
            },
        }];
    }

    // Non-self-closing — insert <alt> after the opening tag
    const insertPos = document.positionAt(tagEnd);
    return [{
        title: 'Add <alt> element',
        kind: CodeActionKind.QuickFix,
        edit: {
            changes: {
                [document.uri]: [{
                    range: Range.create(insertPos, insertPos),
                    newText: '<alt></alt>',
                }],
            },
        },
    }];
}
