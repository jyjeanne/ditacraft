/**
 * Element Navigator Utility
 * Provides functionality to navigate to specific elements within DITA files
 * by their @id attribute
 */

import * as vscode from 'vscode';
import { logger } from './logger';

/**
 * Find the line number of an element with a specific id in the document
 * Returns the line number (0-indexed) or -1 if not found
 */
export function findElementById(document: vscode.TextDocument, elementId: string): number {
    const text = document.getText();
    const lines = text.split('\n');

    // Pattern to match id="elementId" - handles various formats
    // Supports: id="value", id='value', id=value
    const idPattern = new RegExp(`\\bid\\s*=\\s*["']?${escapeRegExp(elementId)}["']?(?:\\s|>|/)`, 'i');

    for (let i = 0; i < lines.length; i++) {
        if (idPattern.test(lines[i])) {
            return i;
        }
    }

    return -1;
}

/**
 * Escape special regex characters in a string
 */
function escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Navigate to an element by its id in the current document or specified file
 * If elementPath contains '/', it's treated as topic_id/element_id format
 */
export async function navigateToElement(
    documentUri: vscode.Uri,
    elementPath: string
): Promise<boolean> {
    try {
        // Parse the element path (could be "element_id" or "topic_id/element_id")
        const parts = elementPath.split('/');
        const targetId = parts.length > 1 ? parts[parts.length - 1] : parts[0];

        logger.debug('Navigating to element', { documentUri: documentUri.fsPath, elementPath, targetId });

        // Open the document
        const document = await vscode.workspace.openTextDocument(documentUri);

        // Find the element line
        const lineNumber = findElementById(document, targetId);

        if (lineNumber === -1) {
            // Try alternative: if we have topic_id/element_id, try searching for just element_id
            if (parts.length > 1) {
                const topicId = parts[0];
                // Maybe the topic ID is what we need
                const topicLine = findElementById(document, topicId);
                if (topicLine !== -1) {
                    await showDocumentAtLine(document, topicLine);
                    logger.info('Navigated to topic element', { topicId, line: topicLine });
                    return true;
                }
            }

            logger.warn('Element not found in document', { targetId, documentUri: documentUri.fsPath });
            vscode.window.showWarningMessage(`Element with id="${targetId}" not found in document`);
            return false;
        }

        // Show the document and navigate to the line
        await showDocumentAtLine(document, lineNumber);

        logger.info('Successfully navigated to element', { targetId, line: lineNumber });
        return true;
    } catch (error) {
        logger.error('Failed to navigate to element', { error, documentUri: documentUri.fsPath, elementPath });
        vscode.window.showErrorMessage(`Failed to navigate to element: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return false;
    }
}

/**
 * Show the document at a specific line number and highlight it
 */
async function showDocumentAtLine(document: vscode.TextDocument, lineNumber: number): Promise<void> {
    // Open the document in the editor
    const editor = await vscode.window.showTextDocument(document, {
        preview: false,
        preserveFocus: false
    });

    // Create a range for the target line
    const targetLine = document.lineAt(lineNumber);
    const range = new vscode.Range(
        new vscode.Position(lineNumber, 0),
        new vscode.Position(lineNumber, targetLine.text.length)
    );

    // Move cursor to the line
    editor.selection = new vscode.Selection(range.start, range.start);

    // Scroll to reveal the line in the center of the viewport
    editor.revealRange(range, vscode.TextEditorRevealType.InCenter);

    // Highlight the line briefly (optional visual feedback)
    const decorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: new vscode.ThemeColor('editor.findMatchHighlightBackground'),
        isWholeLine: true
    });

    editor.setDecorations(decorationType, [range]);

    // Remove highlight after 2 seconds
    setTimeout(() => {
        decorationType.dispose();
    }, 2000);
}

/**
 * Register the element navigation command
 */
export function registerElementNavigationCommand(context: vscode.ExtensionContext): void {
    const command = vscode.commands.registerCommand(
        'ditacraft.navigateToElement',
        async (documentUriString: string, elementPath: string) => {
            // Convert URI string back to Uri object
            const documentUri = vscode.Uri.parse(documentUriString);
            await navigateToElement(documentUri, elementPath);
        }
    );

    context.subscriptions.push(command);
    logger.info('Element navigation command registered');
}
