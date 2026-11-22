/**
 * Manage DITA-OT Plugins Command
 * Lists installed DITA-OT plugins, installs plugins from the DITA-OT plugin registry, and
 * uninstalls plugins (with the safeguards of docs/STUDY_DITA_OT_PLUGIN_UNINSTALL.md).
 */

import * as path from 'path';
import * as vscode from 'vscode';
import { DitaOtWrapper } from '../utils/ditaOtWrapper';
import { configManager } from '../utils/configurationManager';
import { getDitaOtOutputChannel } from '../utils/ditaOtOutputChannel';
import { getErrorMessage } from '../utils/errorUtils';
import { logger } from '../utils/logger';
import {
    classifyForUninstall,
    describeUninstallBlock,
    fetchRegistryCatalog,
    installPlugin,
    listInstalledPlugins,
    readPluginDescriptors,
    uninstallPlugin,
    PluginUninstallResult,
    RegistryPlugin,
    UninstallCandidate
} from '../utils/ditaOtPluginManager';

const ACTION_LIST = 'list';
const ACTION_INSTALL = 'install';
const ACTION_UNINSTALL = 'uninstall';
const LATEST_LABEL = 'Latest';
const SHOW_OUTPUT = 'Show Output';
const LIST_PLUGINS = 'List Installed Plugins';
const REMOVE = 'Remove';
const CONFIGURE_PATH = 'Configure DITA-OT Path';

/**
 * Command: ditacraft.manageDitaOtPlugins
 */
export async function manageDitaOtPluginsCommand(): Promise<void> {
    try {
        const wrapper = new DitaOtWrapper();
        const verification = await wrapper.verifyInstallation();
        if (!verification.installed && verification.problem) {
            // DITA-OT is there but cannot run from its folder (Windows command line limit).
            const choice = await vscode.window.showErrorMessage(verification.problem, 'Configure DITA-OT Path');
            if (choice === 'Configure DITA-OT Path') {
                await vscode.commands.executeCommand('ditacraft.configureDitaOT');
            }
            return;
        }
        if (!verification.installed) {
            const choice = await vscode.window.showWarningMessage(
                'DITA-OT was not found. Configure the DITA-OT path or install DITA-OT first.',
                'Configure DITA-OT Path',
                'Install DITA-OT'
            );
            if (choice === 'Configure DITA-OT Path') {
                await vscode.commands.executeCommand('ditacraft.configureDitaOT');
            } else if (choice === 'Install DITA-OT') {
                await vscode.commands.executeCommand('ditacraft.installDitaOT');
            }
            return;
        }

        const action = await vscode.window.showQuickPick(
            [
                { label: 'List installed plugins', action: ACTION_LIST },
                { label: 'Install plugin from registry', action: ACTION_INSTALL },
                { label: 'Uninstall plugin', action: ACTION_UNINSTALL }
            ],
            { placeHolder: `DITA-OT ${verification.version ?? ''} plugins` }
        );
        if (!action) {
            return;
        }

        const run = (args: string[], onOutput?: (chunk: string) => void) => wrapper.runDitaCli(args, onOutput);
        if (action.action === ACTION_LIST) {
            await showInstalledPlugins(run);
        } else if (action.action === ACTION_INSTALL) {
            await installFromRegistry(wrapper, run);
        } else {
            await uninstallFromDitaOt(wrapper, run);
        }
    } catch (error: unknown) {
        logger.error('DITA-OT plugin management failed', { error });
        vscode.window.showErrorMessage(`Plugin management failed: ${getErrorMessage(error)}`);
    }
}

type Runner = (args: string[], onOutput?: (chunk: string) => void) => ReturnType<DitaOtWrapper['runDitaCli']>;

async function showInstalledPlugins(run: Runner): Promise<void> {
    const plugins = await vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: 'Reading installed DITA-OT plugins...' },
        () => listInstalledPlugins(run)
    );

    if (plugins.length === 0) {
        vscode.window.showInformationMessage('No DITA-OT plugins are installed.');
        return;
    }

    // In a QuickPick, not in the DITA-OT output channel: that is a log channel, where
    // these lines, which carry no log level, were logged at debug level and hidden.
    await vscode.window.showQuickPick(
        plugins.map(plugin => ({ label: plugin.id, description: plugin.version ?? '' })),
        { placeHolder: `Installed DITA-OT plugins (${plugins.length})`, matchOnDescription: true }
    );
}

