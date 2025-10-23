/**
 * Configure Command
 * Handles DITA-OT configuration
 */

import * as vscode from 'vscode';
import { DitaOtWrapper } from '../utils/ditaOtWrapper';

/**
 * Command: ditacraft.configureDitaOT
 * Opens dialog to configure DITA-OT path
 */
export async function configureDitaOTCommand(): Promise<void> {
    try {
        const ditaOt = new DitaOtWrapper();
        await ditaOt.configureOtPath();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Configuration failed: ${errorMessage}`);
    }
}
