/**
 * DitaCraft Extension Entry Point
 *
 * This is the main entry point for the DitaCraft VS Code extension.
 * It handles extension activation, command registration, and lifecycle management.
 */

import * as vscode from 'vscode';
import { DitaOtWrapper } from './utils/ditaOtWrapper';
import { logger } from './utils/logger';
import { registerDitaLinkProvider } from './providers/ditaLinkProvider';
import {
    validateCommand,
    initializeValidator,
    publishCommand,
    publishHTML5Command,
    previewHTML5Command,
    newTopicCommand,
    newMapCommand,
    newBookmapCommand,
    configureDitaOTCommand
} from './commands';

// Global extension state
let ditaOtWrapper: DitaOtWrapper;
let outputChannel: vscode.OutputChannel;

/**
 * Extension activation function
 * Called when the extension is activated
 */
export function activate(context: vscode.ExtensionContext) {
    // Show immediate popup to confirm activation is called
    vscode.window.showInformationMessage('DitaCraft: activate() called!');

    try {
        logger.info('DitaCraft extension activation started');

        // Create output channel for DITA-OT logs
        outputChannel = vscode.window.createOutputChannel('DitaCraft');
        context.subscriptions.push(outputChannel);
        outputChannel.appendLine('=== DitaCraft Activation Starting ===');

        // Initialize DITA-OT wrapper
        outputChannel.appendLine('Initializing DITA-OT wrapper...');
        ditaOtWrapper = new DitaOtWrapper();
        outputChannel.appendLine('DITA-OT wrapper initialized');

        // Initialize validator
        outputChannel.appendLine('Initializing validator...');
        initializeValidator(context);
        outputChannel.appendLine('Validator initialized');

        // Register DITA link provider for Ctrl+Click navigation
        outputChannel.appendLine('Registering DITA link provider...');
        registerDitaLinkProvider(context);
        outputChannel.appendLine('DITA link provider registered');

        // Register all commands
        outputChannel.appendLine('Registering commands...');
        registerCommands(context);
        outputChannel.appendLine('Commands registered');

        // Register configuration change listener
        outputChannel.appendLine('Registering configuration listener...');
        registerConfigurationListener(context);
        outputChannel.appendLine('Configuration listener registered');

        // Register logger commands
        outputChannel.appendLine('Registering logger commands...');
        registerLoggerCommands(context);
        outputChannel.appendLine('Logger commands registered');

        // Clean up old logs (keep 7 days)
        logger.clearOldLogs(7);

        // Verify DITA-OT installation on activation (async - don't wait)
        verifyDitaOtInstallation();

        // Show welcome message on first activation
        showWelcomeMessage(context);

        logger.info('DitaCraft extension activated successfully');
        outputChannel.appendLine('=== DitaCraft Activation Complete ===');

        vscode.window.showInformationMessage('DitaCraft activated successfully!');
    } catch (error) {
        const errorMsg = `Failed to activate DitaCraft: ${error instanceof Error ? error.message : 'Unknown error'}`;
        vscode.window.showErrorMessage(errorMsg);
        logger.error('Failed to activate DitaCraft extension', error);
        if (outputChannel) {
            outputChannel.appendLine('=== ACTIVATION ERROR ===');
            outputChannel.appendLine(errorMsg);
            outputChannel.show();
        }
        throw error;
    }
}

/**
 * Extension deactivation function
 * Called when the extension is deactivated
 */
export function deactivate() {
    logger.info('DitaCraft extension deactivation started');

    if (outputChannel) {
        outputChannel.appendLine('DitaCraft extension deactivated');
        outputChannel.dispose();
    }

    logger.dispose();
}

/**
 * Register all extension commands
 */
