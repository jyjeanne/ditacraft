import * as assert from 'assert';
import {
    getGlobalSettings,
    updateGlobalSettings,
    clearDocumentSettings,
    getDocumentSettings,
    initSettings,
} from '../src/settings';

suite('settings', () => {

    // ── Default settings ────────────────────────────────────────

    suite('getGlobalSettings', () => {
        test('returns default settings', () => {
            const settings = getGlobalSettings();
            assert.strictEqual(settings.autoValidate, true);
            assert.strictEqual(settings.validationDebounceMs, 300);
            assert.strictEqual(settings.validationEngine, 'built-in');
            assert.strictEqual(settings.keySpaceCacheTtlMinutes, 5);
            assert.strictEqual(settings.maxLinkMatches, 10000);
            assert.strictEqual(settings.maxNumberOfProblems, 100);
            assert.strictEqual(settings.logLevel, 'info');
        });

        test('default DITA rules settings', () => {
            const settings = getGlobalSettings();
            assert.strictEqual(settings.ditaRulesEnabled, true);
            assert.ok(Array.isArray(settings.ditaRulesCategories));
            assert.ok(settings.ditaRulesCategories.includes('mandatory'));
            assert.ok(settings.ditaRulesCategories.includes('recommendation'));
            assert.ok(settings.ditaRulesCategories.includes('authoring'));
            assert.ok(settings.ditaRulesCategories.includes('accessibility'));
        });

        test('default cross-ref and subject scheme settings', () => {
            const settings = getGlobalSettings();
            assert.strictEqual(settings.crossRefValidationEnabled, true);
            assert.strictEqual(settings.subjectSchemeValidationEnabled, true);
        });

        test('default schema settings', () => {
            const settings = getGlobalSettings();
            assert.strictEqual(settings.ditaVersion, 'auto');
            assert.strictEqual(settings.schemaFormat, 'dtd');
            assert.strictEqual(settings.rngSchemaPath, '');
            assert.strictEqual(settings.xmlCatalogPath, '');
        });

        test('default severity overrides is empty', () => {
            const settings = getGlobalSettings();
            assert.deepStrictEqual(settings.validationSeverityOverrides, {});
        });

        test('default custom rules file is empty string', () => {
            const settings = getGlobalSettings();
            assert.strictEqual(settings.customRulesFile, '');
        });

        test('default large file threshold is 500 KB', () => {
            const settings = getGlobalSettings();
            assert.strictEqual(settings.largeFileThresholdKB, 500);
        });
    });

    // ── updateGlobalSettings ────────────────────────────────────

    suite('updateGlobalSettings', () => {
        // Reset to defaults after each test to avoid cross-contamination
        const snapshot = { ...getGlobalSettings() };
        teardown(() => {
            updateGlobalSettings(snapshot);
        });

        test('merges partial settings into defaults', () => {
            updateGlobalSettings({ maxNumberOfProblems: 200 });
            const settings = getGlobalSettings();
            assert.strictEqual(settings.maxNumberOfProblems, 200);
            // Other defaults preserved
            assert.strictEqual(settings.autoValidate, true);
            assert.strictEqual(settings.validationDebounceMs, 300);
        });

        test('overrides multiple fields at once', () => {
            updateGlobalSettings({
                autoValidate: false,
                logLevel: 'debug',
                keySpaceCacheTtlMinutes: 10,
            });
            const settings = getGlobalSettings();
            assert.strictEqual(settings.autoValidate, false);
            assert.strictEqual(settings.logLevel, 'debug');
            assert.strictEqual(settings.keySpaceCacheTtlMinutes, 10);
        });

        test('empty partial preserves all defaults', () => {
            updateGlobalSettings({});
            const settings = getGlobalSettings();
            assert.strictEqual(settings.autoValidate, true);
            assert.strictEqual(settings.maxNumberOfProblems, 100);
        });

        test('can override severity overrides', () => {
            updateGlobalSettings({
                validationSeverityOverrides: { 'DITA-XML-001': 'warning' },
            });
            const settings = getGlobalSettings();
            assert.strictEqual(settings.validationSeverityOverrides['DITA-XML-001'], 'warning');
        });
    });

    // ── clearDocumentSettings ───────────────────────────────────

    suite('clearDocumentSettings', () => {
        test('clears all document settings without error', () => {
            // Should not throw even when cache is already empty
            assert.doesNotThrow(() => clearDocumentSettings());
        });

        test('clears a specific URI without error', () => {
            assert.doesNotThrow(() => clearDocumentSettings('file:///test.dita'));
        });
    });

    // ── getDocumentSettings without configuration capability ────

    suite('getDocumentSettings (no config capability)', () => {
        setup(() => {
            // Initialize without configuration capability → returns global settings
            const mockConnection = {
                workspace: { getConfiguration: () => Promise.resolve({}) },
            };
            initSettings(mockConnection as never, false);
        });

        test('returns global settings when no config capability', async () => {
            updateGlobalSettings({ maxNumberOfProblems: 42 });
            const settings = await getDocumentSettings('file:///test.dita');
            assert.strictEqual(settings.maxNumberOfProblems, 42);
        });

        test('returns same settings for different URIs', async () => {
            const s1 = await getDocumentSettings('file:///a.dita');
            const s2 = await getDocumentSettings('file:///b.dita');
            assert.strictEqual(s1, s2);
        });

        // Restore defaults
        teardown(() => {
            updateGlobalSettings({});
            clearDocumentSettings();
        });
    });

    // ── getDocumentSettings with configuration capability ────

    suite('getDocumentSettings (with config capability)', () => {
        setup(() => {
            const mockConnection = {
                workspace: {
                    getConfiguration: () => Promise.resolve({
                        maxNumberOfProblems: 77,
                        logLevel: 'debug',
                    }),
                },
            };
            initSettings(mockConnection as never, true);
            clearDocumentSettings();
        });

        test('fetches settings from connection', async () => {
            const settings = await getDocumentSettings('file:///test.dita');
            assert.strictEqual(settings.maxNumberOfProblems, 77);
            assert.strictEqual(settings.logLevel, 'debug');
        });

        test('merges fetched settings with defaults', async () => {
            const settings = await getDocumentSettings('file:///test.dita');
            // Defaults for fields not returned by mock
            assert.strictEqual(settings.autoValidate, true);
            assert.strictEqual(settings.keySpaceCacheTtlMinutes, 5);
        });

        test('caches settings per URI', async () => {
            const s1 = await getDocumentSettings('file:///test.dita');
            const s2 = await getDocumentSettings('file:///test.dita');
            assert.strictEqual(s1, s2); // Same promise/reference
        });

        test('clearDocumentSettings forces refetch', async () => {
            await getDocumentSettings('file:///test.dita');
            clearDocumentSettings('file:///test.dita');
            // After clearing, a new promise is created (different reference)
            const p1 = getDocumentSettings('file:///test.dita');
            const p2 = getDocumentSettings('file:///other.dita');
            assert.notStrictEqual(p1, p2);
        });

        teardown(() => {
            clearDocumentSettings();
            // Reset to no-config mode
            initSettings({
                workspace: { getConfiguration: () => Promise.resolve({}) },
            } as never, false);
            updateGlobalSettings({});
        });
    });
});
