/**
 * Configuration Manager Test Suite
 * Tests for dynamic configuration management
 */

import * as assert from 'assert';
import { ConfigurationManager, DitaCraftConfiguration, ConfigurationChangeEvent } from '../../utils/configurationManager';

suite('Configuration Manager Test Suite', () => {

    // Clean up singleton after each test to prevent state leakage
    teardown(() => {
        ConfigurationManager.resetInstance();
    });

    suite('Singleton Pattern', () => {
        test('Should return the same instance', () => {
            const instance1 = ConfigurationManager.getInstance();
            const instance2 = ConfigurationManager.getInstance();

            assert.strictEqual(instance1, instance2, 'Should return the same singleton instance');
        });
    });

    suite('Configuration Access', () => {
        test('Should get full configuration object', () => {
            const configManager = ConfigurationManager.getInstance();
            const config = configManager.getConfiguration();

            assert.ok(config, 'Should return configuration object');
            assert.ok('logLevel' in config, 'Should have logLevel property');
            assert.ok('autoValidate' in config, 'Should have autoValidate property');
            assert.ok('validationEngine' in config, 'Should have validationEngine property');
        });

        test('Should get individual configuration values', () => {
            const configManager = ConfigurationManager.getInstance();

            const logLevel = configManager.get('logLevel');
            assert.ok(['debug', 'info', 'warn', 'error'].includes(logLevel),
                'logLevel should be a valid log level');

            const autoValidate = configManager.get('autoValidate');
            assert.strictEqual(typeof autoValidate, 'boolean',
                'autoValidate should be a boolean');

            const maxLinkMatches = configManager.get('maxLinkMatches');
            assert.strictEqual(typeof maxLinkMatches, 'number',
                'maxLinkMatches should be a number');
        });

        test('Should return default values for unconfigured settings', () => {
            const configManager = ConfigurationManager.getInstance();
            const defaults = configManager.getDefaults();

            assert.strictEqual(defaults.logLevel, 'info', 'Default logLevel should be "info"');
            assert.strictEqual(defaults.autoValidate, true, 'Default autoValidate should be true');
            assert.strictEqual(defaults.validationDebounceMs, 500, 'Default validationDebounceMs should be 500');
            assert.strictEqual(defaults.maxLinkMatches, 10000, 'Default maxLinkMatches should be 10000');
        });

        test('Should return a copy of configuration to prevent mutation', () => {
            const configManager = ConfigurationManager.getInstance();
            const config1 = configManager.getConfiguration();
            const config2 = configManager.getConfiguration();

            assert.notStrictEqual(config1, config2, 'Should return different objects');
            assert.deepStrictEqual(config1, config2, 'But with the same values');

            // Modify config1 and verify config2 is unaffected
            (config1 as unknown as { logLevel: string }).logLevel = 'debug';
            const config3 = configManager.getConfiguration();
            assert.notStrictEqual(config1.logLevel, config3.logLevel,
                'Modifying returned config should not affect cached config');
        });
    });

    suite('Configuration Types', () => {
        test('Should have correct types for all configuration properties', () => {
            const configManager = ConfigurationManager.getInstance();
            const config = configManager.getConfiguration();

            // String properties
            assert.strictEqual(typeof config.ditaOtPath, 'string');
            assert.strictEqual(typeof config.defaultTranstype, 'string');
            assert.strictEqual(typeof config.outputDirectory, 'string');
            assert.strictEqual(typeof config.validationEngine, 'string');
            assert.strictEqual(typeof config.logLevel, 'string');

            // Boolean properties
            assert.strictEqual(typeof config.autoValidate, 'boolean');
            assert.strictEqual(typeof config.previewAutoRefresh, 'boolean');
            assert.strictEqual(typeof config.previewScrollSync, 'boolean');
            assert.strictEqual(typeof config.showProgressNotifications, 'boolean');
            assert.strictEqual(typeof config.enableSnippets, 'boolean');
            assert.strictEqual(typeof config.enableFileLogging, 'boolean');
            assert.strictEqual(typeof config.enableConsoleLogging, 'boolean');

            // Number properties
            assert.strictEqual(typeof config.ditaOtTimeoutMinutes, 'number');
            assert.strictEqual(typeof config.validationDebounceMs, 'number');
            assert.strictEqual(typeof config.keySpaceCacheTtlMinutes, 'number');
            assert.strictEqual(typeof config.maxLinkMatches, 'number');

            // Array properties
            assert.ok(Array.isArray(config.ditaOtArgs), 'ditaOtArgs should be an array');
        });

        test('Should validate enum values', () => {
            const configManager = ConfigurationManager.getInstance();
            const config = configManager.getConfiguration();

            const validTranstypes = ['html5', 'pdf', 'xhtml', 'epub', 'htmlhelp', 'markdown'];
            assert.ok(validTranstypes.includes(config.defaultTranstype),
                `defaultTranstype should be one of: ${validTranstypes.join(', ')}`);

            const validEngines = ['xmllint', 'built-in'];
            assert.ok(validEngines.includes(config.validationEngine),
                `validationEngine should be one of: ${validEngines.join(', ')}`);

            const validLogLevels = ['debug', 'info', 'warn', 'error'];
            assert.ok(validLogLevels.includes(config.logLevel),
                `logLevel should be one of: ${validLogLevels.join(', ')}`);

            const validPreviewThemes = ['auto', 'light', 'dark'];
            assert.ok(validPreviewThemes.includes(config.previewTheme),
                `previewTheme should be one of: ${validPreviewThemes.join(', ')}`);
        });
    });

    suite('Configuration Change Listener', () => {
        test('Should allow registering change listeners', () => {
            const configManager = ConfigurationManager.getInstance();

            const disposable = configManager.onConfigurationChange(() => {
                // Listener registered but not expected to be called in this test
            });

            assert.ok(disposable, 'Should return a disposable');
            assert.ok(typeof disposable.dispose === 'function', 'Disposable should have dispose method');

            // Clean up
            disposable.dispose();
        });

        test('Should allow unregistering change listeners via dispose', () => {
            const configManager = ConfigurationManager.getInstance();

            let callCount = 0;
            const disposable = configManager.onConfigurationChange(() => {
                callCount++;
            });

            // Dispose should work without error
            disposable.dispose();

            // After dispose, the listener should no longer be in the internal set
            // (We can't easily test this directly, but we can verify dispose doesn't throw)
            assert.strictEqual(callCount, 0, 'Callback should not have been invoked');
        });
    });

    suite('Configuration Reload', () => {
        test('Should reload configuration on demand', () => {
            const configManager = ConfigurationManager.getInstance();

            // Get config before reload
            const configBefore = configManager.getConfiguration();

            // Reload
            configManager.reloadConfiguration();

            // Get config after reload
            const configAfter = configManager.getConfiguration();

            // Values should be the same (no actual change in VS Code settings)
            assert.deepStrictEqual(configBefore, configAfter,
                'Configuration should be consistent after reload');
        });
    });

    suite('Change Event Structure', () => {
        test('ConfigurationChangeEvent should have correct structure', () => {
            // Test the type definition by creating a mock event
            const previousValues = new Map<string, unknown>();
            previousValues.set('logLevel', 'info');
            previousValues.set('autoValidate', true);

            const newValues = new Map<string, unknown>();
            newValues.set('logLevel', 'debug');
            newValues.set('autoValidate', false);

            const mockEvent: ConfigurationChangeEvent = {
                affectedKeys: ['logLevel', 'autoValidate'],
                previousValues,
                newValues
            };

            assert.ok(Array.isArray(mockEvent.affectedKeys), 'affectedKeys should be an array');
            assert.ok(mockEvent.previousValues instanceof Map, 'previousValues should be a Map');
            assert.ok(mockEvent.newValues instanceof Map, 'newValues should be a Map');

            assert.strictEqual(mockEvent.affectedKeys.length, 2, 'Should have 2 affected keys');
            assert.strictEqual(mockEvent.previousValues.get('logLevel'), 'info');
            assert.strictEqual(mockEvent.newValues.get('logLevel'), 'debug');
        });

        test('Should correctly identify affected keys', () => {
            const configManager = ConfigurationManager.getInstance();

            const mockEvent: ConfigurationChangeEvent = {
                affectedKeys: ['logLevel', 'autoValidate'],
                previousValues: new Map(),
                newValues: new Map()
            };

            assert.ok(configManager.wasAffected(mockEvent, 'logLevel'), 'logLevel should be affected');
            assert.ok(configManager.wasAffected(mockEvent, 'autoValidate'), 'autoValidate should be affected');
            assert.ok(!configManager.wasAffected(mockEvent, 'validationEngine'), 'validationEngine should not be affected');
        });
    });

    suite('Default Configuration', () => {
        test('Should have all expected default values', () => {
            const configManager = ConfigurationManager.getInstance();
            const defaults = configManager.getDefaults();

            // Verify all expected properties exist
            const expectedProperties: (keyof DitaCraftConfiguration)[] = [
                'ditaOtPath',
                'defaultTranstype',
                'outputDirectory',
                'ditaOtArgs',
                'ditaOtTimeoutMinutes',
                'autoValidate',
                'validationEngine',
                'validationDebounceMs',
                'previewAutoRefresh',
                'previewTheme',
                'previewCustomCss',
                'previewScrollSync',
                'showProgressNotifications',
                'enableSnippets',
                'logLevel',
                'enableFileLogging',
                'enableConsoleLogging',
                'keySpaceCacheTtlMinutes',
                'maxLinkMatches'
            ];

            for (const prop of expectedProperties) {
                assert.ok(prop in defaults, `Default config should have property: ${prop}`);
            }
        });

        test('Should not allow mutation of default values', () => {
            const configManager = ConfigurationManager.getInstance();
            const defaults1 = configManager.getDefaults();
            const defaults2 = configManager.getDefaults();

            assert.notStrictEqual(defaults1, defaults2, 'Should return different objects');

            // Modify defaults1 and verify defaults2 is unaffected
            (defaults1 as unknown as { logLevel: string }).logLevel = 'error';
            const defaults3 = configManager.getDefaults();
            assert.strictEqual(defaults3.logLevel, 'info',
                'Modifying returned defaults should not affect internal defaults');
        });
    });

    suite('Preview Configuration', () => {
        test('Should have previewScrollSync boolean setting', () => {
            const configManager = ConfigurationManager.getInstance();
            const config = configManager.getConfiguration();

            assert.strictEqual(typeof config.previewScrollSync, 'boolean',
                'previewScrollSync should be a boolean');
        });

        test('Should have previewScrollSync default to true', () => {
            const configManager = ConfigurationManager.getInstance();
            const defaults = configManager.getDefaults();

            assert.strictEqual(defaults.previewScrollSync, true,
                'previewScrollSync should default to true');
        });

        test('Should have previewTheme string setting', () => {
            const configManager = ConfigurationManager.getInstance();
            const config = configManager.getConfiguration();

            assert.strictEqual(typeof config.previewTheme, 'string',
                'previewTheme should be a string');
        });

        test('Should have previewTheme default to auto', () => {
            const configManager = ConfigurationManager.getInstance();
            const defaults = configManager.getDefaults();

            assert.strictEqual(defaults.previewTheme, 'auto',
                'previewTheme should default to "auto"');
        });

        test('Should have previewCustomCss string setting', () => {
            const configManager = ConfigurationManager.getInstance();
            const config = configManager.getConfiguration();

            assert.strictEqual(typeof config.previewCustomCss, 'string',
                'previewCustomCss should be a string');
        });

        test('Should have previewCustomCss default to empty string', () => {
            const configManager = ConfigurationManager.getInstance();
            const defaults = configManager.getDefaults();

            assert.strictEqual(defaults.previewCustomCss, '',
                'previewCustomCss should default to empty string');
        });

        test('Should have previewAutoRefresh boolean setting', () => {
            const configManager = ConfigurationManager.getInstance();
            const config = configManager.getConfiguration();

            assert.strictEqual(typeof config.previewAutoRefresh, 'boolean',
                'previewAutoRefresh should be a boolean');
        });

        test('Should have previewAutoRefresh default to true', () => {
            const configManager = ConfigurationManager.getInstance();
            const defaults = configManager.getDefaults();

            assert.strictEqual(defaults.previewAutoRefresh, true,
                'previewAutoRefresh should default to true');
        });

        test('Preview settings should be accessible via get method', () => {
            const configManager = ConfigurationManager.getInstance();

            const scrollSync = configManager.get('previewScrollSync');
            assert.strictEqual(typeof scrollSync, 'boolean', 'Should get previewScrollSync');

            const theme = configManager.get('previewTheme');
            assert.strictEqual(typeof theme, 'string', 'Should get previewTheme');

            const customCss = configManager.get('previewCustomCss');
            assert.strictEqual(typeof customCss, 'string', 'Should get previewCustomCss');
        });
    });
});

suite('Logger Dynamic Configuration Test Suite', () => {
    test('Logger should have reloadConfiguration method', async () => {
        // Import logger dynamically to test it has the method
        const { logger } = await import('../../utils/logger');

        assert.ok(typeof logger.reloadConfiguration === 'function',
            'Logger should have reloadConfiguration method');
    });

    test('Logger reloadConfiguration should not throw', async () => {
        const { logger } = await import('../../utils/logger');

        // Should not throw when called
        assert.doesNotThrow(() => {
            logger.reloadConfiguration();
        }, 'reloadConfiguration should not throw');
    });
});
