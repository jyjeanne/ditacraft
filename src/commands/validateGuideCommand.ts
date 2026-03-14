/**
 * Validate Guide Command
 * Runs DITA-OT against the root map for full end-to-end guide validation.
 * Results displayed in a WebView report panel and the Problems panel.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import { promises as fsPromises } from 'fs';
import { DitaOtWrapper } from '../utils/ditaOtWrapper';
import { parseDitaOtOutput, getDitaOtDiagnostics } from '../utils/ditaOtErrorParser';
import { logger } from '../utils/logger';
import { ValidationReportPanel, ValidationReport, ValidationIssue } from '../providers/validationReportPanel';
import type { DitaOtError } from '../utils/ditaOtErrorParser';
import { lookupErrorCode, getModuleForCode } from '../utils/ditaOtErrorCodes';

/** Guard context returned when all prerequisites pass. */
interface GuideValidationContext {
    rootMapPath: string;
    ditaOtVersion: string;
    ditaOt: DitaOtWrapper;
}

/** Prevents concurrent executions. */
let isValidating = false;

/**
 * Command entry point: ditacraft.validateGuide
 */
export async function validateGuideCommand(context: vscode.ExtensionContext): Promise<void> {
    if (isValidating) {
        vscode.window.showInformationMessage('DITA-OT guide validation is already in progress.');
        return;
    }

    isValidating = true;
    try {
        await executeValidation(context);
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Guide validation failed', error);
        vscode.window.showErrorMessage(`Guide validation failed: ${msg}`);
    } finally {
        isValidating = false;
    }
}

/**
 * Check prerequisites: DITA-OT installed and root map set.
 */
async function validateGuidePrerequisites(): Promise<GuideValidationContext | null> {
    // 1. Check DITA-OT installation
    const ditaOt = new DitaOtWrapper();
    const installation = await ditaOt.verifyInstallation();
    if (!installation.installed) {
        const action = await vscode.window.showErrorMessage(
            'Command not available: DITA-OT must be installed and configured.',
            'Configure Now'
        );
        if (action === 'Configure Now') {
            await vscode.commands.executeCommand(
                'workbench.action.openSettings', 'ditacraft.ditaOtPath'
            );
        }
        return null;
    }

    // 2. Check root map
    const config = vscode.workspace.getConfiguration('ditacraft');
    const rootMap = config.get<string>('rootMap', '');
    if (!rootMap) {
        const action = await vscode.window.showErrorMessage(
            'Command not available: a root map must be set.',
            'Set Root Map'
        );
        if (action === 'Set Root Map') {
            await vscode.commands.executeCommand('ditacraft.setRootMap');
        }
        return null;
    }

    // 3. Resolve to absolute path
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showWarningMessage('No workspace folder open.');
        return null;
    }
    const rootMapPath = vscode.Uri.joinPath(workspaceFolders[0].uri, rootMap).fsPath;

    // 4. Verify root map file exists
    try {
        await vscode.workspace.fs.stat(vscode.Uri.file(rootMapPath));
    } catch {
        const action = await vscode.window.showErrorMessage(
            `Root map file not found: ${rootMap}.`,
            'Set Root Map'
        );
        if (action === 'Set Root Map') {
            await vscode.commands.executeCommand('ditacraft.setRootMap');
        }
        return null;
    }

    return {
        rootMapPath,
        ditaOtVersion: installation.version ?? 'unknown',
        ditaOt,
    };
}

/**
 * Core validation logic: select transtype, run DITA-OT, parse output, show report.
 */
async function executeValidation(context: vscode.ExtensionContext): Promise<void> {
    // Prerequisites
    const prereqs = await validateGuidePrerequisites();
    if (!prereqs) {
        return;
    }
    const { rootMapPath, ditaOtVersion, ditaOt } = prereqs;
    const rootMapDir = path.dirname(rootMapPath);

    // Select transtype
    const transtypes = await ditaOt.getAvailableTranstypes();
    const transtype = transtypes.includes('dita') ? 'dita' : 'html5';

    // Create temp directory for output
    const tempDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'ditacraft-validate-'));

    try {
        // Run DITA-OT with progress
        const startTime = Date.now();

        const result = await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'DITA-OT: Validating guide...',
                cancellable: false,
            },
            async (progress) => {
                return await ditaOt.publish(
                    {
                        inputFile: rootMapPath,
                        transtype,
                        outputDir: tempDir,
                    },
                    (publishProgress) => {
                        progress.report({
                            increment: publishProgress.percentage,
                            message: publishProgress.message,
                        });
                    }
                );
            }
        );

        const duration = Date.now() - startTime;

        // Parse DITA-OT output
        const parsed = parseDitaOtOutput(result.output ?? '', rootMapDir);

        // Map to ValidationIssues
        const issues: ValidationIssue[] = [
            ...mapToValidationIssues(parsed.errors, rootMapDir),
            ...mapToValidationIssues(parsed.warnings, rootMapDir),
            ...mapToValidationIssues(parsed.infos, rootMapDir),
        ];

        const filesAffected = new Set(
            issues.filter(i => i.file).map(i => i.file)
        ).size;

        // Build report
        const workspaceFolders = vscode.workspace.workspaceFolders;
        const rootMapRelative = workspaceFolders
            ? vscode.workspace.asRelativePath(vscode.Uri.file(rootMapPath))
            : path.basename(rootMapPath);

        const report: ValidationReport = {
            rootMap: rootMapRelative,
            rootMapAbsolute: rootMapPath,
            ditaOtVersion,
            transtype,
            timestamp: new Date().toISOString(),
            duration,
            success: parsed.buildSuccessful,
            summary: {
                errors: parsed.errors.length,
                warnings: parsed.warnings.length,
                info: parsed.infos.length,
                total: issues.length,
                filesAffected,
            },
            issues,
        };

        // Populate Problems panel
        const diagnostics = getDitaOtDiagnostics();
        diagnostics.updateFromParsedOutput(parsed, vscode.Uri.file(rootMapPath));

        // Show WebView report
        ValidationReportPanel.createOrShow(context.extensionUri, report);

        // Log summary
        logger.info('Guide validation complete', {
            rootMap: rootMapRelative,
            transtype,
            duration,
            errors: parsed.errors.length,
            warnings: parsed.warnings.length,
            success: parsed.buildSuccessful,
        });

    } finally {
        // Clean up temp directory
        try {
            await fsPromises.rm(tempDir, { recursive: true, force: true });
        } catch (cleanupError) {
            logger.warn('Failed to clean up temp directory', { tempDir, cleanupError });
        }
    }
}

/**
 * Map DitaOtError[] to ValidationIssue[].
 */
function mapToValidationIssues(
    errors: DitaOtError[],
    baseDir: string
): ValidationIssue[] {
    return errors.map(e => {
        const codeInfo = lookupErrorCode(e.code);
        return {
            severity: e.severity,
            code: e.code,
            message: e.message,
            file: e.filePath
                ? path.relative(baseDir, path.resolve(baseDir, e.filePath))
                : undefined,
            absolutePath: e.filePath
                ? path.resolve(baseDir, e.filePath)
                : undefined,
            line: e.line,
            column: e.column,
            description: codeInfo?.description,
            module: getModuleForCode(e.code),
        };
    });
}
