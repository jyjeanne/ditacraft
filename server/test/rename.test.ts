import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { URI } from 'vscode-uri';
import { handlePrepareRename, handleRename } from '../src/features/rename';
import { KeySpaceService, KeyDefinition } from '../src/services/keySpaceService';
import { createDoc, createDocs } from './helper';

function mockKeySpaceService(resolve: (keyName: string, contextFilePath: string) => KeyDefinition | null): KeySpaceService {
    return {
        resolveKey: async (keyName: string, contextFilePath: string) => resolve(keyName, contextFilePath),
    } as unknown as KeySpaceService;
}

suite('handlePrepareRename', () => {
    test('cursor on id attribute value returns its range', () => {
        const doc = createDoc('<topic id="t1"><title>T</title></topic>');
        const docs = createDocs(doc);
        const range = handlePrepareRename(
            { textDocument: { uri: doc.uri }, position: { line: 0, character: 12 } },
            docs
        );
        assert.ok(range, 'should return a range on the id value');
    });

    test('cursor elsewhere returns null', () => {
        const doc = createDoc('<topic id="t1"><title>T</title></topic>');
        const docs = createDocs(doc);
        const range = handlePrepareRename(
            { textDocument: { uri: doc.uri }, position: { line: 0, character: 0 } },
            docs
        );
        assert.strictEqual(range, null);
    });
});

