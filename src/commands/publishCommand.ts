/**
 * Publish Commands
 * Handles publishing DITA content to various formats using DITA-OT
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { DitaOtWrapper } from '../utils/ditaOtWrapper';
import { logger } from '../utils/logger';
import { fireAndForget } from '../utils/errorUtils';
import { parseDitaOtOutput, getDitaOtDiagnostics } from '../utils/ditaOtErrorParser';

/**
 * P1-5 Fix: Extracted shared validation logic for publish commands
 * Validates file path and DITA-OT installation before publishing
 * @returns DitaOtWrapper instance if validation passes, null if validation fails
 */
async function validateAndPrepareForPublish(uri?: vscode.Uri): Promise<{ ditaOt: DitaOtWrapper; filePath: string } | null> {
    // Get the file URI
    const fileUri = uri || vscode.window.activeTextEditor?.document.uri;

    if (!fileUri) {
        vscode.window.showErrorMessage('No DITA file is currently open');
        return null;
    }

    const filePath = fileUri.fsPath;

    // Check if filePath is valid and not empty
    if (!filePath || filePath.trim() === '') {
        vscode.window.showErrorMessage('Invalid file path. Please open a DITA file.');
        return null;
    }

    // Initialize DITA-OT wrapper
    const ditaOt = new DitaOtWrapper();

    // Validate input file FIRST before checking DITA-OT
    const validation = ditaOt.validateInputFile(filePath);
    if (!validation.valid) {
        vscode.window.showErrorMessage(`Cannot publish: ${validation.error}`);
        return null;
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
        return null;
    }

    return { ditaOt, filePath };
}

/**
 * Command: ditacraft.publish
 * Shows format picker and publishes to selected format
 */
export async function publishCommand(uri?: vscode.Uri): Promise<void> {
    try {
        // Validate file and DITA-OT installation
        const prepared = await validateAndPrepareForPublish(uri);
        if (!prepared) {
            return;
        }
        const { ditaOt, filePath } = prepared;

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
        // Validate file and DITA-OT installation
        const prepared = await validateAndPrepareForPublish(uri);
        if (!prepared) {
            return;
        }
        const { ditaOt, filePath } = prepared;

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

    // Clean output directory before publishing to avoid stale files
    // P1-1 Fix: Use async file operations
    const fsPromises = await import('fs/promises');
    try {
        await fsPromises.rm(outputDir, { recursive: true, force: true });
        logger.debug('Cleaned output directory', { outputDir });
    } catch (error) {
        // Directory might not exist or failed to remove - continue anyway
        const errorCode = (error as NodeJS.ErrnoException).code;
        if (errorCode !== 'ENOENT') {
            logger.warn('Failed to clean output directory', { outputDir, error });
        }
    }

    // Get the diagnostics manager (outside progress callback for clarity)
    const diagnostics = getDitaOtDiagnostics();

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
            // Clear any previous publishing errors
            diagnostics.clear();

            // Parse output for warnings even on success
            if (result.output) {
                const parsed = parseDitaOtOutput(result.output, path.dirname(inputFile));
                if (parsed.warnings.length > 0) {
                    diagnostics.updateFromParsedOutput(parsed, vscode.Uri.file(inputFile));
                    logger.info('Publishing completed with warnings', {
                        warningCount: parsed.warnings.length
                    });
                }
            }

            // Show success notification with action
            const buttons = transtype === 'html5'
                ? ['Open Output Folder', 'Show Preview']
                : ['Open Output Folder'];

            const action = await vscode.window.showInformationMessage(
                `✓ Published successfully to ${transtype}`,
                ...buttons
            );

            if (action === 'Open Output Folder') {
                fireAndForget(
                    Promise.resolve(vscode.env.openExternal(vscode.Uri.file(result.outputPath))),
                    'open-output-folder'
                );
            } else if (action === 'Show Preview') {
                // Open preview for HTML5
                fireAndForget(
                    vscode.commands.executeCommand('ditacraft.previewHTML5', vscode.Uri.file(inputFile)),
                    'open-preview'
                );
            }
        } else {
            // Log detailed error information
            logger.error('Publishing failed', {
                inputFile: inputFile,
                transtype: transtype,
                outputDir: outputDir,
                error: result.error
            });

            // Parse output and show errors in Problems panel
            if (result.output) {
                const parsed = parseDitaOtOutput(result.output, path.dirname(inputFile));
                diagnostics.updateFromParsedOutput(parsed, vscode.Uri.file(inputFile));

                logger.info('Parsed DITA-OT errors', {
                    errorCount: parsed.errors.length,
                    warningCount: parsed.warnings.length,
                    summary: parsed.summary
                });
            }

            // Show error with options
            const viewOutput = await vscode.window.showErrorMessage(
                `Publishing failed: ${result.error}`,
                'View Problems',
                'View Build Output',
                'View Logs'
            );

            if (viewOutput === 'View Problems') {
                // Focus the Problems panel
                await vscode.commands.executeCommand('workbench.actions.view.problems');
            } else if (viewOutput === 'View Build Output') {
                // Show the DITA-OT build output channel (syntax-highlighted)
                await vscode.commands.executeCommand('ditacraft.showBuildOutput');
            } else if (viewOutput === 'View Logs') {
                // Open the log file for detailed analysis
                logger.openLogFile();
            }
        }
    });
}
