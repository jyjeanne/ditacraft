/**
 * Integration tests against the real docs-develop DITA dataset
 * (DITA-OT user guide — 263 .dita files across 6 folders).
 *
 * These tests exercise the LSP server APIs with actual DITA content rather
 * than synthetic inline fixtures, catching false positives / false negatives
 * that unit tests with hand-crafted XML cannot reveal.
 *
 * Dataset: /home/jeremy/Documents/Project/docs-develop/
 * Skipped automatically when the dataset path is not available (e.g. CI).
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { URI } from 'vscode-uri';

import { validateDITADocument } from '../src/features/validation';
import { validateCrossReferences } from '../src/features/crossRefValidation';
import { validateDitaRules, DitaRulesSettings } from '../src/features/ditaRulesValidator';
import { validateProfilingAttributes } from '../src/features/profilingValidation';
import { KeySpaceService, KeyDefinition } from '../src/services/keySpaceService';
import { SubjectSchemeService } from '../src/services/subjectSchemeService';
import { getGlobalSettings } from '../src/settings';
import { createDoc } from './helper';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DOCS_ROOT = '/home/jeremy/Documents/Project/docs-develop';
const ROOT_MAP  = path.join(DOCS_ROOT, 'userguide.ditamap');
const SUBJECT_SCHEME = path.join(DOCS_ROOT, 'resources', 'subjectscheme.ditamap');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Recursively collect all .dita files under a directory, relative to DOCS_ROOT. */
function collectDitaFiles(dir: string): string[] {
    const results: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            // Skip hidden dirs (.git, .github, .gradle, etc.)
            if (!entry.name.startsWith('.')) {
                results.push(...collectDitaFiles(path.join(dir, entry.name)));
            }
        } else if (entry.name.endsWith('.dita')) {
            results.push(path.relative(DOCS_ROOT, path.join(dir, entry.name)));
        }
    }
    return results.sort();
}

/** Read a file from the dataset and return its content + VS Code URI string. */
function readDatasetFile(relPath: string): { text: string; uri: string } {
    const fullPath = path.join(DOCS_ROOT, relPath);
    const text = fs.readFileSync(fullPath, 'utf-8');
    const uri  = URI.file(fullPath).toString();
    return { text, uri };
}

/** Default server settings — same as used during normal validation. */
function settings() { return getGlobalSettings(); }

/** Create a minimal mock KeySpaceService with a given key map (for negative tests). */
function createMockKeySpaceService(keys: Map<string, KeyDefinition>): KeySpaceService {
    return {
        getAllKeys: async () => keys,
        resolveKey: async (keyName: string) => keys.get(keyName) ?? null,
        getDuplicateKeys: async () => new Map(),
        getWorkspaceFolders: () => [],
        buildKeySpace: async () => ({
            rootMap: '',
            keys,
            buildTime: Date.now(),
            mapHierarchy: [],
            subjectSchemePaths: [],
            duplicateKeys: new Map(),
        }),
        getSubjectSchemePaths: async () => [],
        findRootMap: async () => null,
        invalidateForFile: () => {},
        updateWorkspaceFolders: () => {},
        reloadCacheConfig: async () => {},
        shutdown: () => {},
    } as unknown as KeySpaceService;
}

/** DITA rules settings — all categories, DITA 1.3. */
const DITA_RULES_SETTINGS: DitaRulesSettings = {
    enabled: true,
    categories: ['mandatory', 'recommendation', 'authoring', 'accessibility'],
    ditaVersion: '1.3',
};

// ---------------------------------------------------------------------------
// Dataset availability guard
// ---------------------------------------------------------------------------

// Skip gracefully on CI or machines without the dataset checked out.
const DATASET_AVAILABLE = fs.existsSync(DOCS_ROOT) && fs.existsSync(ROOT_MAP);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function suiteIfDataset(title: string, fn: (this: any) => void): void {
    if (DATASET_AVAILABLE) {
        suite(title, fn);
    } else {
        suite(title, function () {
            test('skipped — docs-develop dataset not present on this machine', function () {
                this.skip();
            });
        });
    }
}

