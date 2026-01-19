/**
 * Configuration Manager
 * Centralized configuration management with dynamic reloading support
 *
 * This module provides:
 * - Type-safe access to all DitaCraft configuration values
 * - Event-based configuration change notifications
 * - Automatic caching with invalidation on settings change
 */

import * as vscode from 'vscode';

/**
 * Log level enumeration
 */
export type LogLevelType = 'debug' | 'info' | 'warn' | 'error';

/**
 * Validation engine type
 */
export type ValidationEngineType = 'xmllint' | 'built-in';

/**
 * Default transform type
 */
export type TranstypeType = 'html5' | 'pdf' | 'xhtml' | 'epub' | 'htmlhelp' | 'markdown';

/**
 * Preview theme type
 */
export type PreviewThemeType = 'auto' | 'light' | 'dark';

/**
 * Configuration change event
 */
export interface ConfigurationChangeEvent {
    affectedKeys: string[];
    previousValues: Map<string, unknown>;
    newValues: Map<string, unknown>;
}

/**
 * Configuration change listener type
 */
export type ConfigurationChangeListener = (event: ConfigurationChangeEvent) => void;

/**
 * All DitaCraft configuration values with types
 */
export interface DitaCraftConfiguration {
    // DITA-OT settings
    ditaOtPath: string;
    defaultTranstype: TranstypeType;
    outputDirectory: string;
    ditaOtArgs: string[];
    ditaOtTimeoutMinutes: number;

    // Validation settings
    autoValidate: boolean;
    validationEngine: ValidationEngineType;
    validationDebounceMs: number;

    // Preview settings
    previewAutoRefresh: boolean;
    previewTheme: PreviewThemeType;
    previewCustomCss: string;
    previewScrollSync: boolean;

    // UI settings
    showProgressNotifications: boolean;
    enableSnippets: boolean;

    // Logging settings
    logLevel: LogLevelType;
    enableFileLogging: boolean;
    enableConsoleLogging: boolean;

    // Performance settings
    keySpaceCacheTtlMinutes: number;
    maxLinkMatches: number;
}

/**
 * Validate a numeric configuration value and return default if invalid
 * Exported for testing
 * @param value The value to validate
 * @param defaultValue The default value to use if validation fails
 * @param minValue Minimum allowed value (inclusive)
 * @returns The validated value or default
 */
