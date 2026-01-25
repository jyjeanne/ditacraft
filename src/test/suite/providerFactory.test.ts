/**
 * Provider Factory Tests
 * P2-2: Tests for centralized provider factory
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import {
    ProviderFactory,
    getProviderFactory,
    disposeProviderFactory,
    isProviderFactoryInitialized
} from '../../utils/providerFactory';
import { KeySpaceResolver } from '../../utils/keySpaceResolver';
import { DitaValidator } from '../../providers/ditaValidator';
import { DitaLinkProvider } from '../../providers/ditaLinkProvider';
import { KeyDiagnosticsProvider } from '../../providers/keyDiagnostics';

suite('ProviderFactory Test Suite', () => {
    let mockContext: vscode.ExtensionContext;

    setup(() => {
        // Create a minimal mock context for testing
        mockContext = {
            subscriptions: [],
            globalState: {
                get: () => undefined,
                update: () => Promise.resolve(),
                keys: () => []
            },
            workspaceState: {
                get: () => undefined,
                update: () => Promise.resolve(),
                keys: () => []
            },
            extensionPath: '',
            extensionUri: vscode.Uri.file('/test'),
            storageUri: undefined,
            globalStorageUri: vscode.Uri.file('/test/global'),
            logUri: vscode.Uri.file('/test/log'),
            asAbsolutePath: (p: string) => p,
            storagePath: undefined,
            globalStoragePath: '/test/global',
            logPath: '/test/log',
            extensionMode: vscode.ExtensionMode.Test,
            extension: {} as vscode.Extension<unknown>,
            environmentVariableCollection: {} as vscode.GlobalEnvironmentVariableCollection,
            secrets: {
                get: () => Promise.resolve(undefined),
                store: () => Promise.resolve(),
                delete: () => Promise.resolve(),
                onDidChange: new vscode.EventEmitter<vscode.SecretStorageChangeEvent>().event
            },
            languageModelAccessInformation: {
                onDidChange: new vscode.EventEmitter<void>().event,
                canSendRequest: () => undefined
            }
        } as unknown as vscode.ExtensionContext;

        // Clean up any existing global factory
        disposeProviderFactory();
    });

    teardown(() => {
        // Clean up after each test
        disposeProviderFactory();

        // Dispose any subscriptions added to the mock context
        mockContext.subscriptions.forEach(sub => {
            if (sub && typeof sub.dispose === 'function') {
                try {
                    sub.dispose();
                } catch {
                    // Ignore disposal errors in tests
                }
            }
        });
    });

    suite('ProviderFactory instance', () => {
        test('Should create ProviderFactory with context', () => {
            const factory = new ProviderFactory(mockContext);
            assert.ok(factory, 'Factory should be created');
            factory.dispose();
        });

        test('Should create KeySpaceResolver', () => {
            const factory = new ProviderFactory(mockContext);
            const resolver = factory.getKeySpaceResolver();

            assert.ok(resolver, 'KeySpaceResolver should be created');
            assert.ok(resolver instanceof KeySpaceResolver, 'Should be KeySpaceResolver instance');

            factory.dispose();
        });

        test('Should return same KeySpaceResolver on multiple calls', () => {
            const factory = new ProviderFactory(mockContext);
            const resolver1 = factory.getKeySpaceResolver();
            const resolver2 = factory.getKeySpaceResolver();

            assert.strictEqual(resolver1, resolver2, 'Should return same instance');

            factory.dispose();
        });

        test('Should create DitaValidator', () => {
            const factory = new ProviderFactory(mockContext);
            const validator = factory.getValidator();

            assert.ok(validator, 'Validator should be created');
            assert.ok(validator instanceof DitaValidator, 'Should be DitaValidator instance');

            factory.dispose();
        });

        test('Should return same DitaValidator on multiple calls', () => {
            const factory = new ProviderFactory(mockContext);
            const validator1 = factory.getValidator();
            const validator2 = factory.getValidator();

            assert.strictEqual(validator1, validator2, 'Should return same instance');

            factory.dispose();
        });

        test('Should create DitaLinkProvider', () => {
            const factory = new ProviderFactory(mockContext);
            const linkProvider = factory.getLinkProvider();

            assert.ok(linkProvider, 'LinkProvider should be created');
            assert.ok(linkProvider instanceof DitaLinkProvider, 'Should be DitaLinkProvider instance');

            factory.dispose();
        });

        test('Should create KeyDiagnosticsProvider', () => {
            const factory = new ProviderFactory(mockContext);
            const diagnosticsProvider = factory.getKeyDiagnosticsProvider();

            assert.ok(diagnosticsProvider, 'DiagnosticsProvider should be created');
            assert.ok(diagnosticsProvider instanceof KeyDiagnosticsProvider, 'Should be KeyDiagnosticsProvider instance');

            factory.dispose();
        });

        test('Should share KeySpaceResolver between providers', () => {
            const factory = new ProviderFactory(mockContext);

            const keySpaceResolver = factory.getKeySpaceResolver();
            const linkProvider = factory.getLinkProvider();

            // The link provider should use the same KeySpaceResolver
            const linkProviderResolver = linkProvider.getKeySpaceResolver();
            assert.strictEqual(keySpaceResolver, linkProviderResolver, 'Should share KeySpaceResolver');

            factory.dispose();
        });

        test('Should accept custom KeySpaceResolver in options', () => {
            const customResolver = new KeySpaceResolver();
            const factory = new ProviderFactory(mockContext, { keySpaceResolver: customResolver });

            const resolver = factory.getKeySpaceResolver();
            assert.strictEqual(resolver, customResolver, 'Should use custom resolver');

            factory.dispose();
            customResolver.dispose();
        });

        test('Should dispose all providers on factory dispose', () => {
            const factory = new ProviderFactory(mockContext);

            // Create all providers
            factory.getKeySpaceResolver();
            factory.getValidator();
            factory.getLinkProvider();
            factory.getKeyDiagnosticsProvider();

            // Dispose should not throw
            assert.doesNotThrow(() => factory.dispose(), 'Dispose should not throw');
        });

        test('Should register all providers', () => {
            const factory = new ProviderFactory(mockContext);

            const providers = factory.registerAllProviders();

            assert.ok(providers.validator, 'Validator should be registered');
            assert.ok(providers.linkProvider, 'LinkProvider should be registered');
            assert.ok(providers.keyDiagnosticsProvider, 'KeyDiagnosticsProvider should be registered');
            assert.ok(providers.keySpaceResolver, 'KeySpaceResolver should be available');

            factory.dispose();
        });
    });

    suite('Global ProviderFactory', () => {
        test('Should not be initialized initially', () => {
            assert.strictEqual(isProviderFactoryInitialized(), false, 'Should not be initialized');
        });

        test('Should throw when getting factory without context', () => {
            assert.throws(
                () => getProviderFactory(),
                /not initialized/,
                'Should throw when not initialized'
            );
        });

        test('Should initialize with context', () => {
            const factory = getProviderFactory(mockContext);

            assert.ok(factory, 'Factory should be created');
            assert.strictEqual(isProviderFactoryInitialized(), true, 'Should be initialized');
        });

        test('Should return same instance on subsequent calls', () => {
            const factory1 = getProviderFactory(mockContext);
            const factory2 = getProviderFactory(); // No context needed after initialization

            assert.strictEqual(factory1, factory2, 'Should return same instance');
        });

        test('Should dispose global factory', () => {
            getProviderFactory(mockContext);
            assert.strictEqual(isProviderFactoryInitialized(), true, 'Should be initialized');

            disposeProviderFactory();
            assert.strictEqual(isProviderFactoryInitialized(), false, 'Should not be initialized after dispose');
        });

        test('Should allow re-initialization after dispose', () => {
            const factory1 = getProviderFactory(mockContext);
            disposeProviderFactory();

            const factory2 = getProviderFactory(mockContext);
            assert.notStrictEqual(factory1, factory2, 'Should create new instance');
        });
    });
});
