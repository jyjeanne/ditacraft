/**
 * Integration tests against the real docs-develop DITA dataset
 * (DITA-OT user guide — 316 files).
 *
 * These tests exercise the LSP server APIs with actual DITA content rather
 * than synthetic inline fixtures, catching false positives / false negatives
 * that unit tests with hand-crafted XML cannot reveal.
 *
 * Dataset: /home/jeremy/Documents/Project/docs-develop/
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
const ROOT_MAP = path.join(DOCS_ROOT, 'userguide.ditamap');
const SUBJECT_SCHEME = path.join(DOCS_ROOT, 'resources', 'subjectscheme.ditamap');

/** Read a file from the dataset and return its content + VS Code URI string. */
function readDatasetFile(relPath: string): { text: string; uri: string } {
    const fullPath = path.join(DOCS_ROOT, relPath);
    const text = fs.readFileSync(fullPath, 'utf-8');
    const uri = URI.file(fullPath).toString();
    return { text, uri };
}

/** Default settings from server — same as used during normal validation. */
function settings() {
    return getGlobalSettings();
}

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

/** Default DITA rules settings (all categories, DITA 1.3). */
const DITA_RULES_SETTINGS: DitaRulesSettings = {
    enabled: true,
    categories: ['mandatory', 'recommendation', 'authoring', 'accessibility'],
    ditaVersion: '1.3',
};

// ---------------------------------------------------------------------------
// Suite 1 — Well-formed real topics produce no XML / structural errors
// ---------------------------------------------------------------------------

suite('docs-develop dataset — Suite 1: well-formed topics', function () {
    this.timeout(15_000);

    const CLEAN_TOPICS = [
        'topics/adding-new-languages.dita',     // task
        'topics/ant.dita',                      // concept (keyref-heavy)
        'topics/installing.dita',               // concept
        'reference/dita-v1-3-support.dita',     // reference
        'release-notes/rel4.2.dita',            // reference with nested sections
    ];

    for (const relPath of CLEAN_TOPICS) {
        test(`${relPath} — no XML well-formedness errors (DITA-XML-001)`, () => {
            const { text, uri } = readDatasetFile(relPath);
            const doc = createDoc(text, uri);
            const diags = validateDITADocument(doc, settings());
            const xmlErrors = diags.filter(d => d.code === 'DITA-XML-001');
            assert.strictEqual(
                xmlErrors.length,
                0,
                `Unexpected XML errors in ${relPath}: ${xmlErrors.map(d => d.message).join('; ')}`
            );
        });

        test(`${relPath} — has DOCTYPE declaration (no DITA-STRUCT-001)`, () => {
            const { text, uri } = readDatasetFile(relPath);
            const doc = createDoc(text, uri);
            const diags = validateDITADocument(doc, settings());
            const missing = diags.filter(d => d.code === 'DITA-STRUCT-001');
            assert.strictEqual(
                missing.length,
                0,
                `Missing DOCTYPE reported in ${relPath}`
            );
        });

        test(`${relPath} — root element has id (no DITA-STRUCT-002)`, () => {
            const { text, uri } = readDatasetFile(relPath);
            const doc = createDoc(text, uri);
            const diags = validateDITADocument(doc, settings());
            const missing = diags.filter(d => d.code === 'DITA-STRUCT-002');
            assert.strictEqual(
                missing.length,
                0,
                `Missing root id reported in ${relPath}`
            );
        });

        test(`${relPath} — has title (no DITA-STRUCT-003)`, () => {
            const { text, uri } = readDatasetFile(relPath);
            const doc = createDoc(text, uri);
            const diags = validateDITADocument(doc, settings());
            const missing = diags.filter(d => d.code === 'DITA-STRUCT-003');
            assert.strictEqual(
                missing.length,
                0,
                `Missing title reported in ${relPath}`
            );
        });
    }

    test('release notes map (changes.ditamap) — no XML errors', () => {
        const { text, uri } = readDatasetFile('release-notes/changes.ditamap');
        const doc = createDoc(text, uri);
        const diags = validateDITADocument(doc, settings());
        const xmlErrors = diags.filter(d => d.code === 'DITA-XML-001');
        assert.strictEqual(xmlErrors.length, 0, `XML errors in changes.ditamap: ${xmlErrors.map(d => d.message).join('; ')}`);
    });
});

// ---------------------------------------------------------------------------
// Suite 2 — Profiling attributes validated against subject scheme
// ---------------------------------------------------------------------------