// Collect all .dita files once (empty array when dataset absent, to avoid fs errors)
const ALL_DITA_FILES: string[] = DATASET_AVAILABLE ? collectDitaFiles(DOCS_ROOT) : [];

// ---------------------------------------------------------------------------
// Suite 1 — Every .dita file: well-formedness + structural rules
// ---------------------------------------------------------------------------

suiteIfDataset('docs-develop dataset — Suite 1: all files — well-formedness and structure', function () {
    this.timeout(60_000);

    // One test per file: zero XML-001 (malformed XML) diagnostics
    suite('DITA-XML-001 — no malformed XML in any file', function () {
        this.timeout(60_000);
        for (const relPath of ALL_DITA_FILES) {
            test(relPath, () => {
                const { text, uri } = readDatasetFile(relPath);
                const doc = createDoc(text, uri);
                const diags = validateDITADocument(doc, settings());
                const xmlErrors = diags.filter(d => d.code === 'DITA-XML-001');
                assert.strictEqual(
                    xmlErrors.length,
                    0,
                    `XML-001 in ${relPath}: ${xmlErrors.map(d => d.message).join('; ')}`
                );
            });
        }
    });

    // One test per file: zero STRUCT-001 (missing DOCTYPE)
    suite('DITA-STRUCT-001 — no missing DOCTYPE in any file', function () {
        this.timeout(60_000);
        for (const relPath of ALL_DITA_FILES) {
            test(relPath, () => {
                const { text, uri } = readDatasetFile(relPath);
                const doc = createDoc(text, uri);
                const diags = validateDITADocument(doc, settings());
                const missing = diags.filter(d => d.code === 'DITA-STRUCT-001');
                assert.strictEqual(
                    missing.length,
                    0,
                    `STRUCT-001 (missing DOCTYPE) in ${relPath}`
                );
            });
        }
    });

    // One test per file: zero STRUCT-002 (missing root id)
    suite('DITA-STRUCT-002 — root element has id attribute in every file', function () {
        this.timeout(60_000);
        for (const relPath of ALL_DITA_FILES) {
            test(relPath, () => {
                const { text, uri } = readDatasetFile(relPath);
                const doc = createDoc(text, uri);
                const diags = validateDITADocument(doc, settings());
                const missing = diags.filter(d => d.code === 'DITA-STRUCT-002');
                assert.strictEqual(
                    missing.length,
                    0,
                    `STRUCT-002 (missing root id) in ${relPath}`
                );
            });
        }
    });

    // One test per file: zero STRUCT-003 (missing title)
    suite('DITA-STRUCT-003 — every file has a title', function () {
        this.timeout(60_000);
        for (const relPath of ALL_DITA_FILES) {
            test(relPath, () => {
                const { text, uri } = readDatasetFile(relPath);
                const doc = createDoc(text, uri);
                const diags = validateDITADocument(doc, settings());
                const missing = diags.filter(d => d.code === 'DITA-STRUCT-003');
                assert.strictEqual(
                    missing.length,
                    0,
                    `STRUCT-003 (missing title) in ${relPath}`
                );
            });
        }
    });
});

// ---------------------------------------------------------------------------
// Suite 2 — Profiling attributes validated against subject scheme
// ---------------------------------------------------------------------------

