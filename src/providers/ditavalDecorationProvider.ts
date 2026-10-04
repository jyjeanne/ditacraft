/**
 * Condition Highlighting (§4.5 Piece 2)
 *
 * Dims elements in the active editor that the currently active `.ditaval`
 * preview filter (`ditacraft.previewFilter`, see previewCommand.ts) would
 * exclude from a filtered publish, and gives the elements it flags their
 * flag's look (background tint, style, start/end flags, overview-ruler mark,
 * hover). Both are decided by the visual preview's own filter
 * (`conditionMarks` over `buildDitavalFilter`), so the source and the
 * preview always agree — the filter-wide default rule included. A read-only
 * decoration pass, not a validation phase — it never touches
 * `ValidationPipeline` or produces diagnostics.
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
 * are cleared and reapplied on every recompute. Flag decoration types are
 * created per flag look when first needed and live as long as the filter
 * file they come from (disposed when it changes, and on deactivation). Recomputes are triggered
 * by active-editor changes, document edits (debounced), active-filter
 * changes, and relevant configuration changes (enabling/disabling the
 * feature, changing the large-file threshold).
 */

import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import { getActiveDitavalPath, onDidChangeActiveDitaval } from '../commands/previewCommand';
import { buildDitavalFilter, type DitavalFilter } from '../preview/ditaval';
import { conditionMarks, flagLook, type FlagLabel, type MarkSpan } from '../preview/conditionMarks';
import type { FlagStyle } from '../shared/render/types';
import { isDitaContentUri } from '../utils/constants';
import { configManager } from '../utils/configurationManager';
import { logger } from '../utils/logger';

const DECORATION_DEBOUNCE_MS = 300;
const DEFAULT_LARGE_FILE_THRESHOLD_KB = 500;

/** Dim + strike through elements the active filter would exclude. */
const excludedDecorationType = vscode.window.createTextEditorDecorationType({
    opacity: '0.55',
    textDecoration: 'line-through',
    rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
});

/** The active filter's flag looks, by `flagKey`: one decoration type each. */
const flagDecorationTypes = new Map<string, vscode.TextEditorDecorationType>();

function flagDecorationType(key: string, style: FlagStyle): vscode.TextEditorDecorationType {
    let type = flagDecorationTypes.get(key);
    if (!type) {
        const look = flagLook(style);
        type = vscode.window.createTextEditorDecorationType({
            backgroundColor: look.backgroundColor,
            fontWeight: look.fontWeight,
            fontStyle: look.fontStyle,
            textDecoration: look.textDecoration,
            before: flagAttachment(look.before),
            after: flagAttachment(look.after),
            overviewRulerColor: look.overviewRulerColor ?? new vscode.ThemeColor('editorOverviewRuler.infoForeground'),
            overviewRulerLane: vscode.OverviewRulerLane.Right,
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
        });
        flagDecorationTypes.set(key, type);
    }
    return type;
}

function flagAttachment(label: FlagLabel | undefined): vscode.ThemableDecorationAttachmentRenderOptions | undefined {
    return label && {
        contentText: label.contentText,
        color: label.color ?? new vscode.ThemeColor('editorCodeLens.foreground'),
        backgroundColor: label.backgroundColor,
        margin: label.margin
    };
}

function disposeFlagDecorationTypes(): void {
    for (const type of flagDecorationTypes.values()) {
        type.dispose();
    }
    flagDecorationTypes.clear();
}

function flagHover(filterLabel: string, span: MarkSpan): vscode.MarkdownString {
    const values = Object.entries(span.values).map(([name, value]) => `${name}="${value}"`).join(' ');
    return new vscode.MarkdownString().appendText(`Flagged by ${filterLabel}: ${values}`);
}

function clearDecorations(editor: vscode.TextEditor): void {
    editor.setDecorations(excludedDecorationType, []);
    for (const type of flagDecorationTypes.values()) {
        editor.setDecorations(type, []);
    }
}

let debounceTimer: NodeJS.Timeout | undefined;

/** Small mtime-keyed cache so rapid recomputes (e.g. fast typing) don't
 * re-read and re-parse the same `.ditaval` file from disk every time. */
let filterCache: { path: string; mtimeMs: number; filter: DitavalFilter } | undefined;

