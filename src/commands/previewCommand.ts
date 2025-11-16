/**
 * Preview Command
 * Shows HTML5 preview of DITA content in WebView panel
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { DitaOtWrapper } from '../utils/ditaOtWrapper';
import { logger } from '../utils/logger';

/**
 * Command: ditacraft.previewHTML5
 * Shows HTML5 preview in WebView panel
 */
export async function previewHTML5Command(uri?: vscode.Uri): Promise<void> {
    try {
        // Get the file URI - be very explicit about getting the actual document
        let fileUri: vscode.Uri | undefined = uri;

        // If no URI was passed, get it from the active editor
        if (!fileUri && vscode.window.activeTextEditor) {
            fileUri = vscode.window.activeTextEditor.document.uri;
            logger.debug('Using active editor document URI');
        }

        if (!fileUri) {
            vscode.window.showErrorMessage('No DITA file is currently open. Please open a DITA file first.');
            return;
        }

        // Log URI details for debugging
        logger.debug('Preview command debug info', {
            uriProvidedAsParameter: uri ? 'Yes' : 'No',
            uriScheme: fileUri.scheme,
            uriPath: fileUri.path,
            uriFsPath: fileUri.fsPath,
            uriToString: fileUri.toString()
        });

        // Get the file system path
        const filePath = fileUri.fsPath;

        // Check if filePath is valid and not empty
        if (!filePath || filePath.trim() === '') {
            vscode.window.showErrorMessage('Invalid file path. Please open a DITA file.');
            return;
        }

        // Additional check: ensure path ends with a file (has extension)
        if (filePath.endsWith('\\') || filePath.endsWith('/')) {
            logger.error('Path ends with directory separator', { filePath });
            vscode.window.showErrorMessage('The path appears to be a directory, not a file. Please open a specific DITA file.');
            return;
        }

        // Check if this is actually a file with an extension
        const hasExtension = path.extname(filePath) !== '';
        if (!hasExtension) {
            logger.error('Path has no file extension', { filePath });
            vscode.window.showErrorMessage('The path does not appear to be a file. Please open a DITA file (.dita, .ditamap, or .bookmap).');
            return;
        }

        logger.debug('File extension validated', { extension: path.extname(filePath) });

        // Initialize DITA-OT wrapper
        const ditaOt = new DitaOtWrapper();

        // Validate input file FIRST before checking DITA-OT
        const validation = ditaOt.validateInputFile(filePath);
        if (!validation.valid) {
            vscode.window.showErrorMessage(`Cannot preview: ${validation.error}`);
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

        // Generate HTML5 output
        const fileName = path.basename(filePath, path.extname(filePath));
        const outputDir = path.join(ditaOt.getOutputDirectory(), 'html5', fileName);

        // Check if preview already exists
        let needsPublish = true;
        if (fs.existsSync(outputDir)) {
            const fileStats = fs.statSync(filePath);
            const outputStats = fs.statSync(outputDir);

            // If output is newer than source, use cached version
            if (outputStats.mtime > fileStats.mtime) {
                needsPublish = false;
            }
        }

        // Publish to HTML5 if needed
        if (needsPublish) {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Generating HTML5 preview",
                cancellable: false
            }, async (progress) => {

                const result = await ditaOt.publish({
                    inputFile: filePath,
                    transtype: 'html5',
                    outputDir: outputDir
                }, (publishProgress) => {
                    progress.report({
                        increment: publishProgress.percentage,
                        message: publishProgress.message
                    });
                });

                if (!result.success) {
                    throw new Error(result.error || 'Failed to generate preview');
                }
            });
        }

        // Find the main HTML file
        const htmlFile = findMainHtmlFile(outputDir, fileName);

        if (!htmlFile) {
            vscode.window.showErrorMessage('Could not find generated HTML file');
            return;
        }

        // Create and show WebView panel
        // TODO: This will be implemented in previewPanel.ts
        // For now, open in external browser
        const htmlUri = vscode.Uri.file(htmlFile);
        await vscode.env.openExternal(htmlUri);

        vscode.window.showInformationMessage('Preview opened in browser');

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Preview failed', error);
        vscode.window.showErrorMessage(`Preview failed: ${errorMessage}`);
    }
}

/**
 * Find the main HTML file in the output directory
 */
function findMainHtmlFile(outputDir: string, baseName: string): string | null {
    // Try common patterns
    const patterns = [
        `${baseName}.html`,
        'index.html',
        path.join('index.html')
    ];

    for (const pattern of patterns) {
        const fullPath = path.join(outputDir, pattern);
        if (fs.existsSync(fullPath)) {
            return fullPath;
        }
    }

    // Fallback: find any .html file
    try {
        const files = fs.readdirSync(outputDir);
        const htmlFiles = files.filter((f: string) => f.endsWith('.html'));

        if (htmlFiles.length > 0) {
            return path.join(outputDir, htmlFiles[0]);
        }
    } catch (_error) {
        // Directory doesn't exist or can't be read
    }

    return null;
}
