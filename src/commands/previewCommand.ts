/**
 * Preview Command
 * Shows HTML5 preview of DITA content in WebView panel
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import type { Stats } from 'fs';
import * as crypto from 'crypto';
import { DitaOtWrapper, toVsCodeProgressReporter } from '../utils/ditaOtWrapper';
import { logger } from '../utils/logger';
import { fireAndForget } from '../utils/errorUtils';
import { DitaPreviewPanel } from '../providers/previewPanel';
import { promptForDitaval, resolveDitavalPath } from './publishProfilesCommand';

// Store extension context for creating preview panels
let extensionContext: vscode.ExtensionContext | undefined;

/**
 * `.ditaval` file currently filtering the HTML5 preview (absolute path), or
 * undefined for an unfiltered preview. Applies to the next preview build for
 * *any* file — the preview panel is a singleton, so "current filter" is
 * process-wide state rather than something tracked per document. Changed via
 * `ditacraft.previewFilter`; read by every path that ends up in
 * `previewHTML5Command` (the manual command itself, and the save-triggered
 * auto-refresh via `requestPreviewRefresh` below), so a save naturally
 * re-publishes through whichever filter is currently active.
 */
let activeDitavalPath: string | undefined;

/** The `.ditaval` file currently filtering the preview, if any. Exported for testing. */
export function getActiveDitavalPath(): string | undefined {
    return activeDitavalPath;
}

const activeDitavalChangedEmitter = new vscode.EventEmitter<string | undefined>();
/**
 * Fires whenever the active preview filter changes (including to/from
 * `undefined`). Consumed by `ditavalDecorationProvider.ts` (§4.5 Piece 2)
 * so condition highlighting recomputes the moment the user picks a
 * different filter, without polling `getActiveDitavalPath()` on a timer.
 * Deliberately reuses this same "active filter" concept for both the
 * rendered preview and the dimmed-source highlighting rather than
 * introducing a second, independent "which filter is highlighting" state —
 * picking a filter is one act with two views of its effect.
 */
export const onDidChangeActiveDitaval = activeDitavalChangedEmitter.event;

// Serializes every trigger that can call previewHTML5Command *outside* a
// direct, one-off user invocation of the preview command itself — currently
// the save-triggered auto-refresh (registerPreviewAutoRefresh in
// extension.ts) and the DITAVAL filter picker's own immediate re-publish
// below. Both publish into the same shared output directory for a given
// file+filter combination, so without this guard a save landing while a
// filter change is still publishing (or vice versa) could run two
// `ditaOt.publish()` invocations concurrently against it.
let refreshInFlight = false;
let pendingRefresh: { uri: vscode.Uri; preserveFocus: boolean } | undefined;

/**
 * Request a preview refresh, guaranteeing at most one DITA-OT publish runs
 * at a time. A request that arrives while a publish is already in flight
 * replaces any previously queued one and is replayed once that publish
 * finishes, rather than starting a concurrent publish. Exported so
 * `registerPreviewAutoRefresh` shares this guard instead of keeping its own
 * separate copy.
 */
export function requestPreviewRefresh(uri: vscode.Uri, preserveFocus: boolean): Promise<void> {
    if (refreshInFlight) {
        pendingRefresh = { uri, preserveFocus };
        return Promise.resolve();
    }

    refreshInFlight = true;
    return previewHTML5Command(uri, preserveFocus).finally(() => {
        refreshInFlight = false;
        if (pendingRefresh) {
            const next = pendingRefresh;
            pendingRefresh = undefined;
            fireAndForget(requestPreviewRefresh(next.uri, next.preserveFocus), 'preview-refresh-replay');
        }
    });
}

/**
 * Whether a DITA-OT publish requested through `requestPreviewRefresh` is
 * currently running. Exported so `registerPreviewAutoRefresh` can bypass its
 * save-coalescing debounce and queue immediately when a publish is already
 * in flight (`/code-review` regression: routing every save through the
 * debounce unconditionally, with no in-flight fast path, meant a burst of
 * saves arriving faster than the debounce interval could keep resetting the
 * timer and never actually queue a replay until the burst paused for a full
 * debounce window — well after the in-flight publish had already finished).
 */
