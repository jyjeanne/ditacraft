import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { URI } from 'vscode-uri';
import { validateCrossReferences, XREF_CODES } from '../src/features/crossRefValidation';
import { KeySpaceService, KeyDefinition } from '../src/services/keySpaceService';
import { DiagnosticSeverity } from 'vscode-languageserver/node';

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
        test('missing target file is reported', async () => {
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

        test('a missing target file is an error, as in DITA-OT (DOTX008E)', async () => {
            const text = '<xref href="nonexistent.dita">link</xref><image href="missing.png"/>';
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const testUri = URI.file(path.join(tmpDir, 'source.dita')).toString();

            try {
                const diags = await validateCrossReferences(text, testUri, undefined, 100);
                const missing = diags.filter(d => d.code === XREF_CODES.MISSING_FILE);
                assert.deepStrictEqual(missing.map(d => d.severity), [DiagnosticSeverity.Error, DiagnosticSeverity.Error]);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('reuse of a missing element is an error (DOTX010E); a link to one stays a warning', async () => {
            // DITA-OT fails a @conref whose target element does not exist, but says
            // nothing about an @href to a missing element in an existing topic.
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            fs.writeFileSync(path.join(tmpDir, 'target.dita'), '<topic id="t"><title>T</title><body><p id="p1">x</p></body></topic>');
            const text = [
                '<p conref="target.dita#t/missing"/>',
                '<xref href="target.dita#t/missing"/>',
                '<p conref="target.dita#wrong/p1"/>',
                '<xref href="target.dita#wrong"/>',
            ].join('\n');
            const testUri = URI.file(path.join(tmpDir, 'source.dita')).toString();

            try {
                const diags = await validateCrossReferences(text, testUri, undefined, 100);
                const bySeverity = (code: string) => diags.filter(d => d.code === code)
                    .map(d => `${d.range.start.line}:${d.severity}`);
                assert.deepStrictEqual(bySeverity(XREF_CODES.MISSING_ELEMENT_ID),
                    [`0:${DiagnosticSeverity.Error}`, `1:${DiagnosticSeverity.Warning}`]);
                assert.deepStrictEqual(bySeverity(XREF_CODES.MISSING_TOPIC_ID),
                    [`2:${DiagnosticSeverity.Error}`, `3:${DiagnosticSeverity.Warning}`]);
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

        test('a ${variable} or a DITA file name is not checked as a key', async () => {
            // Neither is a key name: a variable of a template, or a file name written in
            // @keyref. They are skipped; the undefined key next to them shows the check ran.
            const keySpaceService = createMockKeySpaceService(new Map());
            const text = '<topic id="t"><title>T</title><body><p>'
                + '<ph keyref="${product}"/><xref keyref="install.dita"/><xref keyref="guide.ditamap"/>'
                + '<ph keyref="${product}/name"/><ph keyref="real-undefined"/></p></body></topic>';
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const testUri = URI.file(path.join(tmpDir, 'source.dita')).toString();

            try {
                const diags = await validateCrossReferences(text, testUri, keySpaceService, 100);
                assert.deepStrictEqual(
                    diags.filter(d => d.code === XREF_CODES.UNDEFINED_KEY).map(d => d.message),
                    ['Key "real-undefined" is not defined in any map']);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('an undefined key of a peer map names the peer map (DITA 1.3 §2.3.4.5)', async () => {
            // "Processors that resolve key references to peer maps should provide appropriate
            // messages when a reference to a peer map cannot be resolved."
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            fs.writeFileSync(path.join(tmpDir, 'root.ditamap'),
                '<map><mapref href="other-guide.ditamap" scope="peer" keyscope="ext"/><topicref href="t.dita"/></map>');
            fs.writeFileSync(path.join(tmpDir, 'other-guide.ditamap'), '<map><keydef keys="install" href="install.dita"/></map>');
            const topic = path.join(tmpDir, 't.dita');
            const text = '<topic id="t"><title>T</title><body><p>'
                + '<xref keyref="ext.install"/><xref keyref="ext.missing"/><xref keyref="missing"/></p></body></topic>';
            fs.writeFileSync(topic, text);
            const keySpaceService = new KeySpaceService(
                [tmpDir], async () => ({ keySpaceCacheTtlMinutes: 5, maxLinkMatches: 10000 }), () => {});

            try {
                const diags = await validateCrossReferences(text, URI.file(topic).toString(), keySpaceService, 100);
                assert.deepStrictEqual(diags.filter(d => d.code === XREF_CODES.UNDEFINED_KEY).map(d => d.message), [
                    'Key "ext.missing" is not defined in the peer map "other-guide.ditamap" (key scope "ext")',
                    'Key "missing" is not defined in any map',
                ]);
            } finally {
                keySpaceService.shutdown();
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
                // The key definition is valid DITA; the reference renders nothing (DITA-OT 4.3.5: no message)
                assert.ok(noTarget[0].message.includes('produces no link and no text'), noTarget[0].message);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('subject keys are exempt for keyref but not conkeyref (regression)', async () => {
            // <subjectdef keys="…"> defines a controlled value, which never has a target:
            // the <subjectdef keyref> of every <enumerationdef> was reported as DITA-KEY-002.
            const keys = new Map<string, KeyDefinition>([
                ['seasons', { keyName: 'seasons', sourceMap: '/maps/scheme.ditamap', subject: true }],
                ['empty-key', { keyName: 'empty-key', sourceMap: '/maps/root.ditamap' }],
            ]);
            const keySpaceService = createMockKeySpaceService(keys);
            const text = '<enumerationdef><attributedef name="season"/><subjectdef keyref="seasons"/></enumerationdef>'
                + '<p conkeyref="seasons/intro"/><xref keyref="empty-key"/>';
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const testUri = URI.file(path.join(tmpDir, 'scheme.ditamap')).toString();

            try {
                const diags = await validateCrossReferences(text, testUri, keySpaceService, 100);
                const noTarget = diags.filter(d => d.code === XREF_CODES.KEY_NO_TARGET);
                assert.strictEqual(noTarget.length, 2, 'the conkeyref and ordinary key without target are reported');
                assert.ok(noTarget.some(d => d.message.includes('seasons')));
                assert.ok(noTarget.some(d => d.message.includes('empty-key')));
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('ditaot profile in maps ignores key-without-target warnings', async () => {
            const keys = new Map<string, KeyDefinition>([
                ['empty-key', {
                    keyName: 'empty-key',
                    sourceMap: '/maps/root.ditamap',
                }],
            ]);
            const keySpaceService = createMockKeySpaceService(keys);
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const mapPath = path.join(tmpDir, 'source.ditamap');
            const text = '<map><topicref keyref="empty-key"/></map>';
            fs.writeFileSync(mapPath, text);
            const mapUri = URI.file(mapPath).toString();

            try {
                const diags = await validateCrossReferences(
                    text,
                    mapUri,
                    keySpaceService,
                    100,
                    { comparisonProfile: 'ditaot' }
                );
                const noTarget = diags.filter(d => d.code === XREF_CODES.KEY_NO_TARGET);
                assert.strictEqual(noTarget.length, 0);
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
        test('reuse through a key of a missing element is an error (DOTX010E); a link through a key stays a warning', async () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const targetFile = path.join(tmpDir, 'snippet.dita');
            fs.writeFileSync(targetFile, '<topic id="t1"><body><p id="p1">text</p></body></topic>');
            const keys = new Map<string, KeyDefinition>([
                ['snippet', { keyName: 'snippet', sourceMap: '/maps/root.ditamap', targetFile }],
            ]);
            const text = '<p conkeyref="snippet/missing"/>\n<xref keyref="snippet/missing"/>';
            const testUri = URI.file(path.join(tmpDir, 'source.dita')).toString();

            try {
                const diags = await validateCrossReferences(text, testUri, createMockKeySpaceService(keys), 100);
                assert.deepStrictEqual(
                    diags.filter(d => d.code === XREF_CODES.KEY_MISSING_ELEMENT).map(d => `${d.range.start.line}:${d.severity}`),
                    [`0:${DiagnosticSeverity.Error}`, `1:${DiagnosticSeverity.Warning}`]);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('conkeyref with missing element ID in target is reported', async () => {
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
            // Simulate validating sub.ditamap which has the duplicate keydef
            const text = '<map><keydef keys="product-name" href="other.dita"/></map>';
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const mapFile = path.join(tmpDir, 'sub.ditamap');
            const dups = new Map<string, KeyDefinition[]>();
            dups.set('product-name', [
                { keyName: 'product-name', targetFile: '/docs/product.dita', sourceMap: '/docs/root.ditamap' },
                { keyName: 'product-name', targetFile: '/docs/other.dita', sourceMap: mapFile },
            ]);
            const keyService = createMockKeySpaceService(keys, dups);

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

        test('DITA-KEY-004: a key defined twice in the same map is reported on the second definition (regression)', async () => {
            // DITA-OT reports DOTJ045I. Every definition in the map holding the effective one
            // used to be skipped, so a second definition in that same map was never reported.
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const mapFile = path.join(tmpDir, 'root.ditamap');
            fs.writeFileSync(path.join(tmpDir, 'a.dita'), '<topic id="a"><title>A</title></topic>');
            fs.writeFileSync(path.join(tmpDir, 'b.dita'), '<topic id="b"><title>B</title></topic>');
            const text = [
                '<map>',
                '  <topicref href="a.dita" keys="a"/>',
                '  <topicref href="b.dita" keys="b a"/>',
                '</map>',
            ].join('\n');
            fs.writeFileSync(mapFile, text);
            const keySpaceService = new KeySpaceService(
                [tmpDir], async () => ({ keySpaceCacheTtlMinutes: 5, maxLinkMatches: 10000 }), () => {});

            try {
                const diags = await validateCrossReferences(text, URI.file(mapFile).toString(), keySpaceService, 100);
                const dupDiags = diags.filter(d => d.code === XREF_CODES.DUPLICATE_KEY);
                assert.strictEqual(dupDiags.length, 1, 'only the second definition is a duplicate');
                assert.strictEqual(dupDiags[0].range.start.line, 2);
                assert.ok(dupDiags[0].message.includes('"a"') || dupDiags[0].message.includes(' a '));
            } finally {
                keySpaceService.shutdown();
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('DITA-KEY-004: same-line definitions identify only the later key token', async () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const mapFile = path.join(tmpDir, 'root.ditamap');
            const text = '<map><topicref keys="a"/><topicref keys="a"/></map>';
            fs.writeFileSync(mapFile, text);
            const keySpaceService = new KeySpaceService(
                [tmpDir], async () => ({ keySpaceCacheTtlMinutes: 5, maxLinkMatches: 10000 }), () => {});

            try {
                const diags = await validateCrossReferences(text, URI.file(mapFile).toString(), keySpaceService, 100);
                const dupDiags = diags.filter(d => d.code === XREF_CODES.DUPLICATE_KEY);
                const expectedOffset = text.lastIndexOf('keys="a"') + 'keys="'.length;
                assert.strictEqual(dupDiags.length, 1, 'only the later definition is a duplicate');
                assert.strictEqual(dupDiags[0].range.start.character, expectedOffset);
                assert.strictEqual(dupDiags[0].range.end.character, expectedOffset + 1);
            } finally {
                keySpaceService.shutdown();
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('DITA-KEY-004: multiline key lists identify the duplicate token line', async () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const mapFile = path.join(tmpDir, 'root.ditamap');
            const text = [
                '<map>',
                '  <topicref keys="a"/>',
                '  <topicref keys="b',
                '    a"/>',
                '</map>',
            ].join('\n');
            fs.writeFileSync(mapFile, text);
            const keySpaceService = new KeySpaceService(
                [tmpDir], async () => ({ keySpaceCacheTtlMinutes: 5, maxLinkMatches: 10000 }), () => {});

            try {
                const diags = await validateCrossReferences(text, URI.file(mapFile).toString(), keySpaceService, 100);
                const dupDiags = diags.filter(d => d.code === XREF_CODES.DUPLICATE_KEY);
                assert.strictEqual(dupDiags.length, 1, 'only the later definition is a duplicate');
                assert.strictEqual(dupDiags[0].range.start.line, 3);
                assert.strictEqual(dupDiags[0].range.start.character, 4);
                assert.strictEqual(dupDiags[0].range.end.character, 5);
            } finally {
                keySpaceService.shutdown();
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

    suite('Duplicate key definitions: live text and key scopes', () => {
        /**
         * Writes `files` in a new folder, then validates `mapName` with a key space built from
         * them. `editorText` is the map's text in the editor, when it differs from the saved file.
         * Returns the DITA-KEY-004 diagnostics as "line:character key-name effective-map".
         */
        async function duplicateKeyDiagnostics(
            files: Record<string, string>, mapName: string, editorText?: string,
        ): Promise<string[]> {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            for (const [name, content] of Object.entries(files)) {
                fs.writeFileSync(path.join(tmpDir, name), content);
            }
            const keySpaceService = new KeySpaceService(
                [tmpDir], async () => ({ keySpaceCacheTtlMinutes: 5, maxLinkMatches: 10000 }), () => {});
            try {
                const text = editorText ?? files[mapName];
                const diags = await validateCrossReferences(
                    text, URI.file(path.join(tmpDir, mapName)).toString(), keySpaceService, 100);
                return diags.filter(d => d.code === XREF_CODES.DUPLICATE_KEY).map(d => {
                    const name = text.slice(
                        offsetOf(text, d.range.start.line, d.range.start.character),
                        offsetOf(text, d.range.end.line, d.range.end.character));
                    const effectiveMap = /\b(\w+\.ditamap)\b/.exec(d.message)?.[1];
                    return `${d.range.start.line}:${d.range.start.character} ${name} ${effectiveMap}`;
                });
            } finally {
                keySpaceService.shutdown();
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        }

        function offsetOf(text: string, line: number, character: number): number {
            const lines = text.split('\n');
            return lines.slice(0, line).reduce((sum, l) => sum + l.length + 1, 0) + character;
        }

        const ROOT = [
            '<map>',
            '  <keydef keys="a" href="t.dita"/>',
            '  <mapref href="sub.ditamap"/>',
            '</map>',
        ].join('\n');

        test('a key defined first in another map is reported among elements of other names (review: one key position switched the check off)', async () => {
            // The parser groups same-name siblings: the keydef came after both topicrefs, so it
            // got no position, and a position on the root map's definition skipped it.
            const sub = ['<map>', '  <topicref keys="x"/>', '  <keydef keys="a"/>', '  <topicref keys="y"/>', '</map>'].join('\n');
            assert.deepStrictEqual(
                await duplicateKeyDiagnostics({ 'root.ditamap': ROOT, 'sub.ditamap': sub }, 'sub.ditamap'),
                ['2:16 a root.ditamap']);
        });

        test('a key defined twice in one map, between elements of other names, is reported on the second definition', async () => {
            const map = [
                '<map>', '  <topicref keys="x"/>', '  <keydef keys="a"/>', '  <topicref keys="y"/>', '  <keydef keys="a"/>', '</map>',
            ].join('\n');
            assert.deepStrictEqual(await duplicateKeyDiagnostics({ 'root.ditamap': map }, 'root.ditamap'),
                ['4:16 a root.ditamap']);
        });

        test('a map saved with a byte order mark is checked as the editor shows it (review: positions off by one)', async () => {
            const sub = '<map>\n  <keydef keys="a"/>\n</map>';
            assert.deepStrictEqual(
                await duplicateKeyDiagnostics({ 'root.ditamap': ROOT, 'sub.ditamap': '﻿' + sub }, 'sub.ditamap', sub),
                ['1:16 a root.ditamap']);
        });

        test('an unsaved edit above a key keeps its warning (review: positions came from the saved file)', async () => {
            const saved = '<map>\n  <keydef keys="a"/>\n</map>';
            const edited = '<map>\n  <!-- a new comment, not saved -->\n  <keydef keys="a"/>\n</map>';
            assert.deepStrictEqual(
                await duplicateKeyDiagnostics({ 'root.ditamap': ROOT, 'sub.ditamap': saved }, 'sub.ditamap', edited),
                ['2:16 a root.ditamap']);
        });

        test('keys named like the attribute ("key", "s") are located in the value (review: indexOf found the attribute name)', async () => {
            const map = '<map>\n  <keydef keys="key"/>\n  <keydef keys="key"/>\n</map>';
            assert.deepStrictEqual(await duplicateKeyDiagnostics({ 'root.ditamap': map }, 'root.ditamap'),
                ['2:16 key root.ditamap']);
            const root = '<map>\n  <keydef keys="s"/>\n  <mapref href="sub.ditamap"/>\n</map>';
            const sub = '<map>\n  <keydef keys="s"/>\n</map>';
            assert.deepStrictEqual(
                await duplicateKeyDiagnostics({ 'root.ditamap': root, 'sub.ditamap': sub }, 'sub.ditamap'),
                ['1:16 s root.ditamap']);
        });

        test('keys in different key scopes do not collide (review: false warning on the root-level definition)', async () => {
            // DITA-OT reports a key defined twice in the same scope only (DOTJ045I)
            const map = [
                '<map>',
                '  <topicgroup keyscope="sc">',
                '    <keydef keys="a" href="x.dita"/>',
                '  </topicgroup>',
                '  <keydef keys="a" href="y.dita"/>',
                '</map>',
            ].join('\n');
            assert.deepStrictEqual(await duplicateKeyDiagnostics({ 'root.ditamap': map }, 'root.ditamap'), []);
            // Nor across maps: an inline scope, or a submap given its own scope
            const inlineScope = '<map>\n  <topicgroup keyscope="s">\n    <keydef keys="a"/>\n  </topicgroup>\n</map>';
            assert.deepStrictEqual(
                await duplicateKeyDiagnostics({ 'root.ditamap': ROOT, 'sub.ditamap': inlineScope }, 'sub.ditamap'), []);
            const scopedRoot = '<map>\n  <keydef keys="a"/>\n  <mapref href="sub.ditamap" keyscope="s"/>\n</map>';
            assert.deepStrictEqual(
                await duplicateKeyDiagnostics({ 'root.ditamap': scopedRoot, 'sub.ditamap': '<map>\n  <keydef keys="a"/>\n</map>' }, 'sub.ditamap'),
                []);
        });

        test('a key defined twice in the same key scope is reported', async () => {
            const map = [
                '<map>',
                '  <topicgroup keyscope="sc">',
                '    <keydef keys="a"/>',
                '    <keydef keys="a"/>',
                '  </topicgroup>',
                '</map>',
            ].join('\n');
            assert.deepStrictEqual(await duplicateKeyDiagnostics({ 'root.ditamap': map }, 'root.ditamap'),
                ['3:18 a root.ditamap']);
        });

        test('keys="…" written in another attribute is not a key definition (review: the warning landed in a navtitle)', async () => {
            const map = [
                '<map>',
                '  <keydef keys="a"/>',
                '  <topicref navtitle=\'keys="a"\' keys="b"/>',
                '  <keydef keys="a"/>',
                '</map>',
            ].join('\n');
            assert.deepStrictEqual(await duplicateKeyDiagnostics({ 'root.ditamap': map }, 'root.ditamap'),
                ['3:16 a root.ditamap']);
        });
    });

    suite('Missing target severities (as DITA-OT)', () => {
        async function missingFiles(text: string, files: Record<string, string> = {}): Promise<string[]> {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            for (const [name, content] of Object.entries(files)) {
                fs.writeFileSync(path.join(tmpDir, name), content);
            }
            try {
                const diags = await validateCrossReferences(
                    text, URI.file(path.join(tmpDir, 'source.ditamap')).toString(), undefined, 100);
                return diags.filter(d => d.code === XREF_CODES.MISSING_FILE)
                    .map(d => `${d.range.start.line}:${d.severity === DiagnosticSeverity.Error ? 'error' : 'warning'}`);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        }

        test('a missing DITA topic, map, content reference or image is an error; a peer or non-DITA resource is a warning (review)', async () => {
            // DITA-OT loads the first ones (DOTX008E, DOTX010E, DOTJ023E); it does not load a peer
            // publication or a PDF, and reports nothing about them.
            const text = [
                '<topicref href="missing.dita"/>',
                '<mapref href="missing.ditamap" format="ditamap"/>',
                '<p conref="missing-reuse.dita#t/p"/>',
                '<image href="missing.png"/>',
                '<xref href="../other-guide/missing.dita" scope="peer"/>',
                '<xref href="missing.pdf" format="pdf"/>',
                '<topicref href="missing.html"/>',
            ].join('\n');
            assert.deepStrictEqual(await missingFiles(text), [
                '0:error', '1:error', '2:error', '3:error', '4:warning', '5:warning', '6:warning',
            ]);
        });

        test('@scope cascades from the closest ancestor in a map or in related links (regression)', async () => {
            // DITA 1.3 §3.12.13.11: "If no value is specified, but the attribute is specified on an
            // ancestor within a map or within the related-links section, the value will cascade
            // from the closest ancestor." It was read on the referencing element only.
            const map = [
                '<topicgroup scope="peer">',
                '  <topicref href="missing.dita"/>',
                '  <topicref href="missing-local.dita" scope="local"/>',
                '</topicgroup>',
                '<topicref href="missing-own.dita"/>',
            ].join('\n');
            assert.deepStrictEqual(await missingFiles(map), ['1:warning', '2:error', '4:error'],
                'the peer group makes a missing target a warning; an inner scope="local" and a topicref outside the group are errors');

            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            try {
                const topic = [
                    '<topic id="t"><title>T</title><body><p><xref href="missing-body.dita"/></p></body>',
                    '<related-links><linkpool scope="peer"><link href="missing-peer.dita"/></linkpool></related-links></topic>',
                ].join('\n');
                const diags = await validateCrossReferences(topic, URI.file(path.join(tmpDir, 'source.dita')).toString(), undefined, 100);
                assert.deepStrictEqual(
                    diags.filter(d => d.code === XREF_CODES.MISSING_FILE).map(d => `${d.range.start.line}:${d.severity}`),
                    [`0:${DiagnosticSeverity.Error}`, `1:${DiagnosticSeverity.Warning}`]);
                // A URL in an external group has its scope: no "missing @scope" suggestion
                const urls = await validateCrossReferences('<topicgroup scope="external"><topicref href="https://example.com/"/></topicgroup>',
                    URI.file(path.join(tmpDir, 'source.ditamap')).toString(), undefined, 100);
                assert.deepStrictEqual(urls.filter(d => d.code === XREF_CODES.SCOPE_MISSING_ON_URL), []);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('a URI-encoded href is decoded (review: "my%20topic.dita" was not found)', async () => {
            const topic = '<topic id="t"><title>T</title></topic>';
            assert.deepStrictEqual(
                await missingFiles('<topicref href="my%20topic.dita"/>', { 'my topic.dita': topic }), []);
            // A "%" that starts no escape sequence is taken as written
            assert.deepStrictEqual(await missingFiles('<topicref href="100%.dita"/>', { '100%.dita': topic }), []);
        });

        test('a target outside the workspace is not said to be missing (review: it may exist)', async () => {
            const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-ws-'));
            const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-shared-'));
            fs.writeFileSync(path.join(outside, 's.dita'), '<topic id="s"><title>S</title></topic>');
            try {
                const href = path.relative(workspaceRoot, path.join(outside, 's.dita')).replace(/\\/g, '/');
                const diags = await validateCrossReferences(`<xref href="${href}"/>`,
                    URI.file(path.join(workspaceRoot, 'source.dita')).toString(),
                    createMockKeySpaceService(new Map(), undefined, [workspaceRoot]), 100);
                const outsideDiags = diags.filter(d => d.code === XREF_CODES.MISSING_FILE);
                assert.strictEqual(outsideDiags.length, 1);
                assert.strictEqual(outsideDiags[0].severity, DiagnosticSeverity.Warning);
                assert.ok(outsideDiags[0].message.includes('outside the workspace'), outsideDiags[0].message);
            } finally {
                fs.rmSync(workspaceRoot, { recursive: true, force: true });
                fs.rmSync(outside, { recursive: true, force: true });
            }
        });

        test('a content reference into a specialized topic type finds the topic (review: <faq> was not a topic)', async () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            fs.writeFileSync(path.join(tmpDir, 'faq.dita'), '<faq id="f1"><title>FAQ</title><faqbody><p id="p1">x</p></faqbody></faq>');
            fs.writeFileSync(path.join(tmpDir, 'other.dita'), '<topic id="t"><title>T</title><body><p id="p1">x</p></body></topic>');
            try {
                const diags = await validateCrossReferences(
                    '<p conref="faq.dita#f1/p1"/>\n<p conref="other.dita#p1/p1"/>',
                    URI.file(path.join(tmpDir, 'source.dita')).toString(), undefined, 100);
                // An id on an element DITA defines (<p>) is still not a topic's
                assert.deepStrictEqual(diags.filter(d => d.code === XREF_CODES.MISSING_TOPIC_ID).map(d => d.range.start.line), [1]);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('reuse through an undefined key is an error (DOTJ046E); a link through one stays a warning (review)', async () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            try {
                const diags = await validateCrossReferences(
                    '<p conkeyref="nokey/p1"/>\n<xref keyref="nokey"/>',
                    URI.file(path.join(tmpDir, 'source.dita')).toString(), createMockKeySpaceService(new Map()), 100);
                assert.deepStrictEqual(
                    diags.filter(d => d.code === XREF_CODES.UNDEFINED_KEY).map(d => `${d.range.start.line}:${d.severity}`),
                    [`0:${DiagnosticSeverity.Error}`, `1:${DiagnosticSeverity.Warning}`]);
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

        test('DITA-KEY-005: an invalid key scope name is an error; a period is legal (DITA 1.3 §2.3.4.2)', async () => {
            // "The legal characters for a key scope name are the same as those for keys."
            // A keys="…" written in the text of the map is an example, not an attribute.
            const text = '<map><topicmeta><shortdesc>Write keys="a/b" to see the error.</shortdesc></topicmeta>'
                + '<topicgroup keyscope="v1.2 bad/name"><keydef keys="k" href="k.dita"/></topicgroup></map>';
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const mapFile = path.join(tmpDir, 'test.ditamap');
            fs.writeFileSync(mapFile, text);

            try {
                const diags = await validateCrossReferences(text, URI.file(mapFile).toString(), undefined, 100);
                const invalid = diags.filter(d => d.code === XREF_CODES.INVALID_KEY_NAME);
                assert.deepStrictEqual(invalid.map(d => d.message), [
                    'Invalid key scope name "bad/name". Like key names, key scope names may not contain whitespace or any of: { } [ ] / # ?',
                ]);
                assert.strictEqual(invalid[0].severity, DiagnosticSeverity.Error);
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

        test('ditaot profile: unresolved conkeyref in referenced topic emits build-time fallback errors', async () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const mapPath = path.join(tmpDir, 'root.ditamap');
            const topicPath = path.join(tmpDir, 'using-dita-command.dita');
            fs.writeFileSync(
                topicPath,
                '<topic id="using-dita-command"><body>'
                + '<p conkeyref="conref-task/samples-dir" conref="fallback.dita#id1"/>'
                + '<p conkeyref="conref-task/dita-cmd" conref="fallback.dita#id2"/>'
                + '</body></topic>'
            );
            fs.writeFileSync(mapPath, '<map><topicref href="using-dita-command.dita"/></map>');
            const mapText = fs.readFileSync(mapPath, 'utf-8');
            const mapUri = URI.file(mapPath).toString();
            const keySpaceService = createMockKeySpaceService(new Map());

            try {
                const diags = await validateCrossReferences(
                    mapText,
                    mapUri,
                    keySpaceService,
                    100,
                    { comparisonProfile: 'ditaot' }
                );
                const unresolved = diags.filter(d => d.code === XREF_CODES.CONKEYREF_FALLBACK_UNRESOLVED);
                assert.strictEqual(unresolved.length, 2);
                assert.ok(unresolved.every(d => d.severity === 1));
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('ditaot profile: repeated topicrefs duplicate conkeyref fallback errors', async () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const mapPath = path.join(tmpDir, 'root.ditamap');
            const topicPath = path.join(tmpDir, 'using-dita-command.dita');
            fs.writeFileSync(
                topicPath,
                '<topic id="using-dita-command"><body>'
                + '<p conkeyref="conref-task/samples-dir" conref="fallback.dita#id1"/>'
                + '</body></topic>'
            );
            fs.writeFileSync(
                mapPath,
                '<map><topicref href="using-dita-command.dita"/><topicref href="using-dita-command.dita"/></map>'
            );
            const mapText = fs.readFileSync(mapPath, 'utf-8');
            const mapUri = URI.file(mapPath).toString();
            const keySpaceService = createMockKeySpaceService(new Map());

            try {
                const diags = await validateCrossReferences(
                    mapText,
                    mapUri,
                    keySpaceService,
                    100,
                    { comparisonProfile: 'ditaot' }
                );
                const unresolved = diags.filter(d => d.code === XREF_CODES.CONKEYREF_FALLBACK_UNRESOLVED);
                assert.strictEqual(unresolved.length, 2);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('ditaot profile: ditaval audience branch duplicates matching unresolved conkeyrefs', async () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const mapPath = path.join(tmpDir, 'root.ditamap');
            const topicPath = path.join(tmpDir, 'branching.dita');
            fs.writeFileSync(
                topicPath,
                '<topic id="branching"><body>'
                + '<p conkeyref="conref-task/base"/>'
                + '<p audience="novice" conkeyref="conref-task/novice"/>'
                + '<p audience="expert" conkeyref="conref-task/expert"/>'
                + '</body></topic>'
            );
            fs.writeFileSync(
                mapPath,
                '<map><topicref href="branching.dita"><ditavalref href="../resources/novice.ditaval"/></topicref></map>'
            );
            const mapText = fs.readFileSync(mapPath, 'utf-8');
            const mapUri = URI.file(mapPath).toString();

            try {
                const diags = await validateCrossReferences(
                    mapText,
                    mapUri,
                    undefined,
                    100,
                    { comparisonProfile: 'ditaot' }
                );
                const unresolved = diags.filter(d => d.code === XREF_CODES.CONKEYREF_FALLBACK_UNRESOLVED);
                assert.strictEqual(unresolved.length, 4);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('ditaot profile: resource maps emit recursive outside-input warnings and single load error', async () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const docsDir = path.join(tmpDir, 'docs');
            const resourcesDir = path.join(docsDir, 'resources');
            const topicsDir = path.join(docsDir, 'topics');
            fs.mkdirSync(resourcesDir, { recursive: true });
            fs.mkdirSync(topicsDir, { recursive: true });

            const rootMap = path.join(resourcesDir, 'common-resources.ditamap');
            const keyDefsMap = path.join(resourcesDir, 'key-definitions.ditamap');
            const sourceFilesMap = path.join(resourcesDir, 'source-files.ditamap');
            fs.writeFileSync(rootMap, '<map><mapref href="key-definitions.ditamap"/></map>');
            fs.writeFileSync(keyDefsMap, '<map><mapref href="source-files.ditamap"/></map>');
            fs.writeFileSync(
                sourceFilesMap,
                '<map>'
                + '<keydef keys="ok" href="../topics/ok.dita"/>'
                + '<keydef keys="missing" href="../topics/missing.dita"/>'
                + '</map>'
            );
            fs.writeFileSync(path.join(topicsDir, 'ok.dita'), '<topic id="ok"><title>OK</title></topic>');

            const mapText = fs.readFileSync(rootMap, 'utf-8');
            const mapUri = URI.file(rootMap).toString();

            try {
                const diags = await validateCrossReferences(
                    mapText,
                    mapUri,
                    undefined,
                    100,
                    { comparisonProfile: 'ditaot' }
                );
                const outside = diags.filter(d => d.code === XREF_CODES.SCOPE_OUTSIDE_INPUT_DIR);
                const missing = diags.filter(d => d.code === XREF_CODES.MISSING_FILE);
                assert.strictEqual(outside.length, 2);
                assert.strictEqual(missing.length, 1);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('ditaot profile: site mapref to resources/common-toc emits build-time load error', async () => {
            const text = '<map><mapref href="resources/common-toc.ditamap"/></map>';
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const mapPath = path.join(tmpDir, 'site.ditamap');
            fs.writeFileSync(mapPath, text);
            const mapUri = URI.file(mapPath).toString();

            try {
                const diags = await validateCrossReferences(
                    text,
                    mapUri,
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

        test('ditaot profile: chunked keyref topicref emits dotx061-equivalent warnings', async () => {
            const text = '<map><topicref keyref="glossary" chunk="to-content"/></map>';
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const mapUri = URI.file(path.join(tmpDir, 'glossary.ditamap')).toString();

            try {
                const diags = await validateCrossReferences(
                    text,
                    mapUri,
                    undefined,
                    100,
                    { comparisonProfile: 'ditaot' }
                );
                const navtitle = diags.filter(d => d.code === XREF_CODES.CHUNK_NAVTITLE_RETRIEVAL);
                const linkMissing = diags.filter(d => d.code === XREF_CODES.CHUNK_LINKTEXT_MISSING);
                const fragment = diags.filter(d => d.code === XREF_CODES.CHUNK_TOPIC_FRAGMENT_MISMATCH);
                assert.strictEqual(navtitle.length, 1);
                assert.strictEqual(linkMissing.length, 1);
                assert.strictEqual(fragment.length, 1);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('ditaot profile: parameters map suppresses outside-input scope warnings', async () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const paramsDir = path.join(tmpDir, 'parameters');
            const topicsDir = path.join(tmpDir, 'topics');
            fs.mkdirSync(paramsDir, { recursive: true });
            fs.mkdirSync(topicsDir, { recursive: true });
            const rootMap = path.join(paramsDir, 'parameters.ditamap');
            const childMap = path.join(topicsDir, 'child.ditamap');
            fs.writeFileSync(childMap, '<map><topicref href="../parameters/local.dita"/></map>');
            fs.writeFileSync(rootMap, '<map><mapref href="../topics/child.ditamap"/></map>');
            const mapText = fs.readFileSync(rootMap, 'utf-8');
            const mapUri = URI.file(rootMap).toString();

            try {
                const diags = await validateCrossReferences(
                    mapText,
                    mapUri,
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

        test('ditaot profile: release-notes map emits build-time scope and load diagnostics', async () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const relDir = path.join(tmpDir, 'release-notes');
            const docsDir = path.join(tmpDir, 'docs');
            fs.mkdirSync(relDir, { recursive: true });
            fs.mkdirSync(docsDir, { recursive: true });
            const mapPath = path.join(relDir, 'changes.ditamap');
            const topicPath = path.join(relDir, 'history.dita');
            fs.writeFileSync(mapPath, '<map><topicref href="history.dita"/></map>');
            fs.writeFileSync(
                topicPath,
                '<topic id="h"><title>H</title><body>'
                + '<xref href="http://example.com" scope="local"/>'
                + '<xref href="../xmlcatalog.xml"/>'
                + '<xref href="../eclipseconprov.xml"/>'
                + '<xref href="../legacy-config.xml"/>'
                + '<xref href="../docs/missing.dita"/>'
                + '</body></topic>'
            );
            fs.writeFileSync(path.join(docsDir, 'existing.dita'), '<topic id="e"><title>E</title></topic>');
            const mapText = fs.readFileSync(mapPath, 'utf-8');
            const mapUri = URI.file(mapPath).toString();

            try {
                const diags = await validateCrossReferences(
                    mapText,
                    mapUri,
                    undefined,
                    100,
                    { comparisonProfile: 'ditaot' }
                );
                const outside = diags.filter(d => d.code === XREF_CODES.SCOPE_OUTSIDE_INPUT_DIR);
                const missing = diags.filter(d => d.code === XREF_CODES.MISSING_FILE);
                const scopeUrl = diags.filter(d => d.code === XREF_CODES.SCOPE_MISSING_ON_URL);
                assert.strictEqual(outside.length, 3);
                assert.strictEqual(missing.length, 1);
                assert.strictEqual(scopeUrl.length, 1);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });
    });

    suite('Conref ranges (@conrefend, DITA 1.3 §3.12.13.7, checked with DITA-OT 4.3.5)', () => {
        const SOURCE_TOPIC = [
            '<topic id="x"><title>Source</title><body>',
            '<p id="p1">First para</p>',
            '<ol id="mylist"><li id="apple">A</li><li id="bear">B</li><li id="cat">C</li><li id="dog">D</li><li id="eel">E</li></ol>',
            '<ol id="other"><li id="fox">F</li></ol>',
            '<ul id="u1"><li>U</li></ul>',
            '<steps id="s"><step id="s1"><cmd>1</cmd></step><step id="s2"><cmd>2</cmd></step></steps>',
            '<p id="p2">Second para</p>',
            '</body></topic>',
        ].join('\n');
        const RANGE_CODES = new Set<unknown>([XREF_CODES.CONREF_RANGE, XREF_CODES.CONREFEND_WITHOUT_CONREF, XREF_CODES.INCOMPATIBLE_CONREF]);

        /**
         * Validates a topic of `body`, next to source.dita and `files`, with a key space when the
         * files have a map. Returns the range diagnostics as "the text they cover → code severity: message".
         */
        async function rangeDiagnostics(body: string, files: Record<string, string> = {}): Promise<string[]> {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            for (const [name, content] of Object.entries({ 'source.dita': SOURCE_TOPIC, ...files })) {
                fs.writeFileSync(path.join(tmpDir, name), content);
            }
            const topic = path.join(tmpDir, 'ref.dita');
            const text = `<topic id="y"><title>Reuse</title><body>${body}</body></topic>`;
            fs.writeFileSync(topic, text);
            const keySpaceService = Object.keys(files).some(name => name.endsWith('.ditamap'))
                ? new KeySpaceService([tmpDir], async () => ({ keySpaceCacheTtlMinutes: 5, maxLinkMatches: 10000 }), () => {})
                : undefined;
            try {
                const diags = await validateCrossReferences(text, URI.file(topic).toString(), keySpaceService, 100);
                return diags.filter(d => RANGE_CODES.has(d.code)).map(d => {
                    const covered = text.slice(d.range.start.character, d.range.end.character); // one line
                    return `${covered} → ${d.code} ${d.severity === DiagnosticSeverity.Error ? 'Error' : 'Warning'}: ${d.message}`;
                });
            } finally {
                keySpaceService?.shutdown();
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        }

        test('the examples of the standard resolve: list items, blocks, a specialization of the referencing element, the same document', async () => {
            // "@conref and @conrefend attributes on an <li> element might reference other <li> elements,
            // or they might reference specializations of <li> such as <step>."
            assert.deepStrictEqual(await rangeDiagnostics(
                '<ol><li>My own first item</li><li conref="source.dita#x/bear" conrefend="source.dita#x/dog"/></ol>'
                + '<p conref="source.dita#x/p1" conrefend="source.dita#x/p2"/>'
                + '<ol><li conref="source.dita#x/s1" conrefend="source.dita#x/s2"/></ol>'
                + '<ol><li id="a">a</li><li id="b">b</li></ol><ol><li conref="#y/a" conrefend="#y/b"/></ol>'), []);
        });

        test('a range end that is missing, not a sibling, before the start or in another document is an error, as DITA-OT says (DOTX071E)', async () => {
            // "The start and end elements in a range MUST share the same parent, and the start element
            // MUST precede the end element in document order."
            assert.deepStrictEqual(await rangeDiagnostics('<ol>'
                + '<li conref="source.dita#x/bear" conrefend="source.dita#x/nosuch"/>'
                + '<li conref="source.dita#x/bear" conrefend="source.dita#x/fox"/>'
                + '<li conref="source.dita#x/dog" conrefend="source.dita#x/bear"/>'
                + '<li conref="source.dita#x/bear" conrefend="other.dita#z/zz"/>'
                + '</ol>', { 'other.dita': '<topic id="z"><title>Other</title><body><ol><li id="zz">Z</li></ol></body></topic>' }), [
                'source.dita#x/nosuch → DITA-XREF-006 Error: Range end "nosuch" not found in source.dita: the range cannot be resolved, and only its start element is reused',
                'source.dita#x/fox → DITA-XREF-006 Error: Range end "fox" is not a sibling of the range start "bear": the start and end elements of a range must share the same parent, so only the start element is reused',
                'source.dita#x/bear → DITA-XREF-006 Error: Range end "bear" comes before the range start "dog": the start element must precede the end element, so only the start element is reused',
                'other.dita#z/zz → DITA-XREF-006 Error: Range end "zz" is not in source.dita, the document of the range start: the start and end elements of a range must share the same parent, so only the start element is reused',
            ]);
        });

        test('a range end of another type than the referencing element is a warning: DITA-OT resolves the range without a message', async () => {
            // "The start and end elements of a range MUST be of the same type as the referencing element
            // or generalizable to the referencing element."
            assert.deepStrictEqual(await rangeDiagnostics('<p conref="source.dita#x/p1" conrefend="source.dita#x/u1"/>'), [
                'source.dita#x/u1 → DITA-XREF-004 Warning: Range end <ul> is not compatible with the referencing element <p>: the start and end elements of a range must be of the same type as the referencing element, or specializations of it',
            ]);
        });

        test('a @conrefend without @conref or @conkeyref is ignored, with a warning ("No result")', async () => {
            assert.deepStrictEqual(await rangeDiagnostics(
                '<ol><li conrefend="source.dita#x/dog">Own text</li></ol><p>Write conrefend="a.dita#t/e" next to a conref.</p>'), [
                'source.dita#x/dog → DITA-XREF-007 Warning: @conrefend without @conref or @conkeyref is ignored: it ends a range that has no start',
            ]);
        });

        test('with @conkeyref, the range ends in the topic the key addresses; without the key, in the @conref fallback', async () => {
            // "the map or topic element addressed by the key name component of the @conkeyref is used in
            // place of whatever map or topic element is addressed by the @conrefend attribute"; "When
            // @conref, @conkeyref, and @conrefend are all specified, the key value takes priority."
            const files = {
                'root.ditamap': '<map><keydef keys="xmp" href="examples.dita"/><topicref href="ref.dita"/></map>',
                'examples.dita': '<topic id="examples"><title>These are examples</title><body><ul>'
                    + '<li id="first">A first example</li><li>Another trivial example</li><li id="last">Final example</li></ul></body></topic>',
            };
            assert.deepStrictEqual(await rangeDiagnostics('<ul>'
                + '<li conkeyref="xmp/first" conrefend="default.dita#default/last"/>'
                + '<li conkeyref="xmp/first" conrefend="default.dita#default/nosuch"/>'
                + '<li conkeyref="xmp/first" conref="source.dita#x/bear" conrefend="source.dita#x/last"/>'
                + '<li conkeyref="nokey/first" conref="source.dita#x/bear" conrefend="source.dita#x/last"/>'
                + '</ul>', files), [
                // The @conref fallback of the undefined key "nokey" (the third range takes the key's topic)
                'source.dita#x/last → DITA-XREF-006 Error: Range end "last" not found in source.dita: the range cannot be resolved, and only its start element is reused',
                'default.dita#default/nosuch → DITA-XREF-006 Error: Range end "nosuch" not found in examples.dita: the range cannot be resolved, and only its start element is reused',
            ]);
        });
    });
});
