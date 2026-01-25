/**
 * XMLLint Validation Engine
 * P2-1: External xmllint-based XML validation
 */

import * as path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as vscode from 'vscode';
import { IValidationEngine } from './validationEngineBase';
import { ValidationResult, ValidationError, createEmptyResult } from './validationTypes';
import { fireAndForget } from '../../utils/errorUtils';

const execFileAsync = promisify(execFile);

/**
 * Validation engine that uses external xmllint tool
 */
export class XmllintEngine implements IValidationEngine {
    public readonly name = 'xmllint';
    private _isAvailable: boolean = true;
    private hasShownWarning: boolean = false;

    /**
     * Callback for when xmllint is not available
     * @param content - The content that was being validated
     * @param filePath - The file path that was being validated
     */
    public onNotAvailable?: (content: string, filePath: string) => Promise<ValidationResult>;

    public get isAvailable(): boolean {
        return this._isAvailable;
    }

    /**
     * Validate using xmllint (external tool)
     */
    public async validate(content: string, filePath: string): Promise<ValidationResult> {
        try {
            // Use execFile to avoid command injection
            await execFileAsync('xmllint', ['--noout', filePath], {
                cwd: path.dirname(filePath)
            });

            // No errors
            return createEmptyResult();

        } catch (error: unknown) {
            return this.handleXmllintError(error, content, filePath);
        }
    }

    /**
     * Handle xmllint execution errors
     */
    private async handleXmllintError(error: unknown, content: string, filePath: string): Promise<ValidationResult> {
        // Safe error type extraction with Buffer handling
        const err = error && typeof error === 'object' ? error as Record<string, unknown> : {};
        const errCode = typeof err.code === 'string' ? err.code : undefined;
        const errMessage = typeof err.message === 'string' ? err.message : undefined;
        const errStderr = this.extractStringFromOutput(err.stderr);
        const errStdout = this.extractStringFromOutput(err.stdout);

        // Check if xmllint is not installed
        if (errCode === 'ENOENT' || errMessage?.includes('not found')) {
            this._isAvailable = false;
            this.showXmllintWarning();

            // Fall back if callback is provided
            if (this.onNotAvailable) {
                return this.onNotAvailable(content, filePath);
            }

            return createEmptyResult();
        }

        // Check if error is related to missing DTDs
        const stderrOutput = errStderr || errStdout;
        if (stderrOutput.includes('failed to load external entity') ||
            stderrOutput.includes('Could not load DTD') ||
            stderrOutput.includes('validity error')) {
            // DTD validation issues - fall back
            if (this.onNotAvailable) {
                return this.onNotAvailable(content, filePath);
            }
            return createEmptyResult();
        }

        // Parse xmllint errors (real XML syntax errors)
        const errors = this.parseXmllintErrors(stderrOutput);

        return {
            valid: errors.length === 0,
            errors: errors,
            warnings: []
        };
    }

    /**
     * Show warning when xmllint is not available
     */
    private showXmllintWarning(): void {
        if (this.hasShownWarning) {
            return;
        }
        this.hasShownWarning = true;

        fireAndForget(
            (async () => {
                const action = await vscode.window.showWarningMessage(
                    'xmllint not found. Switching to built-in validation. Install libxml2 or change validation engine in settings.',
                    'Change Engine'
                );
                if (action === 'Change Engine') {
                    await vscode.commands.executeCommand('workbench.action.openSettings', 'ditacraft.validationEngine');
                }
            })(),
            'xmllint-warning'
        );
    }

    /**
     * Extract string from stdout/stderr output (handles both string and Buffer)
     */
    private extractStringFromOutput(output: unknown): string {
        if (typeof output === 'string') {
            return output;
        }
        if (Buffer.isBuffer(output)) {
            return output.toString('utf8');
        }
        return '';
    }

    /**
     * Parse xmllint error output
     */
    private parseXmllintErrors(output: string): ValidationError[] {
        const errors: ValidationError[] = [];
        const lines = output.split('\n');

        // xmllint error format: filename:line:column: type: message
        const errorRegex = /^(.+):(\d+):(\d+):\s*(error|warning|info):\s*(.+)$/;

        for (const line of lines) {
            const match = line.match(errorRegex);
            if (match) {
                errors.push({
                    line: parseInt(match[2], 10) - 1, // VS Code uses 0-based line numbers
                    column: parseInt(match[3], 10) - 1,
                    severity: match[4] as 'error' | 'warning' | 'info',
                    message: match[5].trim(),
                    source: 'xmllint'
                });
            }
        }

        return errors;
    }
}
