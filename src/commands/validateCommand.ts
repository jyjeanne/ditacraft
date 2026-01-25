/**
 * Validate Command
 * Validates DITA files for XML syntax and DITA conformance
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { DitaValidator } from '../providers/ditaValidator';
import { configManager } from '../utils/configurationManager';
import { createRateLimiter, RateLimiter } from '../utils/rateLimiter';

// Global validator instance
let validator: DitaValidator | undefined;
let extensionContext: vscode.ExtensionContext | undefined;

// Rate limiter for validation requests (P3-6: DoS protection)
let validationRateLimiter: RateLimiter | undefined;

// Debounce timers for validation (per file)
const validationDebounceTimers: Map<string, NodeJS.Timeout> = new Map();

/**
 * Get the validation debounce delay from configuration
 * P1-4 Fix: Use centralized configManager
 */
function getValidationDebounceMs(): number {
    return configManager.get('validationDebounceMs');
}

/**
 * Check if auto-validation is enabled (reads fresh value)
 * P1-4 Fix: Use centralized configManager
 */
function isAutoValidateEnabled(): boolean {
    return configManager.get('autoValidate');
}

/**
 * Initialize the validator
 */
export function initializeValidator(context: vscode.ExtensionContext): void {
    extensionContext = context;
    validator = new DitaValidator(context);
    context.subscriptions.push(validator);

    // Initialize rate limiter (P3-6: DoS protection)
    validationRateLimiter = createRateLimiter('VALIDATION');
    context.subscriptions.push(validationRateLimiter);

    // Register save listener - checks autoValidate dynamically on each save
    // This allows the setting to be changed without extension reload
    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument(async (document) => {
            // Check autoValidate setting dynamically (allows runtime changes)
            if (!isAutoValidateEnabled()) {
                return;
            }

            const ext = path.extname(document.uri.fsPath).toLowerCase();
            if (['.dita', '.ditamap', '.bookmap'].includes(ext)) {
                const filePath = document.uri.fsPath;

                // Clear existing timer for this file
                const existingTimer = validationDebounceTimers.get(filePath);
                if (existingTimer) {
                    clearTimeout(existingTimer);
                }

                // Set new debounced validation
                const timer = setTimeout(async () => {
                    validationDebounceTimers.delete(filePath);

                    // P3-6: Check rate limit before validation
                    if (validationRateLimiter && !validationRateLimiter.isAllowed(filePath)) {
                        return; // Skip if rate limited
                    }

                    await validator?.validateFile(document.uri);
                }, getValidationDebounceMs());

                validationDebounceTimers.set(filePath, timer);
            }
        })
    );

    // Clean up debounce timers on deactivation
    context.subscriptions.push({
        dispose: () => {
            validationDebounceTimers.forEach(timer => clearTimeout(timer));
            validationDebounceTimers.clear();
        }
    });
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

        // P3-6: Check rate limit (allow manual validation to bypass with warning)
        if (validationRateLimiter && !validationRateLimiter.isAllowed(fileUri.fsPath)) {
            vscode.window.showWarningMessage('Validation rate limit exceeded. Please wait a moment.');
            return;
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

/**
 * Get the rate limiter instance (for testing)
 */
export function getValidationRateLimiter(): RateLimiter | undefined {
    return validationRateLimiter;
}

/**
 * Reset the rate limiter (for testing)
 * Clears all rate limit tracking without disposing the limiter
 */
export function resetValidationRateLimiter(): void {
    if (validationRateLimiter) {
        validationRateLimiter.resetAll();
    }
}
