/**
 * Condition Highlighting (§4.5 Piece 2)
 *
 * Dims elements in the active editor that the currently active `.ditaval`
 * preview filter (`ditacraft.previewFilter`, see previewCommand.ts) would
 * exclude from a filtered publish. A read-only decoration pass, not a
 * validation phase — it never touches `ValidationPipeline` or produces
 * diagnostics.
 *
 * Deliberately reuses previewCommand.ts's "active filter" concept rather
 * than introducing a second, independent notion of "which filter is
 * highlighting" — picking a filter for the preview is the same act as
 * picking one to highlight conditions against, one filter with two views
 * of its effect (rendered preview + dimmed source).
 *
 * Lifecycle: unlike the only prior decoration usage in this codebase
 * (`elementNavigator.ts`'s one-shot flash highlight, created, applied, and
 * disposed again within ~2 seconds for a single navigation jump), this
 * decoration type is created once at registration and lives for the
 * extension's lifetime — only its *applied ranges* (not the type itself)
 * are cleared and reapplied on every recompute. Recomputes are triggered
 * by active-editor changes, document edits (debounced), and active-filter
 * changes.
 */

import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import { getActiveDitavalPath, onDidChangeActiveDitaval } from '../commands/previewCommand';
import { parseDitavalRules, isExcludedByRules, PROFILING_ATTRIBUTES, DitavalRule } from '../utils/ditavalParser';
import { findProfiledElements } from '../utils/xmlElementScanner';
import { isDitaContentUri } from '../utils/constants';
import { configManager } from '../utils/configurationManager';
import { logger } from '../utils/logger';

const DECORATION_DEBOUNCE_MS = 300;

/** Dim + strike through elements the active filter would exclude. */
const excludedDecorationType = vscode.window.createTextEditorDecorationType({
    opacity: '0.55',
    textDecoration: 'line-through',
    rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
});

let debounceTimer: NodeJS.Timeout | undefined;

/** Small mtime-keyed cache so rapid recomputes (e.g. fast typing) don't
 * re-read and re-parse the same `.ditaval` file from disk every time. */
let rulesCache: { path: string; mtimeMs: number; rules: DitavalRule[] } | undefined;

async function loadActiveRules(ditavalPath: string): Promise<DitavalRule[]> {
    const stats = await fs.stat(ditavalPath);
    if (rulesCache && rulesCache.path === ditavalPath && rulesCache.mtimeMs === stats.mtimeMs) {
        return rulesCache.rules;
    }
    const content = await fs.readFile(ditavalPath, 'utf-8');
    const rules = parseDitavalRules(content);
    rulesCache = { path: ditavalPath, mtimeMs: stats.mtimeMs, rules };
    return rules;
}

async function recompute(editor: vscode.TextEditor | undefined): Promise<void> {
    if (!editor) {
        return;
    }

    if (!configManager.get('conditionHighlightingEnabled') || !isDitaContentUri(editor.document.uri)) {
        editor.setDecorations(excludedDecorationType, []);
        return;
    }

    const ditavalPath = getActiveDitavalPath();
    if (!ditavalPath) {
        editor.setDecorations(excludedDecorationType, []);
        return;
    }

    let rules: DitavalRule[];
    try {
        rules = await loadActiveRules(ditavalPath);
    } catch (error) {
        // Active filter file missing/unreadable — same as "no filter" for
        // highlighting purposes; the preview flow surfaces its own error
        // for this case, no need to duplicate that here.
        logger.debug('Condition highlighting: failed to read active .ditaval file', { error, ditavalPath });
        editor.setDecorations(excludedDecorationType, []);
        return;
    }

    // The editor may have changed (or closed) while the above awaited.
    if (vscode.window.activeTextEditor !== editor) {
        return;
    }

    const text = editor.document.getText();
    const elements = findProfiledElements(text, PROFILING_ATTRIBUTES);
    const ranges: vscode.Range[] = [];
    for (const element of elements) {
        if (isExcludedByRules(element.attrs, rules)) {
            ranges.push(new vscode.Range(
                editor.document.positionAt(element.start),
                editor.document.positionAt(element.end)
            ));
        }
    }

    editor.setDecorations(excludedDecorationType, ranges);
}

function scheduleRecompute(editor: vscode.TextEditor | undefined): void {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
        debounceTimer = undefined;
        recompute(editor).catch(error => logger.debug('Condition highlighting recompute failed', { error }));
    }, DECORATION_DEBOUNCE_MS);
}

/**
 * Register the condition-highlighting decoration pass. Exported for
 * `extension.ts` to call during activation.
 */
export function registerConditionHighlighting(context: vscode.ExtensionContext): void {
    scheduleRecompute(vscode.window.activeTextEditor);

    context.subscriptions.push(
        excludedDecorationType,
        vscode.window.onDidChangeActiveTextEditor(editor => scheduleRecompute(editor)),
        vscode.workspace.onDidChangeTextDocument(event => {
            if (vscode.window.activeTextEditor?.document === event.document) {
                scheduleRecompute(vscode.window.activeTextEditor);
            }
        }),
        onDidChangeActiveDitaval(() => scheduleRecompute(vscode.window.activeTextEditor)),
        {
            dispose: () => {
                if (debounceTimer) {
                    clearTimeout(debounceTimer);
                    debounceTimer = undefined;
                }
            }
        }
    );
}