suite('docs-develop dataset — Suite 2: profiling attribute validation', function () {
    this.timeout(10_000);

    let schemeService: SubjectSchemeService;

    setup(() => {
        schemeService = new SubjectSchemeService();
    });

    test('real file with platform="unix" and platform="windows" — no DITA-PROF-001', () => {
        const { text } = readDatasetFile('topics/increasing-the-jvm.dita');
        const scheme = schemeService.snapshotFor([SUBJECT_SCHEME]);
        const diags = validateProfilingAttributes(text, scheme, 100);
        const profErrors = diags.filter(d => d.code === 'DITA-PROF-001');
        assert.strictEqual(
            profErrors.length,
            0,
            `False DITA-PROF-001 on valid platform values: ${profErrors.map(d => d.message).join('; ')}`
        );
    });

    test('real file with audience="xslt-customizer" — no DITA-PROF-001', () => {
        const { text } = readDatasetFile('parameters/ant-parameters-details.dita');
        const scheme = schemeService.snapshotFor([SUBJECT_SCHEME]);
        const diags = validateProfilingAttributes(text, scheme, 100);
        const profErrors = diags.filter(d => d.code === 'DITA-PROF-001');
        assert.strictEqual(
            profErrors.length,
            0,
            `False DITA-PROF-001 on valid audience value: ${profErrors.map(d => d.message).join('; ')}`
        );
    });

    test('synthetic topic with platform="invalid-os" — DITA-PROF-001 fires', () => {
        const text = `<?xml version="1.0"?>
<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">
<topic id="t1">
  <title>Test</title>
  <body><p platform="invalid-os">Content</p></body>
</topic>`;
        const scheme = schemeService.snapshotFor([SUBJECT_SCHEME]);
        const diags = validateProfilingAttributes(text, scheme, 100);
        const profErrors = diags.filter(d => d.code === 'DITA-PROF-001');
        assert.ok(
            profErrors.length >= 1,
            'Expected DITA-PROF-001 for invalid platform value but none fired'
        );
        assert.ok(
            profErrors[0].message.includes('invalid-os'),
            `Error message should mention the invalid value, got: ${profErrors[0].message}`
        );
    });

    test('synthetic topic with audience="unknown-role" — DITA-PROF-001 fires', () => {
        const text = `<?xml version="1.0"?>
<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">
<topic id="t1">
  <title>Test</title>
  <body><p audience="unknown-role">Content</p></body>
</topic>`;
        const scheme = schemeService.snapshotFor([SUBJECT_SCHEME]);
        const diags = validateProfilingAttributes(text, scheme, 100);
        const profErrors = diags.filter(d => d.code === 'DITA-PROF-001');
        assert.ok(profErrors.length >= 1, 'Expected DITA-PROF-001 for invalid audience value but none fired');
    });

    test('without subject scheme — no profiling diagnostics (no false positives)', () => {
        const { text } = readDatasetFile('topics/increasing-the-jvm.dita');
        // Empty snapshot — no scheme registered
        const emptyScheme = schemeService.snapshotFor([]);
        const diags = validateProfilingAttributes(text, emptyScheme, 100);
        assert.strictEqual(diags.length, 0, 'No profiling errors expected without a subject scheme');
    });
});

// ---------------------------------------------------------------------------
// Suite 3 — Key space built from real root map
// ---------------------------------------------------------------------------