export function isPreviewRefreshInFlight(): boolean {
    return refreshInFlight;
}

/**
 * Initialize the preview command with extension context
 */
export function initializePreview(context: vscode.ExtensionContext): void {
    extensionContext = context;
}

/**
 * Command: ditacraft.previewFilter
 * Choose (or clear) the `.ditaval` file used to filter the HTML5 preview.
 *
 * Reuses `promptForDitaval` — the same "browse for a .ditaval file" picker
 * publishing profiles already use — rather than building a second one; only
 * what happens with the result differs (profile storage vs. this in-memory
 * preview state).
 *
 * The choice applies to the next preview build. If a preview panel is
 * already open, the current source file is re-published immediately so the
 * effect is visible without a separate manual refresh or save.
 */
export async function pickPreviewFilterCommand(): Promise<void> {
    const choice = await promptForDitaval(activeDitavalPath);
    if (choice === undefined) {
        return; // Cancelled — leave the active filter unchanged.
    }

    activeDitavalPath = resolveDitavalPath(choice);
    logger.info('Preview filter changed', { ditavalPath: activeDitavalPath });
    activeDitavalChangedEmitter.fire(activeDitavalPath);

    const sourceFile = DitaPreviewPanel.currentPanel?.getSourceFile();
    if (sourceFile) {
        await requestPreviewRefresh(vscode.Uri.file(sourceFile), true);
    }
}

/**
 * Command: ditacraft.previewHTML5
 * Shows HTML5 preview in WebView panel
 *
 * @param uri Optional file URI; falls back to the active editor.
 * @param preserveFocus When true, the preview panel is revealed without
 *        stealing focus from the editor. Used by the save-triggered
 *        auto-refresh so the cursor stays in the document.
 */
export async function previewHTML5Command(uri?: vscode.Uri, preserveFocus = false): Promise<void> {
    try {
        // Get and validate file URI
        const fileUri = await getAndValidateFileUri(uri);
        const filePath = fileUri.fsPath;

        // Validate file path and extension
        validateFilePath(filePath);

        // Initialize DITA-OT wrapper and validate setup
        const ditaOt = await initializeAndValidateDitaOt();

        // Validate input file
        validateInputFile(ditaOt, filePath);

        // Generate HTML5 output if needed
        const outputDir = await generateHtml5OutputIfNeeded(ditaOt, filePath, activeDitavalPath);

        // Find and display the main HTML file
        await displayPreview(filePath, outputDir, preserveFocus, activeDitavalPath);

    } catch (error) {
        handlePreviewError(error);
    }
}

/**
 * Decide whether a save should trigger an auto-refresh of the preview.
 * Exported for testing.
 *
 * Refresh only when the setting is enabled AND the saved file is the same
 * source file currently shown in the preview panel. Paths are normalized and
 * compared case-insensitively on case-insensitive platforms (Windows/macOS),
 * so a tree-view URI (`c:\…`) and an editor document URI (`C:\…`) still match.
 */
export function shouldAutoRefreshPreview(
    savedFilePath: string,
    autoRefreshEnabled: boolean,
    previewedSourceFile: string | undefined
): boolean {
    if (!autoRefreshEnabled || previewedSourceFile === undefined) {
        return false;
    }
    return pathsEqual(savedFilePath, previewedSourceFile);
}

/**
 * Compare two file system paths for equality, accounting for separator
 * normalization and platform case-sensitivity.
 */
function pathsEqual(a: string, b: string): boolean {
    const normA = path.normalize(a);
    const normB = path.normalize(b);
    // Windows and macOS file systems are case-insensitive; Linux is not.
    if (process.platform === 'win32' || process.platform === 'darwin') {
        return normA.toLowerCase() === normB.toLowerCase();
    }
    return normA === normB;
}

/**
 * Get and validate the file URI from either parameter or active editor
 */
