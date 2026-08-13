import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { URI } from 'vscode-uri';
import { handlePrepareRename, handleRename } from '../src/features/rename';
import { KeySpaceService, KeyDefinition } from '../src/services/keySpaceService';
import { createDoc, createDocs } from './helper';

/**
 * `resolveEntry` defaults to `resolve` — most tests don't distinguish
 * resolveKey() (follows @keyref chains) from resolveKeyEntry() (doesn't);
 * pass a distinct one only when a test needs to simulate a candidate
 * resolving through an indirection chain differently than the raw entry.
 */
function mockKeySpaceService(
    resolve: (keyName: string, contextFilePath: string) => KeyDefinition | null,
    resolveEntry: (keyName: string, contextFilePath: string) => KeyDefinition | null = resolve
): KeySpaceService {
    return {
        resolveKey: async (keyName: string, contextFilePath: string) => resolve(keyName, contextFilePath),
        resolveKeyEntry: async (keyName: string, contextFilePath: string) => resolveEntry(keyName, contextFilePath),
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

    test('multiple conkeyrefs in one file resolve concurrently without mismatching edit-to-ref (regression)', async () => {
        // Regression for parallelizing resolveKey calls: each ref's match
        // result must still map to that same ref's own text edit, not get
        // shuffled by concurrent resolution order.
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
        try {
            const targetPath = path.join(tmpDir, 'target.dita');
            const unrelatedPath = path.join(tmpDir, 'unrelated.dita');
            fs.writeFileSync(targetPath, '<topic id="t1"><title>T</title></topic>');
            fs.writeFileSync(unrelatedPath, '<topic id="t1"><title>U</title></topic>');

            const referencerPath = path.join(tmpDir, 'referencer.dita');
            fs.writeFileSync(referencerPath,
                '<topic id="r1"><title>R</title><body>' +
                '<p conkeyref="badkey1/t1">a</p>' +
                '<p conkeyref="goodkey/t1">b</p>' +
                '<p conkeyref="badkey2/t1">c</p>' +
                '</body></topic>');

            const doc = createDoc(fs.readFileSync(targetPath, 'utf-8'), URI.file(targetPath).toString());
            const docs = createDocs(doc);

            const keySpaceService = mockKeySpaceService((keyName) =>
                keyName === 'goodkey'
                    ? { keyName: 'goodkey', targetFile: targetPath, sourceMap: targetPath }
                    : { keyName, targetFile: unrelatedPath, sourceMap: unrelatedPath }
            );

            const edit = await handleRename(
                { textDocument: { uri: doc.uri }, position: { line: 0, character: 12 }, newName: 't1new' },
                docs,
                [tmpDir],
                keySpaceService
            );

            const referencerUri = URI.file(referencerPath).toString();
            const edits = edit?.changes?.[referencerUri];
            assert.ok(edits, 'referencer file should have an edit');
            assert.strictEqual(edits!.length, 1, 'only the goodkey conkeyref should be rewritten');
            assert.strictEqual(edits![0].newText, 'goodkey/t1new');
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

            const logs: string[] = [];
            const edit = await handleRename(
                { textDocument: { uri: doc.uri }, position: { line: 0, character: 12 }, newName: 't1new' },
                docs,
                [tmpDir],
                // no keySpaceService
                undefined,
                (msg) => logs.push(msg)
            );

            const referencerUri = URI.file(referencerPath).toString();
            assert.ok(!edit?.changes?.[referencerUri],
                'without a KeySpaceService, an unverifiable conkeyref must not be rewritten');
            assert.ok(
                logs.some(m => m.includes('mykey/t1')),
                'skipping an unverifiable conkeyref should be logged so it is not silently dropped (regression)'
            );
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

suite('handlePrepareRename — key rename', () => {
    test('cursor on a single-key "keys" attribute value returns its range', () => {
        const doc = createDoc('<keydef keys="mykey" href="target.dita"/>');
        const docs = createDocs(doc);
        const range = handlePrepareRename(
            { textDocument: { uri: doc.uri }, position: { line: 0, character: 16 } },
            docs
        );
        assert.ok(range, 'should return a range on the keys value');
    });

    test('cursor on one token within a multi-key "keys" attribute returns just that token', () => {
        const content = '<keydef keys="alpha beta gamma" href="target.dita"/>';
        const doc = createDoc(content);
        const docs = createDocs(doc);
        const offset = doc.positionAt(content.indexOf('beta') + 1);

        const range = handlePrepareRename(
            { textDocument: { uri: doc.uri }, position: offset },
            docs
        );
        assert.ok(range, 'should return a range on the beta token');

        const start = doc.offsetAt(range!.start);
        const end = doc.offsetAt(range!.end);
        assert.strictEqual(content.slice(start, end), 'beta', 'range should bound only the beta token');
    });

    test('cursor on href attribute (not keys) returns null', () => {
        const content = '<keydef keys="mykey" href="target.dita"/>';
        const doc = createDoc(content);
        const docs = createDocs(doc);
        const offset = doc.positionAt(content.indexOf('target.dita'));

        const range = handlePrepareRename(
            { textDocument: { uri: doc.uri }, position: offset },
            docs
        );
        assert.strictEqual(range, null);
    });
});

suite('handleRename — key rename', () => {
    test('renames the keys token itself and a same-file keyref that resolves to it', async () => {
        const content =
            '<map>' +
            '<keydef keys="mykey" href="target.dita"/>' +
            '<topicref keyref="mykey"/>' +
            '</map>';
        const doc = createDoc(content, URI.file('/workspace/root.ditamap').toString());
        const docs = createDocs(doc);

        const keydefLine = 1; // 1-based line of the keydef (mirrors KeyDefinition.sourceLine)
        const keySpaceService = mockKeySpaceService((keyName) =>
            keyName === 'mykey'
                ? { keyName: 'mykey', sourceMap: '/workspace/root.ditamap', sourceLine: keydefLine }
                : null
        );

        const offset = doc.positionAt(content.indexOf('mykey') + 1);
        const edit = await handleRename(
            { textDocument: { uri: doc.uri }, position: offset, newName: 'mykeynew' },
            docs,
            ['/workspace'],
            keySpaceService
        );

        assert.ok(edit?.changes);
        const edits = edit!.changes![doc.uri];
        assert.strictEqual(edits.length, 2, 'should rewrite both the keys token and the keyref');
        assert.ok(edits.some(e => e.newText === 'mykeynew'));
    });

    test('same-file keyref resolving to a DIFFERENT key definition (name collision, different scope) is NOT rewritten', async () => {
        // Two keydefs happen to share the literal text "mykey" — e.g. two
        // different keyscopes — but the keyref only resolves to one of them.
        // Renaming the cursor's definition must not touch the unrelated keyref.
        const content =
            '<map>' +
            '<keydef keys="mykey" href="target.dita"/>' +
            '<topicref keyref="mykey"/>' +
            '</map>';
        const doc = createDoc(content, URI.file('/workspace/root.ditamap').toString());
        const docs = createDocs(doc);

        // The mock resolves "mykey" to a definition in a DIFFERENT file/line
        // than the one the cursor is on, simulating a same-named key that
        // actually wins resolution from a different scope.
        const keySpaceService = mockKeySpaceService((keyName) =>
            keyName === 'mykey'
                ? { keyName: 'mykey', sourceMap: '/workspace/other-scope.ditamap', sourceLine: 5 }
                : null
        );

        const offset = doc.positionAt(content.indexOf('mykey') + 1);
        const edit = await handleRename(
            { textDocument: { uri: doc.uri }, position: offset, newName: 'mykeynew' },
            docs,
            ['/workspace'],
            keySpaceService
        );

        assert.ok(edit?.changes);
        const edits = edit!.changes![doc.uri];
        assert.strictEqual(edits.length, 1, 'only the keys token itself should be rewritten');
        assert.strictEqual(edits[0].newText, 'mykeynew');
    });

    test('same-file keyref is still rewritten despite a stale (disk-cached) sourceLine, when the key is unambiguous in this file (regression)', async () => {
        // KeySpaceService only ever reads map content from disk and caches
        // the result — it can't see this document's unsaved edits. Simulate
        // that: the live cursor computes line 1, but the mock (standing in
        // for a stale disk-cached KeySpaceService) reports a different line
        // for the same file, as if an earlier, unsaved edit shifted the
        // keydef's position. Since "mykey" is defined only once in this
        // document, that staleness must not block the same-file rewrite.
        const content =
            '<map>' +
            '<keydef keys="mykey" href="target.dita"/>' +
            '<topicref keyref="mykey"/>' +
            '</map>';
        const doc = createDoc(content, URI.file('/workspace/root.ditamap').toString());
        const docs = createDocs(doc);

        const keySpaceService = mockKeySpaceService((keyName) =>
            keyName === 'mykey'
                ? { keyName: 'mykey', sourceMap: '/workspace/root.ditamap', sourceLine: 99 } // stale line
                : null
        );

        const offset = doc.positionAt(content.indexOf('mykey') + 1);
        const edit = await handleRename(
            { textDocument: { uri: doc.uri }, position: offset, newName: 'mykeynew' },
            docs,
            ['/workspace'],
            keySpaceService
        );

        assert.ok(edit?.changes);
        const edits = edit!.changes![doc.uri];
        assert.strictEqual(edits.length, 2, 'both the keys token and the keyref should be rewritten despite the stale line');
        assert.ok(edits.every(e => e.newText === 'mykeynew'));
    });

    test('same-file keyref with a stale sourceLine is NOT rewritten when the key is ambiguous in this file (regression)', async () => {
        // Two distinct definitions of "mykey" exist in this same document
        // (e.g. different inline @keyscope branches) — line-based
        // disambiguation still matters here, so a stale/mismatched line must
        // still block the rewrite rather than being waved through.
        const content =
            '<map>' +
            '<topicref keyscope="a" keys="mykey" href="a.dita"/>' +
            '<topicref keyscope="b" keys="mykey" href="b.dita"/>' +
            '<topicref keyref="mykey"/>' +
            '</map>';
        const doc = createDoc(content, URI.file('/workspace/root.ditamap').toString());
        const docs = createDocs(doc);

        // The candidate resolves (via scope b, say) to a line that doesn't
        // match the cursor's own (scope a) definition.
        const keySpaceService = mockKeySpaceService((keyName) =>
            keyName === 'mykey'
                ? { keyName: 'mykey', sourceMap: '/workspace/root.ditamap', sourceLine: 99 }
                : null
        );

        const offset = doc.positionAt(content.indexOf('mykey') + 1);
        const edit = await handleRename(
            { textDocument: { uri: doc.uri }, position: offset, newName: 'mykeynew' },
            docs,
            ['/workspace'],
            keySpaceService
        );

        assert.ok(edit?.changes);
        const edits = edit!.changes![doc.uri];
        assert.strictEqual(edits.length, 1, 'only the keys token at the cursor should be rewritten — the ambiguous keyref is left alone');
    });

    test('cross-file keyref resolving to the renamed key is rewritten, keyref to an unrelated key is not', async () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
        try {
            const rootMapPath = path.join(tmpDir, 'root.ditamap');
            const referencerPath = path.join(tmpDir, 'referencer.dita');
            const elsewherePath = path.join(tmpDir, 'elsewhere.dita');

            fs.writeFileSync(rootMapPath, '<map><keydef keys="mykey" href="target.dita"/></map>');
            fs.writeFileSync(referencerPath, '<topic id="r1"><title>R</title><body><p><xref keyref="mykey">x</xref></p></body></topic>');
            fs.writeFileSync(elsewherePath, '<topic id="e1"><title>E</title><body><p><xref keyref="otherkey">x</xref></p></body></topic>');

            const doc = createDoc(fs.readFileSync(rootMapPath, 'utf-8'), URI.file(rootMapPath).toString());
            const docs = createDocs(doc);

            const normalizedRootMap = rootMapPath;
            const keySpaceService = mockKeySpaceService((keyName) =>
                keyName === 'mykey'
                    ? { keyName: 'mykey', sourceMap: normalizedRootMap, sourceLine: 1 }
                    : keyName === 'otherkey'
                        ? { keyName: 'otherkey', sourceMap: path.join(tmpDir, 'unrelated.ditamap'), sourceLine: 1 }
                        : null
            );

            const content = fs.readFileSync(rootMapPath, 'utf-8');
            const offset = doc.positionAt(content.indexOf('mykey') + 1);

            const edit = await handleRename(
                { textDocument: { uri: doc.uri }, position: offset, newName: 'mykeynew' },
                docs,
                [tmpDir],
                keySpaceService
            );

            const referencerUri = URI.file(referencerPath).toString();
            const elsewhereUri = URI.file(elsewherePath).toString();
            assert.ok(edit?.changes?.[referencerUri], 'referencer.dita keyref should be rewritten');
            assert.strictEqual(edit!.changes![referencerUri][0].newText, 'mykeynew');
            assert.ok(!edit?.changes?.[elsewhereUri], 'elsewhere.dita references a different key and must be untouched');
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    test('conkeyref usage has its key-name prefix renamed while the element-id suffix is preserved', async () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
        try {
            const rootMapPath = path.join(tmpDir, 'root.ditamap');
            const referencerPath = path.join(tmpDir, 'referencer.dita');

            fs.writeFileSync(rootMapPath, '<map><keydef keys="mykey" href="target.dita"/></map>');
            fs.writeFileSync(referencerPath, '<topic id="r1"><title>R</title><body><p conkeyref="mykey/elem1">x</p></body></topic>');

            const doc = createDoc(fs.readFileSync(rootMapPath, 'utf-8'), URI.file(rootMapPath).toString());
            const docs = createDocs(doc);

            const keySpaceService = mockKeySpaceService((keyName) =>
                keyName === 'mykey'
                    ? { keyName: 'mykey', sourceMap: rootMapPath, sourceLine: 1 }
                    : null
            );

            const content = fs.readFileSync(rootMapPath, 'utf-8');
            const offset = doc.positionAt(content.indexOf('mykey') + 1);

            const edit = await handleRename(
                { textDocument: { uri: doc.uri }, position: offset, newName: 'mykeynew' },
                docs,
                [tmpDir],
                keySpaceService
            );

            const referencerUri = URI.file(referencerPath).toString();
            assert.ok(edit?.changes?.[referencerUri]);
            assert.strictEqual(edit!.changes![referencerUri][0].newText, 'mykeynew/elem1');
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    test('an indirect keyref on another keydef ("keys=a keyref=b") is rewritten when renaming b', async () => {
        // <keydef keys="alias" keyref="mykey"/> chains to "mykey" — the keyref
        // attribute here is on a *keydef* element, not a content reference, but
        // it's still a genuine usage of the key and must be renamed along with
        // every other keyref/conkeyref usage.
        const content =
            '<map>' +
            '<keydef keys="mykey" href="target.dita"/>' +
            '<keydef keys="alias" keyref="mykey"/>' +
            '</map>';
        const doc = createDoc(content, URI.file('/workspace/root.ditamap').toString());
        const docs = createDocs(doc);

        const keySpaceService = mockKeySpaceService((keyName) =>
            keyName === 'mykey'
                ? { keyName: 'mykey', sourceMap: '/workspace/root.ditamap', sourceLine: 1 }
                : null
        );

        const offset = doc.positionAt(content.indexOf('mykey') + 1);
        const edit = await handleRename(
            { textDocument: { uri: doc.uri }, position: offset, newName: 'mykeynew' },
            docs,
            ['/workspace'],
            keySpaceService
        );

        assert.ok(edit?.changes);
        const edits = edit!.changes![doc.uri];
        assert.strictEqual(edits.length, 2, 'should rewrite the keys token and the indirect keyref chain');
        assert.ok(edits.every(e => e.newText === 'mykeynew'));
    });

    test('the whole rename is refused when no KeySpaceService is available (regression)', async () => {
        // Unlike ID rename (where only conkeyref needs KeySpaceService, so
        // href/conref matches are still rewritten without one), key rename
        // needs it to verify *every* keyref/conkeyref match — a bare keyref
        // value *is* the key name being renamed. Doing just the definition-
        // site edit and silently skipping every reference would return an
        // apparently-successful rename that actually leaves every usage
        // dangling with no signal the editor UI would surface. Refusing the
        // whole rename is the safe behavior instead.
        const content =
            '<map>' +
            '<keydef keys="mykey" href="target.dita"/>' +
            '<topicref keyref="mykey"/>' +
            '</map>';
        const doc = createDoc(content, URI.file('/workspace/root.ditamap').toString());
        const docs = createDocs(doc);

        const logs: string[] = [];
        const offset = doc.positionAt(content.indexOf('mykey') + 1);
        const edit = await handleRename(
            { textDocument: { uri: doc.uri }, position: offset, newName: 'mykeynew' },
            docs,
            ['/workspace'],
            // no keySpaceService
            undefined,
            (msg) => logs.push(msg)
        );

        assert.strictEqual(edit, null, 'the rename should be refused entirely, not partially applied');
        assert.ok(logs.some(m => m.includes('Refusing') && m.includes('KeySpaceService')),
            'refusing should be logged with a clear reason');
    });

    test('renaming one token in a multi-key "keys" attribute leaves the other tokens untouched', async () => {
        const content = '<keydef keys="alpha beta gamma" href="target.dita"/>';
        const doc = createDoc(content, URI.file('/workspace/root.ditamap').toString());
        const docs = createDocs(doc);

        const keySpaceService = mockKeySpaceService(() => null);

        const offset = doc.positionAt(content.indexOf('beta') + 1);
        const edit = await handleRename(
            { textDocument: { uri: doc.uri }, position: offset, newName: 'betanew' },
            docs,
            ['/workspace'],
            keySpaceService
        );

        assert.ok(edit?.changes);
        const edits = edit!.changes![doc.uri];
        assert.strictEqual(edits.length, 1, 'only the beta token should be rewritten');
        assert.strictEqual(edits[0].newText, 'betanew');

        const startOffset = doc.offsetAt(edits[0].range.start);
        const endOffset = doc.offsetAt(edits[0].range.end);
        assert.strictEqual(content.slice(startOffset, endOffset), 'beta');
    });

    test('a whitespace-containing new name is refused rather than corrupting a multi-key list (regression)', async () => {
        const content = '<keydef keys="alpha beta gamma" href="target.dita"/>';
        const doc = createDoc(content, URI.file('/workspace/root.ditamap').toString());
        const docs = createDocs(doc);

        const keySpaceService = mockKeySpaceService(() => null);
        const logs: string[] = [];

        const offset = doc.positionAt(content.indexOf('beta') + 1);
        const edit = await handleRename(
            { textDocument: { uri: doc.uri }, position: offset, newName: 'new name' },
            docs,
            ['/workspace'],
            keySpaceService,
            (msg) => logs.push(msg)
        );

        assert.strictEqual(edit, null, 'a name containing whitespace must not be spliced into the keys list');
        assert.ok(logs.some(m => m.includes('whitespace')), 'refusing should be logged with a clear reason');
    });

    test('renaming an alias key (keys="alias" keyref="target") updates its own direct usages (regression)', async () => {
        // resolveKey() follows @keyref chains to their ultimate target, so
        // naively using it to verify a candidate keyref="alias" usage would
        // resolve past "alias" itself to "target"'s identity and never match
        // — resolveKeyEntry() (no chain-following) is what makes this work.
        const content =
            '<map>' +
            '<keydef keys="target" href="target.dita"/>' +
            '<keydef keys="alias" keyref="target"/>' +
            '<topicref keyref="alias"/>' +
            '</map>';
        const doc = createDoc(content, URI.file('/workspace/root.ditamap').toString());
        const docs = createDocs(doc);

        const aliasSourceMap = '/workspace/root.ditamap';
        const aliasKeyDef: KeyDefinition = { keyName: 'alias', keyref: 'target', sourceMap: aliasSourceMap, sourceLine: 1 };
        const targetKeyDef: KeyDefinition = { keyName: 'target', sourceMap: aliasSourceMap, sourceLine: 1 };

        const keySpaceService = mockKeySpaceService(
            // resolveKey(): follows the chain past the alias, to "target" — the
            // wrong identity for verifying a usage of "alias" itself.
            (keyName) => keyName === 'alias' ? targetKeyDef : keyName === 'target' ? targetKeyDef : null,
            // resolveKeyEntry(): returns the alias's own raw entry, unresolved.
            (keyName) => keyName === 'alias' ? aliasKeyDef : keyName === 'target' ? targetKeyDef : null
        );

        const offset = doc.positionAt(content.indexOf('"alias"') + 1);
        const edit = await handleRename(
            { textDocument: { uri: doc.uri }, position: offset, newName: 'alias2' },
            docs,
            ['/workspace'],
            keySpaceService
        );

        assert.ok(edit?.changes);
        const edits = edit!.changes![doc.uri];
        // The alias's own keys="alias" token, plus the topicref's keyref="alias"
        // usage — both should be rewritten to "alias2".
        assert.strictEqual(edits.length, 2, 'both the alias definition and its direct usage should be rewritten');
        assert.ok(edits.every(e => e.newText === 'alias2'));
    });
});
