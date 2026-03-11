import * as assert from 'assert';
import { ValidationPipeline, WorkspaceContext } from '../src/services/validationPipeline';
import { CatalogValidationService } from '../src/services/catalogValidationService';
import { RngValidationService } from '../src/services/rngValidationService';
import { SubjectSchemeService } from '../src/services/subjectSchemeService';
import { DitaCraftSettings } from '../src/settings';
import { createDoc } from './helper';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCatalogService(overrides: Partial<CatalogValidationService> = {}): CatalogValidationService {
    return {
        isAvailable: false,
        validate: () => [],
        initialize: () => {},
        reinitialize: () => {},
        error: null,
        ...overrides,
    } as unknown as CatalogValidationService;
}

function makeRngService(overrides: Partial<RngValidationService> = {}): RngValidationService {
    return {
        isAvailable: false,
        validate: async () => [],
        initialize: () => {},
        setSchemaBasePath: () => {},
        error: null,
        ...overrides,
    } as unknown as RngValidationService;
}

function makeSubjectSchemeService(overrides: Partial<SubjectSchemeService> = {}): SubjectSchemeService {
    return {
        hasSchemeData: () => false,
        registerSchemes: () => {},
        getValidValues: () => null,
        isControlledAttribute: () => false,
        invalidate: () => {},
        shutdown: () => {},
        ...overrides,
    } as unknown as SubjectSchemeService;
}

const defaultSettings: DitaCraftSettings = {
    autoValidate: true,
    validationDebounceMs: 300,
    validationEngine: 'typesxml',
    keySpaceCacheTtlMinutes: 5,
    maxLinkMatches: 50,
    maxNumberOfProblems: 100,
    logLevel: 'info',
    ditaRulesEnabled: true,
    ditaRulesCategories: ['mandatory', 'recommendation', 'authoring', 'accessibility'],
    crossRefValidationEnabled: true,
    subjectSchemeValidationEnabled: true,
    ditaVersion: 'auto',
    schemaFormat: 'dtd',
    rngSchemaPath: '',
    xmlCatalogPath: '',
};

const emptyWorkspace: WorkspaceContext = {
    rootIdIndex: new Map(),
    unusedTopicPaths: new Set(),
};

/** A minimal valid DITA topic that passes base validation. */
const VALID_TOPIC =
    '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">\n' +
    '<topic id="t1"><title>Hello</title><body><p>World</p></body></topic>';

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