async function loadActiveFilter(ditavalPath: string): Promise<DitavalFilter> {
    const stats = await fs.stat(ditavalPath);
    if (filterCache && filterCache.path === ditavalPath && filterCache.mtimeMs === stats.mtimeMs) {
        return filterCache.filter;
    }
    const content = await fs.readFile(ditavalPath, 'utf-8');
    // A flag image's path only tells that there is one: shown as ⚑ when it has no alternate text.
    const filter = buildDitavalFilter(content, ditavalPath, absolutePath => absolutePath);
    filterCache = { path: ditavalPath, mtimeMs: stats.mtimeMs, filter };
    disposeFlagDecorationTypes(); // a new filter brings its own flag looks
    return filter;
}

/**
 * Reuses `ditacraft.largeFileThresholdKB` — the same setting
 * `ValidationPipeline` uses to skip its own heavy phases (DITA rules,
 * cross-references, workspace checks) for large files — rather than
 * inventing a second, decoration-specific threshold. This pass runs a
 * full-document regex scan (plus a per-match closing-tag search) on every
 * debounced edit, which the same "skip on large files" guard the rest of
 * the codebase already applies elsewhere.
 */
function exceedsLargeFileThreshold(document: vscode.TextDocument): boolean {
    const thresholdKb = vscode.workspace.getConfiguration('ditacraft')
        .get<number>('largeFileThresholdKB', DEFAULT_LARGE_FILE_THRESHOLD_KB);
    if (thresholdKb <= 0) {
        return false; // 0 means "disabled" per the setting's own documented contract.
    }
    return Buffer.byteLength(document.getText(), 'utf8') > thresholdKb * 1024;
}

async function recompute(editor: vscode.TextEditor | undefined): Promise<void> {
    if (!editor) {
        return;
    }

    if (
        !configManager.get('conditionHighlightingEnabled') ||
        !isDitaContentUri(editor.document.uri) ||
        exceedsLargeFileThreshold(editor.document)
    ) {
        clearDecorations(editor);
        return;
    }

    const ditavalPath = getActiveDitavalPath();
    if (!ditavalPath) {
        clearDecorations(editor);
        return;
    }

    let filter: DitavalFilter;
    try {
        filter = await loadActiveFilter(ditavalPath);
    } catch (error) {
        // Active filter file missing/unreadable — same as "no filter" for
        // highlighting purposes; the preview flow surfaces its own error
        // for this case, no need to duplicate that here.
        logger.debug('Condition highlighting: failed to read active .ditaval file', { error, ditavalPath });
        clearDecorations(editor);
        return;
    }

    // The editor may have changed (or closed) while the above awaited.
    if (vscode.window.activeTextEditor !== editor) {
        return;
    }

    const document = editor.document;
    const marks = conditionMarks(document.getText(), filter);
    const range = (span: MarkSpan): vscode.Range =>
        new vscode.Range(document.positionAt(span.start), document.positionAt(span.end));

    editor.setDecorations(excludedDecorationType, marks.excluded.map(range));
    const shown = new Set<string>();
    for (const flag of marks.flagged) {
        shown.add(flag.key);
        editor.setDecorations(flagDecorationType(flag.key, flag.style),
            flag.spans.map(span => ({ range: range(span), hoverMessage: flagHover(filter.label, span) })));
    }
    for (const [key, type] of flagDecorationTypes) {
        if (!shown.has(key)) {
            editor.setDecorations(type, []);
        }
    }
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
        // Toggling ditacraft.conditionHighlightingEnabled (or changing
        // largeFileThresholdKB) off must clear/update decorations
        // immediately, not just on the next unrelated edit/editor-switch
        // recompute — `/code-review` regression: the setting's own
        // description promises it "gates the whole feature off", which
        // wasn't true without this listener.
        configManager.onConfigurationChange(event => {
            if (
                event.affectedKeys.includes('conditionHighlightingEnabled') ||
                event.affectedKeys.includes('largeFileThresholdKB')
            ) {
                scheduleRecompute(vscode.window.activeTextEditor);
            }
        }),
        {
            dispose: () => {
                if (debounceTimer) {
                    clearTimeout(debounceTimer);
                    debounceTimer = undefined;
                }
                disposeFlagDecorationTypes();
                filterCache = undefined;
            }
        }
    );
}
