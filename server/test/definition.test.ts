import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { URI } from 'vscode-uri';
import { handleDefinition } from '../src/features/definition';
import { KeySpaceService, KeyDefinition } from '../src/services/keySpaceService';
import { createDoc, createDocs, createDocsFromContent, TEST_URI } from './helper';

function createMockKeySpaceService(keys: Map<string, KeyDefinition>): KeySpaceService {
    return {
        getAllKeys: async () => keys,
        resolveKey: async (keyName: string) => keys.get(keyName) ?? null,
        getWorkspaceFolders: () => [],
        buildKeySpace: async () => ({ rootMap: '', keys, buildTime: Date.now(), mapHierarchy: [], subjectSchemePaths: [] }),
        findRootMap: async () => '/test/root.ditamap',
        invalidateForFile: () => {},
        updateWorkspaceFolders: () => {},
        reloadCacheConfig: async () => {},
        shutdown: () => {},
        getExplicitRootMap: () => null,
        setExplicitRootMap: () => {},
        getSubjectSchemePaths: async () => [],
    } as unknown as KeySpaceService;
}

suite('handleDefinition', () => {
    test('returns null when document not found', async () => {
        const docs = createDocs(); // empty
        const result = await handleDefinition(
            {
                textDocument: { uri: 'file:///nonexistent.dita' },
                position: { line: 0, character: 0 },
            },
            docs
        );
        assert.strictEqual(result, null);
    });

    test('returns null when cursor is not on a reference attribute', async () => {
        const content = '<topic id="t1"><title>Hello</title></topic>';
        const { documents } = createDocsFromContent(content);
        const result = await handleDefinition(
            {
                textDocument: { uri: TEST_URI },
                position: { line: 0, character: 5 }, // on "c" of "topic"
            },
            documents
        );
        assert.strictEqual(result, null);
    });

    test('resolves href to same-file element ID', async () => {
        const content = '<topic id="topic1"><body><p id="elem1">text</p><xref href="#topic1/elem1"/></body></topic>';
        const { documents } = createDocsFromContent(content);

        // Position the cursor inside the href value — find the offset of "#topic1/elem1"
        const hrefStart = content.indexOf('"#topic1/elem1"');
        // We need line/character. Content is single line, so line=0, character = hrefStart + some offset inside the value.
        const cursorChar = hrefStart + 2; // inside the value, past the opening quote and #

        const result = await handleDefinition(
            {
                textDocument: { uri: TEST_URI },
                position: { line: 0, character: cursorChar },
            },
            documents
        );

        assert.ok(result, 'should return a Location');
        assert.strictEqual(result.uri, TEST_URI);
        // The target is <p id="elem1">, which starts at the offset of "<p" inside the content
        const elemOffset = content.indexOf('<p id="elem1"');
        assert.ok(elemOffset >= 0);
        // Position should point to line 0 since everything is on one line
        assert.strictEqual(result.range.start.line, 0);
        assert.strictEqual(result.range.start.character, elemOffset);
    });

    test('resolves keyref when keySpaceService has the key', async () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-def-test-'));
        const targetFile = path.join(tmpDir, 'target.dita');
        fs.writeFileSync(targetFile, '<topic id="t1"><body><p>target content</p></body></topic>');

        try {
            const keys = new Map<string, KeyDefinition>([
                ['my-key', {
                    keyName: 'my-key',
                    sourceMap: path.join(tmpDir, 'root.ditamap'),
                    targetFile: targetFile,
                }],
            ]);
            const keySpaceService = createMockKeySpaceService(keys);

            const content = '<xref keyref="my-key">link text</xref>';
            const doc = createDoc(content);
            const docs = createDocs(doc);

            // Cursor inside "my-key" value
            const cursorChar = content.indexOf('"my-key"') + 3; // inside the value
            const result = await handleDefinition(
                {
                    textDocument: { uri: TEST_URI },
                    position: { line: 0, character: cursorChar },
                },
                docs,
                keySpaceService
            );

            assert.ok(result, 'should return a Location');
            const expectedUri = URI.file(targetFile).toString();
            assert.strictEqual(result.uri, expectedUri);
            // Should point to file start since no elementId
            assert.strictEqual(result.range.start.line, 0);
            assert.strictEqual(result.range.start.character, 0);
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    test('returns null for keyref when no keySpaceService', async () => {
        const content = '<xref keyref="some-key">link</xref>';
        const doc = createDoc(content);
        const docs = createDocs(doc);

        const cursorChar = content.indexOf('"some-key"') + 3;
        const result = await handleDefinition(
            {
                textDocument: { uri: TEST_URI },
                position: { line: 0, character: cursorChar },
            },
            docs
            // no keySpaceService
        );
        assert.strictEqual(result, null);
    });

    test('returns null for keyref with unknown key', async () => {
        const keys = new Map<string, KeyDefinition>();
        const keySpaceService = createMockKeySpaceService(keys);

        const content = '<xref keyref="unknown-key">link</xref>';
        const doc = createDoc(content);
        const docs = createDocs(doc);

        const cursorChar = content.indexOf('"unknown-key"') + 3;
        const result = await handleDefinition(
            {
                textDocument: { uri: TEST_URI },
                position: { line: 0, character: cursorChar },
            },
            docs,
            keySpaceService
        );
        assert.strictEqual(result, null);
    });

    // Lines 63-66: keyref resolves to an inline key (no targetFile, has sourceMap)
    test('resolves keyref to source map when key has no targetFile but has sourceMap', async () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-def-test-'));
        const sourceMapFile = path.join(tmpDir, 'root.ditamap');
        fs.writeFileSync(sourceMapFile, '<map><title>Root</title></map>');

        try {
            const keys = new Map<string, KeyDefinition>([
                ['inline-key', {
                    keyName: 'inline-key',
                    sourceMap: sourceMapFile,
                    // no targetFile — this is an inline key
                }],
            ]);
            const keySpaceService = createMockKeySpaceService(keys);

            const content = '<xref keyref="inline-key">link text</xref>';
            const doc = createDoc(content);
            const docs = createDocs(doc);

            const cursorChar = content.indexOf('"inline-key"') + 3;
            const result = await handleDefinition(
                {
                    textDocument: { uri: TEST_URI },
                    position: { line: 0, character: cursorChar },
                },
                docs,
                keySpaceService
            );

            assert.ok(result, 'should return a Location pointing to the source map');
            const expectedUri = URI.file(sourceMapFile).toString();
            assert.strictEqual(result.uri, expectedUri);
            assert.strictEqual(result.range.start.line, 0);
            assert.strictEqual(result.range.start.character, 0);
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    test('resolves keyref with no targetFile to the sourceMap (inline key)', async () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-def-test-'));
        const sourceMapFile = path.join(tmpDir, 'inline.ditamap');
        fs.writeFileSync(sourceMapFile, '<map><title>Inline</title></map>');

        try {
            const keys = new Map<string, KeyDefinition>([
                ['bare-key', {
                    keyName: 'bare-key',
                    sourceMap: sourceMapFile,
                    // no targetFile — inline key, resolved to sourceMap
                }],
            ]);
            const keySpaceService = createMockKeySpaceService(keys);

            const content = '<xref keyref="bare-key">link</xref>';
            const doc = createDoc(content);
            const docs = createDocs(doc);

            const cursorChar = content.indexOf('"bare-key"') + 3;
            const result = await handleDefinition(
                {
                    textDocument: { uri: TEST_URI },
                    position: { line: 0, character: cursorChar },
                },
                docs,
                keySpaceService
            );

            // No targetFile means the code falls through to the sourceMap branch (lines 63-64)
            assert.ok(result, 'should navigate to sourceMap for inline key');
            const expectedUri = URI.file(sourceMapFile).toString();
            assert.strictEqual(result.uri, expectedUri);
            assert.strictEqual(result.range.start.line, 0);
            assert.strictEqual(result.range.start.character, 0);
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    // Lines 71-91: conkeyref handling

    test('resolves conkeyref with keySpaceService to cross-file element', async () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-def-test-'));
        const targetFile = path.join(tmpDir, 'reuse.dita');
        fs.writeFileSync(targetFile, '<topic id="t1"><body><p id="para1">reuse paragraph</p></body></topic>');

        try {
            const keys = new Map<string, KeyDefinition>([
                ['reuse-key', {
                    keyName: 'reuse-key',
                    sourceMap: path.join(tmpDir, 'root.ditamap'),
                    targetFile: targetFile,
                }],
            ]);
            const keySpaceService = createMockKeySpaceService(keys);

            const content = '<p conkeyref="reuse-key/para1"/>';
            const doc = createDoc(content);
            const docs = createDocs(doc);

            const cursorChar = content.indexOf('"reuse-key/para1"') + 3;
            const result = await handleDefinition(
                {
                    textDocument: { uri: TEST_URI },
                    position: { line: 0, character: cursorChar },
                },
                docs,
                keySpaceService
            );

            assert.ok(result, 'should return a Location in the target file');
            const expectedUri = URI.file(targetFile).toString();
            assert.strictEqual(result.uri, expectedUri);
            assert.strictEqual(result.range.start.line, 0);
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    test('resolves conkeyref fallback to same-file element when key not found but elementId present', async () => {
        // Key is unknown but there is an elementId, so should fall back to same-file lookup
        const keys = new Map<string, KeyDefinition>(); // empty — key not found
        const keySpaceService = createMockKeySpaceService(keys);

        const content = '<topic id="t1"><body><p id="local-para">content</p><p conkeyref="missing-key/local-para"/></body></topic>';
        const { documents } = createDocsFromContent(content);

        const cursorChar = content.indexOf('"missing-key/local-para"') + 3;
        const result = await handleDefinition(
            {
                textDocument: { uri: TEST_URI },
                position: { line: 0, character: cursorChar },
            },
            documents,
            keySpaceService
        );

        assert.ok(result, 'should fall back to same-file element lookup');
        assert.strictEqual(result.uri, TEST_URI);
        const elemOffset = content.indexOf('<p id="local-para"');
        assert.ok(elemOffset >= 0);
        assert.strictEqual(result.range.start.line, 0);
        assert.strictEqual(result.range.start.character, elemOffset);
    });

    test('returns null for conkeyref without keySpaceService and no elementId', async () => {
        const content = '<p conkeyref="some-key"/>';
        const doc = createDoc(content);
        const docs = createDocs(doc);

        // conkeyref value has no slash so elementId is empty
        const cursorChar = content.indexOf('"some-key"') + 3;
        const result = await handleDefinition(
            {
                textDocument: { uri: TEST_URI },
                position: { line: 0, character: cursorChar },
            },
            docs
            // no keySpaceService
        );
        assert.strictEqual(result, null);
    });

    test('resolves conkeyref without keySpaceService using same-file element lookup', async () => {
        const content = '<topic id="t1"><body><p id="target-el">para</p><p conkeyref="any-key/target-el"/></body></topic>';
        const { documents } = createDocsFromContent(content);

        const cursorChar = content.indexOf('"any-key/target-el"') + 3;
        const result = await handleDefinition(
            {
                textDocument: { uri: TEST_URI },
                position: { line: 0, character: cursorChar },
            },
            documents
            // no keySpaceService — should still fall back to same-file element
        );

        assert.ok(result, 'should fall back to same-file element even without keySpaceService');
        assert.strictEqual(result.uri, TEST_URI);
        const elemOffset = content.indexOf('<p id="target-el"');
        assert.ok(elemOffset >= 0);
        assert.strictEqual(result.range.start.line, 0);
        assert.strictEqual(result.range.start.character, elemOffset);
    });

    // Lines 104-106: cross-file href resolution

    test('resolves cross-file href to element in another file', async () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-def-test-'));
        const targetFile = path.join(tmpDir, 'other.dita');
        fs.writeFileSync(targetFile, '<topic id="t2"><body><p id="section1">content</p></body></topic>');

        // The source document must live in the same tmpDir so the relative path resolves
        const sourceFile = path.join(tmpDir, 'source.dita');
        const sourceUri = URI.file(sourceFile).toString();
        const content = '<topic id="t1"><body><xref href="other.dita#t2/section1"/></body></topic>';
        fs.writeFileSync(sourceFile, content);

        try {
            const { documents } = createDocsFromContent(content, sourceUri);

            const cursorChar = content.indexOf('"other.dita#t2/section1"') + 3;
            const result = await handleDefinition(
                {
                    textDocument: { uri: sourceUri },
                    position: { line: 0, character: cursorChar },
                },
                documents
            );

            assert.ok(result, 'should resolve cross-file href');
            const expectedUri = URI.file(targetFile).toString();
            assert.strictEqual(result.uri, expectedUri);
            assert.strictEqual(result.range.start.line, 0);
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    test('resolves cross-file href to file start when element not found in target', async () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-def-test-'));
        const targetFile = path.join(tmpDir, 'other.dita');
        fs.writeFileSync(targetFile, '<topic id="t2"><body><p>no id here</p></body></topic>');

        const sourceFile = path.join(tmpDir, 'source.dita');
        const sourceUri = URI.file(sourceFile).toString();
        const content = '<topic id="t1"><body><xref href="other.dita#t2/nonexistent"/></body></topic>';
        fs.writeFileSync(sourceFile, content);

        try {
            const { documents } = createDocsFromContent(content, sourceUri);

            const cursorChar = content.indexOf('"other.dita#t2/nonexistent"') + 3;
            const result = await handleDefinition(
                {
                    textDocument: { uri: sourceUri },
                    position: { line: 0, character: cursorChar },
                },
                documents
            );

            assert.ok(result, 'should fall back to file start when element not found');
            const expectedUri = URI.file(targetFile).toString();
            assert.strictEqual(result.uri, expectedUri);
            assert.strictEqual(result.range.start.line, 0);
            assert.strictEqual(result.range.start.character, 0);
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    test('returns null for cross-file href when target file does not exist', async () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-def-test-'));
        const sourceFile = path.join(tmpDir, 'source.dita');
        const sourceUri = URI.file(sourceFile).toString();
        const content = '<topic id="t1"><body><xref href="missing.dita#t2/elem"/></body></topic>';
        fs.writeFileSync(sourceFile, content);

        try {
            const { documents } = createDocsFromContent(content, sourceUri);

            const cursorChar = content.indexOf('"missing.dita#t2/elem"') + 3;
            const result = await handleDefinition(
                {
                    textDocument: { uri: sourceUri },
                    position: { line: 0, character: cursorChar },
                },
                documents
            );

            assert.strictEqual(result, null);
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    // Lines 143-153: resolveElementInFile with elementId found/not found, and file not existing

    test('resolves keyref with elementId to the exact element position in target file', async () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-def-test-'));
        const targetFile = path.join(tmpDir, 'target.dita');
        // Put the element on a second line to verify offset-to-position conversion
        fs.writeFileSync(targetFile, '<topic id="t1">\n<body><p id="elem2">target</p></body>\n</topic>');

        try {
            const keys = new Map<string, KeyDefinition>([
                ['key-with-elem', {
                    keyName: 'key-with-elem',
                    sourceMap: path.join(tmpDir, 'root.ditamap'),
                    targetFile: targetFile,
                    elementId: 'elem2',
                }],
            ]);
            const keySpaceService = createMockKeySpaceService(keys);

            const content = '<xref keyref="key-with-elem">link</xref>';
            const doc = createDoc(content);
            const docs = createDocs(doc);

            const cursorChar = content.indexOf('"key-with-elem"') + 3;
            const result = await handleDefinition(
                {
                    textDocument: { uri: TEST_URI },
                    position: { line: 0, character: cursorChar },
                },
                docs,
                keySpaceService
            );

            assert.ok(result, 'should return a Location pointing to the element');
            const expectedUri = URI.file(targetFile).toString();
            assert.strictEqual(result.uri, expectedUri);
            // elem2 is on line 1 (second line)
            assert.strictEqual(result.range.start.line, 1);
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    test('resolves keyref with elementId to file start when elementId not found in target', async () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-def-test-'));
        const targetFile = path.join(tmpDir, 'target.dita');
        fs.writeFileSync(targetFile, '<topic id="t1"><body><p>no id here</p></body></topic>');

        try {
            const keys = new Map<string, KeyDefinition>([
                ['key-missing-elem', {
                    keyName: 'key-missing-elem',
                    sourceMap: path.join(tmpDir, 'root.ditamap'),
                    targetFile: targetFile,
                    elementId: 'does-not-exist',
                }],
            ]);
            const keySpaceService = createMockKeySpaceService(keys);

            const content = '<xref keyref="key-missing-elem">link</xref>';
            const doc = createDoc(content);
            const docs = createDocs(doc);

            const cursorChar = content.indexOf('"key-missing-elem"') + 3;
            const result = await handleDefinition(
                {
                    textDocument: { uri: TEST_URI },
                    position: { line: 0, character: cursorChar },
                },
                docs,
                keySpaceService
            );

            assert.ok(result, 'should fall back to file start when elementId not found');
            const expectedUri = URI.file(targetFile).toString();
            assert.strictEqual(result.uri, expectedUri);
            assert.strictEqual(result.range.start.line, 0);
            assert.strictEqual(result.range.start.character, 0);
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });
});
