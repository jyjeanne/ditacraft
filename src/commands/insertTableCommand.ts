/**
 * Insert Table Command
 * Prompts for a table type, column/row counts, and an optional header row,
 * then inserts a correctly-structured `<simpletable>` or CALS `<table>`/
 * `<tgroup>` skeleton at the cursor — eliminating the single most common
 * table authoring mistake (mismatched `<entry>` counts vs `<colspec>`).
 *
 * Scoped as an insertion wizard, not a full visual grid editor — a WebView
 * with bidirectional XML sync is a much larger effort, deferred to the
 * backlog unless there's demand for it once this ships.
 *
 * Content models verified against `server/src/data/ditaSchema.ts` before
 * writing the generators below:
 * - `table: ['title', 'desc', 'tgroup']`, `tgroup: ['colspec', 'thead', 'tbody']`
 *   — a CALS table *can* have a `<title>`.
 * - `simpletable: ['sthead', 'strow']` — a simple table has **no** `<title>`
 *   child at all; the title prompt is only offered for the CALS variant.
 */

import * as vscode from 'vscode';
import { DITA_EXTENSIONS } from '../utils/constants';
import { logger } from '../utils/logger';
import { escapeXml } from '../utils/xmlUtils';
import { insertAtCursor } from '../utils/editorInsertUtils';

const MIN_COLUMNS = 1;
const MAX_COLUMNS = 20;
const MIN_ROWS = 1;
const MAX_ROWS = 50;

type TableType = 'table' | 'simpletable';

/**
 * Command: ditacraft.insertTable
 */
export async function insertTableCommand(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor || !isEligibleDocument(editor.document.uri)) {
        vscode.window.showWarningMessage('DitaCraft: Open a DITA topic to insert a table.');
        return;
    }

    const tableTypePick = await vscode.window.showQuickPick(
        [
            { label: 'Simple Table', description: '<simpletable> — lightweight, no column specifications', value: 'simpletable' as TableType },
            { label: 'CALS Table', description: '<table>/<tgroup> — formal table with column specs and an optional title', value: 'table' as TableType }
        ],
        { title: 'DITA: Insert Table (1/4)', placeHolder: 'Select the table type' }
    );
    if (!tableTypePick) {
        logger.debug('User cancelled table type selection');
        return;
    }

    const columns = await promptForCount('Number of Columns (2/4)', 'columns', MIN_COLUMNS, MAX_COLUMNS);
    if (columns === undefined) {
        logger.debug('User cancelled column count input');
        return;
    }

    const rows = await promptForCount('Number of Data Rows (3/4)', 'data rows', MIN_ROWS, MAX_ROWS);
    if (rows === undefined) {
        logger.debug('User cancelled row count input');
        return;
    }

    const headerChoice = await vscode.window.showQuickPick(
        [
            { label: '$(check) Yes', value: true },
            { label: '$(circle-slash) No', value: false }
        ],
        { title: 'Include a Header Row? (4/4)', placeHolder: 'Most tables have one' }
    );
    if (headerChoice === undefined) {
        logger.debug('User cancelled header-row choice');
        return;
    }
    const includeHeader = headerChoice.value;

    // simpletable has no <title> child at all (see module doc comment) --
    // only prompt for one when it can actually be used.
    let title: string | undefined;
    if (tableTypePick.value === 'table') {
        const titleInput = await vscode.window.showInputBox({
            title: 'Table Title (optional)',
            prompt: 'Leave empty to omit the <title> element'
        });
        if (titleInput === undefined) {
            logger.debug('User cancelled table title input');
            return;
        }
        title = titleInput.trim().length > 0 ? titleInput.trim() : undefined;
    }

    const snippet = tableTypePick.value === 'table'
        ? buildCalsTableSnippet(columns, rows, includeHeader, title)
        : buildSimpleTableSnippet(columns, rows, includeHeader);

    const inserted = await insertAtCursor(editor, snippet);
    if (!inserted) {
        vscode.window.showErrorMessage('DitaCraft: Failed to insert table markup.');
        return;
    }
    logger.info('Table inserted', { type: tableTypePick.value, columns, rows, includeHeader });
}

/**
 * Tables are body content — valid inside `<body>`/`<conbody>`/`<taskbody>`/
 * `<refbody>`/`<section>`/etc., never at the map level — so this is
 * deliberately narrower than Insert Image's gating: `.dita` topic files
 * only, not `.ditamap`/`.bookmap`.
 */
export function isEligibleDocument(uri: vscode.Uri): boolean {
    return uri.fsPath.toLowerCase().endsWith(DITA_EXTENSIONS.TOPIC);
}

async function promptForCount(title: string, noun: string, min: number, max: number): Promise<number | undefined> {
    const input = await vscode.window.showInputBox({
        title,
        prompt: `Enter the number of ${noun} (${min}-${max})`,
        validateInput: (value) => {
            const parsed = Number(value);
            if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
                return `Enter a whole number between ${min} and ${max}`;
            }
            return null;
        }
    });
    return input === undefined ? undefined : Number(input);
}

/**
 * Build a CALS `<table>`/`<tgroup>` skeleton with one `<colspec>` per
 * column (so `tgroup/@cols` and the actual column count can never drift),
 * an optional `<thead>`, and `rows` empty `<entry/>` rows in `<tbody>` —
 * every row and the header (when present) get exactly `columns` entries,
 * eliminating the mismatched-entry-count mistake this command exists to
 * prevent.
 */
export function buildCalsTableSnippet(
    columns: number,
    rows: number,
    includeHeader: boolean,
    title: string | undefined
): string {
    const lines: string[] = ['<table>'];
    if (title) {
        lines.push(`    <title>${escapeXml(title)}</title>`);
    }
    lines.push(`    <tgroup cols="${columns}">`);
    for (let c = 1; c <= columns; c++) {
        lines.push(`        <colspec colname="c${c}" colwidth="1*"/>`);
    }
    if (includeHeader) {
        lines.push('        <thead>');
        lines.push('            <row>');
        for (let c = 1; c <= columns; c++) {
            lines.push(`                <entry>Column ${c}</entry>`);
        }
        lines.push('            </row>');
        lines.push('        </thead>');
    }
    lines.push('        <tbody>');
    for (let r = 0; r < rows; r++) {
        lines.push('            <row>');
        for (let c = 0; c < columns; c++) {
            lines.push('                <entry/>');
        }
        lines.push('            </row>');
    }
    lines.push('        </tbody>');
    lines.push('    </tgroup>');
    lines.push('</table>');
    return lines.join('\n');
}

/**
 * Build a `<simpletable>` skeleton — no column specifications to keep in
 * sync (simpletable has none), just `columns` `<stentry>`s per row,
 * every row (header included) getting exactly the same count.
 */
export function buildSimpleTableSnippet(columns: number, rows: number, includeHeader: boolean): string {
    const lines: string[] = ['<simpletable>'];
    if (includeHeader) {
        lines.push('    <sthead>');
        for (let c = 1; c <= columns; c++) {
            lines.push(`        <stentry>Column ${c}</stentry>`);
        }
        lines.push('    </sthead>');
    }
    for (let r = 0; r < rows; r++) {
        lines.push('    <strow>');
        for (let c = 0; c < columns; c++) {
            lines.push('        <stentry/>');
        }
        lines.push('    </strow>');
    }
    lines.push('</simpletable>');
    return lines.join('\n');
}
