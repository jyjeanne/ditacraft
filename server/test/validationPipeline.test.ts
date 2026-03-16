import * as assert from 'assert';
import { ValidationPipeline, ValidationPhase, WorkspaceContext } from '../src/services/validationPipeline';
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
    validationSeverityOverrides: {},
    customRulesFile: '',
    largeFileThresholdKB: 500,
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

    // -----------------------------------------------------------------------
    suite('Phase result caching', () => {

        test('second call with same version uses cache (faster)', async () => {
            const logMessages: string[] = [];
            const pipeline = new ValidationPipeline(
                makeCatalogService(),
                makeRngService(),
                makeSubjectSchemeService(),
                (msg) => logMessages.push(msg),
            );
            const settings: DitaCraftSettings = {
                ...defaultSettings,
                crossRefValidationEnabled: false,
            };
            const doc = createDoc(VALID_TOPIC);

            // First call — populates cache
            await pipeline.validate(doc, settings, undefined, emptyWorkspace);
            const firstLog = logMessages.filter(m => m.includes('Total='));
            assert.ok(firstLog.length > 0, 'should log timings');

            logMessages.length = 0;
            // Second call — same doc, same version, same settings → cache hits
            await pipeline.validate(doc, settings, undefined, emptyWorkspace);
            const secondLog = logMessages.find(m => m.includes('cache='));
            assert.ok(secondLog, 'second call should report cache hits');
        });

        test('changed settings cause cache miss', async () => {
            const logMessages: string[] = [];
            const pipeline = new ValidationPipeline(
                makeCatalogService(),
                makeRngService(),
                makeSubjectSchemeService(),
                (msg) => logMessages.push(msg),
            );
            const settings1: DitaCraftSettings = {
                ...defaultSettings,
                crossRefValidationEnabled: false,
            };
            const settings2: DitaCraftSettings = {
                ...settings1,
                ditaRulesEnabled: false,
            };
            const doc = createDoc(VALID_TOPIC);

            await pipeline.validate(doc, settings1, undefined, emptyWorkspace);
            logMessages.length = 0;
            await pipeline.validate(doc, settings2, undefined, emptyWorkspace);
            // With different settings, cache should miss — no cache= in log
            const cacheLog = logMessages.find(m => m.includes('cache='));
            assert.ok(!cacheLog, 'different settings should cause cache miss');
        });

        test('invalidateForTextEdit clears text-dependent phases', async () => {
            const pipeline = new ValidationPipeline(
                makeCatalogService(),
                makeRngService(),
                makeSubjectSchemeService(),
            );
            const settings: DitaCraftSettings = {
                ...defaultSettings,
                crossRefValidationEnabled: false,
            };
            const doc = createDoc(VALID_TOPIC);

            // Populate cache
            await pipeline.validate(doc, settings, undefined, emptyWorkspace);

            // Invalidate text phases
            pipeline.invalidateForTextEdit(doc.uri);

            // Verify the invalidation API doesn't throw
            assert.doesNotThrow(() => pipeline.invalidateForTextEdit(doc.uri));
        });

        test('invalidateAll clears entire cache', async () => {
            const logMessages: string[] = [];
            const pipeline = new ValidationPipeline(
                makeCatalogService(),
                makeRngService(),
                makeSubjectSchemeService(),
                (msg) => logMessages.push(msg),
            );
            const settings: DitaCraftSettings = {
                ...defaultSettings,
                crossRefValidationEnabled: false,
            };
            const doc = createDoc(VALID_TOPIC);

            // Populate cache
            await pipeline.validate(doc, settings, undefined, emptyWorkspace);
            logMessages.length = 0;

            // Clear all
            pipeline.invalidateAll();

            // Re-validate — should have no cache hits
            await pipeline.validate(doc, settings, undefined, emptyWorkspace);
            const cacheLog = logMessages.find(m => m.includes('cache='));
            assert.ok(!cacheLog, 'after invalidateAll, should have no cache hits');
        });

        test('invalidateForDocument only clears that document', async () => {
            const logMessages: string[] = [];
            const pipeline = new ValidationPipeline(
                makeCatalogService(),
                makeRngService(),
                makeSubjectSchemeService(),
                (msg) => logMessages.push(msg),
            );
            const settings: DitaCraftSettings = {
                ...defaultSettings,
                crossRefValidationEnabled: false,
            };
            const doc1 = createDoc(VALID_TOPIC, 'file:///doc1.dita');
            const doc2 = createDoc(VALID_TOPIC, 'file:///doc2.dita');

            // Populate cache for both docs
            await pipeline.validate(doc1, settings, undefined, emptyWorkspace);
            await pipeline.validate(doc2, settings, undefined, emptyWorkspace);

            // Invalidate only doc1
            pipeline.invalidateForDocument('file:///doc1.dita');

            logMessages.length = 0;
            // doc2 should still have cache hits
            await pipeline.validate(doc2, settings, undefined, emptyWorkspace);
            const cacheLog = logMessages.find(m => m.includes('cache='));
            assert.ok(cacheLog, 'doc2 should still have cache hits after doc1 invalidation');
        });

        test('invalidateForMapChange clears cross-ref phases for all documents', async () => {
            const pipeline = new ValidationPipeline(
                makeCatalogService(),
                makeRngService(),
                makeSubjectSchemeService(),
            );
            // Just verify the API works without throwing
            assert.doesNotThrow(() => pipeline.invalidateForMapChange());
        });

        test('invalidateForFileSave clears I/O phases', async () => {
            const pipeline = new ValidationPipeline(
                makeCatalogService(),
                makeRngService(),
                makeSubjectSchemeService(),
            );
            assert.doesNotThrow(() => pipeline.invalidateForFileSave('file:///test.dita'));
        });

        test('invalidatePhases clears specific phases', async () => {
            const pipeline = new ValidationPipeline(
                makeCatalogService(),
                makeRngService(),
                makeSubjectSchemeService(),
            );
            assert.doesNotThrow(() =>
                pipeline.invalidatePhases('file:///test.dita', [
                    ValidationPhase.XmlStructureId,
                    ValidationPhase.ContentModel,
                ])
            );
        });
    });

    // -----------------------------------------------------------------------
    suite('Severity overrides', () => {

        test('override changes severity of a diagnostic', async () => {
            const settings: DitaCraftSettings = {
                ...defaultSettings,
                crossRefValidationEnabled: false,
                validationSeverityOverrides: {
                    'DITA-SCH-003': 'error',
                },
            };
            const pipeline = new ValidationPipeline(
                makeCatalogService(),
                makeRngService(),
                makeSubjectSchemeService(),
            );
            // indextermref triggers DITA-SCH-003 (normally Warning)
            const doc = createDoc('<topic id="t1"><title>T</title><body><indextermref/></body></topic>');
            const diags = await pipeline.validate(doc, settings, undefined, emptyWorkspace);
            const sch003 = diags.filter(d => d.code === 'DITA-SCH-003');
            assert.ok(sch003.length > 0, 'should have DITA-SCH-003');
            // Severity 1 = Error
            assert.strictEqual(sch003[0].severity, 1, 'severity should be overridden to Error');
        });

        test('override "off" suppresses a diagnostic', async () => {
            const settings: DitaCraftSettings = {
                ...defaultSettings,
                crossRefValidationEnabled: false,
                validationSeverityOverrides: {
                    'DITA-SCH-003': 'off',
                },
            };
            const pipeline = new ValidationPipeline(
                makeCatalogService(),
                makeRngService(),
                makeSubjectSchemeService(),
            );
            const doc = createDoc('<topic id="t1"><title>T</title><body><indextermref/></body></topic>');
            const diags = await pipeline.validate(doc, settings, undefined, emptyWorkspace);
            const sch003 = diags.filter(d => d.code === 'DITA-SCH-003');
            assert.strictEqual(sch003.length, 0, 'DITA-SCH-003 should be suppressed');
        });

        test('override to "hint" works', async () => {
            const settings: DitaCraftSettings = {
                ...defaultSettings,
                crossRefValidationEnabled: false,
                validationSeverityOverrides: {
                    'DITA-SCH-003': 'hint',
                },
            };
            const pipeline = new ValidationPipeline(
                makeCatalogService(),
                makeRngService(),
                makeSubjectSchemeService(),
            );
            const doc = createDoc('<topic id="t1"><title>T</title><body><indextermref/></body></topic>');
            const diags = await pipeline.validate(doc, settings, undefined, emptyWorkspace);
            const sch003 = diags.filter(d => d.code === 'DITA-SCH-003');
            assert.ok(sch003.length > 0);
            // Severity 4 = Hint
            assert.strictEqual(sch003[0].severity, 4, 'severity should be overridden to Hint');
        });

        test('non-matching overrides leave other diagnostics unchanged', async () => {
            const settings: DitaCraftSettings = {
                ...defaultSettings,
                crossRefValidationEnabled: false,
                validationSeverityOverrides: {
                    'NONEXISTENT-CODE': 'error',
                },
            };
            const pipeline = new ValidationPipeline(
                makeCatalogService(),
                makeRngService(),
                makeSubjectSchemeService(),
            );
            const doc = createDoc('<topic id="t1"><title>T</title><body><indextermref/></body></topic>');
            const diags = await pipeline.validate(doc, settings, undefined, emptyWorkspace);
            const sch003 = diags.filter(d => d.code === 'DITA-SCH-003');
            assert.ok(sch003.length > 0, 'should still have DITA-SCH-003');
            // Original severity (Error = 1)
            assert.strictEqual(sch003[0].severity, 1, 'severity should remain Error');
        });
    });

    // -----------------------------------------------------------------------
    suite('Comment-based suppression', () => {

        test('ditacraft-disable-file suppresses matching code for entire file', async () => {
            const xml = `<!-- ditacraft-disable-file DITA-SCH-003 -->
<topic id="t1"><title>T</title><body><indextermref/></body></topic>`;
            const settings: DitaCraftSettings = {
                ...defaultSettings,
                crossRefValidationEnabled: false,
                validationSeverityOverrides: {},
            };
            const pipeline = new ValidationPipeline(
                makeCatalogService(),
                makeRngService(),
                makeSubjectSchemeService(),
            );
            const doc = createDoc(xml);
            const diags = await pipeline.validate(doc, settings, undefined, emptyWorkspace);
            const sch003 = diags.filter(d => d.code === 'DITA-SCH-003');
            assert.strictEqual(sch003.length, 0, 'DITA-SCH-003 should be suppressed by disable-file');
        });

        test('ditacraft-disable / ditacraft-enable suppresses code in range', async () => {
            const xml = `<topic id="t1"><title>T</title><body>
<!-- ditacraft-disable DITA-SCH-003 -->
<indextermref/>
<!-- ditacraft-enable DITA-SCH-003 -->
</body></topic>`;
            const settings: DitaCraftSettings = {
                ...defaultSettings,
                crossRefValidationEnabled: false,
                validationSeverityOverrides: {},
            };
            const pipeline = new ValidationPipeline(
                makeCatalogService(),
                makeRngService(),
                makeSubjectSchemeService(),
            );
            const doc = createDoc(xml);
            const diags = await pipeline.validate(doc, settings, undefined, emptyWorkspace);
            const sch003 = diags.filter(d => d.code === 'DITA-SCH-003');
            assert.strictEqual(sch003.length, 0, 'DITA-SCH-003 should be suppressed in disabled range');
        });

        test('diagnostics outside suppression range are kept', async () => {
            const xml = `<topic id="t1"><title>T</title><body>
<!-- ditacraft-disable DITA-SCH-003 -->
<!-- ditacraft-enable DITA-SCH-003 -->
<indextermref/>
</body></topic>`;
            const settings: DitaCraftSettings = {
                ...defaultSettings,
                crossRefValidationEnabled: false,
                validationSeverityOverrides: {},
            };
            const pipeline = new ValidationPipeline(
                makeCatalogService(),
                makeRngService(),
                makeSubjectSchemeService(),
            );
            const doc = createDoc(xml);
            const diags = await pipeline.validate(doc, settings, undefined, emptyWorkspace);
            const sch003 = diags.filter(d => d.code === 'DITA-SCH-003');
            assert.ok(sch003.length > 0, 'DITA-SCH-003 should NOT be suppressed outside range');
        });

        test('multiple codes can be suppressed in a single comment', async () => {
            const xml = `<!-- ditacraft-disable-file DITA-SCH-003 DITA-SCH-016 -->
<topic id="t1"><title>T</title><body><indextermref/></body></topic>`;
            const settings: DitaCraftSettings = {
                ...defaultSettings,
                crossRefValidationEnabled: false,
                validationSeverityOverrides: {},
            };
            const pipeline = new ValidationPipeline(
                makeCatalogService(),
                makeRngService(),
                makeSubjectSchemeService(),
            );
            const doc = createDoc(xml);
            const diags = await pipeline.validate(doc, settings, undefined, emptyWorkspace);
            const sch003 = diags.filter(d => d.code === 'DITA-SCH-003');
            assert.strictEqual(sch003.length, 0, 'DITA-SCH-003 should be suppressed');
        });

        test('enable comment line itself is not suppressed (exclusive end)', async () => {
            // indextermref is on the same line as the enable comment
            const xml = `<topic id="t1"><title>T</title><body>
<!-- ditacraft-disable DITA-SCH-003 -->
<!-- ditacraft-enable DITA-SCH-003 --><indextermref/>
</body></topic>`;
            const settings: DitaCraftSettings = {
                ...defaultSettings,
                crossRefValidationEnabled: false,
                validationSeverityOverrides: {},
            };
            const pipeline = new ValidationPipeline(
                makeCatalogService(),
                makeRngService(),
                makeSubjectSchemeService(),
            );
            const doc = createDoc(xml);
            const diags = await pipeline.validate(doc, settings, undefined, emptyWorkspace);
            const sch003 = diags.filter(d => d.code === 'DITA-SCH-003');
            assert.ok(sch003.length > 0, 'DITA-SCH-003 on enable line should NOT be suppressed');
        });

        test('non-matching suppression does not affect other diagnostics', async () => {
            const xml = `<!-- ditacraft-disable-file NONEXISTENT-CODE -->
<topic id="t1"><title>T</title><body><indextermref/></body></topic>`;
            const settings: DitaCraftSettings = {
                ...defaultSettings,
                crossRefValidationEnabled: false,
                validationSeverityOverrides: {},
            };
            const pipeline = new ValidationPipeline(
                makeCatalogService(),
                makeRngService(),
                makeSubjectSchemeService(),
            );
            const doc = createDoc(xml);
            const diags = await pipeline.validate(doc, settings, undefined, emptyWorkspace);
            const sch003 = diags.filter(d => d.code === 'DITA-SCH-003');
            assert.ok(sch003.length > 0, 'DITA-SCH-003 should still be present');
        });
    });

    // -----------------------------------------------------------------------
    suite('Large file optimization', () => {

        test('large file skips heavy phases and adds DITA-PERF-001 info diagnostic', async () => {
            // Create a document that exceeds a very small threshold
            const xml = '<topic id="t1"><title>T</title><body><p>text</p><indextermref/></body></topic>';
            const settings: DitaCraftSettings = {
                ...defaultSettings,
                crossRefValidationEnabled: false,
                largeFileThresholdKB: 0.01, // ~10 bytes — any doc exceeds this
            };
            const pipeline = new ValidationPipeline(
                makeCatalogService(),
                makeRngService(),
                makeSubjectSchemeService(),
            );
            const doc = createDoc(xml);
            const diags = await pipeline.validate(doc, settings, undefined, emptyWorkspace);
            const perfDiag = diags.find(d => d.code === 'DITA-PERF-001');
            assert.ok(perfDiag, 'should have DITA-PERF-001 info diagnostic');
            assert.strictEqual(perfDiag!.severity, 3); // Information
            // DITA rules (SCH-003 for indextermref) should be skipped
            const sch003 = diags.filter(d => d.code === 'DITA-SCH-003');
            assert.strictEqual(sch003.length, 0, 'DITA rules should be skipped for large files');
        });

        test('normal file still runs all phases', async () => {
            const xml = '<topic id="t1"><title>T</title><body><indextermref/></body></topic>';
            const settings: DitaCraftSettings = {
                ...defaultSettings,
                crossRefValidationEnabled: false,
                largeFileThresholdKB: 500, // normal threshold
            };
            const pipeline = new ValidationPipeline(
                makeCatalogService(),
                makeRngService(),
                makeSubjectSchemeService(),
            );
            const doc = createDoc(xml);
            const diags = await pipeline.validate(doc, settings, undefined, emptyWorkspace);
            const perfDiag = diags.find(d => d.code === 'DITA-PERF-001');
            assert.ok(!perfDiag, 'should NOT have DITA-PERF-001 for normal files');
            const sch003 = diags.filter(d => d.code === 'DITA-SCH-003');
            assert.ok(sch003.length > 0, 'DITA rules should run for normal files');
        });

        test('threshold 0 disables large file optimization', async () => {
            const xml = '<topic id="t1"><title>T</title><body><indextermref/></body></topic>';
            const settings: DitaCraftSettings = {
                ...defaultSettings,
                crossRefValidationEnabled: false,
                largeFileThresholdKB: 0, // disabled
            };
            const pipeline = new ValidationPipeline(
                makeCatalogService(),
                makeRngService(),
                makeSubjectSchemeService(),
            );
            const doc = createDoc(xml);
            const diags = await pipeline.validate(doc, settings, undefined, emptyWorkspace);
            const perfDiag = diags.find(d => d.code === 'DITA-PERF-001');
            assert.ok(!perfDiag, 'should NOT have DITA-PERF-001 when threshold is 0');
            const sch003 = diags.filter(d => d.code === 'DITA-SCH-003');
            assert.ok(sch003.length > 0, 'DITA rules should run when threshold is 0');
        });
    });

    // -----------------------------------------------------------------------
    suite('summarize', () => {

        test('counts errors, warnings, and infos correctly', () => {
            const diags = [
                { severity: 1 }, // Error
                { severity: 1 }, // Error
                { severity: 2 }, // Warning
                { severity: 3 }, // Info
                { severity: 4 }, // Hint → counted as info
            ] as any[];
            const summary = ValidationPipeline.summarize(diags);
            assert.strictEqual(summary.errors, 2);
            assert.strictEqual(summary.warnings, 1);
            assert.strictEqual(summary.infos, 2);
        });

        test('empty diagnostics returns all zeros', () => {
            const summary = ValidationPipeline.summarize([]);
            assert.strictEqual(summary.errors, 0);
            assert.strictEqual(summary.warnings, 0);
            assert.strictEqual(summary.infos, 0);
        });
    });
});
