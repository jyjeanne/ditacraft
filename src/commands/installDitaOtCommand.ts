/**
 * Install DITA-OT Command
 * Downloads a DITA-OT release from GitHub, extracts it safely, verifies it and
 * points ditacraft.ditaOtPath at the new installation.
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { DitaOtWrapper } from '../utils/ditaOtWrapper';
import { configManager } from '../utils/configurationManager';
import { substituteWorkspaceFolderVar } from '../utils/pathUtils';
import { getErrorMessage } from '../utils/errorUtils';
import { logger } from '../utils/logger';
import {
    fetchDitaOtVersions,
    installDitaOt,
    isValidDitaOtVersion,
    verifyDitaOtAt,
    isWritableDirectory
} from '../utils/ditaOtInstaller';
import { deepInstallFolderWarning } from '../utils/ditaOtLaunch';

const DOWNLOAD_TIMEOUT_MS = 10 * 60 * 1000;
const RUN_PUBLISH_ACTION = 'Run Publish';
const CHOOSE_ANOTHER_FOLDER = 'Choose Another Folder';
const INSTALL_ANYWAY = 'Install Anyway';

/**
 * Command: ditacraft.installDitaOT
 * Installs DITA-OT into a chosen folder and configures ditacraft.ditaOtPath.
 */
export async function installDitaOtCommand(): Promise<void> {
    try {
        const version = await pickVersion();
        if (!version) {
            return;
        }

        let targetDir = await pickTargetDirectory();
        if (!targetDir) {
            return;
        }
        // On Windows, DITA-OT may not run from a deep folder: its command line grows with the path.
        let warning = deepInstallFolderWarning(targetDir, version);
        while (warning) {
            const choice = await vscode.window.showWarningMessage(warning, { modal: true }, CHOOSE_ANOTHER_FOLDER, INSTALL_ANYWAY);
            if (choice === INSTALL_ANYWAY) {
                break;
            }
            if (choice !== CHOOSE_ANOTHER_FOLDER) {
                return;
            }
            targetDir = await pickTargetDirectory(true);
            if (!targetDir) {
                return;
            }
            warning = deepInstallFolderWarning(targetDir, version);
        }

        const installPath = path.join(targetDir, `dita-ot-${version}`);
        if (fs.existsSync(installPath)) {
            vscode.window.showErrorMessage(`Target already exists: ${installPath}. Choose another folder or remove it first.`);
            return;
        }

        const confirm = await vscode.window.showWarningMessage(
            `Install DITA-OT ${version} into ${targetDir}? The download is about 100 MB.`,
            { modal: true },
            'Install'
        );
        if (confirm !== 'Install') {
            return;
        }

        const installed = await vscode.window.withProgress(
            { location: vscode.ProgressLocation.Notification, title: `Installing DITA-OT ${version}`, cancellable: false },
            async progress => installDitaOt({
                version,
                targetDir,
                downloadTimeoutMs: DOWNLOAD_TIMEOUT_MS,
                onProgress: message => progress.report({ message }),
                verify: verifyDitaOtAt
            })
        );

        await applyInstalledPath(installed.installPath, installed.version);
    } catch (error: unknown) {
        logger.error('DITA-OT installation failed', { error });
        vscode.window.showErrorMessage(`DITA-OT installation failed: ${getErrorMessage(error)}`);
    }
}

async function pickVersion(): Promise<string | undefined> {
    const listing = await vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: 'Loading DITA-OT versions...' },
        () => fetchDitaOtVersions()
    );

    if (listing.source === 'fallback') {
        vscode.window.showWarningMessage('Could not reach GitHub; showing a built-in list of DITA-OT versions.');
    }

    const preferred = configManager.get('ditaOtPreferredVersion').trim();
    const versions = [...listing.versions];
    if (preferred && isValidDitaOtVersion(preferred) && !versions.includes(preferred)) {
        versions.unshift(preferred);
    }

    const latest = listing.versions[0];
    const items = versions.map(v => ({
        label: v,
        description: [
            v === latest ? 'latest' : '',
            v === preferred ? 'preferred' : ''
        ].filter(Boolean).join(', ') || undefined,
        version: v,
        picked: preferred ? v === preferred : v === latest
    }));

    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select a DITA-OT version to install',
        matchOnDescription: true
    });
    return selected?.version;
}

/** The install folder: the setting when there is one, unless `ignoreSetting`; otherwise a folder dialog. */
async function pickTargetDirectory(ignoreSetting = false): Promise<string | undefined> {
    const configured = ignoreSetting ? '' : substituteWorkspaceFolderVar(configManager.get('ditaOtInstallTargetDir').trim());
    if (configured) {
        if (!isWritableDirectory(configured)) {
            vscode.window.showErrorMessage(
                `Installation directory is not writable: ${configured}`
            );
            return undefined;
        }
        return configured;
    }

    const folders = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        openLabel: 'Select install folder'
    });
    const selected = folders?.[0]?.fsPath;
    if (!selected) {
        return undefined;
    }
    if (!isWritableDirectory(selected)) {
        vscode.window.showErrorMessage(`Installation directory is not writable: ${selected}`);
        return undefined;
    }
    return selected;
}

/**
 * Points ditaOtPath at the new installation and verifies it through the wrapper.
 * Rolls back the setting if the wrapper cannot verify the installation.
 */
async function applyInstalledPath(installPath: string, version: string): Promise<void> {
    const config = vscode.workspace.getConfiguration('ditacraft');
    const previousGlobal = config.inspect<string>('ditaOtPath')?.globalValue;

    await config.update('ditaOtPath', installPath, vscode.ConfigurationTarget.Global);

    const effectivePath = vscode.workspace.getConfiguration('ditacraft').get<string>('ditaOtPath', '');
    const wrapper = new DitaOtWrapper();
    wrapper.reloadConfiguration();
    const verification = effectivePath === installPath ? await wrapper.verifyInstallation() : undefined;
    if (!verification?.installed) {
        await config.update('ditaOtPath', previousGlobal, vscode.ConfigurationTarget.Global);
        wrapper.reloadConfiguration();
        if (verification?.problem) {
            vscode.window.showErrorMessage(`${verification.problem} The DITA-OT path setting was not changed.`);
            return;
        }
        const reason = effectivePath === installPath
            ? 'verification failed'
            : `a workspace or folder setting overrides it (${effectivePath || 'empty'})`;
        vscode.window.showErrorMessage(
            `DITA-OT ${version} was extracted to ${installPath}, but ${reason}. The DITA-OT path setting was not changed.`
        );
        return;
    }

    const choice = await vscode.window.showInformationMessage(
        `DITA-OT ${verification.version ?? version} installed at ${installPath} and set as the DITA-OT path.`,
        RUN_PUBLISH_ACTION
    );
    if (choice === RUN_PUBLISH_ACTION) {
        await vscode.commands.executeCommand('ditacraft.publish');
    }
}
