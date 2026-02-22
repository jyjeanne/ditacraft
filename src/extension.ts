/**
 * DitaCraft Extension Entry Point
 *
 * This is the main entry point for the DitaCraft VS Code extension.
 * It handles extension activation, command registration, and lifecycle management.
 */

import * as vscode from 'vscode';
import { DitaOtWrapper } from './utils/ditaOtWrapper';
import { logger } from './utils/logger';
import { fireAndForget } from './utils/errorUtils';
import { configManager, ConfigurationChangeEvent } from './utils/configurationManager';
import { getGlobalKeySpaceResolver } from './providers/ditaLinkProvider';
import { registerElementNavigationCommand } from './utils/elementNavigator';
import { registerKeyDiagnosticsProvider } from './providers/keyDiagnostics';
import {
    validateCommand,
    initializeValidator,
    publishCommand,
    publishHTML5Command,
    previewHTML5Command,
    initializePreview,
    newTopicCommand,
    newMapCommand,
    newBookmapCommand,
    configureDitaOTCommand,
    setupCSpellCommand
} from './commands';
import { registerPreviewPanelSerializer } from './providers/previewPanel';
import { disposeDitaOtDiagnostics } from './utils/ditaOtErrorParser';
import { UI_TIMEOUTS } from './utils/constants';
import { getDitaOtOutputChannel, disposeDitaOtOutputChannel } from './utils/ditaOtOutputChannel';
import { MapVisualizerPanel } from './providers/mapVisualizerPanel';
import { DitaExplorerProvider, DitaExplorerItem } from './providers/ditaExplorerProvider';
import { DitaFileDecorationProvider } from './providers/ditaFileDecorationProvider';
import { KeySpaceViewProvider } from './providers/keySpaceViewProvider';
import { DiagnosticsViewProvider } from './providers/diagnosticsViewProvider';
import { startLanguageClient, stopLanguageClient } from './languageClient';

// Global extension state
let ditaOtWrapper: DitaOtWrapper;
let outputChannel: vscode.OutputChannel;

/**
 * Extension activation function
 * Called when the extension is activated
 */
