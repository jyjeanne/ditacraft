/**
 * `ditacraft.ai.enabled` — the master switch of DITA Craft AI.
 *
 * Off, every AI feature stays silent: no provider probing or "no provider" warning at startup,
 * no AI completions or quick fixes, and the @ditacraft chat participant and the Restructure Map
 * command answer that AI is turned off. The Configure AI Settings panel stays available.
 */

import * as vscode from 'vscode';

export const AI_ENABLED_SETTING = 'ditacraft.ai.enabled';

export const AI_DISABLED_MESSAGE =
    `DITA Craft AI is turned off. Turn on the ${AI_ENABLED_SETTING} setting to use it.`;

export function isAiEnabled(): boolean {
    return vscode.workspace.getConfiguration('ditacraft.ai').get<boolean>('enabled', true);
}

/** Says that AI is turned off, with a button to the setting. */
export async function showAiDisabledMessage(): Promise<void> {
    const openSetting = 'Open Setting';
    if (await vscode.window.showInformationMessage(AI_DISABLED_MESSAGE, openSetting) === openSetting) {
        await vscode.commands.executeCommand('workbench.action.openSettings', AI_ENABLED_SETTING);
    }
}
