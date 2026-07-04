import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { URI } from 'vscode-uri';
import { handleReferences } from '../src/features/references';
import { KeySpaceService, KeyDefinition } from '../src/services/keySpaceService';
import { createDoc, createDocs } from './helper';

function mockKeySpaceService(resolve: (keyName: string, contextFilePath: string) => KeyDefinition | null): KeySpaceService {
    return {
        resolveKey: async (keyName: string, contextFilePath: string) => resolve(keyName, contextFilePath),
    } as unknown as KeySpaceService;
}

suite('handleReferences', () => {
    test('finds a same-file fragment-only reference', async () => {
        const content = '<topic id="t1"><title>T</title><body><p><xref href="#t1"/></p></body></topic>';
        const doc = createDoc(content);
        const docs = createDocs(doc);

        const idAttrOffset = content.indexOf('id="t1"');
        const position = doc.positionAt(idAttrOffset + 4);

        const results = await handleReferences(
            { textDocument: { uri: doc.uri }, position, context: { includeDeclaration: false } },
            docs
        );
        assert.strictEqual(results.length, 1);
    });

    test('includeDeclaration adds the element itself', async () => {
        const content = '<topic id="t1"><title>T</title><body><p><xref href="#t1"/></p></body></topic>';
        const doc = createDoc(content);
        const docs = createDocs(doc);

        const idAttrOffset = content.indexOf('id="t1"');
        const position = doc.positionAt(idAttrOffset + 4);

        const results = await handleReferences(
            { textDocument: { uri: doc.uri }, position, context: { includeDeclaration: true } },
            docs
        );
        assert.strictEqual(results.length, 2, 'declaration + the one xref reference');
    });

    test('same-file href pointing to a different file with a matching id is excluded (regression)', async () => {
        // The id "s1" being searched lives in this document, but the xref
        // below points to "other.dita#topic/s1" — a *different* file whose
        // element merely happens to share the same id text. It must not be
        // reported as a reference.
        const content =
            '<topic id="root"><title>T</title><body>' +
            '<step id="s1"/>' +
            '<xref href="other.dita#topic/s1"/>' +
            '</body></topic>';
        const doc = createDoc(content, URI.file('/workspace/this.dita').toString());
        const docs = createDocs(doc);

        const idAttrOffset = content.indexOf('id="s1"');
        const position = doc.positionAt(idAttrOffset + 4);

        const results = await handleReferences(
            { textDocument: { uri: doc.uri }, position, context: { includeDeclaration: false } },
            docs
        );
        assert.strictEqual(results.length, 0, 'href pointing at a different file must not be reported');
    });

    test('cross-file conkeyref resolving to the target file is included, resolving elsewhere is excluded (regression)', async () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
        try {
            const targetPath = path.join(tmpDir, 'target.dita');
            const unrelatedPath = path.join(tmpDir, 'unrelated.dita');
            const goodRefPath = path.join(tmpDir, 'good-ref.dita');
            const badRefPath = path.join(tmpDir, 'bad-ref.dita');

            fs.writeFileSync(targetPath, '<topic id="t1"><title>T</title></topic>');
            fs.writeFileSync(unrelatedPath, '<topic id="t1"><title>U</title></topic>');
            fs.writeFileSync(goodRefPath,
                '<topic id="g1"><title>G</title><body><p conkeyref="goodkey/t1">x</p></body></topic>');
            fs.writeFileSync(badRefPath,
                '<topic id="b1"><title>B</title><body><p conkeyref="badkey/t1">x</p></body></topic>');

            const doc = createDoc(fs.readFileSync(targetPath, 'utf-8'), URI.file(targetPath).toString());
            const docs = createDocs(doc);

            const keySpaceService = mockKeySpaceService((keyName) => {
                if (keyName === 'goodkey') return { keyName, targetFile: targetPath, sourceMap: targetPath };
                if (keyName === 'badkey') return { keyName, targetFile: unrelatedPath, sourceMap: unrelatedPath };
                return null;
            });

            const results = await handleReferences(
                { textDocument: { uri: doc.uri }, position: { line: 0, character: 12 }, context: { includeDeclaration: false } },
                docs,
                [tmpDir],
                keySpaceService
            );

            const goodUri = URI.file(goodRefPath).toString();
            const badUri = URI.file(badRefPath).toString();
            assert.ok(results.some(r => r.uri === goodUri), 'conkeyref resolving to the target file should be found');
            assert.ok(!results.some(r => r.uri === badUri), 'conkeyref resolving elsewhere must be excluded');
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    test('skipping an unverifiable conkeyref without a KeySpaceService is logged (regression)', async () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
        try {
            const targetPath = path.join(tmpDir, 'target.dita');
            const referencerPath = path.join(tmpDir, 'referencer.dita');

            fs.writeFileSync(targetPath, '<topic id="t1"><title>T</title></topic>');
            fs.writeFileSync(referencerPath,
                '<topic id="r1"><title>R</title><body><p conkeyref="mykey/t1">x</p></body></topic>');

            const doc = createDoc(fs.readFileSync(targetPath, 'utf-8'), URI.file(targetPath).toString());
            const docs = createDocs(doc);

            const logs: string[] = [];
            const results = await handleReferences(
                { textDocument: { uri: doc.uri }, position: { line: 0, character: 12 }, context: { includeDeclaration: false } },
                docs,
                [tmpDir],
                // no keySpaceService
                undefined,
                (msg) => logs.push(msg)
            );

            const referencerUri = URI.file(referencerPath).toString();
            assert.ok(!results.some(r => r.uri === referencerUri),
                'without a KeySpaceService, an unverifiable conkeyref must not be reported as a match');
            assert.ok(
                logs.some(m => m.includes('mykey/t1')),
                'skipping an unverifiable conkeyref should be logged so it is not silently dropped'
            );
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    test('cursor not on an id attribute returns empty', async () => {
        const doc = createDoc('<topic id="t1"><title>T</title></topic>');
        const docs = createDocs(doc);
        const results = await handleReferences(
            { textDocument: { uri: doc.uri }, position: { line: 0, character: 0 }, context: { includeDeclaration: false } },
            docs
        );
        assert.strictEqual(results.length, 0);
    });

    test('document not found returns empty', async () => {
        const docs = createDocs();
        const results = await handleReferences(
            { textDocument: { uri: 'file:///nonexistent.dita' }, position: { line: 0, character: 0 }, context: { includeDeclaration: false } },
            docs
        );
        assert.strictEqual(results.length, 0);
    });
});
