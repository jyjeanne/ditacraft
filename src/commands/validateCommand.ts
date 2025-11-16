/**
 * Validate Command
 * Validates DITA files for XML syntax and DITA conformance
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { DitaValidator } from '../providers/ditaValidator';

// Global validator instance
let validator: DitaValidator | undefined;
let extensionContext: vscode.ExtensionContext | undefined;

/**
 * Initialize the validator
 */
export function initializeValidator(context: vscode.ExtensionContext): void {
    extensionContext = context;
    validator = new DitaValidator(context);
    context.subscriptions.push(validator);

    // Auto-validate on save if enabled
    const autoValidateEnabled = vscode.workspace.getConfiguration('ditacraft').get<boolean>('autoValidate', true);

    if (autoValidateEnabled) {
        context.subscriptions.push(
            vscode.workspace.onDidSaveTextDocument(async (document) => {
                const ext = path.extname(document.uri.fsPath).toLowerCase();
                if (['.dita', '.ditamap', '.bookmap'].includes(ext)) {
                    await validator?.validateFile(document.uri);
                }
            })
        );
    }
}

/**
 * Command: ditacraft.validate
 * Validates the current DITA file
 */
export async function validateCommand(uri?: vscode.Uri): Promise<void> {
    try {
        // Get the file URI
        const fileUri = uri || vscode.window.activeTextEditor?.document.uri;

        if (!fileUri) {
            vscode.window.showErrorMessage('No DITA file is currently open');
            return;
        }

        // Verify it's a DITA file
        const ext = path.extname(fileUri.fsPath).toLowerCase();
        if (!['.dita', '.ditamap', '.bookmap'].includes(ext)) {
            vscode.window.showWarningMessage('Current file is not a DITA file');
            return;
        }

        // Initialize validator if not already done
        if (!validator) {
            validator = new DitaValidator(extensionContext);
        }

        // Show progress
        const result = await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Validating DITA file",
            cancellable: false
        }, async (progress) => {
            progress.report({ increment: 0, message: "Reading file..." });

            // Validate the file - validator is guaranteed to be defined here
            if (!validator) {
                throw new Error('Validator failed to initialize');
            }
            const validationResult = await validator.validateFile(fileUri);

            progress.report({ increment: 100, message: "Complete" });

            return validationResult;
        });

        // Show summary message
        const fileName = path.basename(fileUri.fsPath);
        const errorCount = result.errors.length;
        const warningCount = result.warnings.length;

        if (result.valid && errorCount === 0 && warningCount === 0) {
            vscode.window.showInformationMessage(`✓ No issues found in ${fileName}`);
        } else if (errorCount === 0) {
            vscode.window.showInformationMessage(
                `✓ Validation complete: ${fileName} (${warningCount} warning${warningCount !== 1 ? 's' : ''})`
            );
        } else {
            vscode.window.showWarningMessage(
                `⚠ Validation complete: ${fileName} (${errorCount} error${errorCount !== 1 ? 's' : ''}, ${warningCount} warning${warningCount !== 1 ? 's' : ''})`
            );
        }

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Validation failed: ${errorMessage}`);
    }
}

/**
 * Get the validator instance
 */
export function getValidator(): DitaValidator | undefined {
    return validator;
}