async function installFromRegistry(wrapper: DitaOtWrapper, run: Runner): Promise<void> {
    const registryUrl = configManager.get('ditaOtRegistryUrl');
    const catalog = await vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: 'Loading DITA-OT plugin registry...' },
        () => fetchRegistryCatalog(registryUrl)
    );
    if (catalog.source === 'github-fallback') {
        vscode.window.showWarningMessage(
            'The plugin registry could not be reached; showing plugin ids from the dita-ot/registry repository. Versions are not available.'
        );
    }

    const plugin = await vscode.window.showQuickPick(
        catalog.plugins.map(entry => ({
            label: entry.id,
            description: entry.versions[0] ? `latest ${entry.versions[0]}` : '',
            detail: entry.description,
            entry
        })),
        { placeHolder: `Select a plugin to install (${catalog.plugins.length} available)`, matchOnDescription: true, matchOnDetail: true }
    );
    if (!plugin) {
        return;
    }

    const version = await pickVersion(plugin.entry);
    if (version === null) {
        return;
    }

    const target = version ? `${plugin.entry.id}@${version}` : plugin.entry.id;
    const confirm = await vscode.window.showWarningMessage(
        `Install DITA-OT plugin ${target}? Plugin installation runs code from the registry.`,
        { modal: true },
        'Install'
    );
    if (confirm !== 'Install') {
        return;
    }

    const output = getDitaOtOutputChannel();
    output.clear();
    output.show(true);
    output.info(`> dita install ${target}`);

    const result = await vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: `Installing DITA-OT plugin ${target}...`, cancellable: false },
        () => installPlugin(run, plugin.entry.id, version, chunk => output.logOutput(chunk))
    );

    if (result.success) {
        // The plugin's libraries lengthen DITA-OT's command line, which has a limit on Windows.
        const problem = wrapper.publishCommandLineProblem();
        if (problem) {
            vscode.window.showWarningMessage(problem);
        }
        const choice = await vscode.window.showInformationMessage(`DITA-OT plugin ${target} installed.`, LIST_PLUGINS);
        if (choice === LIST_PLUGINS) {
            await showInstalledPlugins(run);
        }
        return;
    }

    const choice = await vscode.window.showErrorMessage(
        `Plugin installation failed for ${target}: ${result.reason ?? 'unknown error'}`,
        SHOW_OUTPUT
    );
    if (choice === SHOW_OUTPUT) {
        output.show(true);
    }
}

type CandidateItem = vscode.QuickPickItem & { candidate?: UninstallCandidate };

async function uninstallFromDitaOt(wrapper: DitaOtWrapper, run: Runner): Promise<void> {
    // The folder is needed to back up the plugin before DITA-OT deletes it.
    const ditaOtHome = wrapper.resolveDitaOtHome();
    if (!ditaOtHome) {
        const choice = await vscode.window.showWarningMessage(
            'To uninstall a plugin, DITA Craft needs the DITA-OT folder and its plugins folder. Set it with DITA: Configure DITA-OT Path.',
            CONFIGURE_PATH
        );
        if (choice === CONFIGURE_PATH) {
            await vscode.commands.executeCommand('ditacraft.configureDitaOT');
        }
        return;
    }

    const candidates = await vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: 'Reading installed DITA-OT plugins...' },
        async () => classifyForUninstall(await listInstalledPlugins(run), readPluginDescriptors(ditaOtHome), ditaOtHome)
    );
    if (candidates.length === 0) {
        vscode.window.showInformationMessage('No DITA-OT plugins are installed.');
        return;
    }

    const candidate = await pickPluginToUninstall(candidates);
    if (!candidate) {
        return;
    }
    if (candidate.block) {
        vscode.window.showInformationMessage(uninstallBlockMessage(candidate));
        return;
    }

    const target = candidate.version ? `${candidate.id}@${candidate.version}` : candidate.id;
    const confirm = await vscode.window.showWarningMessage(
        `Remove DITA-OT plugin ${target} from ${ditaOtHome}?`,
        {
            modal: true,
            detail: 'Its folder is deleted and DITA-OT is integrated again; do not publish meanwhile. '
                + 'To get the plugin back, install it again from the registry or from its ZIP file.'
        },
        REMOVE
    );
    if (confirm !== REMOVE) {
        return;
    }

    const output = getDitaOtOutputChannel();
    output.clear();
    output.show(true);
    output.info(`> dita uninstall ${candidate.id}`);

    let result: PluginUninstallResult;
    try {
        result = await vscode.window.withProgress(
            { location: vscode.ProgressLocation.Notification, title: `Removing DITA-OT plugin ${target}...`, cancellable: false },
            () => uninstallPlugin(run, candidate.id, { ditaOtPath: ditaOtHome, onOutput: chunk => output.logOutput(chunk) })
        );
    } catch (error: unknown) {
        // The backup of the plugin folder failed, so DITA-OT was not run.
        vscode.window.showErrorMessage(`Could not remove ${candidate.id}: ${getErrorMessage(error)}. Nothing was changed.`);
        return;
    }

    if (result.success) {
        output.info(`Removed ${candidate.id}.`);
        const choice = await vscode.window.showInformationMessage(`DITA-OT plugin ${target} removed.`, LIST_PLUGINS);
        if (choice === LIST_PLUGINS) {
            await showInstalledPlugins(run);
        }
        return;
    }

    const reason = result.reason ?? 'unknown error';
    let message: string;
    if (result.notFound) {
        message = `Could not remove ${candidate.id}: DITA-OT did not find it in ${path.join(ditaOtHome, 'plugins')}.`;
    } else if (result.restored) {
        output.info(`${candidate.id} was put back from its backup, and DITA-OT was integrated again.`);
        message = `Could not remove ${candidate.id}: ${reason}. The plugin was restored.`;
    } else {
        output.info(`Putting ${candidate.id} back failed: ${result.rollbackError}. A copy of its folder is in ${result.backupPath}.`);
        message = `Could not remove ${candidate.id}: ${reason}. Putting it back failed (${result.rollbackError}), `
            + `so DITA-OT may not work until ${candidate.id} is installed again. A copy of its folder is in ${result.backupPath}.`;
    }
    const choice = await vscode.window.showErrorMessage(message, SHOW_OUTPUT);
    if (choice === SHOW_OUTPUT) {
        output.show(true);
    }
}

