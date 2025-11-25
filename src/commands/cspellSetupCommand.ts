/**
 * cSpell Setup Command
 * Initializes cSpell configuration for DITA files
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Command: ditacraft.setupCSpell
 * Sets up cSpell configuration for DITA projects in the workspace
 */
export async function setupCSpellCommand(): Promise<void> {
    try {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage('No workspace folder open. Please open a workspace first.');
            return;
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const cspellConfigPath = path.join(workspaceRoot, '.cspellrc.json');
        const extensionPath = path.dirname(path.dirname(__dirname));
        const templatePath = path.join(extensionPath, '.cspellrc.json');

        // Check if .cspellrc.json already exists
        if (fs.existsSync(cspellConfigPath)) {
            const choice = await vscode.window.showInformationMessage(
                '.cspellrc.json already exists in your workspace.',
                'Keep Current',
                'Replace with DitaCraft Config',
                'Open Existing File'
            );

            if (choice === 'Replace with DitaCraft Config') {
                // Read template and copy
                const templateContent = fs.readFileSync(templatePath, 'utf-8');
                fs.writeFileSync(cspellConfigPath, templateContent);
                vscode.window.showInformationMessage(
                    'cSpell configuration updated with DitaCraft DITA vocabulary.'
                );
            } else if (choice === 'Open Existing File') {
                const document = await vscode.workspace.openTextDocument(cspellConfigPath);
                await vscode.window.showTextDocument(document);
            }
        } else {
            // Copy template file to workspace
            const templateContent = fs.readFileSync(templatePath, 'utf-8');
            fs.writeFileSync(cspellConfigPath, templateContent);

            const choice = await vscode.window.showInformationMessage(
                'cSpell configuration created with DITA vocabulary! Would you like to install cSpell extension if not already installed?',
                'Install cSpell',
                'Open Config File',
                'Done'
            );

            if (choice === 'Install cSpell') {
                await vscode.commands.executeCommand(
                    'workbench.extensions.installExtension',
                    'streetsidesoftware.code-spell-checker'
                );
                vscode.window.showInformationMessage(
                    '.cspellrc.json created in your workspace root with DITA vocabulary support.'
                );
            } else if (choice === 'Open Config File') {
                const document = await vscode.workspace.openTextDocument(cspellConfigPath);
                await vscode.window.showTextDocument(document);
            } else {
                vscode.window.showInformationMessage(
                    '.cspellrc.json created in your workspace root with DITA vocabulary support.'
                );
            }
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Failed to setup cSpell: ${errorMessage}`);
        console.error('cSpell setup error:', error);
    }
}
