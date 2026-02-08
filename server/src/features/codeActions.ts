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
        if (diagnostic.source !== 'dita-lsp') continue;

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
    const idMatch = textAtPos.match(/\bid="([^"]*)"/);
    if (!idMatch) return [];

    const oldId = idMatch[1];
    const suffix = Math.random().toString(36).slice(2, 6);
    const newId = `${oldId}_${suffix}`;

    // Replace the id value
    const idValueStart = startOffset + idMatch.index! + idMatch[0].indexOf('"') + 1;
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