suite('handleRename', () => {
    test('renames the id attribute and a same-file fragment-only reference', async () => {
        const content = '<topic id="t1"><title>T</title><body><p><xref href="#t1"/></p></body></topic>';
        const doc = createDoc(content);
        const docs = createDocs(doc);

        const edit = await handleRename(
            { textDocument: { uri: doc.uri }, position: { line: 0, character: 12 }, newName: 't1new' },
            docs
        );

        assert.ok(edit?.changes);
        const edits = edit!.changes![doc.uri];
        assert.strictEqual(edits.length, 2, 'should rewrite both the id and the #t1 fragment ref');
        assert.ok(edits.some(e => e.newText === 't1new'));
        assert.ok(edits.some(e => e.newText === '#t1new'));
    });

    test('same-file href pointing to a different file with a matching id is NOT rewritten (regression)', async () => {
        // The renamed id "s1" lives in this document, but the xref below points
        // to "other.dita#topic/s1" — a *different* file whose element merely
        // happens to share the same id text. It must be left untouched.
        const content =
            '<topic id="root"><title>T</title><body>' +
            '<step id="s1"/>' +
            '<xref href="other.dita#topic/s1"/>' +
            '</body></topic>';
        const doc = createDoc(content, URI.file('/workspace/this.dita').toString());
        const docs = createDocs(doc);

        const idAttrOffset = content.indexOf('id="s1"');
        const offset = doc.positionAt(idAttrOffset + 4); // inside the "s1" value

        const edit = await handleRename(
            { textDocument: { uri: doc.uri }, position: offset, newName: 's1new' },
            docs
        );

        assert.ok(edit?.changes);
        const edits = edit!.changes![doc.uri];
        assert.strictEqual(edits.length, 1, 'only the id attribute itself should be rewritten');
        assert.strictEqual(edits[0].newText, 's1new');
    });

    test('cross-file href pointing to the renamed file is rewritten, href to another file is not', async () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
        try {
            const targetPath = path.join(tmpDir, 'target.dita');
            const otherPath = path.join(tmpDir, 'other.dita');
            const elsewherePath = path.join(tmpDir, 'elsewhere.dita');

            fs.writeFileSync(targetPath, '<topic id="t1"><title>T</title></topic>');
            fs.writeFileSync(otherPath, '<topic id="o1"><title>O</title><body><xref href="target.dita#t1"/></body></topic>');
            fs.writeFileSync(elsewherePath, '<topic id="e1"><title>E</title><body><xref href="somewhere-else.dita#t1"/></body></topic>');

            const doc = createDoc(fs.readFileSync(targetPath, 'utf-8'), URI.file(targetPath).toString());
            const docs = createDocs(doc);

            const edit = await handleRename(
                { textDocument: { uri: doc.uri }, position: { line: 0, character: 12 }, newName: 't1new' },
                docs,
                [tmpDir]
            );

            const otherUri = URI.file(otherPath).toString();
            const elsewhereUri = URI.file(elsewherePath).toString();
            assert.ok(edit?.changes?.[otherUri], 'other.dita references target.dita and should be rewritten');
            assert.ok(!edit?.changes?.[elsewhereUri], 'elsewhere.dita points at a different file and must be untouched');
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    test('cross-file conkeyref resolving to the renamed file is rewritten (regression)', async () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
        try {
            const targetPath = path.join(tmpDir, 'target.dita');
            const referencerPath = path.join(tmpDir, 'referencer.dita');

            fs.writeFileSync(targetPath, '<topic id="t1"><title>T</title></topic>');
            fs.writeFileSync(referencerPath,
                '<topic id="r1"><title>R</title><body><p conkeyref="mykey/t1">x</p></body></topic>');

            const doc = createDoc(fs.readFileSync(targetPath, 'utf-8'), URI.file(targetPath).toString());
            const docs = createDocs(doc);

            const keySpaceService = mockKeySpaceService((keyName) =>
                keyName === 'mykey'
                    ? { keyName: 'mykey', targetFile: targetPath, sourceMap: targetPath }
                    : null
            );

            const edit = await handleRename(
                { textDocument: { uri: doc.uri }, position: { line: 0, character: 12 }, newName: 't1new' },
                docs,
                [tmpDir],
                keySpaceService
            );

            const referencerUri = URI.file(referencerPath).toString();
            assert.ok(edit?.changes?.[referencerUri], 'conkeyref resolving to the renamed file should be rewritten');
            assert.strictEqual(edit!.changes![referencerUri][0].newText, 'mykey/t1new');
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    test('cross-file conkeyref resolving to a DIFFERENT file is NOT rewritten (regression)', async () => {
        // "mykey" resolves to some unrelated file, not the one being renamed —
        // even though the conkeyref's trailing element id text ("s1") happens
        // to match the id being renamed. Before the fix, this was rewritten
        // unconditionally ("conkeyref: include all matches by element ID"),
        // corrupting an unrelated file.
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
        try {
            const targetPath = path.join(tmpDir, 'target.dita');
            const unrelatedPath = path.join(tmpDir, 'unrelated.dita');
            const referencerPath = path.join(tmpDir, 'referencer.dita');

            fs.writeFileSync(targetPath, '<topic id="s1"><title>T</title></topic>');
            fs.writeFileSync(unrelatedPath, '<topic id="u1"><title>U</title><step id="s1"/></topic>');
            fs.writeFileSync(referencerPath,
                '<topic id="r1"><title>R</title><body><p conkeyref="otherkey/s1">x</p></body></topic>');

            const doc = createDoc(fs.readFileSync(targetPath, 'utf-8'), URI.file(targetPath).toString());
            const docs = createDocs(doc);

            const keySpaceService = mockKeySpaceService((keyName) =>
                keyName === 'otherkey'
                    ? { keyName: 'otherkey', targetFile: unrelatedPath, sourceMap: unrelatedPath }
                    : null
            );

            const edit = await handleRename(
                { textDocument: { uri: doc.uri }, position: { line: 0, character: 12 }, newName: 's1new' },
                docs,
                [tmpDir],
                keySpaceService
            );

            const referencerUri = URI.file(referencerPath).toString();
            assert.ok(!edit?.changes?.[referencerUri],
                'conkeyref resolving to an unrelated file must not be rewritten');
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    test('conkeyref is skipped (not rewritten) when no KeySpaceService is available', async () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
        try {
            const targetPath = path.join(tmpDir, 'target.dita');
            const referencerPath = path.join(tmpDir, 'referencer.dita');

            fs.writeFileSync(targetPath, '<topic id="t1"><title>T</title></topic>');
            fs.writeFileSync(referencerPath,
                '<topic id="r1"><title>R</title><body><p conkeyref="mykey/t1">x</p></body></topic>');

            const doc = createDoc(fs.readFileSync(targetPath, 'utf-8'), URI.file(targetPath).toString());
            const docs = createDocs(doc);

            const edit = await handleRename(
                { textDocument: { uri: doc.uri }, position: { line: 0, character: 12 }, newName: 't1new' },
                docs,
                [tmpDir]
                // no keySpaceService
            );

            const referencerUri = URI.file(referencerPath).toString();
            assert.ok(!edit?.changes?.[referencerUri],
                'without a KeySpaceService, an unverifiable conkeyref must not be rewritten');
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    test('cursor not on an id attribute returns null', async () => {
        const doc = createDoc('<topic id="t1"><title>T</title></topic>');
        const docs = createDocs(doc);
        const edit = await handleRename(
            { textDocument: { uri: doc.uri }, position: { line: 0, character: 0 }, newName: 'x' },
            docs
        );
        assert.strictEqual(edit, null);
    });
});
