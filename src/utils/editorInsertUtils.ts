/**
 * Editor Insert Utilities
 * Shared cursor-insertion helper for commands that build a multi-line
 * XML/DITA snippet and insert it at the cursor, re-indented to match the
 * current line — used by `insertImageCommand.ts` and `insertTableCommand.ts`.
 */

import * as vscode from 'vscode';

/** Indent every line after the first by `indent`, so a multi-line block still nests correctly when embedded after other text on its own line. */
export function indentContinuationLines(text: string, indent: string): string {
    return text.split('\n').map((line, i) => (i === 0 ? line : indent + line)).join('\n');
}

/**
 * Insert `snippet` at the cursor, re-indenting continuation lines to match
 * the current line's leading whitespace so a multi-line skeleton doesn't
 * land flush-left against the document's existing indentation.
 */
export async function insertAtCursor(editor: vscode.TextEditor, snippet: string): Promise<boolean> {
    const position = editor.selection.active;
    const indent = editor.document.lineAt(position.line).text.match(/^[ \t]*/)?.[0] ?? '';
    const indented = indentContinuationLines(snippet, indent);
    return editor.edit(editBuilder => editBuilder.insert(position, indented));
}