async function getAndValidateFileUri(uri?: vscode.Uri): Promise<vscode.Uri> {
    // Get the file URI - be very explicit about getting the actual document
    let fileUri: vscode.Uri | undefined = uri;

    // If no URI was passed, get it from the active editor
    if (!fileUri && vscode.window.activeTextEditor) {
        fileUri = vscode.window.activeTextEditor.document.uri;
        logger.debug('Using active editor document URI');
    }

    if (!fileUri) {
        throw new Error('No DITA file is currently open. Please open a DITA file first.');
    }

    // Log URI details for debugging
    logger.debug('Preview command debug info', {
        uriProvidedAsParameter: uri ? 'Yes' : 'No',
        uriScheme: fileUri.scheme,
        uriPath: fileUri.path,
        uriFsPath: fileUri.fsPath,
        uriToString: fileUri.toString()
    });

    return fileUri;
}

/**
 * Validate file path and extension
 * Exported for testing
 */
export function validateFilePath(filePath: string): void {
    // Check if filePath is valid and not empty
    if (!filePath || filePath.trim() === '') {
        throw new Error('Invalid file path. Please open a DITA file.');
    }

    // Additional check: ensure path ends with a file (has extension)
    if (filePath.endsWith('\\') || filePath.endsWith('/')) {
        logger.error('Path ends with directory separator', { filePath });
        throw new Error('The path appears to be a directory, not a file. Please open a specific DITA file.');
    }

    // Check if this is actually a file with an extension
    const hasExtension = path.extname(filePath) !== '';
    if (!hasExtension) {
        logger.error('Path has no file extension', { filePath });
        throw new Error('The path does not appear to be a file. Please open a DITA file (.dita, .ditamap, or .bookmap).');
    }

    logger.debug('File extension validated', { extension: path.extname(filePath) });
}

/**
 * Initialize DITA-OT wrapper and validate installation
 */
async function initializeAndValidateDitaOt(): Promise<DitaOtWrapper> {
    // Initialize DITA-OT wrapper
    const ditaOt = new DitaOtWrapper();

    // Validate DITA-OT installation
    const verification = await ditaOt.verifyInstallation();
    if (!verification.installed) {
        const action = await vscode.window.showErrorMessage(
            'DITA-OT is not installed or not configured. Please configure DITA-OT path.',
            'Configure Now'
        );

        if (action === 'Configure Now') {
            await ditaOt.configureOtPath();
        }
        throw new Error('DITA-OT is not configured');
    }

    return ditaOt;
}

/**
 * Validate input file
 */
function validateInputFile(ditaOt: DitaOtWrapper, filePath: string): void {
    // Validate input file FIRST before checking DITA-OT
    const validation = ditaOt.validateInputFile(filePath);
    if (!validation.valid) {
        throw new Error(`Cannot preview: ${validation.error}`);
    }
}

/**
 * Suffix distinguishing a filtered preview's output directory from an
 * unfiltered one (and from a preview filtered by a *different* `.ditaval`
 * file), so switching filters never serves another filter's — or no
 * filter's — stale cached HTML from the mtime check below. Deterministic:
 * the same `.ditaval` path always maps to the same suffix, so re-selecting
 * an already-used filter reuses its existing cache directory rather than
 * republishing needlessly. Exported for testing.
 */
export function computeFilterSuffix(ditavalPath: string | undefined): string {
    if (!ditavalPath) {
        return '';
    }
    const hash = crypto.createHash('md5').update(ditavalPath).digest('hex').slice(0, 8);
    return `__filter-${hash}`;
}

/**
 * Generate HTML5 output if needed (checks cache and publishes if necessary)
 * P1-1 Fix: Use async file operations
 *
 * When `ditavalPath` is set, the output directory is suffixed (see
 * `computeFilterSuffix`) so a filtered and an unfiltered preview — or two
 * previews filtered by different `.ditaval` files — never share a cache
 * entry. The cache is also invalidated by the `.ditaval` file's own mtime,
 * not just the source document's: editing the filter's conditions without
 * touching the topic must still force a republish.
 */