export function validateNumericConfig(value: number, defaultValue: number, minValue: number): number {
    if (typeof value !== 'number' || isNaN(value) || value < minValue) {
        return defaultValue;
    }
    return value;
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: DitaCraftConfiguration = {
    ditaOtPath: '',
    defaultTranstype: 'html5',
    outputDirectory: '${workspaceFolder}/out',
    ditaOtArgs: [],
    ditaOtTimeoutMinutes: 10,
    autoValidate: true,
    validationEngine: 'xmllint',
    validationDebounceMs: 500,
    previewAutoRefresh: true,
    previewTheme: 'auto',
    previewCustomCss: '',
    previewScrollSync: true,
    showProgressNotifications: true,
    enableSnippets: true,
    logLevel: 'info',
    enableFileLogging: false,
    enableConsoleLogging: true,
    keySpaceCacheTtlMinutes: 5,
    maxLinkMatches: 10000
};

/**
 * Error handler type for configuration change listener errors
 */
export type ConfigurationErrorHandler = (error: unknown, listenerName?: string) => void;

/**
 * ConfigurationManager - Singleton class for centralized configuration management
 */
export class ConfigurationManager implements vscode.Disposable {
    private static instance: ConfigurationManager | undefined;
    private listeners: Set<ConfigurationChangeListener> = new Set();
    private disposables: vscode.Disposable[] = [];
    private cachedConfig: DitaCraftConfiguration | undefined;
    private lastConfigSnapshot: Map<string, unknown> = new Map();
    private errorHandler: ConfigurationErrorHandler | undefined;

    private constructor() {
        // Initialize cached config
        this.cachedConfig = this.loadConfiguration();
        this.lastConfigSnapshot = this.createConfigSnapshot();

        // Listen for configuration changes
        this.disposables.push(
            vscode.workspace.onDidChangeConfiguration(event => {
                if (event.affectsConfiguration('ditacraft')) {
                    this.handleConfigurationChange(event);
                }
            })
        );
    }

    /**
     * Get the singleton instance
     */
    public static getInstance(): ConfigurationManager {
        if (!ConfigurationManager.instance) {
            ConfigurationManager.instance = new ConfigurationManager();
        }
        return ConfigurationManager.instance;
    }

    /**
     * Reset the singleton instance (for testing)
     */
    public static resetInstance(): void {
        if (ConfigurationManager.instance) {
            ConfigurationManager.instance.dispose();
            ConfigurationManager.instance = undefined;
        }
    }

    /**
     * Load all configuration values from VS Code settings
     */
    private loadConfiguration(): DitaCraftConfiguration {
        const config = vscode.workspace.getConfiguration('ditacraft');

        // Load and validate numeric values
        const ditaOtTimeoutMinutes = validateNumericConfig(
            config.get<number>('ditaOtTimeoutMinutes', DEFAULT_CONFIG.ditaOtTimeoutMinutes),
            DEFAULT_CONFIG.ditaOtTimeoutMinutes,
            1 // Minimum 1 minute
        );
        const validationDebounceMs = validateNumericConfig(
            config.get<number>('validationDebounceMs', DEFAULT_CONFIG.validationDebounceMs),
            DEFAULT_CONFIG.validationDebounceMs,
            0 // Minimum 0ms (immediate validation allowed)
        );
        const keySpaceCacheTtlMinutes = validateNumericConfig(
            config.get<number>('keySpaceCacheTtlMinutes', DEFAULT_CONFIG.keySpaceCacheTtlMinutes),
            DEFAULT_CONFIG.keySpaceCacheTtlMinutes,
            1 // Minimum 1 minute
        );
        const maxLinkMatches = validateNumericConfig(
            config.get<number>('maxLinkMatches', DEFAULT_CONFIG.maxLinkMatches),
            DEFAULT_CONFIG.maxLinkMatches,
            1 // Minimum 1 match
        );

        return {
            ditaOtPath: config.get<string>('ditaOtPath', DEFAULT_CONFIG.ditaOtPath),
            defaultTranstype: config.get<TranstypeType>('defaultTranstype', DEFAULT_CONFIG.defaultTranstype),
            outputDirectory: config.get<string>('outputDirectory', DEFAULT_CONFIG.outputDirectory),
            ditaOtArgs: config.get<string[]>('ditaOtArgs', DEFAULT_CONFIG.ditaOtArgs),
            ditaOtTimeoutMinutes,
            autoValidate: config.get<boolean>('autoValidate', DEFAULT_CONFIG.autoValidate),
            validationEngine: config.get<ValidationEngineType>('validationEngine', DEFAULT_CONFIG.validationEngine),
            validationDebounceMs,
            previewAutoRefresh: config.get<boolean>('previewAutoRefresh', DEFAULT_CONFIG.previewAutoRefresh),
            previewTheme: config.get<PreviewThemeType>('previewTheme', DEFAULT_CONFIG.previewTheme),
            previewCustomCss: config.get<string>('previewCustomCss', DEFAULT_CONFIG.previewCustomCss),
            previewScrollSync: config.get<boolean>('previewScrollSync', DEFAULT_CONFIG.previewScrollSync),
            showProgressNotifications: config.get<boolean>('showProgressNotifications', DEFAULT_CONFIG.showProgressNotifications),
            enableSnippets: config.get<boolean>('enableSnippets', DEFAULT_CONFIG.enableSnippets),
            logLevel: config.get<LogLevelType>('logLevel', DEFAULT_CONFIG.logLevel),
            enableFileLogging: config.get<boolean>('enableFileLogging', DEFAULT_CONFIG.enableFileLogging),
            enableConsoleLogging: config.get<boolean>('enableConsoleLogging', DEFAULT_CONFIG.enableConsoleLogging),
            keySpaceCacheTtlMinutes,
            maxLinkMatches
        };
    }

    /**
     * Create a snapshot of current configuration for comparison
     */
    private createConfigSnapshot(): Map<string, unknown> {
        const snapshot = new Map<string, unknown>();
        if (this.cachedConfig) {
            for (const [key, value] of Object.entries(this.cachedConfig)) {
                snapshot.set(key, value);
            }
        }
        return snapshot;
    }

    /**
     * Handle configuration change event
     */
    private handleConfigurationChange(event: vscode.ConfigurationChangeEvent): void {
        const previousValues = this.lastConfigSnapshot;

        // Reload configuration
        this.cachedConfig = this.loadConfiguration();
        const newSnapshot = this.createConfigSnapshot();

        // Determine which keys changed
        const affectedKeys: string[] = [];
        const changedPreviousValues = new Map<string, unknown>();
        const changedNewValues = new Map<string, unknown>();

        for (const key of Object.keys(DEFAULT_CONFIG)) {
            if (event.affectsConfiguration(`ditacraft.${key}`)) {
                const prevValue = previousValues.get(key);
                const newValue = newSnapshot.get(key);

                // Check if value actually changed
                if (JSON.stringify(prevValue) !== JSON.stringify(newValue)) {
                    affectedKeys.push(key);
                    changedPreviousValues.set(key, prevValue);
                    changedNewValues.set(key, newValue);
                }
            }
        }

        // Update snapshot
        this.lastConfigSnapshot = newSnapshot;

        // Notify listeners if there were actual changes
        if (affectedKeys.length > 0) {
            const changeEvent: ConfigurationChangeEvent = {
                affectedKeys,
                previousValues: changedPreviousValues,
                newValues: changedNewValues
            };

            for (const listener of this.listeners) {
                try {
                    listener(changeEvent);
                } catch (error) {
                    // Use error handler if set, otherwise fallback to console
                    if (this.errorHandler) {
                        this.errorHandler(error, 'configuration change listener');
                    } else {
                        console.error('Error in configuration change listener:', error);
                    }
                }
            }
        }
    }

    /**
     * Get the full configuration object (cached)
     * Returns a deep copy to prevent mutation of cached values
     */
    public getConfiguration(): DitaCraftConfiguration {
        if (!this.cachedConfig) {
            this.cachedConfig = this.loadConfiguration();
        }
        return {
            ...this.cachedConfig,
            ditaOtArgs: [...this.cachedConfig.ditaOtArgs] // Deep copy array
        };
    }

    /**
     * Get a specific configuration value
     */
    public get<K extends keyof DitaCraftConfiguration>(key: K): DitaCraftConfiguration[K] {
        return this.getConfiguration()[key];
    }

    /**
     * Force reload of configuration (invalidates cache)
     */
    public reloadConfiguration(): void {
        this.cachedConfig = this.loadConfiguration();
        this.lastConfigSnapshot = this.createConfigSnapshot();
    }

    /**
     * Add a configuration change listener
     * @returns Disposable to remove the listener
     */
    public onConfigurationChange(listener: ConfigurationChangeListener): vscode.Disposable {
        this.listeners.add(listener);
        return new vscode.Disposable(() => {
            this.listeners.delete(listener);
        });
    }

    /**
     * Check if a specific configuration key was affected in the last change
     */
    public wasAffected(event: ConfigurationChangeEvent, key: keyof DitaCraftConfiguration): boolean {
        return event.affectedKeys.includes(key);
    }

    /**
     * Set an error handler for listener errors
     * This allows the extension to use the logger without creating circular dependencies
     */
    public setErrorHandler(handler: ConfigurationErrorHandler): void {
        this.errorHandler = handler;
    }

    /**
     * Get default configuration values
     * Returns a deep copy to prevent mutation
     */
    public getDefaults(): DitaCraftConfiguration {
        return {
            ...DEFAULT_CONFIG,
            ditaOtArgs: [...DEFAULT_CONFIG.ditaOtArgs] // Deep copy array
        };
    }

    /**
     * Dispose of resources
     */
    public dispose(): void {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables = [];
        this.listeners.clear();
        this.cachedConfig = undefined;
    }
}

/**
 * Lazy singleton accessor
 * Returns the singleton instance, creating it on first access
 * This avoids initialization issues when module is imported before VS Code is ready
 */
export function getConfigManager(): ConfigurationManager {
    return ConfigurationManager.getInstance();
}

/**
 * Export singleton instance for convenience (lazy-initialized via getter)
 * Note: This creates the instance immediately on first property access
 */
export const configManager = {
    get instance(): ConfigurationManager {
        return ConfigurationManager.getInstance();
    },
    // Proxy all methods to the singleton instance
    getConfiguration: () => ConfigurationManager.getInstance().getConfiguration(),
    get: <K extends keyof DitaCraftConfiguration>(key: K) => ConfigurationManager.getInstance().get(key),
    reloadConfiguration: () => ConfigurationManager.getInstance().reloadConfiguration(),
    onConfigurationChange: (listener: ConfigurationChangeListener) => ConfigurationManager.getInstance().onConfigurationChange(listener),
    wasAffected: (event: ConfigurationChangeEvent, key: keyof DitaCraftConfiguration) => ConfigurationManager.getInstance().wasAffected(event, key),
    setErrorHandler: (handler: ConfigurationErrorHandler) => ConfigurationManager.getInstance().setErrorHandler(handler),
    getDefaults: () => ConfigurationManager.getInstance().getDefaults(),
    dispose: () => ConfigurationManager.getInstance().dispose()
};