suite('ValidationPipeline', () => {

    // -----------------------------------------------------------------------
    suite('Basic validation', () => {

        test('valid DITA topic returns diagnostics array without throwing', async () => {
            const pipeline = new ValidationPipeline(
                makeCatalogService(),
                makeRngService(),
                makeSubjectSchemeService(),
            );
            const doc = createDoc(VALID_TOPIC);
            const diags = await pipeline.validate(doc, defaultSettings, undefined, emptyWorkspace);
            assert.ok(Array.isArray(diags), 'should return an array');
        });

        test('malformed XML produces XML diagnostics', async () => {
            const pipeline = new ValidationPipeline(
                makeCatalogService(),
                makeRngService(),
                makeSubjectSchemeService(),
            );
            const doc = createDoc('<topic><title>Unclosed</topic>');
            const diags = await pipeline.validate(doc, defaultSettings, undefined, emptyWorkspace);
            const xmlErrors = diags.filter(d => d.code === 'DITA-XML-001');
            assert.ok(xmlErrors.length > 0, 'should have XML well-formedness errors');
        });
    });

    // -----------------------------------------------------------------------
    suite('Error isolation', () => {

        test('throwing catalog service does not discard base validation diagnostics', async () => {
            const throwingCatalog = makeCatalogService({
                isAvailable: true,
                validate: () => { throw new Error('catalog exploded'); },
            });
            const pipeline = new ValidationPipeline(
                throwingCatalog,
                makeRngService(),
                makeSubjectSchemeService(),
            );
            // Malformed doc guarantees at least one base diagnostic
            const doc = createDoc('<topic><title>Unclosed</topic>');
            const diags = await pipeline.validate(doc, defaultSettings, undefined, emptyWorkspace);
            const xmlErrors = diags.filter(d => d.code === 'DITA-XML-001');
            assert.ok(xmlErrors.length > 0, 'base validation diagnostics should survive a catalog failure');
        });

        test('throwing RNG service does not discard base validation diagnostics', async () => {
            const throwingRng = makeRngService({
                isAvailable: true,
                validate: async () => { throw new Error('rng exploded'); },
            });
            const settings: DitaCraftSettings = { ...defaultSettings, schemaFormat: 'rng' };
            const pipeline = new ValidationPipeline(
                makeCatalogService(),
                throwingRng,
                makeSubjectSchemeService(),
            );
            const doc = createDoc('<topic><title>Unclosed</topic>');
            const diags = await pipeline.validate(doc, settings, undefined, emptyWorkspace);
            const xmlErrors = diags.filter(d => d.code === 'DITA-XML-001');
            assert.ok(xmlErrors.length > 0, 'base validation diagnostics should survive an RNG failure');
        });

        test('throwing base validator does not prevent other phases from running', async () => {
            // We cannot mock validateDITADocument directly, but we can verify the pipeline
            // continues past any phase error. Here we test that a catalog service that
            // throws still lets the RNG phase (disabled) and downstream phases run without
            // crashing the pipeline.
            const throwingCatalog = makeCatalogService({
                isAvailable: true,
                validate: () => { throw new Error('DTD exploded'); },
            });
            const pipeline = new ValidationPipeline(
                throwingCatalog,
                makeRngService(),
                makeSubjectSchemeService(),
            );
            const doc = createDoc(VALID_TOPIC);
            // Should resolve without throwing
            const diags = await pipeline.validate(doc, defaultSettings, undefined, emptyWorkspace);
            assert.ok(Array.isArray(diags));
        });
    });

    // -----------------------------------------------------------------------
    suite('Logger callback', () => {

        test('log is called when catalog service throws', async () => {
            const logMessages: string[] = [];
            const throwingCatalog = makeCatalogService({
                isAvailable: true,
                validate: () => { throw new Error('catalog failure'); },
            });
            const pipeline = new ValidationPipeline(
                throwingCatalog,
                makeRngService(),
                makeSubjectSchemeService(),
                (msg) => logMessages.push(msg),
            );
            const doc = createDoc(VALID_TOPIC);
            await pipeline.validate(doc, defaultSettings, undefined, emptyWorkspace);
            const dtdLogs = logMessages.filter(m => m.includes('DTD validation failed'));
            assert.ok(dtdLogs.length > 0, 'log should be called with DTD validation failure message');
        });

        test('log is called when RNG service throws', async () => {
            const logMessages: string[] = [];
            const throwingRng = makeRngService({
                isAvailable: true,
                validate: async () => { throw new Error('rng failure'); },
            });
            const settings: DitaCraftSettings = { ...defaultSettings, schemaFormat: 'rng' };
            const pipeline = new ValidationPipeline(
                makeCatalogService(),
                throwingRng,
                makeSubjectSchemeService(),
                (msg) => logMessages.push(msg),
            );
            const doc = createDoc(VALID_TOPIC);
            await pipeline.validate(doc, settings, undefined, emptyWorkspace);
            const rngLogs = logMessages.filter(m => m.includes('RNG validation failed'));
            assert.ok(rngLogs.length > 0, 'log should be called with RNG validation failure message');
        });

        test('log message contains the original error text', async () => {
            const logMessages: string[] = [];
            const throwingCatalog = makeCatalogService({
                isAvailable: true,
                validate: () => { throw new Error('unique-error-xyz'); },
            });
            const pipeline = new ValidationPipeline(
                throwingCatalog,
                makeRngService(),
                makeSubjectSchemeService(),
                (msg) => logMessages.push(msg),
            );
            const doc = createDoc(VALID_TOPIC);
            await pipeline.validate(doc, defaultSettings, undefined, emptyWorkspace);
            const hasError = logMessages.some(m => m.includes('unique-error-xyz'));
            assert.ok(hasError, 'log message should contain the original error text');
        });
    });

    // -----------------------------------------------------------------------
    suite('DTD vs RNG mutual exclusion', () => {

        test('when schemaFormat=rng and rng is available, catalog validate is not called', async () => {
            let catalogCalled = false;
            const catalog = makeCatalogService({
                isAvailable: true,
                validate: () => { catalogCalled = true; return []; },
            });
            const rng = makeRngService({ isAvailable: true });
            const settings: DitaCraftSettings = { ...defaultSettings, schemaFormat: 'rng' };
            const pipeline = new ValidationPipeline(catalog, rng, makeSubjectSchemeService());
            const doc = createDoc(VALID_TOPIC);
            await pipeline.validate(doc, settings, undefined, emptyWorkspace);
            assert.strictEqual(catalogCalled, false, 'catalog.validate should not be called when RNG is active');
        });

        test('when schemaFormat=rng and rng is available, rng validate is called', async () => {
            let rngCalled = false;
            const rng = makeRngService({
                isAvailable: true,
                validate: async () => { rngCalled = true; return []; },
            });
            const settings: DitaCraftSettings = { ...defaultSettings, schemaFormat: 'rng' };
            const pipeline = new ValidationPipeline(makeCatalogService(), rng, makeSubjectSchemeService());
            const doc = createDoc(VALID_TOPIC);
            await pipeline.validate(doc, settings, undefined, emptyWorkspace);
            assert.strictEqual(rngCalled, true, 'rng.validate should be called when schemaFormat=rng');
        });

        test('when schemaFormat=dtd, rng validate is not called even if rng is available', async () => {
            let rngCalled = false;
            const rng = makeRngService({
                isAvailable: true,
                validate: async () => { rngCalled = true; return []; },
            });
            const settings: DitaCraftSettings = { ...defaultSettings, schemaFormat: 'dtd' };
            const pipeline = new ValidationPipeline(makeCatalogService(), rng, makeSubjectSchemeService());
            const doc = createDoc(VALID_TOPIC);
            await pipeline.validate(doc, settings, undefined, emptyWorkspace);
            assert.strictEqual(rngCalled, false, 'rng.validate should not be called when schemaFormat=dtd');
        });

        test('when rng is not available, catalog validate is called even if schemaFormat=rng', async () => {
            let catalogCalled = false;
            const catalog = makeCatalogService({
                isAvailable: true,
                validate: () => { catalogCalled = true; return []; },
            });
            // RNG service present but isAvailable=false
            const rng = makeRngService({ isAvailable: false });
            const settings: DitaCraftSettings = { ...defaultSettings, schemaFormat: 'rng' };
            const pipeline = new ValidationPipeline(catalog, rng, makeSubjectSchemeService());
            const doc = createDoc(VALID_TOPIC);
            await pipeline.validate(doc, settings, undefined, emptyWorkspace);
            assert.strictEqual(catalogCalled, true, 'catalog.validate should run when rng is not available');
        });
    });

    // -----------------------------------------------------------------------
    suite('Settings guards', () => {

        test('ditaRulesEnabled=false skips DITA rules phase', async () => {
            // To confirm rules are skipped we use a document that would normally
            // trigger a DITA-SCH rule (e.g. indextermref is deprecated).
            const settings: DitaCraftSettings = {
                ...defaultSettings,
                ditaRulesEnabled: false,
                crossRefValidationEnabled: false,
            };
            const pipeline = new ValidationPipeline(
                makeCatalogService(),
                makeRngService(),
                makeSubjectSchemeService(),
            );
            const doc = createDoc('<topic id="t1"><title>T</title><body><indextermref/></body></topic>');
            const diags = await pipeline.validate(doc, settings, undefined, emptyWorkspace);
            const schDiags = diags.filter(d => typeof d.code === 'string' && (d.code as string).startsWith('DITA-SCH-'));
            assert.strictEqual(schDiags.length, 0, 'DITA-SCH rules should not fire when ditaRulesEnabled=false');
        });

        test('ditaRulesEnabled=true produces DITA rules diagnostics', async () => {
            const settings: DitaCraftSettings = {
                ...defaultSettings,
                crossRefValidationEnabled: false,
            };
            const pipeline = new ValidationPipeline(
                makeCatalogService(),
                makeRngService(),
                makeSubjectSchemeService(),
            );
            // indextermref is a deprecated element covered by DITA-SCH-003
            const doc = createDoc('<topic id="t1"><title>T</title><body><indextermref/></body></topic>');
            const diags = await pipeline.validate(doc, settings, undefined, emptyWorkspace);
            const schDiags = diags.filter(d => typeof d.code === 'string' && (d.code as string).startsWith('DITA-SCH-'));
            assert.ok(schDiags.length > 0, 'DITA-SCH rules should fire when ditaRulesEnabled=true');
        });

        test('crossRefValidationEnabled=false skips cross-ref and circular ref phases', async () => {
            // We cannot mock the imported functions directly, but we can verify
            // the pipeline does not crash and observe side-effects by using a
            // document with a broken xref — if cross-ref runs, we'd get a diagnostic.
            const settings: DitaCraftSettings = {
                ...defaultSettings,
                crossRefValidationEnabled: false,
                ditaRulesEnabled: false,
            };
            const pipeline = new ValidationPipeline(
                makeCatalogService(),
                makeRngService(),
                makeSubjectSchemeService(),
            );
            const doc = createDoc(
                '<topic id="t1"><title>T</title><body><xref href="nonexistent-file-xyz.dita"/></body></topic>'
            );
            const diags = await pipeline.validate(doc, settings, undefined, emptyWorkspace);
            // XREF_CODES.MISSING_FILE diagnostics should not appear
            const xrefDiags = diags.filter(d => d.code === 'DITA-XREF-001');
            assert.strictEqual(xrefDiags.length, 0, 'cross-ref diagnostics should be absent when disabled');
        });
    });

    // -----------------------------------------------------------------------
    suite('maxNumberOfProblems cap', () => {

        test('diagnostics are capped at maxNumberOfProblems', async () => {
            // Produce many diagnostics via a deeply broken document
            const settings: DitaCraftSettings = {
                ...defaultSettings,
                maxNumberOfProblems: 2,
                crossRefValidationEnabled: false,
            };
            const pipeline = new ValidationPipeline(
                makeCatalogService(),
                makeRngService(),
                makeSubjectSchemeService(),
            );
            // Many duplicate IDs and missing root element errors
            const doc = createDoc(
                '<topic>' +
                '<p id="d"/><p id="d"/><p id="d"/><p id="d"/>' +
                '<p id="e"/><p id="e"/><p id="e"/><p id="e"/>' +
                '</topic>'
            );
            const diags = await pipeline.validate(doc, settings, undefined, emptyWorkspace);
            assert.ok(diags.length <= 2, `expected at most 2 diagnostics, got ${diags.length}`);
        });

        test('diagnostics equal to cap are not truncated', async () => {
            const settings: DitaCraftSettings = {
                ...defaultSettings,
                maxNumberOfProblems: 100,
                crossRefValidationEnabled: false,
            };
            const pipeline = new ValidationPipeline(
                makeCatalogService(),
                makeRngService(),
                makeSubjectSchemeService(),
            );
            const doc = createDoc(VALID_TOPIC);
            const diags = await pipeline.validate(doc, settings, undefined, emptyWorkspace);
            assert.ok(diags.length <= 100, 'diagnostics should not exceed maxNumberOfProblems');
        });
    });

    // -----------------------------------------------------------------------
    suite('Empty workspace context', () => {

        test('empty rootIdIndex skips cross-file duplicate ID check', async () => {
            const pipeline = new ValidationPipeline(
                makeCatalogService(),
                makeRngService(),
                makeSubjectSchemeService(),
            );
            const workspace: WorkspaceContext = {
                rootIdIndex: new Map(),   // size=0 → skip
                unusedTopicPaths: new Set(),
            };
            const doc = createDoc(VALID_TOPIC);
            // Should not throw and produces no cross-file duplicate diagnostic
            const diags = await pipeline.validate(doc, defaultSettings, undefined, workspace);
            assert.ok(Array.isArray(diags));
        });

        test('empty unusedTopicPaths skips unused-topic check', async () => {
            const pipeline = new ValidationPipeline(
                makeCatalogService(),
                makeRngService(),
                makeSubjectSchemeService(),
            );
            const workspace: WorkspaceContext = {
                rootIdIndex: new Map(),
                unusedTopicPaths: new Set(),   // size=0 → skip
            };
            const doc = createDoc(VALID_TOPIC);
            const diags = await pipeline.validate(doc, defaultSettings, undefined, workspace);
            // No unused-topic diagnostic expected
            const unusedDiags = diags.filter(d => d.code === 'DITA-WS-002');
            assert.strictEqual(unusedDiags.length, 0);
        });
    });
});
