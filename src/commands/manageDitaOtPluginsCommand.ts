/**
 * Manage DITA-OT Plugins Command
 * Lists installed DITA-OT plugins and installs plugins from the DITA-OT plugin registry.
 */

import * as vscode from 'vscode';
import { DitaOtWrapper } from '../utils/ditaOtWrapper';
import { configManager } from '../utils/configurationManager';
import { getDitaOtOutputChannel } from '../utils/ditaOtOutputChannel';
import { getErrorMessage } from '../utils/errorUtils';
import { logger } from '../utils/logger';
import {
    fetchRegistryCatalog,
    installPlugin,
    listInstalledPlugins,
    RegistryPlugin
} from '../utils/ditaOtPluginManager';

const ACTION_LIST = 'list';
const ACTION_INSTALL = 'install';
const LATEST_LABEL = 'Latest';
const SHOW_OUTPUT = 'Show Output';
const LIST_PLUGINS = 'List Installed Plugins';

/**
 * Command: ditacraft.manageDitaOtPlugins
 */
export async function manageDitaOtPluginsCommand(): Promise<void> {
    try {
        const wrapper = new DitaOtWrapper();
        const verification = await wrapper.verifyInstallation();
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
                { label: 'Install plugin from registry', action: ACTION_INSTALL }
            ],
            { placeHolder: `DITA-OT ${verification.version ?? ''} plugins` }
        );
        if (!action) {
            return;
        }

        const run = (args: string[], onOutput?: (chunk: string) => void) => wrapper.runDitaCli(args, onOutput);
        if (action.action === ACTION_LIST) {
            await showInstalledPlugins(run);
        } else {
            await installFromRegistry(run);
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

async function installFromRegistry(run: Runner): Promise<void> {
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