suiteIfDataset('docs-develop dataset — Suite 2: profiling attribute validation', function () {
    this.timeout(30_000);

    let schemeService: SubjectSchemeService;

    setup(() => { schemeService = new SubjectSchemeService(); });

    // Files known to contain platform= or audience= profiling attributes
    const PROFILED_FILES = [
        'topics/increasing-the-jvm.dita',        // platform="unix" platform="windows"
        'topics/installing.dita',                 // platform="linux" platform="mac" etc.
        'topics/configuring-proxies.dita',        // platform values
        'topics/rebuilding-docs.dita',            // platform values
        'topics/building-with-ant.dita',          // platform values
        'parameters/ant-parameters-details.dita', // audience="xslt-customizer"
    ];

    suite('real files with valid profiling attributes — no DITA-PROF-001', function () {
        for (const relPath of PROFILED_FILES) {
            test(relPath, () => {
                const { text } = readDatasetFile(relPath);
                const scheme = schemeService.snapshotFor([SUBJECT_SCHEME]);
                const diags = validateProfilingAttributes(text, scheme, 100);
                const profErrors = diags.filter(d => d.code === 'DITA-PROF-001');
                assert.strictEqual(
                    profErrors.length,
                    0,
                    `False PROF-001 in ${relPath}: ${profErrors.map(d => d.message).join('; ')}`
                );
            });
        }
    });

    test('synthetic: platform="invalid-os" — DITA-PROF-001 fires', () => {
        const text = `<?xml version="1.0"?>
<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">
<topic id="t1">
  <title>Test</title>
  <body><p platform="invalid-os">Content</p></body>
</topic>`;
        const scheme = schemeService.snapshotFor([SUBJECT_SCHEME]);
        const diags = validateProfilingAttributes(text, scheme, 100);
        const profErrors = diags.filter(d => d.code === 'DITA-PROF-001');
        assert.ok(profErrors.length >= 1, 'Expected DITA-PROF-001 for invalid platform value');
        assert.ok(profErrors[0].message.includes('invalid-os'),
            `Error message should mention "invalid-os", got: ${profErrors[0].message}`);
    });

    test('synthetic: audience="unknown-role" — DITA-PROF-001 fires', () => {
        const text = `<?xml version="1.0"?>
<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">
<topic id="t1">
  <title>Test</title>
  <body><p audience="unknown-role">Content</p></body>
</topic>`;
        const scheme = schemeService.snapshotFor([SUBJECT_SCHEME]);
        const diags = validateProfilingAttributes(text, scheme, 100);
        const profErrors = diags.filter(d => d.code === 'DITA-PROF-001');
        assert.ok(profErrors.length >= 1, 'Expected DITA-PROF-001 for invalid audience value');
    });

    test('without subject scheme — no profiling diagnostics (no false positives)', () => {
        const { text } = readDatasetFile('topics/increasing-the-jvm.dita');
        const emptyScheme = schemeService.snapshotFor([]);
        const diags = validateProfilingAttributes(text, emptyScheme, 100);
        assert.strictEqual(diags.length, 0, 'No profiling errors expected without a subject scheme');
    });
});

// ---------------------------------------------------------------------------
// Suite 3 — Key space built from real root map
// ---------------------------------------------------------------------------

suiteIfDataset('docs-develop dataset — Suite 3: key space from root map', function () {
    this.timeout(30_000);

    let service: KeySpaceService;
    let keySpace: Awaited<ReturnType<KeySpaceService['buildKeySpace']>>;

    suiteSetup(async () => {
        service = new KeySpaceService(
            [DOCS_ROOT],
            async () => ({ keySpaceCacheTtlMinutes: 5, maxLinkMatches: 10000 }),
            () => {}
        );
        keySpace = await service.buildKeySpace(ROOT_MAP);
    });

    suiteTeardown(() => { service.shutdown(); });

    test('key space builds without throwing', () => {
        assert.ok(keySpace, 'buildKeySpace returned falsy');
        assert.ok(keySpace.keys instanceof Map, 'keys should be a Map');
    });

    test('key space contains > 50 keys (submaps were traversed)', () => {
        assert.ok(keySpace.keys.size > 50,
            `Expected > 50 keys but got ${keySpace.keys.size}`);
    });

    const EXPECTED_KEYS = [
        'release',             // from key-definitions.ditamap
        'tool.java.version',   // tool version key
        'tool.ant.tm',         // tool name key
        'dita-ot-issues',      // external GitHub URL (scope="external")
        'contributions',       // external URL key
        'java-api',            // external URL key
    ];

    suite('known keys are present in the key space', function () {
        for (const keyName of EXPECTED_KEYS) {
            test(`key "${keyName}" is defined`, () => {
                assert.ok(keySpace.keys.has(keyName),
                    `Key "${keyName}" not found. Sample keys: ${[...keySpace.keys.keys()].slice(0, 15).join(', ')}…`);
            });
        }
    });

    test('"dita-ot-issues" is marked scope="external"', () => {
        const def = keySpace.keys.get('dita-ot-issues');
        assert.ok(def, 'Key "dita-ot-issues" missing');
        assert.strictEqual(def.scope, 'external',
            `Expected scope="external", got: ${def.scope}`);
    });

    test('no duplicate keys in clean dataset', () => {
        assert.strictEqual(keySpace.duplicateKeys.size, 0,
            `Unexpected duplicate keys: ${[...keySpace.duplicateKeys.keys()].join(', ')}`);
    });

    test('resolveKey returns a definition for "release"', async () => {
        const contextFile = path.join(DOCS_ROOT, 'topics', 'ant.dita');
        const def = await service.resolveKey('release', contextFile);
        assert.ok(def, 'resolveKey("release") returned null/undefined');
    });

    test('resolveKey returns null for unknown key', async () => {
        const contextFile = path.join(DOCS_ROOT, 'topics', 'ant.dita');
        const def = await service.resolveKey('__nonexistent_key_xyz__', contextFile);
        assert.strictEqual(def, null, 'resolveKey should return null for unknown keys');
    });
});

