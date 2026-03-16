import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { URI } from 'vscode-uri';
import { validateCrossReferences, XREF_CODES } from '../src/features/crossRefValidation';
import { KeySpaceService, KeyDefinition } from '../src/services/keySpaceService';

function createMockKeySpaceService(
    keys: Map<string, KeyDefinition>,
    duplicateKeys?: Map<string, KeyDefinition[]>
): KeySpaceService {
    return {
        getAllKeys: async () => keys,
        resolveKey: async (keyName: string) => keys.get(keyName) ?? null,
        getDuplicateKeys: async () => duplicateKeys ?? new Map(),
        getWorkspaceFolders: () => [],
        buildKeySpace: async () => ({
            rootMap: '',
            keys,
            buildTime: Date.now(),
            mapHierarchy: [],
            subjectSchemePaths: [],
            duplicateKeys: duplicateKeys ?? new Map(),
        }),
        getSubjectSchemePaths: async () => [],
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
            const testUri = URI.file(path.join(tmpDir, 'source.dita')).toString();

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
                const testUri = URI.file(path.join(tmpDir, 'source.dita')).toString();
                const diags = await validateCrossReferences(text, testUri, undefined, 100);
                const missing = diags.filter(d => d.code === XREF_CODES.MISSING_FILE);
                assert.strictEqual(missing.length, 0);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('external URL without scope produces info suggestion', async () => {
            const text = '<xref href="https://example.com">link</xref>';
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const testUri = URI.file(path.join(tmpDir, 'source.dita')).toString();

            try {
                const diags = await validateCrossReferences(text, testUri, undefined, 100);
                const scopeInfo = diags.filter(d => d.code === XREF_CODES.SCOPE_MISSING_ON_URL);
                assert.strictEqual(scopeInfo.length, 1);
                // No file-level errors (URL is not checked as local file)
                const fileErrors = diags.filter(d => d.code === XREF_CODES.MISSING_FILE);
                assert.strictEqual(fileErrors.length, 0);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('external URL with scope="external" is skipped', async () => {
            const text = '<xref href="https://example.com" scope="external">link</xref>';
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const testUri = URI.file(path.join(tmpDir, 'source.dita')).toString();

            try {
                const diags = await validateCrossReferences(text, testUri, undefined, 100);
                assert.strictEqual(diags.length, 0);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('scope="external" with relative href produces warning', async () => {
            const text = '<xref href="some-path" scope="external">link</xref>';
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const testUri = URI.file(path.join(tmpDir, 'source.dita')).toString();

            try {
                const diags = await validateCrossReferences(text, testUri, undefined, 100);
                const scopeWarns = diags.filter(d => d.code === XREF_CODES.SCOPE_EXTERNAL_RELATIVE);
                assert.strictEqual(scopeWarns.length, 1);
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
                const testUri = URI.file(path.join(tmpDir, 'source.dita')).toString();
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
                const testUri = URI.file(path.join(tmpDir, 'source.dita')).toString();
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
                const testUri = URI.file(path.join(tmpDir, 'source.dita')).toString();
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
                const testUri = URI.file(path.join(tmpDir, 'source.dita')).toString();
                const diags = await validateCrossReferences(text, testUri, undefined, 100);
                assert.strictEqual(diags.length, 0);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });
        test('scope="local" with absolute URL produces warning', async () => {
            const text = '<xref href="https://example.com" scope="local">link</xref>';
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const testUri = URI.file(path.join(tmpDir, 'source.dita')).toString();

            try {
                const diags = await validateCrossReferences(text, testUri, undefined, 100);
                const scopeWarns = diags.filter(d => d.code === XREF_CODES.SCOPE_LOCAL_ABSOLUTE);
                assert.strictEqual(scopeWarns.length, 1);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });
    });

    suite('conref validation', () => {
        test('missing conref target file produces warning', async () => {
            const text = '<p conref="missing.dita#t1/p1">fallback</p>';
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const testUri = URI.file(path.join(tmpDir, 'source.dita')).toString();

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
            const testUri = URI.file(path.join(tmpDir, 'source.dita')).toString();

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
            const testUri = URI.file(path.join(tmpDir, 'source.dita')).toString();

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
            const testUri = URI.file(path.join(tmpDir, 'source.dita')).toString();

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
            const testUri = URI.file(path.join(tmpDir, 'source.dita')).toString();

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
            const testUri = URI.file(path.join(tmpDir, 'source.dita')).toString();

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

    suite('conref compatibility', () => {
        test('same element type produces no error', async () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const targetFile = path.join(tmpDir, 'target.dita');
            fs.writeFileSync(targetFile, '<topic id="t1"><body><p id="p1">reusable text</p></body></topic>');

            try {
                const text = '<topic id="src"><body><p conref="target.dita#t1/p1">fallback</p></body></topic>';
                const testUri = URI.file(path.join(tmpDir, 'source.dita')).toString();
                const diags = await validateCrossReferences(text, testUri, undefined, 100);
                const compat = diags.filter(d => d.code === XREF_CODES.INCOMPATIBLE_CONREF);
                assert.strictEqual(compat.length, 0);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('incompatible element types produces error', async () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const targetFile = path.join(tmpDir, 'target.dita');
            fs.writeFileSync(targetFile, '<topic id="t1"><body><note id="n1">a note</note></body></topic>');

            try {
                // <p> conref pointing to a <note> target — incompatible
                const text = '<topic id="src"><body><p conref="target.dita#t1/n1">fallback</p></body></topic>';
                const testUri = URI.file(path.join(tmpDir, 'source.dita')).toString();
                const diags = await validateCrossReferences(text, testUri, undefined, 100);
                const compat = diags.filter(d => d.code === XREF_CODES.INCOMPATIBLE_CONREF);
                assert.strictEqual(compat.length, 1);
                assert.ok(compat[0].message.includes('<p>'));
                assert.ok(compat[0].message.includes('<note>'));
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('body and conbody are compatible (same specialization group)', async () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const targetFile = path.join(tmpDir, 'target.dita');
            fs.writeFileSync(targetFile, '<concept id="c1"><title>C</title><conbody id="cb1"><p>text</p></conbody></concept>');

            try {
                const text = '<topic id="src"><title>T</title><body conref="target.dita#c1/cb1">fallback</body></topic>';
                const testUri = URI.file(path.join(tmpDir, 'source.dita')).toString();
                const diags = await validateCrossReferences(text, testUri, undefined, 100);
                const compat = diags.filter(d => d.code === XREF_CODES.INCOMPATIBLE_CONREF);
                assert.strictEqual(compat.length, 0, 'body and conbody should be compatible');
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('same-file conref compatibility check works', async () => {
            // <note> conref pointing to a <p> in the same file
            const text = '<topic id="t1"><body><p id="p1">text</p><note conref="#t1/p1">fallback</note></body></topic>';
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const testUri = URI.file(path.join(tmpDir, 'source.dita')).toString();

            try {
                const diags = await validateCrossReferences(text, testUri, undefined, 100);
                const compat = diags.filter(d => d.code === XREF_CODES.INCOMPATIBLE_CONREF);
                assert.strictEqual(compat.length, 1, 'note and p are not compatible');
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('href does not trigger compatibility check', async () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const targetFile = path.join(tmpDir, 'target.dita');
            fs.writeFileSync(targetFile, '<topic id="t1"><body><note id="n1">a note</note></body></topic>');

            try {
                // href (not conref) pointing to a different element type — should NOT produce compatibility error
                const text = '<topic id="src"><body><p><xref href="target.dita#t1/n1">link</xref></p></body></topic>';
                const testUri = URI.file(path.join(tmpDir, 'source.dita')).toString();
                const diags = await validateCrossReferences(text, testUri, undefined, 100);
                const compat = diags.filter(d => d.code === XREF_CODES.INCOMPATIBLE_CONREF);
                assert.strictEqual(compat.length, 0, 'href should not trigger compatibility check');
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
                const testUri = URI.file(path.join(tmpDir, 'source.dita')).toString();
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
                const testUri = URI.file(path.join(tmpDir, 'source.dita')).toString();
                const diags = await validateCrossReferences(text, testUri, keySpaceService, 100);
                const missing = diags.filter(d => d.code === XREF_CODES.KEY_MISSING_ELEMENT);
                assert.strictEqual(missing.length, 0);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('conkeyref with incompatible element types produces error', async () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const targetFile = path.join(tmpDir, 'snippet.dita');
            fs.writeFileSync(targetFile, '<topic id="t1"><body><note id="n1">a note</note></body></topic>');

            const keys = new Map<string, KeyDefinition>([
                ['snippet', {
                    keyName: 'snippet',
                    sourceMap: '/maps/root.ditamap',
                    targetFile,
                }],
            ]);
            const keySpaceService = createMockKeySpaceService(keys);

            try {
                // <p> conkeyref pointing to a <note> — incompatible
                const text = '<p conkeyref="snippet/n1">fallback</p>';
                const testUri = URI.file(path.join(tmpDir, 'source.dita')).toString();
                const diags = await validateCrossReferences(text, testUri, keySpaceService, 100);
                const compat = diags.filter(d => d.code === XREF_CODES.INCOMPATIBLE_CONREF);
                assert.strictEqual(compat.length, 1);
                assert.ok(compat[0].message.includes('<p>'));
                assert.ok(compat[0].message.includes('<note>'));
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('conkeyref with compatible element types produces no error', async () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const targetFile = path.join(tmpDir, 'snippet.dita');
            fs.writeFileSync(targetFile, '<topic id="t1"><body><p id="p1">reusable</p></body></topic>');

            const keys = new Map<string, KeyDefinition>([
                ['snippet', {
                    keyName: 'snippet',
                    sourceMap: '/maps/root.ditamap',
                    targetFile,
                }],
            ]);
            const keySpaceService = createMockKeySpaceService(keys);

            try {
                const text = '<p conkeyref="snippet/p1">fallback</p>';
                const testUri = URI.file(path.join(tmpDir, 'source.dita')).toString();
                const diags = await validateCrossReferences(text, testUri, keySpaceService, 100);
                const compat = diags.filter(d => d.code === XREF_CODES.INCOMPATIBLE_CONREF);
                assert.strictEqual(compat.length, 0);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });
    });

    suite('edge cases', () => {
        test('references inside comments are ignored', async () => {
            const text = '<!-- <xref href="nonexistent.dita">link</xref> -->';
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const testUri = URI.file(path.join(tmpDir, 'source.dita')).toString();

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
            const testUri = URI.file(path.join(tmpDir, 'source.dita')).toString();

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
            const testUri = URI.file(path.join(tmpDir, 'source.dita')).toString();

            try {
                const diags = await validateCrossReferences(text, testUri, undefined, 100);
                const missing = diags.filter(d => d.code === XREF_CODES.MISSING_FILE);
                assert.strictEqual(missing.length, 2);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });
    });

    suite('Duplicate key definitions', () => {
        test('DITA-KEY-004: warns when map defines key already in another map', async () => {
            const keys = new Map<string, KeyDefinition>();
            keys.set('product-name', {
                keyName: 'product-name',
                targetFile: '/docs/product.dita',
                sourceMap: '/docs/root.ditamap',
            });
            const dups = new Map<string, KeyDefinition[]>();
            dups.set('product-name', [
                { keyName: 'product-name', targetFile: '/docs/product.dita', sourceMap: '/docs/root.ditamap' },
                { keyName: 'product-name', targetFile: '/docs/other.dita', sourceMap: '/docs/sub.ditamap' },
            ]);
            const keyService = createMockKeySpaceService(keys, dups);

            // Simulate validating sub.ditamap which has the duplicate keydef
            const text = '<map><keydef keys="product-name" href="other.dita"/></map>';
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const mapFile = path.join(tmpDir, 'sub.ditamap');
            fs.writeFileSync(mapFile, text);
            const testUri = URI.file(mapFile).toString();

            try {
                const diags = await validateCrossReferences(text, testUri, keyService, 100);
                const dupDiags = diags.filter(d => d.code === XREF_CODES.DUPLICATE_KEY);
                assert.strictEqual(dupDiags.length, 1);
                assert.ok(dupDiags[0].message.includes('product-name'));
                assert.ok(dupDiags[0].message.includes('root.ditamap'));
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('DITA-KEY-004: no warning on the effective (first) definition', async () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const mapFile = path.join(tmpDir, 'root.ditamap');

            const keys = new Map<string, KeyDefinition>();
            keys.set('mykey', {
                keyName: 'mykey',
                targetFile: path.join(tmpDir, 'target.dita'),
                sourceMap: mapFile,
            });
            const dups = new Map<string, KeyDefinition[]>();
            dups.set('mykey', [
                { keyName: 'mykey', targetFile: path.join(tmpDir, 'target.dita'), sourceMap: mapFile },
                { keyName: 'mykey', targetFile: path.join(tmpDir, 'other.dita'), sourceMap: path.join(tmpDir, 'other.ditamap') },
            ]);
            const keyService = createMockKeySpaceService(keys, dups);

            // Validate root.ditamap (has the effective definition)
            const text = '<map><keydef keys="mykey" href="target.dita"/></map>';
            fs.writeFileSync(mapFile, text);
            const testUri = URI.file(mapFile).toString();

            try {
                const diags = await validateCrossReferences(text, testUri, keyService, 100);
                const dupDiags = diags.filter(d => d.code === XREF_CODES.DUPLICATE_KEY);
                assert.strictEqual(dupDiags.length, 0);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('no duplicate key check on .dita files', async () => {
            const keys = new Map<string, KeyDefinition>();
            const dups = new Map<string, KeyDefinition[]>();
            dups.set('mykey', [
                { keyName: 'mykey', sourceMap: '/docs/root.ditamap' },
                { keyName: 'mykey', sourceMap: '/docs/other.ditamap' },
            ]);
            const keyService = createMockKeySpaceService(keys, dups);

            const text = '<topic id="t1"><title>T</title></topic>';
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const topicFile = path.join(tmpDir, 'test.dita');
            fs.writeFileSync(topicFile, text);
            const testUri = URI.file(topicFile).toString();

            try {
                const diags = await validateCrossReferences(text, testUri, keyService, 100);
                const dupDiags = diags.filter(d => d.code === XREF_CODES.DUPLICATE_KEY);
                assert.strictEqual(dupDiags.length, 0);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });
    });
});
