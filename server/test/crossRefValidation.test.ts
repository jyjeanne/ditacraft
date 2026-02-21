import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { validateCrossReferences, XREF_CODES } from '../src/features/crossRefValidation';
import { KeySpaceService, KeyDefinition } from '../src/services/keySpaceService';

function createMockKeySpaceService(
    keys: Map<string, KeyDefinition>
): KeySpaceService {
    return {
        getAllKeys: async () => keys,
        resolveKey: async (keyName: string) => keys.get(keyName) ?? null,
        getWorkspaceFolders: () => [],
        buildKeySpace: async () => ({
            rootMap: '',
            keys,
            buildTime: Date.now(),
            mapHierarchy: [],
        }),
        findRootMap: async () => '/test/root.ditamap',
        invalidateForFile: () => {},
        updateWorkspaceFolders: () => {},
        reloadCacheConfig: async () => {},
        shutdown: () => {},
    } as unknown as KeySpaceService;
}

suite('validateCrossReferences', () => {
    suite('href validation', () => {
        test('missing target file produces warning', async () => {
            const text = '<xref href="nonexistent.dita">link</xref>';
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const testUri = `file:///${tmpDir.replace(/\\/g, '/')}/source.dita`;

            try {
                const diags = await validateCrossReferences(text, testUri, undefined, 100);
                const missing = diags.filter(d => d.code === XREF_CODES.MISSING_FILE);
                assert.strictEqual(missing.length, 1);
                assert.ok(missing[0].message.includes('nonexistent.dita'));
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('existing target file produces no warning', async () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const targetFile = path.join(tmpDir, 'target.dita');
            fs.writeFileSync(targetFile, '<topic id="t1"><title>T</title></topic>');

            try {
                const text = '<xref href="target.dita">link</xref>';
                const testUri = `file:///${tmpDir.replace(/\\/g, '/')}/source.dita`;
                const diags = await validateCrossReferences(text, testUri, undefined, 100);
                const missing = diags.filter(d => d.code === XREF_CODES.MISSING_FILE);
                assert.strictEqual(missing.length, 0);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('external URL is skipped', async () => {
            const text = '<xref href="https://example.com">link</xref>';
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const testUri = `file:///${tmpDir.replace(/\\/g, '/')}/source.dita`;

            try {
                const diags = await validateCrossReferences(text, testUri, undefined, 100);
                assert.strictEqual(diags.length, 0);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('scope="external" is skipped', async () => {
            const text = '<xref href="some-path" scope="external">link</xref>';
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const testUri = `file:///${tmpDir.replace(/\\/g, '/')}/source.dita`;

            try {
                const diags = await validateCrossReferences(text, testUri, undefined, 100);
                assert.strictEqual(diags.length, 0);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('missing topic ID in fragment produces warning', async () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const targetFile = path.join(tmpDir, 'target.dita');
            fs.writeFileSync(targetFile, '<topic id="t1"><title>T</title></topic>');

            try {
                const text = '<xref href="target.dita#nonexistent">link</xref>';
                const testUri = `file:///${tmpDir.replace(/\\/g, '/')}/source.dita`;
                const diags = await validateCrossReferences(text, testUri, undefined, 100);
                const missing = diags.filter(d => d.code === XREF_CODES.MISSING_TOPIC_ID);
                assert.strictEqual(missing.length, 1);
                assert.ok(missing[0].message.includes('nonexistent'));
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('valid topic ID in fragment produces no warning', async () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const targetFile = path.join(tmpDir, 'target.dita');
            fs.writeFileSync(targetFile, '<topic id="t1"><title>T</title></topic>');

            try {
                const text = '<xref href="target.dita#t1">link</xref>';
                const testUri = `file:///${tmpDir.replace(/\\/g, '/')}/source.dita`;
                const diags = await validateCrossReferences(text, testUri, undefined, 100);
                assert.strictEqual(diags.length, 0);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('missing element ID in fragment produces warning', async () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const targetFile = path.join(tmpDir, 'target.dita');
            fs.writeFileSync(targetFile, '<topic id="t1"><body><p id="p1">text</p></body></topic>');

            try {
                const text = '<xref href="target.dita#t1/nonexistent">link</xref>';
                const testUri = `file:///${tmpDir.replace(/\\/g, '/')}/source.dita`;
                const diags = await validateCrossReferences(text, testUri, undefined, 100);
                const missing = diags.filter(d => d.code === XREF_CODES.MISSING_ELEMENT_ID);
                assert.strictEqual(missing.length, 1);
                assert.ok(missing[0].message.includes('nonexistent'));
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('valid element ID in fragment produces no warning', async () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const targetFile = path.join(tmpDir, 'target.dita');
            fs.writeFileSync(targetFile, '<topic id="t1"><body><p id="p1">text</p></body></topic>');

            try {
                const text = '<xref href="target.dita#t1/p1">link</xref>';
                const testUri = `file:///${tmpDir.replace(/\\/g, '/')}/source.dita`;
                const diags = await validateCrossReferences(text, testUri, undefined, 100);
                assert.strictEqual(diags.length, 0);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });
    });

    suite('conref validation', () => {
        test('missing conref target file produces warning', async () => {
            const text = '<p conref="missing.dita#t1/p1">fallback</p>';
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const testUri = `file:///${tmpDir.replace(/\\/g, '/')}/source.dita`;

            try {
                const diags = await validateCrossReferences(text, testUri, undefined, 100);
                const missing = diags.filter(d => d.code === XREF_CODES.MISSING_FILE);
                assert.strictEqual(missing.length, 1);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('same-file conref with missing topic ID produces warning', async () => {
            const text = '<topic id="t1"><body><p conref="#nonexist/p1">fallback</p></body></topic>';
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const testUri = `file:///${tmpDir.replace(/\\/g, '/')}/source.dita`;

            try {
                const diags = await validateCrossReferences(text, testUri, undefined, 100);
                const missing = diags.filter(d => d.code === XREF_CODES.MISSING_TOPIC_ID);
                assert.strictEqual(missing.length, 1);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });
    });

    suite('keyref validation', () => {
        test('undefined key produces warning', async () => {
            const keys = new Map<string, KeyDefinition>();
            const keySpaceService = createMockKeySpaceService(keys);

            const text = '<keyword keyref="undefined-key">fallback</keyword>';
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const testUri = `file:///${tmpDir.replace(/\\/g, '/')}/source.dita`;

            try {
                const diags = await validateCrossReferences(text, testUri, keySpaceService, 100);
                const undef = diags.filter(d => d.code === XREF_CODES.UNDEFINED_KEY);
                assert.strictEqual(undef.length, 1);
                assert.ok(undef[0].message.includes('undefined-key'));
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('defined key produces no warning', async () => {
            const keys = new Map<string, KeyDefinition>([
                ['product', {
                    keyName: 'product',
                    sourceMap: '/maps/root.ditamap',
                    inlineContent: 'Acme Product',
                }],
            ]);
            const keySpaceService = createMockKeySpaceService(keys);

            const text = '<keyword keyref="product">fallback</keyword>';
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const testUri = `file:///${tmpDir.replace(/\\/g, '/')}/source.dita`;

            try {
                const diags = await validateCrossReferences(text, testUri, keySpaceService, 100);
                const undef = diags.filter(d => d.code === XREF_CODES.UNDEFINED_KEY);
                assert.strictEqual(undef.length, 0);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('key with no target or content produces warning', async () => {
            const keys = new Map<string, KeyDefinition>([
                ['empty-key', {
                    keyName: 'empty-key',
                    sourceMap: '/maps/root.ditamap',
                    // No targetFile, no inlineContent
                }],
            ]);
            const keySpaceService = createMockKeySpaceService(keys);

            const text = '<xref keyref="empty-key">link</xref>';
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const testUri = `file:///${tmpDir.replace(/\\/g, '/')}/source.dita`;

            try {
                const diags = await validateCrossReferences(text, testUri, keySpaceService, 100);
                const noTarget = diags.filter(d => d.code === XREF_CODES.KEY_NO_TARGET);
                assert.strictEqual(noTarget.length, 1);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('without keySpaceService, keyref is not validated', async () => {
            const text = '<keyword keyref="any-key">fallback</keyword>';
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const testUri = `file:///${tmpDir.replace(/\\/g, '/')}/source.dita`;

            try {
                const diags = await validateCrossReferences(text, testUri, undefined, 100);
                const keyDiags = diags.filter(d =>
                    d.code === XREF_CODES.UNDEFINED_KEY ||
                    d.code === XREF_CODES.KEY_NO_TARGET ||
                    d.code === XREF_CODES.KEY_MISSING_ELEMENT
                );
                assert.strictEqual(keyDiags.length, 0);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });
    });

    suite('conkeyref validation', () => {
        test('conkeyref with missing element ID in target produces warning', async () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const targetFile = path.join(tmpDir, 'snippet.dita');
            fs.writeFileSync(targetFile, '<topic id="t1"><body><p id="p1">text</p></body></topic>');

            const keys = new Map<string, KeyDefinition>([
                ['snippet', {
                    keyName: 'snippet',
                    sourceMap: '/maps/root.ditamap',
                    targetFile,
                }],
            ]);
            const keySpaceService = createMockKeySpaceService(keys);

            try {
                const text = '<p conkeyref="snippet/nonexistent">fallback</p>';
                const testUri = `file:///${tmpDir.replace(/\\/g, '/')}/source.dita`;
                const diags = await validateCrossReferences(text, testUri, keySpaceService, 100);
                const missing = diags.filter(d => d.code === XREF_CODES.KEY_MISSING_ELEMENT);
                assert.strictEqual(missing.length, 1);
                assert.ok(missing[0].message.includes('nonexistent'));
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('conkeyref with valid element ID produces no warning', async () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const targetFile = path.join(tmpDir, 'snippet.dita');
            fs.writeFileSync(targetFile, '<topic id="t1"><body><p id="intro">text</p></body></topic>');

            const keys = new Map<string, KeyDefinition>([
                ['snippet', {
                    keyName: 'snippet',
                    sourceMap: '/maps/root.ditamap',
                    targetFile,
                }],
            ]);
            const keySpaceService = createMockKeySpaceService(keys);

            try {
                const text = '<p conkeyref="snippet/intro">fallback</p>';
                const testUri = `file:///${tmpDir.replace(/\\/g, '/')}/source.dita`;
                const diags = await validateCrossReferences(text, testUri, keySpaceService, 100);
                const missing = diags.filter(d => d.code === XREF_CODES.KEY_MISSING_ELEMENT);
                assert.strictEqual(missing.length, 0);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });
    });

    suite('edge cases', () => {
        test('references inside comments are ignored', async () => {
            const text = '<!-- <xref href="nonexistent.dita">link</xref> -->';
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const testUri = `file:///${tmpDir.replace(/\\/g, '/')}/source.dita`;

            try {
                const diags = await validateCrossReferences(text, testUri, undefined, 100);
                assert.strictEqual(diags.length, 0);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('maxProblems caps results', async () => {
            const lines = Array.from({ length: 10 }, (_, i) =>
                `<xref href="missing${i}.dita">link</xref>`
            ).join('\n');
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const testUri = `file:///${tmpDir.replace(/\\/g, '/')}/source.dita`;

            try {
                const diags = await validateCrossReferences(lines, testUri, undefined, 3);
                assert.ok(diags.length <= 3, `Expected <= 3, got ${diags.length}`);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('multiple href errors in one document', async () => {
            const text =
                '<xref href="missing1.dita">one</xref>\n' +
                '<xref href="missing2.dita">two</xref>';
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const testUri = `file:///${tmpDir.replace(/\\/g, '/')}/source.dita`;

            try {
                const diags = await validateCrossReferences(text, testUri, undefined, 100);
                const missing = diags.filter(d => d.code === XREF_CODES.MISSING_FILE);
                assert.strictEqual(missing.length, 2);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });
    });
});
