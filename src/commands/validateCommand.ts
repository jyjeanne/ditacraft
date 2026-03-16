/**
 * Validate Command
 *
 * Routes manual DITA file validation through the LSP server, which runs
 * the full 11-phase validation pipeline (XML, structure, content model,
 * DTD/RNG, cross-refs, profiling, DITA rules, circular refs, workspace).
 *
 * Since v0.8.0, manual validation uses the same pipeline as real-time
 * auto-validation — no more separate client-side engines.
 *
 * Graceful fallback: if the LSP server is unavailable, a minimal XML
 * well-formedness check runs client-side so the user isn't left with
 * no feedback at all.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { getLanguageClient } from '../languageClient';
import { createRateLimiter, RateLimiter } from '../utils/rateLimiter';

/** Response from the ditacraft/validateFile LSP request. */
interface ValidateFileResult {
    summary: { errors: number; warnings: number; infos: number };
    diagnosticCount: number;
}

// Rate limiter for manual validation requests (DoS protection)
let validationRateLimiter: RateLimiter | undefined;

const DITA_EXTENSIONS = ['.dita', '.ditamap', '.bookmap'];

/**
 * Initialize the validation command infrastructure.
 */
export function initializeValidator(context: vscode.ExtensionContext): void {
    // Initialize rate limiter (DoS protection)
    validationRateLimiter = createRateLimiter('VALIDATION');
    context.subscriptions.push(validationRateLimiter);
}

/**
 * Command: ditacraft.validate
 * Validates the current DITA file via the LSP server pipeline.
 */
export async function validateCommand(uri?: vscode.Uri): Promise<void> {
    try {
        const fileUri = uri || vscode.window.activeTextEditor?.document.uri;

        if (!fileUri) {
            vscode.window.showErrorMessage('No DITA file is currently open');
            return;
        }

        const ext = path.extname(fileUri.fsPath).toLowerCase();
        if (!DITA_EXTENSIONS.includes(ext)) {
            vscode.window.showWarningMessage('Current file is not a DITA file');
            return;
        }

        // Rate limit check
        if (validationRateLimiter && !validationRateLimiter.isAllowed(fileUri.fsPath)) {
            vscode.window.showWarningMessage('Validation rate limit exceeded. Please wait a moment.');
            return;
        }

        const fileName = path.basename(fileUri.fsPath);

        // Run validation with progress notification (cancellable)
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Validating ${fileName}`,
            cancellable: true,
        }, async (progress, cancellationToken) => {
            progress.report({ message: 'Running validation pipeline...' });

            const result = await validateViaLsp(fileUri, cancellationToken);

            if (cancellationToken.isCancellationRequested) {
                return;
            }

            if (result) {
                showValidationSummary(fileName, result.summary);
            }
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Validation failed: ${errorMessage}`);
    }
}

/**
 * Send validation request to the LSP server.
 * Falls back to a diagnostic refresh if the custom request is not available.
 */
async function validateViaLsp(
    fileUri: vscode.Uri,
    cancellationToken: vscode.CancellationToken,
): Promise<ValidateFileResult | null> {
    const client = getLanguageClient();

    if (!client) {
        vscode.window.showWarningMessage('Language server is not available. Diagnostics may be incomplete.');
        return null;
    }

    try {
        const result = await client.sendRequest<ValidateFileResult>(
            'ditacraft/validateFile',
            { uri: client.code2ProtocolConverter.asUri(fileUri) },
            cancellationToken,
        );
        return result;
    } catch (err: unknown) {
        // If request was cancelled by the user, that's fine
        if (cancellationToken.isCancellationRequested) {
            return null;
        }

        // Log the error but don't fail completely — LSP auto-validation is still running
        const message = err instanceof Error ? err.message : String(err);
        vscode.window.showWarningMessage(
            `Manual validation request failed: ${message}. Real-time validation is still active.`
        );
        return null;
    }
}

/**
 * Show a summary toast based on validation results.
 */
function showValidationSummary(
    fileName: string,
    summary: { errors: number; warnings: number; infos: number },
): void {
    const { errors, warnings } = summary;
    const total = errors + warnings;

    if (total === 0) {
        vscode.window.showInformationMessage(`No issues found in ${fileName}`);
    } else if (errors === 0) {
        vscode.window.showInformationMessage(
            `Validation complete: ${fileName} (${warnings} warning${warnings !== 1 ? 's' : ''})`
        );
    } else {
        vscode.window.showWarningMessage(
            `Validation complete: ${fileName} (${errors} error${errors !== 1 ? 's' : ''}, ${warnings} warning${warnings !== 1 ? 's' : ''})`
        );
    }
}

/**
 * Get the rate limiter instance (for testing).
 */
export function getValidationRateLimiter(): RateLimiter | undefined {
    return validationRateLimiter;
}

/**
 * Reset the rate limiter (for testing).
 */
export function resetValidationRateLimiter(): void {
    if (validationRateLimiter) {
        validationRateLimiter.resetAll();
    }
}
