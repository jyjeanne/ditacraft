/**
 * Provider Factory
 * P2-2: Centralized factory for creating providers with proper dependency injection
 *
 * This factory manages the lifecycle of providers and ensures dependencies are shared correctly.
 * It follows the factory pattern to decouple provider creation from their usage.
 *
 * Note: Validation is now handled entirely by the LSP server (Phase 1 consolidation).
 * This factory manages link providers and key space resolution only.
 */

import * as vscode from 'vscode';
import { KeySpaceResolver } from './keySpaceResolver';
import { DitaLinkProvider } from '../providers/ditaLinkProvider';
import { logger } from './logger';

/**
 * Options for creating providers
 */
export interface ProviderFactoryOptions {
    /**
     * Custom KeySpaceResolver instance (for testing)
     */
    keySpaceResolver?: KeySpaceResolver;
}

/**
 * Factory for creating and managing DITA providers
 * Ensures proper dependency injection and lifecycle management
 */
export class ProviderFactory implements vscode.Disposable {
    private readonly options: ProviderFactoryOptions;

    // Shared dependencies
    private keySpaceResolver: KeySpaceResolver | undefined;

    // Created providers
    private linkProvider: DitaLinkProvider | undefined;

    // Track disposables
    private disposables: vscode.Disposable[] = [];

    constructor(_context: vscode.ExtensionContext, options: ProviderFactoryOptions = {}) {
        this.options = options;
        logger.debug('ProviderFactory initialized');
    }

    /**
     * Get or create the shared KeySpaceResolver instance
     * This is shared across all providers that need key resolution
     */
    public getKeySpaceResolver(): KeySpaceResolver {
        if (!this.keySpaceResolver) {
            this.keySpaceResolver = this.options.keySpaceResolver || new KeySpaceResolver();
            this.disposables.push(this.keySpaceResolver);
            logger.debug('KeySpaceResolver created');
        }
        return this.keySpaceResolver;
    }

    /**
     * Create or get the DitaLinkProvider instance
     * The link provider enables Ctrl+Click navigation in DITA files
     */
    public getLinkProvider(): DitaLinkProvider {
        if (!this.linkProvider) {
            const keySpaceResolver = this.getKeySpaceResolver();
            this.linkProvider = new DitaLinkProvider(keySpaceResolver);
            // Note: DitaLinkProvider doesn't implement Disposable, no need to track
            logger.debug('DitaLinkProvider created');
        }
        return this.linkProvider;
    }

    /**
     * Register the link provider with VS Code
     * Handles all necessary document selectors for DITA files
     */
    public registerLinkProvider(): vscode.Disposable[] {
        const linkProvider = this.getLinkProvider();

        // Register for .ditamap files
        const ditamapProvider = vscode.languages.registerDocumentLinkProvider(
            { language: 'dita', pattern: '**/*.ditamap' },
            linkProvider
        );

        // Register for .bookmap files
        const bookmapProvider = vscode.languages.registerDocumentLinkProvider(
            { language: 'dita', pattern: '**/*.bookmap' },
            linkProvider
        );

        // Also register for generic DITA language (catches all .dita, .ditamap, .bookmap)
        const ditaProvider = vscode.languages.registerDocumentLinkProvider(
            { language: 'dita' },
            linkProvider
        );

        const registrations = [ditamapProvider, bookmapProvider, ditaProvider];
        this.disposables.push(...registrations);

        logger.info('DITA Link Provider registered via ProviderFactory');
        return registrations;
    }

    /**
     * Register all providers at once
     * Convenience method for typical extension activation
     */
    public registerAllProviders(): {
        linkProvider: DitaLinkProvider;
        linkProviderRegistrations: vscode.Disposable[];
        keySpaceResolver: KeySpaceResolver;
    } {
        return {
            linkProvider: this.getLinkProvider(),
            linkProviderRegistrations: this.registerLinkProvider(),
            keySpaceResolver: this.getKeySpaceResolver()
        };
    }

    /**
     * Dispose all created providers and shared resources
     */
    public dispose(): void {
        logger.debug('ProviderFactory disposing...');

        // Dispose in reverse order of creation
        for (let i = this.disposables.length - 1; i >= 0; i--) {
            try {
                this.disposables[i].dispose();
            } catch (error) {
                logger.error('Error disposing provider', error);
            }
        }

        this.disposables = [];
        this.linkProvider = undefined;
        this.keySpaceResolver = undefined;

        logger.info('ProviderFactory disposed');
    }
}

// Global factory instance for shared use
let globalProviderFactory: ProviderFactory | undefined;

/**
 * Get or create the global ProviderFactory instance
 * @param context Extension context (required on first call)
 * @param options Optional configuration options
 */
export function getProviderFactory(
    context?: vscode.ExtensionContext,
    options?: ProviderFactoryOptions
): ProviderFactory {
    if (!globalProviderFactory) {
        if (!context) {
            throw new Error('ProviderFactory not initialized. Call with context first.');
        }
        globalProviderFactory = new ProviderFactory(context, options);
    }
    return globalProviderFactory;
}

/**
 * Dispose the global ProviderFactory instance
 * Call this during extension deactivation
 */
export function disposeProviderFactory(): void {
    if (globalProviderFactory) {
        globalProviderFactory.dispose();
        globalProviderFactory = undefined;
    }
}

/**
 * Check if the global ProviderFactory is initialized
 */
export function isProviderFactoryInitialized(): boolean {
    return globalProviderFactory !== undefined;
}