// ---------------------------------------------------------------------------
// Suite 4 — Cross-reference validation: real files / no false positives
// ---------------------------------------------------------------------------

suiteIfDataset('docs-develop dataset — Suite 4: cross-reference validation', function () {
    this.timeout(15_000);

    // Files known to use only href-based local xrefs (no cross-file keyrefs),
    // so validateCrossReferences without a key space service is a clean test.
    const HREF_ONLY_FILES = [
        'topics/adding-new-strings.dita',
        'topics/enabling-debug-mode.dita',
        'topics/logging.dita',
        'topics/other-errors.dita',
        'extension-points/extension-points-by-plugin.dita',
        'extension-points/plugin-extension-points.dita',
        'reference/architecture.dita',
        'reference/license.dita',
        'parameters/generate-copy-outer.dita',
    ];

    suite('real files — no false DITA-XREF-001 (href-based only)', function () {
        for (const relPath of HREF_ONLY_FILES) {
            test(relPath, async () => {
                const { text, uri } = readDatasetFile(relPath);
                const diags = await validateCrossReferences(text, uri, undefined, 100);
                const hrefErrors = diags.filter(d => d.code === 'DITA-XREF-001');
                assert.strictEqual(
                    hrefErrors.length,
                    0,
                    `False XREF-001 in ${relPath}: ${hrefErrors.map(d => d.message).join('; ')}`
                );
            });
        }
    });

    test('href to existing sibling file — no DITA-XREF-001', async () => {
        const topicsDir = path.join(DOCS_ROOT, 'topics');
        const sourceUri = URI.file(path.join(topicsDir, 'source-test.dita')).toString();
        const text = '<concept id="c1"><title>T</title><conbody>' +
            '<p><xref href="ant.dita">Ant</xref></p>' +
            '</conbody></concept>';
        const diags = await validateCrossReferences(text, sourceUri, undefined, 100);
        const missing = diags.filter(d => d.code === 'DITA-XREF-001');
        assert.strictEqual(missing.length, 0,
            `False XREF-001 for existing ant.dita: ${missing.map(d => d.message).join('; ')}`);
    });

    test('href with scope="external" to https:// URL — no diagnostic', async () => {
        const sourceUri = URI.file(path.join(DOCS_ROOT, 'topics', 'source-test.dita')).toString();
        const text = '<topic id="t1"><title>T</title><body><p>' +
            '<xref href="https://github.com/dita-ot/dita-ot" scope="external" format="html">GitHub</xref>' +
            '</p></body></topic>';
        const diags = await validateCrossReferences(text, sourceUri, undefined, 100);
        const missing = diags.filter(d => d.code === 'DITA-XREF-001');
        assert.strictEqual(missing.length, 0,
            `External URL incorrectly flagged: ${missing.map(d => d.message).join('; ')}`);
    });

    test('href to nonexistent file — DITA-XREF-001 fires', async () => {
        const sourceUri = URI.file(path.join(DOCS_ROOT, 'topics', 'source-test.dita')).toString();
        const text = '<topic id="t1"><title>T</title><body><p>' +
            '<xref href="totally-nonexistent-topic-abc123.dita">Missing</xref>' +
            '</p></body></topic>';
        const diags = await validateCrossReferences(text, sourceUri, undefined, 100);
        const missing = diags.filter(d => d.code === 'DITA-XREF-001');
        assert.ok(missing.length >= 1, 'Expected DITA-XREF-001 for nonexistent file');
        assert.ok(missing[0].message.includes('totally-nonexistent-topic-abc123.dita'),
            `Error message should name the missing file, got: ${missing[0].message}`);
    });

    test('keyref to undefined key — DITA-KEY-001 fires (empty mock key space)', async () => {
        const sourceUri = URI.file(path.join(DOCS_ROOT, 'topics', 'source-test.dita')).toString();
        const text = '<concept id="c1"><title>T</title><conbody><p>' +
            '<xref keyref="__undefined_key_xyz__">Missing key</xref>' +
            '</p></conbody></concept>';
        const mockService = createMockKeySpaceService(new Map());
        const diags = await validateCrossReferences(text, sourceUri, mockService, 100);
        const keyErrors = diags.filter(d => d.code === 'DITA-KEY-001');
        assert.ok(keyErrors.length >= 1, 'Expected DITA-KEY-001 for undefined keyref');
    });
});

