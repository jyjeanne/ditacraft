/**
 * Watch Mode
 * Watches the workspace's DITA content files and automatically re-runs a
 * full publish whenever one changes. **Not** incremental publishing —
 * DITA-OT itself has no first-class incremental build mode, so this is
 * "watch + rerun the full publish" only, exactly as scoped in
 * `docs/V0.9-IMPLEMENTATION-PLAN.md` §6 (true incremental republishing —
 * tracking a dependency graph and only rebuilding affected outputs — is a
 * meaningfully larger project, deliberately descoped).
 *
 * Target resolution (what gets published on every change), in priority
 * order: an explicit `uri` argument (e.g. right-click a map in the
 * explorer) → the configured `ditacraft.rootMap` setting, if set → the
 * active editor's `.dita`/`.ditamap`/`.bookmap` file. Format/output
 * options come from the last-used publishing profile (`publishProfilesCommand.ts`)
 * when one exists, falling back to a plain `html5` publish otherwise —
 * mirroring `publishHTML5Command`'s own simplicity for the no-profile case.
 *
 * One status bar item is the entire UI: created on start, disposed on
 * stop, showing "Watching" / "Publishing..." / a transient "Published" /
 * a persistent "Publish failed" until the next successful run. Publish
 * output still goes through the same DITA-OT Build output channel and
 * Problems-panel diagnostics a manual publish uses — only the interactive
 * progress-notification/success-dialog UX (`executePublish`'s) is
 * deliberately skipped here, to avoid a popup on every save while
 * watching.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { DitaOtWrapper, PublishOptions } from '../utils/ditaOtWrapper';
import { logger } from '../utils/logger';
import { parseDitaOtOutput, getDitaOtDiagnostics } from '../utils/ditaOtErrorParser';
import {
    getPublishingProfiles,
    getLastUsedProfileName,
    resolveDitavalPath,
    resolveProfileOutputDir,
} from './publishProfilesCommand';

const WATCH_GLOB = '**/*.{dita,ditamap,bookmap,ditaval}';
const WATCH_DEBOUNCE_MS = 800;
const PUBLISHED_FLASH_MS = 4000;

interface WatchTarget {
    filePath: string;
    transtype: string;
    overrides?: { outputDir?: string; ditavalPath?: string; additionalArgs?: string[] };
}

interface WatchState {
    watcher: vscode.FileSystemWatcher;
    debounceTimer: NodeJS.Timeout | undefined;
    statusBarItem: vscode.StatusBarItem;
    flashTimer: NodeJS.Timeout | undefined;
    target: WatchTarget;
    ditaOt: DitaOtWrapper;
    publishing: boolean;
    /** Set when a change arrives while a publish is already in flight -- runs one more publish right after the current one finishes, instead of silently dropping the edit. */
    pendingRepublish: boolean;
}

let state: WatchState | undefined;

/** True while watch mode is currently active. Exported for testing and for other UI (e.g. status queries) to check. */
export function isWatchModeActive(): boolean {
    return state !== undefined;
}

/**
 * Command: ditacraft.startWatchMode
 */
export async function startWatchModeCommand(uri?: vscode.Uri): Promise<void> {
    if (state) {
        vscode.window.showInformationMessage(`DitaCraft: Already watching ${path.basename(state.target.filePath)}.`);
        return;
    }

    const target = await resolveWatchTarget(uri);
    if (!target) {
        vscode.window.showWarningMessage(
            'DitaCraft: No file to watch -- open a DITA file, set a root map (DITA: Set Root Map), or right-click a .ditamap/.bookmap file.'
        );
        return;
    }

    const ditaOt = new DitaOtWrapper();
    const validation = ditaOt.validateInputFile(target.filePath);
    if (!validation.valid) {
        vscode.window.showErrorMessage(`DitaCraft: Cannot watch: ${validation.error}`);
        return;
    }
    const verification = await ditaOt.verifyInstallation();
    if (!verification.installed) {
        vscode.window.showErrorMessage('DitaCraft: DITA-OT is not installed or not configured. Configure it before starting watch mode.');
        return;
    }

    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 49);
    statusBarItem.command = 'ditacraft.stopWatchMode';
    const watcher = vscode.workspace.createFileSystemWatcher(WATCH_GLOB);

    state = { watcher, debounceTimer: undefined, statusBarItem, flashTimer: undefined, target, ditaOt, publishing: false, pendingRepublish: false };

    const trigger = () => scheduleRepublish();
    watcher.onDidChange(trigger);
    watcher.onDidCreate(trigger);
    watcher.onDidDelete(trigger);

    setWatchingStatus();
    statusBarItem.show();
    logger.info('Watch mode started', { target: target.filePath, transtype: target.transtype });

    // Publish once immediately, matching the conventional "watch" tool
    // behavior of building current state right away rather than waiting
    // for the first change.
    await runWatchPublish();
}