/** The removable plugins first, then, under a separator, the others with the reason. */
async function pickPluginToUninstall(candidates: UninstallCandidate[]): Promise<UninstallCandidate | undefined> {
    const removable = candidates.filter(candidate => !candidate.block);
    const blocked = candidates.filter(candidate => candidate.block);
    const items: CandidateItem[] = [
        ...removable.map(candidate => ({ label: candidate.id, description: candidate.version ?? '', candidate })),
        ...(blocked.length > 0 ? [{ label: 'Cannot be removed here', kind: vscode.QuickPickItemKind.Separator }] : []),
        ...blocked.map(candidate => ({
            label: candidate.id,
            description: candidate.version ?? '',
            detail: candidate.block ? describeUninstallBlock(candidate.block) : '',
            candidate
        }))
    ];
    const picked = await vscode.window.showQuickPick(items, {
        placeHolder: removable.length > 0
            ? `Select a DITA-OT plugin to uninstall (${removable.length} of ${candidates.length} can be removed)`
            : `No DITA-OT plugin can be removed here (${candidates.length} installed)`,
        matchOnDescription: true,
        matchOnDetail: true
    });
    return picked?.candidate;
}

function uninstallBlockMessage(candidate: UninstallCandidate): string {
    const block = candidate.block;
    switch (block?.kind) {
        case 'protected':
            return `${candidate.id} is part of DITA-OT and cannot be removed here.`;
        case 'required': {
            const one = block.dependents.length === 1;
            return `${candidate.id} cannot be removed: ${block.dependents.join(', ')} ${one ? 'depends' : 'depend'} on it. `
                + `Remove ${one ? 'it' : 'them'} first.`;
        }
        case 'not-in-plugins-folder':
            return block.folder
                ? `${candidate.id} is in ${block.folder}, which dita uninstall does not remove.`
                : `${candidate.id} was not found in the plugins folder of DITA-OT.`;
        default:
            return '';
    }
}

/** Returns the selected version, undefined for latest, or null when cancelled. */
async function pickVersion(entry: RegistryPlugin): Promise<string | undefined | null> {
    if (entry.versions.length === 0) {
        return undefined;
    }
    const items = [
        { label: LATEST_LABEL, description: entry.versions[0], version: undefined as string | undefined },
        ...entry.versions.map(version => ({ label: version, description: '', version: version as string | undefined }))
    ];
    const selected = await vscode.window.showQuickPick(items, { placeHolder: `Select a version of ${entry.id}` });
    return selected === undefined ? null : selected.version;
}