export function activate(context: vscode.ExtensionContext) {
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

        // Initialize preview panel
        outputChannel.appendLine('Initializing preview panel...');
        initializePreview(context);
        registerPreviewPanelSerializer(context);
        outputChannel.appendLine('Preview panel initialized');

        // Note: Document links now provided by the LSP server (Phase 6)

        // Register element navigation command for same-file references
        outputChannel.appendLine('Registering element navigation command...');
        registerElementNavigationCommand(context);
        outputChannel.appendLine('Element navigation command registered');

        // Register key diagnostics provider for missing key warnings
        outputChannel.appendLine('Registering key diagnostics provider...');
        const keySpaceResolver = getGlobalKeySpaceResolver();
        registerKeyDiagnosticsProvider(context, keySpaceResolver);
        outputChannel.appendLine('Key diagnostics provider registered');

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

        // Register open file command for tree views
        context.subscriptions.push(
            vscode.commands.registerCommand('ditacraft.openFile', async (uri: vscode.Uri) => {
                if (uri) {
                    try {
                        await vscode.window.showTextDocument(uri, { preview: false });
                    } catch {
                        vscode.window.showWarningMessage(`Could not open file: ${uri.fsPath}`);
                    }
                }
            })
        );

        // Register DITA Explorer tree view
        outputChannel.appendLine('Registering DITA Explorer...');
        const ditaExplorerProvider = new DitaExplorerProvider();
        const ditaExplorerView = vscode.window.createTreeView('ditacraft.ditaExplorer', {
            treeDataProvider: ditaExplorerProvider,
            showCollapseAll: true
        });
        context.subscriptions.push(ditaExplorerView, ditaExplorerProvider);
        context.subscriptions.push(
            vscode.commands.registerCommand('ditacraft.refreshDitaExplorer', () => ditaExplorerProvider.refresh())
        );
        outputChannel.appendLine('DITA Explorer registered');

        // Register Key Space tree view
        outputChannel.appendLine('Registering Key Space view...');
        const keySpaceViewProvider = new KeySpaceViewProvider();
        const keySpaceView = vscode.window.createTreeView('ditacraft.keySpaceView', {
            treeDataProvider: keySpaceViewProvider,
            showCollapseAll: true
        });
        context.subscriptions.push(keySpaceView, keySpaceViewProvider);
        context.subscriptions.push(
            vscode.commands.registerCommand('ditacraft.refreshKeySpace', () => keySpaceViewProvider.refresh())
        );
        outputChannel.appendLine('Key Space view registered');

        // Register Diagnostics tree view
        outputChannel.appendLine('Registering Diagnostics view...');
        const diagnosticsViewProvider = new DiagnosticsViewProvider();
        const diagnosticsView = vscode.window.createTreeView('ditacraft.diagnosticsView', {
            treeDataProvider: diagnosticsViewProvider,
            showCollapseAll: true
        });
        context.subscriptions.push(diagnosticsView, diagnosticsViewProvider);
        context.subscriptions.push(
            vscode.commands.registerCommand('ditacraft.refreshDiagnosticsView', () => diagnosticsViewProvider.refresh()),
            vscode.commands.registerCommand('ditacraft.diagnosticsGroupByFile', () => diagnosticsViewProvider.setGroupMode('byFile')),
            vscode.commands.registerCommand('ditacraft.diagnosticsGroupByType', () => diagnosticsViewProvider.setGroupMode('byType'))
        );
        outputChannel.appendLine('Diagnostics view registered');

        // Register file decoration provider for validation badges
        const fileDecorationProvider = new DitaFileDecorationProvider();
        context.subscriptions.push(
            vscode.window.registerFileDecorationProvider(fileDecorationProvider),
            fileDecorationProvider
        );

        // Start Language Server
        outputChannel.appendLine('Starting DITA Language Server...');
        startLanguageClient(context).then(() => {
            outputChannel.appendLine('DITA Language Server started');
        }).catch((err) => {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            logger.error('Failed to start DITA Language Server', err);
            outputChannel.appendLine(`Failed to start DITA Language Server: ${msg}`);
        });

        // Clean up old logs (keep 7 days)
        logger.clearOldLogs(7);

        // Verify DITA-OT installation on activation (async - don't wait)
        verifyDitaOtInstallation();

        // Show welcome message on first activation
        showWelcomeMessage(context);

        // Suggest cSpell DITA dictionary setup if needed
        suggestCSpellSetup(context);

        logger.info('DitaCraft extension activated successfully');
        outputChannel.appendLine('=== DitaCraft Activation Complete ===');
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
export async function deactivate(): Promise<void> {
    logger.info('DitaCraft extension deactivation started');

    // Stop Language Server
    await stopLanguageClient();

    // Dispose of DITA-OT publishing diagnostics
    disposeDitaOtDiagnostics();

    // Dispose of DITA-OT output channel
    disposeDitaOtOutputChannel();

    // Dispose of Map Visualizer panel
    if (MapVisualizerPanel.currentPanel) {
        MapVisualizerPanel.currentPanel.dispose();
    }

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
    // Wrapped to handle both vscode.Uri (from editor menus) and DitaExplorerItem (from tree context menus)
    context.subscriptions.push(
        vscode.commands.registerCommand('ditacraft.validate', (arg?: DitaExplorerItem | vscode.Uri) => {
            const uri = arg instanceof DitaExplorerItem
                ? (arg.mapNode.filePath ? vscode.Uri.file(arg.mapNode.filePath) : undefined)
                : arg;
            return validateCommand(uri);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('ditacraft.publish', (arg?: DitaExplorerItem | vscode.Uri) => {
            const uri = arg instanceof DitaExplorerItem
                ? (arg.mapNode.filePath ? vscode.Uri.file(arg.mapNode.filePath) : undefined)
                : arg;
            return publishCommand(uri);
        })
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

    context.subscriptions.push(
        vscode.commands.registerCommand('ditacraft.setupCSpell', () => setupCSpellCommand(context.extensionPath))
    );

    // Command to show DITA-OT build output
    context.subscriptions.push(
        vscode.commands.registerCommand('ditacraft.showBuildOutput', () => {
            const ditaOtOutput = getDitaOtOutputChannel();
            ditaOtOutput.show(false);
        })
    );

    // Command to show Map Visualizer (accepts optional tree item or URI from context menus)
    context.subscriptions.push(
        vscode.commands.registerCommand('ditacraft.showMapVisualizer', (arg?: DitaExplorerItem | vscode.Uri) => {
            let filePath: string | undefined;

            if (arg instanceof DitaExplorerItem) {
                filePath = arg.mapNode.filePath;
            } else if (arg instanceof vscode.Uri) {
                filePath = arg.fsPath;
            } else {
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    vscode.window.showWarningMessage('No file is currently open');
                    return;
                }
                filePath = editor.document.uri.fsPath;
            }

            if (!filePath) {
                vscode.window.showWarningMessage('No file path available');
                return;
            }

            const ext = filePath.toLowerCase();
            if (!ext.endsWith('.ditamap') && !ext.endsWith('.bookmap')) {
                vscode.window.showWarningMessage('Map Visualizer requires a .ditamap or .bookmap file');
                return;
            }

            MapVisualizerPanel.createOrShow(context.extensionUri, filePath);
        })
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
 * Dynamically propagates configuration changes to all components without requiring reload
 */
function registerConfigurationListener(context: vscode.ExtensionContext): void {
    // Set up error handler to use the logger (avoids circular dependency in configurationManager)
    configManager.setErrorHandler((error, source) => {
        logger.error(`Configuration error in ${source || 'unknown'}`, error);
    });

    // Use the centralized configuration manager for change notifications
    const configListener = configManager.onConfigurationChange((event: ConfigurationChangeEvent) => {
        handleConfigurationChange(event);
    });
    context.subscriptions.push(configListener);

    // Also add the configuration manager itself to subscriptions for cleanup
    context.subscriptions.push(configManager);
}

/**
 * Handle configuration changes and propagate to all components
 */
function handleConfigurationChange(event: ConfigurationChangeEvent): void {
    const changedKeys = event.affectedKeys;

    logger.info('Configuration changed', {
        changedSettings: changedKeys,
        changes: Object.fromEntries(
            changedKeys.map(key => [key, {
                from: event.previousValues.get(key),
                to: event.newValues.get(key)
            }])
        )
    });

    outputChannel.appendLine(`Configuration changed: ${changedKeys.join(', ')}`);

    // Logger configuration (logLevel, enableFileLogging, enableConsoleLogging)
    const loggerSettings = ['logLevel', 'enableFileLogging', 'enableConsoleLogging'];
    if (changedKeys.some(key => loggerSettings.includes(key))) {
        logger.reloadConfiguration();
        outputChannel.appendLine('  → Logger configuration reloaded');
    }

    // DITA-OT configuration (ditaOtPath, defaultTranstype, outputDirectory, ditaOtArgs, ditaOtTimeoutMinutes)
    const ditaOtSettings = ['ditaOtPath', 'defaultTranstype', 'outputDirectory', 'ditaOtArgs', 'ditaOtTimeoutMinutes'];
    if (changedKeys.some(key => ditaOtSettings.includes(key))) {
        ditaOtWrapper.reloadConfiguration();
        outputChannel.appendLine('  → DITA-OT wrapper configuration reloaded');

        // Verify installation if path changed
        if (changedKeys.includes('ditaOtPath')) {
            logger.debug('DITA-OT path changed, verifying installation');
            verifyDitaOtInstallation();
        }
    }

    // Key space resolver configuration (keySpaceCacheTtlMinutes)
    if (changedKeys.includes('keySpaceCacheTtlMinutes')) {
        const keySpaceResolver = getGlobalKeySpaceResolver();
        keySpaceResolver.reloadCacheConfig();
        outputChannel.appendLine('  → Key space resolver cache configuration reloaded');
    }

    // Show user-friendly notification for important changes
    const userVisibleChanges = changedKeys.filter(key =>
        ['logLevel', 'autoValidate', 'previewAutoRefresh', 'validationEngine', 'ditaOtPath'].includes(key)
    );

    if (userVisibleChanges.length > 0) {
        const changeDescriptions = userVisibleChanges.map(key => {
            const newValue = event.newValues.get(key);
            return `${key}: ${JSON.stringify(newValue)}`;
        });

        vscode.window.setStatusBarMessage(
            `DitaCraft: Settings updated (${changeDescriptions.join(', ')})`,
            UI_TIMEOUTS.STATUS_BAR_MESSAGE_MS
        );
    }
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
                fireAndForget(
                    vscode.commands.executeCommand('ditacraft.configureDitaOT'),
                    'configure-dita-ot'
                );
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
 * Suggest cSpell DITA dictionary setup if cSpell is installed but no config exists
 */
async function suggestCSpellSetup(context: vscode.ExtensionContext): Promise<void> {
    const dismissed = context.globalState.get<boolean>('ditacraft.cspellPromptDismissed', false);
    if (dismissed) {
        return;
    }

    // Only prompt if cSpell extension is installed
    const cspellExt = vscode.extensions.getExtension('streetsidesoftware.code-spell-checker');
    if (!cspellExt) {
        return;
    }

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        return;
    }

    // Check if workspace already has a cSpell config
    const root = workspaceFolders[0].uri;
    const configNames = ['.cspellrc.json', 'cspell.json', '.cspell.json'];
    for (const name of configNames) {
        try {
            await vscode.workspace.fs.stat(vscode.Uri.joinPath(root, name));
            return; // Config exists, no need to prompt
        } catch {
            // Not found, continue checking
        }
    }

    try {
        const action = await vscode.window.showInformationMessage(
            'cSpell is installed but no DITA dictionary is configured. Set up DITA vocabulary to avoid false "unknown word" warnings?',
            'Setup DITA Dictionary',
            "Don't Show Again"
        );

        if (action === 'Setup DITA Dictionary') {
            await vscode.commands.executeCommand('ditacraft.setupCSpell');
        }

        if (action === 'Setup DITA Dictionary' || action === "Don't Show Again") {
            await context.globalState.update('ditacraft.cspellPromptDismissed', true);
        }
    } catch (error) {
        logger.error('Error suggesting cSpell setup', error);
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