suite('docs-develop dataset — Suite 3: key space from root map', function () {
    this.timeout(30_000);

    let service: KeySpaceService;
    let keySpace: Awaited<ReturnType<KeySpaceService['buildKeySpace']>>;

    suiteSetup(async () => {
        service = new KeySpaceService(
            [DOCS_ROOT],
            async () => ({ keySpaceCacheTtlMinutes: 5, maxLinkMatches: 10000 }),
            () => {} // silent logger
        );
        keySpace = await service.buildKeySpace(ROOT_MAP);
    });

    suiteTeardown(() => {
        service.shutdown();
    });

    test('key space builds without throwing', () => {
        assert.ok(keySpace, 'buildKeySpace returned falsy');
        assert.ok(keySpace.keys instanceof Map, 'keys should be a Map');
    });

    test('key space contains more than 50 keys (submaps traversed)', () => {
        assert.ok(
            keySpace.keys.size > 50,
            `Expected > 50 keys but got ${keySpace.keys.size}`
        );
    });

    test('key "release" is defined (from key-definitions.ditamap)', () => {
        assert.ok(
            keySpace.keys.has('release'),
            `Key "release" not found. Available keys: ${[...keySpace.keys.keys()].slice(0, 10).join(', ')}…`
        );
    });

    test('key "tool.java.version" is defined', () => {
        assert.ok(
            keySpace.keys.has('tool.java.version'),
            'Key "tool.java.version" not found in key space'
        );
    });

    test('key "tool.ant.tm" is defined', () => {
        assert.ok(
            keySpace.keys.has('tool.ant.tm'),
            'Key "tool.ant.tm" not found in key space'
        );
    });

    test('key "dita-ot-issues" is defined (from external-links.ditamap)', () => {
        assert.ok(
            keySpace.keys.has('dita-ot-issues'),
            'Key "dita-ot-issues" (external GitHub URL) not found in key space'
        );
    });

    test('key "dita-ot-issues" is marked with scope="external"', () => {
        const def = keySpace.keys.get('dita-ot-issues');
        assert.ok(def, 'Key "dita-ot-issues" missing');
        // External URL keys carry scope="external" (href is resolved at publish time)
        assert.strictEqual(
            def.scope,
            'external',
            `Expected scope="external" for external URL key, got: ${def.scope}`
        );
    });

    test('no duplicate keys detected (clean dataset)', () => {
        assert.strictEqual(
            keySpace.duplicateKeys.size,
            0,
            `Unexpected duplicate keys: ${[...keySpace.duplicateKeys.keys()].join(', ')}`
        );
    });

    test('resolveKey returns correct definition for known key', async () => {
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

suite('docs-develop dataset — Suite 4: cross-reference validation', function () {
    this.timeout(15_000);

    test('xref to existing local file — no DITA-XREF-001 (no false positive)', async () => {
        // topics/ant.dita exists — synthetic xref pointing to it should resolve
        const topicsDir = path.join(DOCS_ROOT, 'topics');
        const sourceUri = URI.file(path.join(topicsDir, 'source-test.dita')).toString();
        const text = '<concept id="c1"><title>T</title><conbody><p><xref href="ant.dita">Ant</xref></p></conbody></concept>';

        const diags = await validateCrossReferences(text, sourceUri, undefined, 100);
        const missing = diags.filter(d => d.code === 'DITA-XREF-001');
        assert.strictEqual(
            missing.length,
            0,
            `False positive DITA-XREF-001 for existing file ant.dita: ${missing.map(d => d.message).join('; ')}`
        );
    });

    test('xref with scope="external" to https:// URL — no missing-file diagnostic', async () => {
        const sourceUri = URI.file(path.join(DOCS_ROOT, 'topics', 'source-test.dita')).toString();
        const text = '<topic id="t1"><title>T</title><body><p>' +
            '<xref href="https://github.com/dita-ot/dita-ot" scope="external" format="html">GitHub</xref>' +
            '</p></body></topic>';

        const diags = await validateCrossReferences(text, sourceUri, undefined, 100);
        const missing = diags.filter(d => d.code === 'DITA-XREF-001');
        assert.strictEqual(
            missing.length,
            0,
            `External URL incorrectly flagged as missing: ${missing.map(d => d.message).join('; ')}`
        );
    });

    test('xref to nonexistent file — DITA-XREF-001 fires', async () => {
        const sourceUri = URI.file(path.join(DOCS_ROOT, 'topics', 'source-test.dita')).toString();
        const text = '<topic id="t1"><title>T</title><body><p>' +
            '<xref href="totally-nonexistent-topic-abc123.dita">Missing</xref>' +
            '</p></body></topic>';

        const diags = await validateCrossReferences(text, sourceUri, undefined, 100);
        const missing = diags.filter(d => d.code === 'DITA-XREF-001');
        assert.ok(
            missing.length >= 1,
            'Expected DITA-XREF-001 for nonexistent file but none fired'
        );
        assert.ok(
            missing[0].message.includes('totally-nonexistent-topic-abc123.dita'),
            `Error message should name the missing file, got: ${missing[0].message}`
        );
    });

    test('keyref to undefined key — DITA-KEY-001 fires', async () => {
        const sourceUri = URI.file(path.join(DOCS_ROOT, 'topics', 'source-test.dita')).toString();
        const text = '<concept id="c1"><title>T</title><conbody><p>' +
            '<xref keyref="__undefined_key_xyz__">Missing key</xref>' +
            '</p></conbody></concept>';

        // Use a mock service with empty key map so keyref resolution runs but finds nothing
        const mockService = createMockKeySpaceService(new Map());
        const diags = await validateCrossReferences(text, sourceUri, mockService, 100);
        const keyErrors = diags.filter(d => d.code === 'DITA-KEY-001');
        assert.ok(
            keyErrors.length >= 1,
            'Expected DITA-KEY-001 for undefined keyref but none fired'
        );
    });

    test('real topic file produces no cross-ref errors (no false positives)', async () => {
        // ant.dita uses only keyref-based xrefs (no href), so without key space all keyrefs
        // would fire — use a topic without cross-file hrefs: adding-new-strings.dita
        const { text, uri } = readDatasetFile('topics/adding-new-strings.dita');
        // Provide no key space service — only href-based missing-file errors matter here
        const diags = await validateCrossReferences(text, uri, undefined, 100);
        const hrefErrors = diags.filter(d => d.code === 'DITA-XREF-001');
        assert.strictEqual(
            hrefErrors.length,
            0,
            `False positive DITA-XREF-001 in adding-new-strings.dita: ${hrefErrors.map(d => d.message).join('; ')}`
        );
    });
});

// ---------------------------------------------------------------------------
// Suite 5 — DITA rules: real content triggers no false positives
// ---------------------------------------------------------------------------

suite('docs-develop dataset — Suite 5: DITA rules — no false positives on real content', function () {
    this.timeout(15_000);

    const CLEAN_TOPICS: Array<{ file: string; desc: string }> = [
        { file: 'topics/adding-new-languages.dita', desc: 'task topic' },
        { file: 'topics/ant.dita',                  desc: 'concept with keyref' },
        { file: 'topics/installing.dita',            desc: 'concept' },
        { file: 'release-notes/rel4.2.dita',         desc: 'reference with nested sections' },
    ];

    for (const { file, desc } of CLEAN_TOPICS) {
        test(`${file} (${desc}) — zero DITA rule violations`, () => {
            const { text } = readDatasetFile(file);
            const diags = validateDitaRules(text, DITA_RULES_SETTINGS);
            const schViolations = diags.filter(d =>
                typeof d.code === 'string' && d.code.startsWith('DITA-SCH-')
            );
            assert.strictEqual(
                schViolations.length,
                0,
                `False positive DITA rules in ${file}: ${schViolations.map(d => `${d.code}: ${d.message}`).join('; ')}`
            );
        });
    }

    test('release-notes/rel3.1.dita (nested reference elements) — no false SCH-023 section-title violation', () => {
        const { text } = readDatasetFile('release-notes/rel3.1.dita');
        const diags = validateDitaRules(text, DITA_RULES_SETTINGS);
        const sch023 = diags.filter(d => d.code === 'DITA-SCH-023');
        assert.strictEqual(
            sch023.length,
            0,
            `False SCH-023 in rel3.1.dita (nested reference sections): ${sch023.map(d => d.message).join('; ')}`
        );
    });

    test('synthetic: xref nested inside xref — DITA-SCH-040 fires', () => {
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
        assert.ok(
            sch040.length >= 1,
            'Expected DITA-SCH-040 for nested xref but none fired'
        );
    });

    test('synthetic: image without alt element — DITA-SCH-030 fires', () => {
        const text = `<?xml version="1.0"?>
<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">
<topic id="t1">
  <title>Test</title>
  <body><p><image href="logo.png"/></p></body>
</topic>`;
        const diags = validateDitaRules(text, DITA_RULES_SETTINGS);
        const sch030 = diags.filter(d => d.code === 'DITA-SCH-030');
        assert.ok(
            sch030.length >= 1,
            'Expected DITA-SCH-030 for image without alt but none fired'
        );
    });

    test('parameters/ant-parameters-details.dita — zero SCH violations despite profiling attrs', () => {
        const { text } = readDatasetFile('parameters/ant-parameters-details.dita');
        const diags = validateDitaRules(text, DITA_RULES_SETTINGS);
        const schViolations = diags.filter(d =>
            typeof d.code === 'string' && d.code.startsWith('DITA-SCH-')
        );
        assert.strictEqual(
            schViolations.length,
            0,
            `False DITA rule violations in ant-parameters-details.dita: ${schViolations.map(d => `${d.code}: ${d.message}`).join('; ')}`
        );
    });
});
