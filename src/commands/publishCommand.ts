/**
 * Publish Commands
 * Handles publishing DITA content to various formats using DITA-OT
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { DitaOtWrapper } from '../utils/ditaOtWrapper';

/**
 * Command: ditacraft.publish
 * Shows format picker and publishes to selected format
 */
export async function publishCommand(uri?: vscode.Uri): Promise<void> {
    try {
        // Get the file URI
        const fileUri = uri || vscode.window.activeTextEditor?.document.uri;

        if (!fileUri) {
            vscode.window.showErrorMessage('No DITA file is currently open');
            return;
        }

        const filePath = fileUri.fsPath;

        // Check if filePath is valid and not empty
        if (!filePath || filePath.trim() === '') {
            vscode.window.showErrorMessage('Invalid file path. Please open a DITA file.');
            return;
        }

        // Initialize DITA-OT wrapper
        const ditaOt = new DitaOtWrapper();

        // Validate input file FIRST before checking DITA-OT
        const validation = ditaOt.validateInputFile(filePath);
        if (!validation.valid) {
            vscode.window.showErrorMessage(`Cannot publish: ${validation.error}`);
            return;
        }

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
            return;
        }

        // Get available transtypes
        const transtypes = await ditaOt.getAvailableTranstypes();

        // Show quick pick for format selection
        const selectedTranstype = await vscode.window.showQuickPick(transtypes, {
            placeHolder: 'Select output format',
            title: 'DITA Publishing Format',
            matchOnDescription: true,
            canPickMany: false
        });

        if (!selectedTranstype) {
            return; // User cancelled
        }

        // Execute publishing
        await executePublish(filePath, selectedTranstype, ditaOt);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Publishing failed: ${errorMessage}`);
    }
}

/**
 * Command: ditacraft.publishHTML5
 * Quick publish to HTML5 format (no format selection)
 */
export async function publishHTML5Command(uri?: vscode.Uri): Promise<void> {
    try {
        // Get the file URI
        const fileUri = uri || vscode.window.activeTextEditor?.document.uri;

        if (!fileUri) {
            vscode.window.showErrorMessage('No DITA file is currently open');
            return;
        }

        const filePath = fileUri.fsPath;

        // Check if filePath is valid and not empty
        if (!filePath || filePath.trim() === '') {
            vscode.window.showErrorMessage('Invalid file path. Please open a DITA file.');
            return;
        }

        // Initialize DITA-OT wrapper
        const ditaOt = new DitaOtWrapper();

        // Validate input file FIRST before checking DITA-OT
        const validation = ditaOt.validateInputFile(filePath);
        if (!validation.valid) {
            vscode.window.showErrorMessage(`Cannot publish: ${validation.error}`);
            return;
        }

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
            return;
        }

        // Execute publishing to HTML5
        await executePublish(filePath, 'html5', ditaOt);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Publishing failed: ${errorMessage}`);
    }
}

/**
 * Internal function to execute publishing with progress tracking
 */
async function executePublish(
    inputFile: string,
    transtype: string,
    ditaOt: DitaOtWrapper
): Promise<void> {
    const fileName = path.basename(inputFile, path.extname(inputFile));
    const outputDir = path.join(ditaOt.getOutputDirectory(), transtype, fileName);

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Publishing to ${transtype.toUpperCase()}`,
        cancellable: false
    }, async (progress) => {

        // Publish using DITA-OT
        const result = await ditaOt.publish({
            inputFile: inputFile,
            transtype: transtype,
            outputDir: outputDir
        }, (publishProgress) => {
            // Update VS Code progress
            progress.report({
                increment: publishProgress.percentage,
                message: publishProgress.message
            });
        });

        if (result.success) {
            // Show success notification with action
            const buttons = transtype === 'html5'
                ? ['Open Output Folder', 'Show Preview']
                : ['Open Output Folder'];

            const action = await vscode.window.showInformationMessage(
                `✓ Published successfully to ${transtype}`,
                ...buttons
            );

            if (action === 'Open Output Folder') {
                vscode.env.openExternal(vscode.Uri.file(result.outputPath));
            } else if (action === 'Show Preview') {
                // Open preview for HTML5
                vscode.commands.executeCommand('ditacraft.previewHTML5', vscode.Uri.file(inputFile));
            }
        } else {
            // Show error
            const viewOutput = await vscode.window.showErrorMessage(
                `Publishing failed: ${result.error}`,
                'View Output'
            );

            if (viewOutput === 'View Output') {
                // TODO: Show output channel with detailed error
                vscode.window.showErrorMessage(result.error || 'Unknown error');
            }
        }
    });
}
