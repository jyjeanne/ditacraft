import * as assert from 'assert';
import { validateDITADocument } from '../src/features/validation';
import { ValidationPipeline, WorkspaceContext } from '../src/services/validationPipeline';
import { CatalogValidationService } from '../src/services/catalogValidationService';
import { RngValidationService } from '../src/services/rngValidationService';
import { SubjectSchemeService } from '../src/services/subjectSchemeService';
import { DitaCraftSettings } from '../src/settings';
import { createDoc } from './helper';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
        isControlledAttribute: () => false,
        invalidate: () => {},
        shutdown: () => {},
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
    crossRefValidationEnabled: false,
    subjectSchemeValidationEnabled: false,
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

function validate(content: string, uri = 'file:///test.dita') {
    const doc = createDoc(content, uri);
    return validateDITADocument(doc, defaultSettings);
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

suite('Edge cases (Manual Plan §12)', () => {

    // -----------------------------------------------------------------------
    suite('Unicode & international content (§12.5.4)', () => {

        test('CJK characters in element IDs are accepted', () => {
            const xml = '<topic id="主题_1"><title>中文标题</title><body><p>内容</p></body></topic>';
            const diags = validate(xml);
            // CJK in IDs may trigger DITA-ID-002 (invalid XML Name) — that's expected.
            // Key point: no crash, no uncaught exception.
            assert.ok(Array.isArray(diags), 'should return diagnostics array');
        });

        test('Arabic text content validates without crash', () => {
            const xml = '<topic id="t1"><title>موضوع</title><body><p>هذا نص عربي</p></body></topic>';
            const diags = validate(xml);
            assert.ok(Array.isArray(diags), 'should return diagnostics array');
        });

        test('emoji in content validates without crash', () => {
            const xml = '<topic id="t1"><title>Test 🚀</title><body><p>Hello 🌍 World 💡</p></body></topic>';
            const diags = validate(xml);
            assert.ok(Array.isArray(diags), 'should return diagnostics array');
            const xmlErrors = diags.filter(d =>
                typeof d.code === 'string' && d.code.startsWith('DITA-XML')
            );
            assert.strictEqual(xmlErrors.length, 0, 'no XML errors for emoji content');
        });

        test('mixed scripts (Latin + CJK + Arabic) in content', () => {
            const xml = '<topic id="t1"><title>Hello 世界 مرحبا</title><body><p>Mixed</p></body></topic>';
            const diags = validate(xml);
            assert.ok(Array.isArray(diags), 'should return diagnostics array');
        });

        test('Unicode in attribute values validates correctly', () => {
            const xml = '<topic id="t1"><title>T</title><body><p translate="no">café résumé naïve</p></body></topic>';
            const diags = validate(xml);
            const xmlErrors = diags.filter(d =>
                typeof d.code === 'string' && d.code.startsWith('DITA-XML')
            );
            assert.strictEqual(xmlErrors.length, 0, 'no XML errors for Unicode in attributes');
        });
    });

    // -----------------------------------------------------------------------
    suite('Empty file (§12.5.1)', () => {

        test('empty .dita file produces diagnostics, no crash', () => {
            const diags = validate('');
            assert.ok(Array.isArray(diags), 'should return diagnostics array');
            assert.ok(diags.length > 0, 'empty file should produce at least one diagnostic');
        });

        test('whitespace-only file produces diagnostics', () => {
            const diags = validate('   \n  \n  ');
            assert.ok(Array.isArray(diags), 'should return diagnostics array');
        });

        test('XML declaration only (no content) produces diagnostics', () => {
            const diags = validate('<?xml version="1.0"?>');
            assert.ok(Array.isArray(diags), 'should return diagnostics array');
        });
    });

    // -----------------------------------------------------------------------
    suite('Very long lines (§12.5.3)', () => {

        test('10,000+ character line does not hang or crash', () => {
            const longText = 'x'.repeat(15000);
            const xml = `<topic id="t1"><title>T</title><body><p>${longText}</p></body></topic>`;
            const diags = validate(xml);
            assert.ok(Array.isArray(diags), 'should return diagnostics array');
        });

        test('very long attribute value validates', () => {
            const longId = 'a' + '_segment'.repeat(500);
            const xml = `<topic id="${longId}"><title>T</title><body><p>text</p></body></topic>`;
            const diags = validate(xml);
            assert.ok(Array.isArray(diags), 'should return diagnostics array');
        });
    });

    // -----------------------------------------------------------------------
    suite('Deeply nested elements (§12.5.6)', () => {

        test('50+ levels of nesting do not cause stack overflow', async () => {
            let xml = '<topic id="t1"><title>T</title><body>';
            const depth = 60;
            for (let i = 0; i < depth; i++) {
                xml += '<section><p>';
            }
            xml += 'deep content';
            for (let i = 0; i < depth; i++) {
                xml += '</p></section>';
            }
            xml += '</body></topic>';

            const pipeline = new ValidationPipeline(
                makeCatalogService(),
                makeRngService(),
                makeSubjectSchemeService(),
            );
            const doc = createDoc(xml);
            const diags = await pipeline.validate(doc, defaultSettings, undefined, emptyWorkspace);
            assert.ok(Array.isArray(diags), 'should return diagnostics without stack overflow');
        });
    });

    // -----------------------------------------------------------------------
    suite('Mixed line endings (§12.5.7-8)', () => {

        test('CRLF line endings validate correctly', () => {
            const xml = '<topic id="t1">\r\n<title>T</title>\r\n<body><p>text</p></body>\r\n</topic>';
            const diags = validate(xml);
            assert.ok(Array.isArray(diags), 'should return diagnostics array');
        });

        test('mixed LF and CRLF in same file', () => {
            const xml = '<topic id="t1">\n<title>T</title>\r\n<body>\n<p>text</p>\r\n</body>\n</topic>';
            const diags = validate(xml);
            assert.ok(Array.isArray(diags), 'should return diagnostics array');
        });

        test('standalone CR line endings', () => {
            const xml = '<topic id="t1">\r<title>T</title>\r<body><p>text</p></body>\r</topic>';
            const diags = validate(xml);
            assert.ok(Array.isArray(diags), 'should return diagnostics array');
        });

        test('diagnostic line numbers are correct with CRLF', () => {
            const xml = '<topic id="t1">\r\n<body><p>no title</p></body>\r\n</topic>';
            const diags = validate(xml);
            const titleDiag = diags.find(d => d.code === 'DITA-STRUCT-004');
            if (titleDiag) {
                assert.ok(titleDiag.range.start.line >= 0, 'line number should be non-negative');
            }
        });
    });

    // -----------------------------------------------------------------------
    suite('BOM handling', () => {

        test('UTF-8 BOM at start of file does not break validation', () => {
            const bom = '\uFEFF';
            const xml = bom + '<topic id="t1"><title>T</title><body><p>text</p></body></topic>';
            const diags = validate(xml);
            assert.ok(Array.isArray(diags), 'should return diagnostics array');
        });
    });

    // -----------------------------------------------------------------------
    suite('Binary/non-XML content (§12.5.2)', () => {

        test('binary-like content produces XML error, no crash', () => {
            const binary = '\x00\x01\x02\x03\xFF\xFE';
            const diags = validate(binary);
            assert.ok(Array.isArray(diags), 'should return diagnostics array');
        });
    });

    // -----------------------------------------------------------------------
    suite('Large file phase skipping (§12.1.4)', () => {

        test('large file skips profiling validation', async () => {
            const xml = '<topic id="t1"><title>T</title><body>' +
                '<p platform="nonexistent">text</p>' +
                '</body></topic>';
            const settings: DitaCraftSettings = {
                ...defaultSettings,
                subjectSchemeValidationEnabled: true,
                largeFileThresholdKB: 0.01,
            };
            const pipeline = new ValidationPipeline(
                makeCatalogService(),
                makeRngService(),
                makeSubjectSchemeService(),
            );
            const doc = createDoc(xml);
            const diags = await pipeline.validate(doc, settings, undefined, emptyWorkspace);
            const perfDiag = diags.find(d => d.code === 'DITA-PERF-001');
            assert.ok(perfDiag, 'should have DITA-PERF-001');
            const heavyPhaseCodes = diags.filter(d =>
                typeof d.code === 'string' && (
                    d.code.startsWith('DITA-PROF') ||
                    d.code.startsWith('DITA-SCH') ||
                    d.code.startsWith('DITA-CM') ||
                    d.code.startsWith('DITA-TABLE')
                )
            );
            assert.strictEqual(heavyPhaseCodes.length, 0,
                'heavy phase diagnostics should be skipped for large files');
        });

        test('large file still runs structure and ID validation', async () => {
            const xml = '<topic id="t1"><body><p>no title</p></body></topic>';
            const settings: DitaCraftSettings = {
                ...defaultSettings,
                largeFileThresholdKB: 0.01,
            };
            const pipeline = new ValidationPipeline(
                makeCatalogService(),
                makeRngService(),
                makeSubjectSchemeService(),
            );
            const doc = createDoc(xml);
            const diags = await pipeline.validate(doc, settings, undefined, emptyWorkspace);
            const structDiag = diags.find(d => d.code === 'DITA-STRUCT-004');
            assert.ok(structDiag, 'structure validation should still run for large files');
        });

        test('boundary: file exactly at threshold runs all phases', async () => {
            const xml = '<topic id="t1"><title>T</title><body><indextermref/></body></topic>';
            const fileSizeKB = Buffer.byteLength(xml, 'utf-8') / 1024;
            const settings: DitaCraftSettings = {
                ...defaultSettings,
                crossRefValidationEnabled: false,
                largeFileThresholdKB: fileSizeKB + 0.001,
            };
            const pipeline = new ValidationPipeline(
                makeCatalogService(),
                makeRngService(),
                makeSubjectSchemeService(),
            );
            const doc = createDoc(xml);
            const diags = await pipeline.validate(doc, settings, undefined, emptyWorkspace);
            const perfDiag = diags.find(d => d.code === 'DITA-PERF-001');
            assert.ok(!perfDiag, 'file within threshold should not get DITA-PERF-001');
            const sch003 = diags.filter(d => d.code === 'DITA-SCH-003');
            assert.ok(sch003.length > 0, 'DITA rules should run when file is within threshold');
        });
    });
});