async function generateHtml5OutputIfNeeded(
    ditaOt: DitaOtWrapper,
    filePath: string,
    ditavalPath: string | undefined
): Promise<string> {
    // Generate HTML5 output
    const fileName = path.basename(filePath, path.extname(filePath));
    const outputDir = path.join(ditaOt.getOutputDirectory(), 'html5', `${fileName}${computeFilterSuffix(ditavalPath)}`);

    // Check if preview already exists
    let needsPublish = true;
    try {
        const statTargets = [fs.stat(filePath), fs.stat(outputDir)];
        if (ditavalPath) {
            statTargets.push(fs.stat(ditavalPath));
        }
        const stats: Stats[] = await Promise.all(statTargets);
        const [fileStats, outputStats, ditavalStats] = stats;
        const newestSourceMtime = ditavalPath && ditavalStats.mtime > fileStats.mtime
            ? ditavalStats.mtime
            : fileStats.mtime;

        // If output is newer than every source (topic + active filter), use cached version
        if (outputStats.mtime > newestSourceMtime) {
            needsPublish = false;
        }
    } catch {
        // Output directory (or the ditaval file) doesn't exist or can't be accessed - needs publish
    }

    // Publish to HTML5 if needed
    if (needsPublish) {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: ditavalPath ? "Generating filtered HTML5 preview" : "Generating HTML5 preview",
            cancellable: false
        }, async (progress) => {
            const result = await ditaOt.publish({
                inputFile: filePath,
                transtype: 'html5',
                outputDir: outputDir,
                ditavalPath
            }, toVsCodeProgressReporter(progress));

            if (!result.success) {
                throw new Error(result.error || 'Failed to generate preview');
            }
        });
    }

    return outputDir;
}

/**
 * Display the preview in WebView panel or external browser
 */
async function displayPreview(
    sourceFilePath: string,
    outputDir: string,
    preserveFocus = false,
    ditavalPath?: string
): Promise<void> {
    const fileName = path.basename(sourceFilePath, path.extname(sourceFilePath));

    // Find the main HTML file (P1-1 Fix: await async function)
    const htmlFile = await findMainHtmlFile(outputDir, fileName);

    if (!htmlFile) {
        throw new Error('Could not find generated HTML file');
    }

    // Create and show WebView panel
    if (extensionContext) {
        const filterLabel = ditavalPath ? path.basename(ditavalPath) : undefined;
        DitaPreviewPanel.createOrShow(
            extensionContext.extensionUri,
            htmlFile,
            sourceFilePath,
            preserveFocus,
            filterLabel
        );
        logger.info('Preview panel opened', { htmlFile, sourceFile: sourceFilePath, filter: filterLabel });
    } else {
        // Fallback: open in external browser if context not available
        logger.warn('Extension context not available, opening in external browser');
        const htmlUri = vscode.Uri.file(htmlFile);
        await vscode.env.openExternal(htmlUri);
        vscode.window.showInformationMessage('Preview opened in browser');
    }
}

/**
 * Handle preview errors consistently
 */
function handlePreviewError(error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Preview failed', error);
    vscode.window.showErrorMessage(`Preview failed: ${errorMessage}`);
}

/**
 * Find the main HTML file in the output directory
 * Exported for testing
 * P1-1 Fix: Use async file operations
 */
export async function findMainHtmlFile(outputDir: string, baseName: string): Promise<string | null> {
    // Try common patterns
    const patterns = [
        `${baseName}.html`,
        'index.html'
    ];

    for (const pattern of patterns) {
        const fullPath = path.join(outputDir, pattern);
        try {
            await fs.access(fullPath);
            return fullPath;
        } catch {
            // File doesn't exist, try next pattern
        }
    }

    // Fallback: find any .html file
    try {
        const files = await fs.readdir(outputDir);
        const htmlFiles = files.filter((f: string) => f.endsWith('.html'));

        if (htmlFiles.length > 0) {
            return path.join(outputDir, htmlFiles[0]);
        }
    } catch (_error) {
        // Directory doesn't exist or can't be read
    }

    return null;
}
