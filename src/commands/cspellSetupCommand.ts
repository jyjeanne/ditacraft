/**
 * cSpell Setup Command
 * Initializes cSpell configuration for DITA files
 */

import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Command: ditacraft.setupCSpell
 * Sets up cSpell configuration for DITA projects in the workspace
 * @param extensionPath - The root path of the extension (context.extensionPath)
 */
export async function setupCSpellCommand(extensionPath: string): Promise<void> {
    try {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage('No workspace folder open. Please open a workspace first.');
            return;
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const cspellConfigPath = path.join(workspaceRoot, '.cspellrc.json');
        const templatePath = path.join(extensionPath, '.cspellrc.json');

        // P1-1 Fix: Use async file operations
        // Check if .cspellrc.json already exists
        let configExists = false;
        try {
            await fs.access(cspellConfigPath);
            configExists = true;
        } catch {
            // File doesn't exist
        }

        if (configExists) {
            const choice = await vscode.window.showInformationMessage(
                '.cspellrc.json already exists in your workspace.',
                'Keep Current',
                'Replace with DitaCraft Config',
                'Open Existing File'
            );

            if (choice === 'Replace with DitaCraft Config') {
                // Read template and copy (async)
                const templateContent = await fs.readFile(templatePath, 'utf-8');
                await fs.writeFile(cspellConfigPath, templateContent);
                vscode.window.showInformationMessage(
                    'cSpell configuration updated with DitaCraft DITA vocabulary.'
                );
            } else if (choice === 'Open Existing File') {
                const document = await vscode.workspace.openTextDocument(cspellConfigPath);
                await vscode.window.showTextDocument(document);
            }
        } else {
            // Copy template file to workspace (async)
            const templateContent = await fs.readFile(templatePath, 'utf-8');
            await fs.writeFile(cspellConfigPath, templateContent);

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