function registerCommands(context: vscode.ExtensionContext): void {
    // Publishing and validation commands
    context.subscriptions.push(
        vscode.commands.registerCommand('ditacraft.validate', validateCommand)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('ditacraft.publish', publishCommand)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('ditacraft.publishHTML5', publishHTML5Command)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('ditacraft.previewHTML5', previewHTML5Command)
    );

    // File creation commands with error wrapping
    context.subscriptions.push(
        vscode.commands.registerCommand('ditacraft.newTopic', async () => {
            try {
                logger.info('Command invoked: ditacraft.newTopic');
                await newTopicCommand();
            } catch (error) {
                logger.error('Unhandled error in newTopicCommand', error);
                vscode.window.showErrorMessage(`Error creating topic: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('ditacraft.newMap', async () => {
            try {
                logger.info('Command invoked: ditacraft.newMap');
                await newMapCommand();
            } catch (error) {
                logger.error('Unhandled error in newMapCommand', error);
                vscode.window.showErrorMessage(`Error creating map: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('ditacraft.newBookmap', async () => {
            try {
                logger.info('Command invoked: ditacraft.newBookmap');
                await newBookmapCommand();
            } catch (error) {
                logger.error('Unhandled error in newBookmapCommand', error);
                vscode.window.showErrorMessage(`Error creating bookmap: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        })
    );

    // Configuration commands
    context.subscriptions.push(
        vscode.commands.registerCommand('ditacraft.configureDitaOT', configureDitaOTCommand)
    );

    // Test command for debugging (intentionally throws error)
    context.subscriptions.push(
        vscode.commands.registerCommand('ditacraft.testLogger', async () => {
            logger.info('Test command invoked');
            logger.debug('This is a debug message', { test: 'data' });
            logger.warn('This is a warning message');
            logger.error('This is an intentional error for testing', new Error('Test error with stack trace'));
            vscode.window.showInformationMessage('Logger test complete. Check log file!');
        })
    );

    logger.info('All commands registered successfully');
    outputChannel.appendLine('All commands registered successfully');
}

/**
 * Register logger-specific commands
 */
function registerLoggerCommands(context: vscode.ExtensionContext): void {
    // Show log file location
    context.subscriptions.push(
        vscode.commands.registerCommand('ditacraft.showLogFile', () => {
            logger.showLogFileLocation();
        })
    );

    // Open log file
    context.subscriptions.push(
        vscode.commands.registerCommand('ditacraft.openLogFile', () => {
            logger.openLogFile();
        })
    );

    // Show output channel
    context.subscriptions.push(
        vscode.commands.registerCommand('ditacraft.showOutputChannel', () => {
            logger.show();
        })
    );

    // Clear output channel
    context.subscriptions.push(
        vscode.commands.registerCommand('ditacraft.clearOutputChannel', () => {
            logger.clear();
        })
    );

    logger.debug('Logger commands registered');
}

/**
 * Register configuration change listener
 * Reloads DITA-OT wrapper when configuration changes
 */
function registerConfigurationListener(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(event => {
            if (event.affectsConfiguration('ditacraft')) {
                logger.info('Configuration changed, reloading DITA-OT wrapper');
                outputChannel.appendLine('Configuration changed, reloading DITA-OT wrapper...');
                ditaOtWrapper.reloadConfiguration();

                // Verify installation if DITA-OT path changed
                if (event.affectsConfiguration('ditacraft.ditaOtPath')) {
                    logger.debug('DITA-OT path changed, verifying installation');
                    verifyDitaOtInstallation();
                }
            }
        })
    );
}

/**
 * Verify DITA-OT installation and show status
 */
async function verifyDitaOtInstallation(): Promise<void> {
    try {
        logger.debug('Verifying DITA-OT installation');
        const verification = await ditaOtWrapper.verifyInstallation();

        if (verification.installed) {
            logger.info('DITA-OT found', {
                version: verification.version,
                path: verification.path
            });
            outputChannel.appendLine(
                `DITA-OT found: Version ${verification.version} at ${verification.path}`
            );
        } else {
            logger.warn('DITA-OT not found or not configured');
            outputChannel.appendLine('DITA-OT not found or not configured');

            // Show notification with action
            const action = await vscode.window.showWarningMessage(
                'DITA-OT is not installed or not configured. Publishing features will not work.',
                'Configure Now',
                'Dismiss'
            );

            if (action === 'Configure Now') {
                logger.debug('User chose to configure DITA-OT');
                vscode.commands.executeCommand('ditacraft.configureDitaOT');
            }
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Error verifying DITA-OT', error);
        outputChannel.appendLine(`Error verifying DITA-OT: ${errorMessage}`);
    }
}

/**
 * Show welcome message on first activation
 */
async function showWelcomeMessage(context: vscode.ExtensionContext): Promise<void> {
    const hasShownWelcome = context.globalState.get<boolean>('ditacraft.hasShownWelcome', false);

    if (!hasShownWelcome) {
        try {
            const action = await vscode.window.showInformationMessage(
                'Welcome to DitaCraft! The best way to edit and publish your DITA files.',
                'Get Started',
                'View Documentation'
            );

            if (action === 'Get Started') {
                // Show quick start guide
                await vscode.commands.executeCommand(
                    'vscode.open',
                    vscode.Uri.parse('https://github.com/jyjeanne/ditacraft#quick-start')
                );
            } else if (action === 'View Documentation') {
                // Open README
                const readmePath = vscode.Uri.joinPath(context.extensionUri, 'README.md');
                await vscode.commands.executeCommand('markdown.showPreview', readmePath);
            }

            // Mark welcome message as shown only after dialog interaction completes
            await context.globalState.update('ditacraft.hasShownWelcome', true);
        } catch (error) {
            logger.error('Error showing welcome message', error);
        }
    }
}

/**
 * Get the output channel (for use by commands)
 */
export function getOutputChannel(): vscode.OutputChannel {
    return outputChannel;
}

/**
 * Get the DITA-OT wrapper instance (for use by commands)
 */
export function getDitaOtWrapper(): DitaOtWrapper {
    return ditaOtWrapper;
}
