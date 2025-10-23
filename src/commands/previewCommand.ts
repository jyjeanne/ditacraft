/**
 * Preview Command
 * Shows HTML5 preview of DITA content in WebView panel
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { DitaOtWrapper } from '../utils/ditaOtWrapper';

/**
 * Command: ditacraft.previewHTML5
 * Shows HTML5 preview in WebView panel
 */
export async function previewHTML5Command(uri?: vscode.Uri): Promise<void> {
    try {
        // Get the file URI
        const fileUri = uri || vscode.window.activeTextEditor?.document.uri;

        if (!fileUri) {
            vscode.window.showErrorMessage('No DITA file is currently open');
            return;
        }

        const filePath = fileUri.fsPath;

        // Initialize DITA-OT wrapper
        const ditaOt = new DitaOtWrapper();

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

        // Validate input file
        const validation = ditaOt.validateInputFile(filePath);
        if (!validation.valid) {
            vscode.window.showErrorMessage(`Cannot preview: ${validation.error}`);
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
        const htmlFiles = files.filter(f => f.endsWith('.html'));

        if (htmlFiles.length > 0) {
            return path.join(outputDir, htmlFiles[0]);
        }
    } catch (error) {
        // Directory doesn't exist or can't be read
    }

    return null;
}
