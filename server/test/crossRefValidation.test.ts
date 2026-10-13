import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { URI } from 'vscode-uri';
import { validateCrossReferences, XREF_CODES } from '../src/features/crossRefValidation';
import { KeySpaceService, KeyDefinition } from '../src/services/keySpaceService';

function createMockKeySpaceService(
    keys: Map<string, KeyDefinition>,
    duplicateKeys?: Map<string, KeyDefinition[]>,
    workspaceFolders: readonly string[] = []
): KeySpaceService {
    return {
        getAllKeys: async () => keys,
        resolveKey: async (keyName: string) => keys.get(keyName) ?? null,
        getDuplicateKeys: async () => duplicateKeys ?? new Map(),
        getWorkspaceFolders: () => workspaceFolders,
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

        test('ditaot profile reports missing target file as error', async () => {
            const text = '<xref href="nonexistent.dita">link</xref>';
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const testUri = URI.file(path.join(tmpDir, 'source.dita')).toString();

            try {
                const diags = await validateCrossReferences(
                    text,
                    testUri,
                    undefined,
                    100,
                    { comparisonProfile: 'ditaot' }
                );
                const missing = diags.filter(d => d.code === XREF_CODES.MISSING_FILE);
                assert.strictEqual(missing.length, 1);
                assert.strictEqual(missing[0].severity, 1);
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

        test('href escaping the workspace is treated as missing, not read', async () => {
            // workspaceRoot/docs/source.dita references "../../secret.dita", which
            // escapes workspaceRoot entirely into a sibling directory. The file
            // genuinely exists on disk, so without a workspace-boundary guard the
            // validator would happily fs.access/read it. It must be reported as
            // missing instead, and never actually read.
            const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-ws-'));
            const docsDir = path.join(workspaceRoot, 'docs');
            fs.mkdirSync(docsDir);
            const secretFile = path.join(os.tmpdir(), 'secret.dita');
            fs.writeFileSync(secretFile, '<topic id="s"><title>Secret</title></topic>');

            try {
                const text = '<xref href="../../secret.dita">link</xref>';
                const testUri = URI.file(path.join(docsDir, 'source.dita')).toString();
                const keySpaceService = createMockKeySpaceService(new Map(), undefined, [workspaceRoot]);

                const diags = await validateCrossReferences(text, testUri, keySpaceService, 100);
                const missing = diags.filter(d => d.code === XREF_CODES.MISSING_FILE);
                assert.strictEqual(missing.length, 1, 'href escaping the workspace should be reported as missing');
            } finally {
                fs.rmSync(workspaceRoot, { recursive: true, force: true });
                fs.rmSync(secretFile, { force: true });
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

        test('ditaot profile ignores scope external warning for XML-format resources', async () => {
            const text = '<topicref href="ditavals/flagging.ditaval" format="xml" scope="external"/>';
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const testUri = URI.file(path.join(tmpDir, 'source.ditamap')).toString();

            try {
                const diags = await validateCrossReferences(
                    text,
                    testUri,
                    undefined,
                    100,
                    { comparisonProfile: 'ditaot' }
                );
                const scopeWarns = diags.filter(d => d.code === XREF_CODES.SCOPE_EXTERNAL_RELATIVE);
                assert.strictEqual(scopeWarns.length, 0);
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

        test('ditaot profile ignores undefined key warnings in maps', async () => {
            const keys = new Map<string, KeyDefinition>();
            const keySpaceService = createMockKeySpaceService(keys);

            const text = '<map><topicref keyref="undefined-key"/></map>';
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const testUri = URI.file(path.join(tmpDir, 'source.ditamap')).toString();

            try {
                const diags = await validateCrossReferences(
                    text,
                    testUri,
                    keySpaceService,
                    100,
                    { comparisonProfile: 'ditaot' }
                );
                const undef = diags.filter(d => d.code === XREF_CODES.UNDEFINED_KEY);
                assert.strictEqual(undef.length, 0);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('ditaot profile emits topicset type compatibility warnings for topicsetref keyrefs', async () => {
            const keys = new Map<string, KeyDefinition>();
            const keySpaceService = createMockKeySpaceService(keys);
            const text = '<map><topicsetref keyref="br01.branch-01" format="ditamap"/></map>';
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const testUri = URI.file(path.join(tmpDir, 'source.ditamap')).toString();

            try {
                const diags = await validateCrossReferences(
                    text,
                    testUri,
                    keySpaceService,
                    100,
                    { comparisonProfile: 'ditaot' }
                );
                const topicsetTopicref = diags.filter(d => d.code === XREF_CODES.TOPICSET_TYPE_TOPICREF_MISMATCH);
                const topicsetLink = diags.filter(d => d.code === XREF_CODES.TOPICSET_TYPE_LINK_MISMATCH);
                assert.strictEqual(topicsetTopicref.length, 1);
                assert.strictEqual(topicsetLink.length, 1);
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

        test('references written as examples in the text are not validated (regression)', async () => {
            // The user guide documents keys and links with examples such as
            // <codeph>keyref="key"</codeph>: text, not attributes.
            const keySpaceService = createMockKeySpaceService(new Map());
            const text = `<topic id="t"><body>
<p>Write <codeph>keyref="my-key"</codeph> or <codeph>conkeyref="my-key/element"</codeph>.</p>
<p>An empty link (<codeph>&lt;xref href="missing.dita"/&gt;</codeph>) shows its target's title: href="#topic/element".</p>
<p><xref keyref="undefined-key"/> <xref href="missing.dita" outputclass="a>b"/></p>
</body></topic>`;
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const testUri = URI.file(path.join(tmpDir, 'source.dita')).toString();

            try {
                const diags = await validateCrossReferences(text, testUri, keySpaceService, 100);
                assert.deepStrictEqual(
                    diags.map(d => `${d.code} ${d.range.start.line}`),
                    [`${XREF_CODES.MISSING_FILE} 3`, `${XREF_CODES.UNDEFINED_KEY} 3`],
                    'only the attributes of line 3 are references'
                );
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('a same-topic reference (#./element) checks the element only (regression)', async () => {
            // DITA 1.3: "." is the topic the reference is in (DITA-OT's docs:
            // <xref href="#./copy-strings"/>).
            const text = `<task id="adding-strings"><taskbody><steps>
<step id="copy-strings"><cmd>See <xref href="#./copy-strings"/> and <xref href="#./missing-step"/>.</cmd></step>
</steps></taskbody></task>`;
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const testUri = URI.file(path.join(tmpDir, 'source.dita')).toString();

            try {
                const diags = await validateCrossReferences(text, testUri, undefined, 100);
                assert.deepStrictEqual(diags.map(d => d.code), [XREF_CODES.MISSING_ELEMENT_ID]);
                assert.ok(diags[0].message.includes('missing-step'));
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('key whose target is a web address produces no warning (regression)', async () => {
            // DITA-OT's docs define license keys as external links
            // (href="https://…" scope="external"); they have a target.
            const keys = new Map<string, KeyDefinition>([
                ['license-apache-2', {
                    keyName: 'license-apache-2',
                    sourceMap: '/maps/external-links.ditamap',
                    externalHref: 'https://www.apache.org/licenses/LICENSE-2.0',
                    scope: 'external',
                }],
            ]);
            const keySpaceService = createMockKeySpaceService(keys);

            const text = '<xref keyref="license-apache-2"/>';
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const testUri = URI.file(path.join(tmpDir, 'source.dita')).toString();

            try {
                const diags = await validateCrossReferences(text, testUri, keySpaceService, 100);
                assert.deepStrictEqual(diags.map(d => d.code), []);
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

    suite('map key and fragment alignment', () => {
        test('DITA-KEY-005: invalid map key name produces error', async () => {
            const text = '<map><keydef keys="left-square-bracket-[bracket ????-???? 寺田寅彦-空想日録 valid-key"/></map>';
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const mapFile = path.join(tmpDir, 'test.ditamap');
            fs.writeFileSync(mapFile, text);
            const testUri = URI.file(mapFile).toString();

            try {
                const diags = await validateCrossReferences(text, testUri, undefined, 100);
                const invalid = diags.filter(d => d.code === XREF_CODES.INVALID_KEY_NAME);
                assert.strictEqual(invalid.length, 3);
                assert.ok(invalid.every(d => d.severity === 1), 'invalid key names should be errors');
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('topicsetref fragment to map element id does not raise missing topic warning', async () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const mapA = path.join(tmpDir, 'map-a.ditamap');
            const mapB = path.join(tmpDir, 'map-b.ditamap');

            fs.writeFileSync(mapB, '<map><topicset id="topicset-map-b-01"><topicref href="topic.dita"/></topicset></map>');
            fs.writeFileSync(mapA, '<map><topicsetref href="map-b.ditamap#topicset-map-b-01"/></map>');

            const textA = fs.readFileSync(mapA, 'utf-8');
            const uriA = URI.file(mapA).toString();

            try {
                const diags = await validateCrossReferences(textA, uriA, undefined, 100);
                const missingTopic = diags.filter(d => d.code === XREF_CODES.MISSING_TOPIC_ID);
                assert.strictEqual(missingTopic.length, 0);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('DITA-SCOPE-004: topicsetref to map outside input directory warns', async () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const mapADir = path.join(tmpDir, 'map-A');
            const mapBDir = path.join(tmpDir, 'map-B');
            fs.mkdirSync(mapADir);
            fs.mkdirSync(mapBDir);

            const mapA = path.join(mapADir, 'map-a.ditamap');
            const mapB = path.join(mapBDir, 'map-b.ditamap');

            fs.writeFileSync(mapB, '<map><topicset id="topicset-map-b-01"/></map>');
            fs.writeFileSync(mapA, '<map><topicsetref href="../map-B/map-b.ditamap#topicset-map-b-01"/></map>');

            const textA = fs.readFileSync(mapA, 'utf-8');
            const uriA = URI.file(mapA).toString();

            try {
                const diags = await validateCrossReferences(textA, uriA, undefined, 100);
                const outside = diags.filter(d => d.code === XREF_CODES.SCOPE_OUTSIDE_INPUT_DIR);
                assert.strictEqual(outside.length, 1);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('topicref outside directory does not trigger DITA-SCOPE-004', async () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const mapADir = path.join(tmpDir, 'map-A');
            const mapBDir = path.join(tmpDir, 'map-B');
            fs.mkdirSync(mapADir);
            fs.mkdirSync(mapBDir);

            const mapA = path.join(mapADir, 'map-a.ditamap');
            const mapB = path.join(mapBDir, 'map-b.ditamap');

            fs.writeFileSync(mapB, '<map><title>B</title></map>');
            fs.writeFileSync(mapA, '<map><topicref href="../map-B/map-b.ditamap"/></map>');

            const textA = fs.readFileSync(mapA, 'utf-8');
            const uriA = URI.file(mapA).toString();

            try {
                const diags = await validateCrossReferences(textA, uriA, undefined, 100);
                const outside = diags.filter(d => d.code === XREF_CODES.SCOPE_OUTSIDE_INPUT_DIR);
                assert.strictEqual(outside.length, 0);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('ditaot profile: mapref outside input directory emits nested outside warnings', async () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const parentDir = path.join(tmpDir, 'parent');
            const childDir = path.join(tmpDir, 'child');
            fs.mkdirSync(parentDir);
            fs.mkdirSync(childDir);

            const rootMap = path.join(parentDir, 'root.ditamap');
            const childMap = path.join(childDir, 'child.ditamap');
            fs.writeFileSync(
                childMap,
                '<map><topicref href="a.dita"/><topicref href="../parent/local.dita"/><topicref href="nested/b.dita"/></map>'
            );
            fs.writeFileSync(rootMap, '<map><mapref href="../child/child.ditamap"/></map>');

            const rootText = fs.readFileSync(rootMap, 'utf-8');
            const rootUri = URI.file(rootMap).toString();

            try {
                const diags = await validateCrossReferences(
                    rootText,
                    rootUri,
                    undefined,
                    100,
                    { comparisonProfile: 'ditaot' }
                );
                const outside = diags.filter(d => d.code === XREF_CODES.SCOPE_OUTSIDE_INPUT_DIR);
                assert.strictEqual(outside.length, 2);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('ditaot profile: peer-scope mapref does not emit nested outside warnings', async () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const parentDir = path.join(tmpDir, 'parent');
            const childDir = path.join(tmpDir, 'child');
            fs.mkdirSync(parentDir);
            fs.mkdirSync(childDir);

            const rootMap = path.join(parentDir, 'root.ditamap');
            const childMap = path.join(childDir, 'child.ditamap');
            fs.writeFileSync(childMap, '<map><topicref href="a.dita"/><topicref href="nested/b.dita"/></map>');
            fs.writeFileSync(rootMap, '<map><mapref href="../child/child.ditamap" scope="peer"/></map>');

            const rootText = fs.readFileSync(rootMap, 'utf-8');
            const rootUri = URI.file(rootMap).toString();

            try {
                const diags = await validateCrossReferences(
                    rootText,
                    rootUri,
                    undefined,
                    100,
                    { comparisonProfile: 'ditaot' }
                );
                const outside = diags.filter(d => d.code === XREF_CODES.SCOPE_OUTSIDE_INPUT_DIR);
                assert.strictEqual(outside.length, 0);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('ditaot profile: missing mapref target map is ignored', async () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const rootMap = path.join(tmpDir, 'root.ditamap');
            fs.writeFileSync(rootMap, '<map><mapref href="missing-submap.ditamap"/></map>');
            const rootText = fs.readFileSync(rootMap, 'utf-8');
            const rootUri = URI.file(rootMap).toString();

            try {
                const diags = await validateCrossReferences(
                    rootText,
                    rootUri,
                    undefined,
                    100,
                    { comparisonProfile: 'ditaot' }
                );
                const missing = diags.filter(d => d.code === XREF_CODES.MISSING_FILE);
                assert.strictEqual(missing.length, 0);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('mapref surfaces invalid key names from referenced map', async () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const rootMap = path.join(tmpDir, 'root.ditamap');
            const childMap = path.join(tmpDir, 'child.ditamap');

            fs.writeFileSync(childMap, '<map><keydef keys="left-square-bracket-[bracket 寺田寅彦-空想日録"/></map>');
            fs.writeFileSync(rootMap, '<map><mapref href="child.ditamap"/></map>');

            const rootText = fs.readFileSync(rootMap, 'utf-8');
            const rootUri = URI.file(rootMap).toString();

            try {
                const diags = await validateCrossReferences(rootText, rootUri, undefined, 100);
                const invalid = diags.filter(d => d.code === XREF_CODES.INVALID_KEY_NAME);
                assert.strictEqual(invalid.length, 2);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('ditaot profile: chunked glossary map emits build-time navtitle/linktext warnings', async () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const rootMap = path.join(tmpDir, 'root.ditamap');
            const resourceMap = path.join(tmpDir, 'resource.ditamap');
            const navMap = path.join(tmpDir, 'navigation-topicheads.ditamap');
            fs.writeFileSync(
                resourceMap,
                '<map>'
                + '<keydef keys="k1" href="a.dita"><topicmeta><navtitle>A</navtitle></topicmeta></keydef>'
                + '<keydef keys="k2" href="b.dita"><topicmeta><navtitle>B</navtitle></topicmeta></keydef>'
                + '<keydef keys="k3" href="c.dita"></keydef>'
                + '</map>'
            );
            fs.writeFileSync(navMap, '<map><topicref keyref="k1"/></map>');
            fs.writeFileSync(
                rootMap,
                '<map><topichead chunk="to-content"><mapref href="navigation-topicheads.ditamap"/></topichead>'
                + '<mapref href="resource.ditamap"/></map>'
            );

            const rootText = fs.readFileSync(rootMap, 'utf-8');
            const rootUri = URI.file(rootMap).toString();

            try {
                const diags = await validateCrossReferences(
                    rootText,
                    rootUri,
                    undefined,
                    100,
                    { comparisonProfile: 'ditaot' }
                );
                const navtitle = diags.filter(d => d.code === XREF_CODES.CHUNK_NAVTITLE_RETRIEVAL);
                const fallback = diags.filter(d => d.code === XREF_CODES.CHUNK_LINKTEXT_FALLBACK);
                const missing = diags.filter(d => d.code === XREF_CODES.CHUNK_LINKTEXT_MISSING);
                assert.strictEqual(navtitle.length, 3);
                assert.strictEqual(fallback.length, 2);
                assert.strictEqual(missing.length, 1);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('ditaot profile: copy-to normalization collision emits one error', async () => {
            const text = '<map>'
                + '<topicref href="topic.dita" copy-to="topic_a_use-02.dita"/>'
                + '<topicref href="topic.dita" copy-to="topic_a-use-02.dita"/>'
                + '</map>';
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const mapUri = URI.file(path.join(tmpDir, 'source.ditamap')).toString();

            try {
                const diags = await validateCrossReferences(
                    text,
                    mapUri,
                    undefined,
                    100,
                    { comparisonProfile: 'ditaot' }
                );
                const collisions = diags.filter(d => d.code === XREF_CODES.COPY_TO_COLLISION);
                assert.strictEqual(collisions.length, 1);
                assert.strictEqual(collisions[0].severity, 1);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('ditaot profile: nested title-only topicref navigation map emits one build-time error', async () => {
            const text = '<map><topicref href="title-only-topics/glossary-title.dita">'
                + '<mapref href="wipo-glossentries-navigation-topicrefs.ditamap"/>'
                + '</topicref></map>';
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const mapUri = URI.file(path.join(tmpDir, 'source.ditamap')).toString();

            try {
                const diags = await validateCrossReferences(
                    text,
                    mapUri,
                    undefined,
                    100,
                    { comparisonProfile: 'ditaot' }
                );
                const buildErrors = diags.filter(d => d.code === XREF_CODES.COPY_TO_COLLISION);
                assert.strictEqual(buildErrors.length, 1);
                assert.strictEqual(buildErrors[0].severity, 1);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });
    });
});
