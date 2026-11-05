import * as assert from 'assert';
import { handleValidateFragment, ValidateFragmentParams } from '../src/features/fragmentValidator';
import { ValidationPipeline } from '../src/services/validationPipeline';
import { CatalogValidationService } from '../src/services/catalogValidationService';
import { RngValidationService } from '../src/services/rngValidationService';
import { SubjectSchemeService } from '../src/services/subjectSchemeService';
import { initSettings, updateGlobalSettings, clearDocumentSettings, getGlobalSettings } from '../src/settings';

function makeCatalogService(): CatalogValidationService {
    return {
        isAvailable: false,
        validate: () => [],
        initialize: () => {},
        reinitialize: () => {},
        error: null,
    } as unknown as CatalogValidationService;
}

function makeRngService(): RngValidationService {
    return {
        isAvailable: false,
        validate: async () => [],
        initialize: () => {},
        setSchemaBasePath: () => {},
        error: null,
    } as unknown as RngValidationService;
}

function makeSubjectSchemeService(): SubjectSchemeService {
    return {
        hasSchemeData: () => false,
        registerSchemes: () => {},
        getValidValues: () => null,
        getDefaultValue: () => null,
        getHierarchyPath: () => null,
        isControlledAttribute: () => false,
        snapshotFor: () => ({
            hasSchemeData: () => false,
            isControlledAttribute: () => false,
            getValidValues: () => null,
            getDefaultValue: () => null,
            getHierarchyPath: () => null,
        }),
        invalidate: () => {},
        shutdown: () => {},
    } as unknown as SubjectSchemeService;
}

function makePipeline(): ValidationPipeline {
    return new ValidationPipeline(makeCatalogService(), makeRngService(), makeSubjectSchemeService());
}

/** Configure the settings module so getDocumentSettings() resolves via a mock connection. */
function useConnectionConfig(config: Record<string, unknown>): void {
    const mockConnection = {
        workspace: { getConfiguration: () => Promise.resolve(config) },
    };
    initSettings(mockConnection as never, true);
    clearDocumentSettings();
}

suite('handleValidateFragment', () => {

    teardown(() => {
        clearDocumentSettings();
        initSettings({
            workspace: { getConfiguration: () => Promise.resolve({}) },
        } as never, false);
        updateGlobalSettings({});
    });

    suite('settings source (regression)', () => {
        // A fragment that trips DITA-SCH-011 (deprecated @alt on <image>) whenever
        // DITA rules validation is enabled — the default.
        const params: ValidateFragmentParams = {
            fragment: '<image href="pic.png" alt="description"/>',
            contextUri: 'file:///workspace/topic.dita',
            fragmentType: 'element',
        };

        test('honors the real per-document settings (rule fires when enabled)', async () => {
            useConnectionConfig({}); // defaults — ditaRulesEnabled: true
            const result = await handleValidateFragment(params, makePipeline());
            const sch011 = result.diagnostics.filter(d => d.code === 'DITA-SCH-011');
            assert.strictEqual(sch011.length, 1, 'rule should fire under default per-document settings');
        });

        test('honors the real per-document settings (rule silenced when disabled)', async () => {
            // Per-document config (as the real client would report it) disables
            // DITA rules entirely. Before the fix, handleValidateFragment read
            // getGlobalSettings() instead — which stays hardcoded at defaults
            // (ditaRulesEnabled: true) whenever the client supports configuration
            // pull — so this diagnostic would incorrectly still appear.
            useConnectionConfig({ ditaRulesEnabled: false });
            const result = await handleValidateFragment(params, makePipeline());
            const sch011 = result.diagnostics.filter(d => d.code === 'DITA-SCH-011');
            assert.strictEqual(sch011.length, 0, 'rule must be silenced per the real per-document config');
        });
    });

    suite('cache isolation (regression)', () => {
        // Every fragment used to be validated as the same synthetic document
        // (ditacraft-fragment:///fragment.dita, version 0), so the pipeline's
        // per-phase cache returned the first fragment's diagnostics for every
        // later fragment validated within the cache TTL.
        const withTitle: ValidateFragmentParams = {
            fragment: '<topic id="a"><title>Title</title><body><p>Text.</p></body></topic>',
            contextUri: 'file:///workspace/topic.dita',
            fragmentType: 'topic',
        };
        const withoutTitle: ValidateFragmentParams = {
            fragment: '<topic id="b"><body><p>Text.</p></body></topic>',
            contextUri: 'file:///workspace/topic.dita',
            fragmentType: 'topic',
        };
        const errorCount = (r: { diagnostics: { severity?: number }[] }) =>
            r.diagnostics.filter(d => d.severity === 1).length;

        test('a fragment validated after another one gets its own diagnostics', async () => {
            useConnectionConfig({});
            const pipeline = makePipeline();
            const first = await handleValidateFragment(withTitle, pipeline);
            const second = await handleValidateFragment(withoutTitle, pipeline);
            const third = await handleValidateFragment(withTitle, pipeline);
            assert.strictEqual(first.isValid, true, 'a topic with a title is valid');
            assert.strictEqual(second.isValid, false, 'a topic without a title must not reuse the previous result');
            assert.ok(errorCount(second) > 0);
            assert.strictEqual(third.isValid, true, 'the valid fragment must not reuse the invalid result');
        });

        test('fragments validated concurrently do not share results', async () => {
            useConnectionConfig({});
            const pipeline = makePipeline();
            const [a, b] = await Promise.all([
                handleValidateFragment(withTitle, pipeline),
                handleValidateFragment(withoutTitle, pipeline),
            ]);
            assert.strictEqual(a.isValid, true);
            assert.strictEqual(b.isValid, false);
        });
    });

    suite('explicit settings', () => {
        test('settings passed by the caller replace the document settings', async () => {
            // The MCP server has no client connection: it passes its own settings.
            useConnectionConfig({ ditaRulesEnabled: true });
            const params: ValidateFragmentParams = {
                fragment: '<image href="pic.png" alt="description"/>',
                contextUri: 'file:///workspace/topic.dita',
                fragmentType: 'element',
            };
            const result = await handleValidateFragment(params, makePipeline(), { ...getGlobalSettings(), ditaRulesEnabled: false });
            assert.strictEqual(result.diagnostics.filter(d => d.code === 'DITA-SCH-011').length, 0);
        });
    });

    suite('wrapFragment (regression)', () => {
        test('map fragment with sibling topicrefs and no root wraps into a single well-formed document', async () => {
            useConnectionConfig({});
            const params: ValidateFragmentParams = {
                fragment: '<topicref href="a.dita"/>\n<topicref href="b.dita"/>',
                contextUri: 'file:///workspace/root.ditamap',
                fragmentType: 'map',
            };
            const result = await handleValidateFragment(params, makePipeline());
            const wellFormednessErrors = result.diagnostics.filter(d => d.code === 'DITA-XML-001');
            assert.strictEqual(
                wellFormednessErrors.length, 0,
                'sibling topicrefs should be wrapped in a single <map> root, not reported as malformed XML'
            );
        });

        test('map fragment already rooted in <map> is used as-is', async () => {
            useConnectionConfig({});
            const params: ValidateFragmentParams = {
                fragment: '<map><topicref href="a.dita"/></map>',
                contextUri: 'file:///workspace/root.ditamap',
                fragmentType: 'map',
            };
            const result = await handleValidateFragment(params, makePipeline());
            const wellFormednessErrors = result.diagnostics.filter(d => d.code === 'DITA-XML-001');
            assert.strictEqual(wellFormednessErrors.length, 0);
        });
    });
});