/**
 * Command: ditacraft.stopWatchMode
 */
export function stopWatchModeCommand(): void {
    if (!state) {
        vscode.window.showInformationMessage('DitaCraft: Watch mode is not running.');
        return;
    }
    const { watcher, statusBarItem, debounceTimer, flashTimer, target } = state;
    if (debounceTimer) clearTimeout(debounceTimer);
    if (flashTimer) clearTimeout(flashTimer);
    watcher.dispose();
    statusBarItem.dispose();
    state = undefined;
    logger.info('Watch mode stopped', { target: target.filePath });
    vscode.window.showInformationMessage(`DitaCraft: Stopped watching ${path.basename(target.filePath)}.`);
}

/** Dispose watch mode's resources without the "stopped" notification -- for extension deactivation. Exported for testing. */
export function disposeWatchMode(): void {
    if (!state) return;
    if (state.debounceTimer) clearTimeout(state.debounceTimer);
    if (state.flashTimer) clearTimeout(state.flashTimer);
    state.watcher.dispose();
    state.statusBarItem.dispose();
    state = undefined;
}

function scheduleRepublish(): void {
    if (!state) return;
    if (state.debounceTimer) clearTimeout(state.debounceTimer);
    state.debounceTimer = setTimeout(() => {
        if (state) state.debounceTimer = undefined;
        void runWatchPublish();
    }, WATCH_DEBOUNCE_MS);
}

/**
 * Resolve what watch mode should publish. Exported for testing.
 * Priority: explicit `uri` > `ditacraft.rootMap` setting (resolved against
 * the first workspace folder) > the active editor's DITA file.
 */
export async function resolveWatchTarget(uri?: vscode.Uri): Promise<WatchTarget | undefined> {
    let filePath: string | undefined;

    if (uri) {
        filePath = uri.fsPath;
    } else {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        const rootMap = vscode.workspace.getConfiguration('ditacraft').get<string>('rootMap', '');
        if (workspaceFolder && rootMap.length > 0) {
            const resolved = path.isAbsolute(rootMap) ? rootMap : path.join(workspaceFolder.uri.fsPath, rootMap);
            if (await pathExists(resolved)) {
                filePath = resolved;
            }
        }
        if (!filePath) {
            const activeUri = vscode.window.activeTextEditor?.document.uri;
            if (activeUri && /\.(dita|ditamap|bookmap)$/i.test(activeUri.fsPath)) {
                filePath = activeUri.fsPath;
            }
        }
    }

    if (!filePath) return undefined;

    return { filePath, ...resolveWatchPublishOptions() };
}

async function pathExists(p: string): Promise<boolean> {
    try {
        await fs.access(p);
        return true;
    } catch {
        return false;
    }
}

/** The last-used publishing profile's transtype/overrides, or a plain html5 default when none is saved. Exported for testing. */
export function resolveWatchPublishOptions(): { transtype: string; overrides?: WatchTarget['overrides'] } {
    const lastUsedName = getLastUsedProfileName();
    const profile = lastUsedName ? getPublishingProfiles().find(p => p.name === lastUsedName) : undefined;
    if (!profile) {
        return { transtype: 'html5' };
    }
    return {
        transtype: profile.transtype,
        overrides: {
            outputDir: resolveProfileOutputDir(profile.outputDir),
            ditavalPath: resolveDitavalPath(profile.ditavalPath),
            additionalArgs: profile.additionalArgs,
        },
    };
}

function setWatchingStatus(): void {
    if (!state) return;
    state.statusBarItem.text = `$(eye) Watching: ${path.basename(state.target.filePath)}`;
    state.statusBarItem.tooltip = `DitaCraft Watch Mode\nPublishing "${state.target.filePath}" to ${state.target.transtype} on every change.\nClick to stop.`;
    state.statusBarItem.backgroundColor = undefined;
}