// ---------------------------------------------------------------------------
// Suite 5 — DITA rules: all real files produce zero false positives
// ---------------------------------------------------------------------------

suiteIfDataset('docs-develop dataset — Suite 5: DITA rules — no false positives across all files', function () {
    this.timeout(120_000);

    // All 263 .dita files: zero SCH-* violations expected on real content
    suite('all dataset files — zero DITA-SCH-* violations', function () {
        this.timeout(120_000);
        for (const relPath of ALL_DITA_FILES) {
            test(relPath, () => {
                const { text } = readDatasetFile(relPath);
                const diags = validateDitaRules(text, DITA_RULES_SETTINGS);
                const violations = diags.filter(d =>
                    typeof d.code === 'string' && d.code.startsWith('DITA-SCH-')
                );
                assert.strictEqual(
                    violations.length,
                    0,
                    `False SCH violations in ${relPath}: ` +
                    violations.map(d => `${d.code}: ${d.message}`).join('; ')
                );
            });
        }
    });

    // Negative (synthetic) tests — deliberate violations that must fire
    suite('synthetic violations — rules fire correctly', function () {
        test('xref nested inside xref — DITA-SCH-040 fires', () => {
            const text = `<?xml version="1.0"?>
<!DOCTYPE concept PUBLIC "-//OASIS//DTD DITA Concept//EN" "concept.dtd">
<concept id="c1">
  <title>Test</title>
  <conbody>
    <p><xref href="a.dita"><xref href="b.dita">nested</xref></xref></p>
  </conbody>
</concept>`;
            const diags = validateDitaRules(text, DITA_RULES_SETTINGS);
            const sch040 = diags.filter(d => d.code === 'DITA-SCH-040');
            assert.ok(sch040.length >= 1, 'Expected DITA-SCH-040 for nested xref but none fired');
        });

        test('image without alt element — DITA-SCH-030 fires', () => {
            const text = `<?xml version="1.0"?>
<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">
<topic id="t1">
  <title>Test</title>
  <body><p><image href="logo.png"/></p></body>
</topic>`;
            const diags = validateDitaRules(text, DITA_RULES_SETTINGS);
            const sch030 = diags.filter(d => d.code === 'DITA-SCH-030');
            assert.ok(sch030.length >= 1, 'Expected DITA-SCH-030 for image without alt');
        });
    });
});