async function runWatchPublish(): Promise<void> {
    if (!state) return;
    if (state.publishing) {
        // A change arrived while a publish was already running -- queue one
        // more run right after this one finishes instead of dropping it;
        // otherwise an edit made mid-publish would never trigger its own
        // republish (`scheduleRepublish`'s debounce timer fires and finds
        // `publishing` still true, with nothing left to re-trigger it).
        state.pendingRepublish = true;
        return;
    }

    // Captured once, up front: if watch mode is stopped (and possibly
    // restarted on a different target) while the publish below is in
    // flight, `state` will no longer be this session -- comparing against
    // `session` (not just checking `state` is defined) keeps this run from
    // writing its stale result onto a newer session's status bar/diagnostics.
    const session = state;
    session.publishing = true;
    session.pendingRepublish = false;
    const { ditaOt, target, statusBarItem } = session;

    statusBarItem.text = '$(sync~spin) Publishing...';
    statusBarItem.tooltip = `Publishing "${target.filePath}" to ${target.transtype}...`;

    const fileName = path.basename(target.filePath, path.extname(target.filePath));
    const baseOutputDir = target.overrides?.outputDir || ditaOt.getOutputDirectory();
    const outputDir = path.join(baseOutputDir, target.transtype, fileName);

    try {
        await fs.rm(outputDir, { recursive: true, force: true });
    } catch (error) {
        const errorCode = (error as NodeJS.ErrnoException).code;
        if (errorCode !== 'ENOENT') {
            logger.warn('Watch mode: failed to clean output directory', { outputDir, error });
        }
    }

    const publishOptions: PublishOptions = {
        inputFile: target.filePath,
        transtype: target.transtype,
        outputDir,
        ditavalPath: target.overrides?.ditavalPath,
        additionalArgs: target.overrides?.additionalArgs,
    };

    const diagnostics = getDitaOtDiagnostics();
    let result: Awaited<ReturnType<DitaOtWrapper['publish']>>;
    try {
        result = await ditaOt.publish(publishOptions);
    } catch (error) {
        logger.error('Watch mode: publish threw unexpectedly', error);
        result = { success: false, outputPath: outputDir, error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // `state` may have been cleared -- or replaced by a new watch session on
    // a different target -- by stopWatchModeCommand()/startWatchModeCommand()
    // while the publish above was in flight; don't touch a disposed or
    // reassigned status bar item/diagnostics with this session's stale result.
    if (state !== session) return;
    session.publishing = false;

    if (result.success) {
        diagnostics.clear();
        if (result.output) {
            const parsed = parseDitaOtOutput(result.output, path.dirname(target.filePath));
            if (parsed.warnings.length > 0) {
                diagnostics.updateFromParsedOutput(parsed, vscode.Uri.file(target.filePath));
            }
        }
        logger.info('Watch mode: published', { target: target.filePath, transtype: target.transtype });
        flashStatus('$(check) Published', `Published "${target.filePath}" to ${target.transtype}.`);
    } else {
        if (result.output) {
            const parsed = parseDitaOtOutput(result.output, path.dirname(target.filePath));
            diagnostics.updateFromParsedOutput(parsed, vscode.Uri.file(target.filePath));
        }
        logger.error('Watch mode: publish failed', { target: target.filePath, error: result.error });
        // A still-pending flash timer from an earlier *successful* publish
        // would otherwise fire a few seconds from now and silently revert
        // this "Publish failed" text back to "Watching", hiding the failure.
        if (session.flashTimer) {
            clearTimeout(session.flashTimer);
            session.flashTimer = undefined;
        }
        session.statusBarItem.text = '$(error) Publish failed';
        session.statusBarItem.tooltip = `DitaCraft Watch Mode\nPublish failed: ${result.error}\nSee Problems / DITA-OT Build output.\nClick to stop.`;
    }

    if (session.pendingRepublish) {
        session.pendingRepublish = false;
        void runWatchPublish();
    }
}

/** Show a transient status, then revert to the normal "Watching" text after a delay. */
function flashStatus(text: string, tooltip: string): void {
    if (!state) return;
    if (state.flashTimer) clearTimeout(state.flashTimer);
    state.statusBarItem.text = text;
    state.statusBarItem.tooltip = tooltip;
    state.flashTimer = setTimeout(() => {
        if (state) {
            state.flashTimer = undefined;
            setWatchingStatus();
        }
    }, PUBLISHED_FLASH_MS);
}
