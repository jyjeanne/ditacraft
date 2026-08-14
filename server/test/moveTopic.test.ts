import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { URI } from 'vscode-uri';
import { handleComputeMoveEdits } from '../src/features/moveTopic';
import { createDoc, createDocs } from './helper';

suite('handleComputeMoveEdits', () => {
    let tmpDir: string;

    setup(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-movetopic-test-'));
    });

    teardown(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    test('returns null when no workspace folders are given', async () => {
        const result = await handleComputeMoveEdits({ moves: [] }, createDocs(), undefined);
        assert.strictEqual(result, null);
    });

    test('returns null when no moved file was a DITA file', async () => {
        const oldPath = path.join(tmpDir, 'notes.txt');
        const newPath = path.join(tmpDir, 'renamed-notes.txt');
        fs.writeFileSync(oldPath, 'not dita');

        const result = await handleComputeMoveEdits(
            { moves: [{ oldUri: URI.file(oldPath).toString(), newUri: URI.file(newPath).toString() }] },
            createDocs(),
            [tmpDir]
        );
        assert.strictEqual(result, null);
    });

    test('rewrites a same-directory inbound href to the moved file, leaves an unrelated href untouched', async () => {
        const oldPath = path.join(tmpDir, 'target.dita');
        const newPath = path.join(tmpDir, 'renamed.dita');
        const referencerPath = path.join(tmpDir, 'referencer.dita');
        const elsewherePath = path.join(tmpDir, 'elsewhere.dita');

        fs.writeFileSync(newPath, '<topic id="t1"><title>T</title></topic>'); // simulates the file already having moved on disk
        fs.writeFileSync(referencerPath, '<topic id="r1"><title>R</title><body><xref href="target.dita"/></body></topic>');
        fs.writeFileSync(elsewherePath, '<topic id="e1"><title>E</title><body><xref href="somewhere-else.dita"/></body></topic>');

        const result = await handleComputeMoveEdits(
            { moves: [{ oldUri: URI.file(oldPath).toString(), newUri: URI.file(newPath).toString() }] },
            createDocs(),
            [tmpDir]
        );

        assert.ok(result?.changes, 'expected a WorkspaceEdit with changes');
        const referencerUri = URI.file(referencerPath).toString();
        const elsewhereUri = URI.file(elsewherePath).toString();
        assert.ok(result!.changes![referencerUri], 'referencer.dita should be rewritten');
        assert.strictEqual(result!.changes![referencerUri][0].newText, 'renamed.dita');
        assert.ok(!result!.changes![elsewhereUri], 'elsewhere.dita points at a different file and must be untouched');
    });

    test('preserves the #fragment portion of a rewritten href', async () => {
        const oldPath = path.join(tmpDir, 'target.dita');
        const newPath = path.join(tmpDir, 'renamed.dita');
        const referencerPath = path.join(tmpDir, 'referencer.dita');

        fs.writeFileSync(newPath, '<topic id="t1"><title>T</title></topic>');
        fs.writeFileSync(referencerPath, '<topic id="r1"><title>R</title><body><xref href="target.dita#t1"/></body></topic>');

        const result = await handleComputeMoveEdits(
            { moves: [{ oldUri: URI.file(oldPath).toString(), newUri: URI.file(newPath).toString() }] },
            createDocs(),
            [tmpDir]
        );

        const referencerUri = URI.file(referencerPath).toString();
        assert.strictEqual(result!.changes![referencerUri][0].newText, 'renamed.dita#t1');
    });

    test('recomputes a correct relative path when the file moves into a subdirectory', async () => {
        const oldPath = path.join(tmpDir, 'target.dita');
        const subDir = path.join(tmpDir, 'sub');
        fs.mkdirSync(subDir);
        const newPath = path.join(subDir, 'target.dita');
        const referencerPath = path.join(tmpDir, 'referencer.dita');

        fs.writeFileSync(newPath, '<topic id="t1"><title>T</title></topic>');
        fs.writeFileSync(referencerPath, '<topic id="r1"><title>R</title><body><xref href="target.dita"/></body></topic>');

        const result = await handleComputeMoveEdits(
            { moves: [{ oldUri: URI.file(oldPath).toString(), newUri: URI.file(newPath).toString() }] },
            createDocs(),
            [tmpDir]
        );

        const referencerUri = URI.file(referencerPath).toString();
        assert.strictEqual(result!.changes![referencerUri][0].newText, 'sub/target.dita');
    });

    test('rewrites conref the same way as href', async () => {
        const oldPath = path.join(tmpDir, 'target.dita');
        const newPath = path.join(tmpDir, 'renamed.dita');
        const referencerPath = path.join(tmpDir, 'referencer.dita');

        fs.writeFileSync(newPath, '<topic id="t1"><p id="p1">X</p></topic>');
        fs.writeFileSync(referencerPath, '<topic id="r1"><body><p conref="target.dita#t1/p1"/></body></topic>');

        const result = await handleComputeMoveEdits(
            { moves: [{ oldUri: URI.file(oldPath).toString(), newUri: URI.file(newPath).toString() }] },
            createDocs(),
            [tmpDir]
        );

        const referencerUri = URI.file(referencerPath).toString();
        assert.strictEqual(result!.changes![referencerUri][0].newText, 'renamed.dita#t1/p1');
    });

    test('does not rewrite references inside the moved file itself (inbound-only scope)', async () => {
        const oldPath = path.join(tmpDir, 'target.dita');
        const newPath = path.join(tmpDir, 'renamed.dita');
        const siblingPath = path.join(tmpDir, 'sibling.dita');

        fs.writeFileSync(siblingPath, '<topic id="s1"><title>S</title></topic>');
        // The moved file's own outbound href to sibling.dita is unaffected by
        // this in-place rename (same directory, so it's not even stale) --
        // and would stay unrewritten even if it were, per the documented
        // inbound-only scope.
        fs.writeFileSync(newPath, '<topic id="t1"><body><xref href="sibling.dita"/></body></topic>');

        const result = await handleComputeMoveEdits(
            { moves: [{ oldUri: URI.file(oldPath).toString(), newUri: URI.file(newPath).toString() }] },
            createDocs(),
            [tmpDir]
        );

        // Only the moved file itself has any href in this fixture, and it's
        // excluded from rewriting -- so no changes at all are expected.
        assert.ok(!result, 'the moved file itself must not appear in the returned edits');
    });

    test('uses in-memory (unsaved) content over stale disk content for an open referencing document', async () => {
        const oldPath = path.join(tmpDir, 'target.dita');
        const newPath = path.join(tmpDir, 'renamed.dita');
        const referencerPath = path.join(tmpDir, 'referencer.dita');

        fs.writeFileSync(newPath, '<topic id="t1"><title>T</title></topic>');
        // Disk content has no reference at all yet...
        fs.writeFileSync(referencerPath, '<topic id="r1"><title>R</title></topic>');

        // ...but the open (unsaved) buffer already has one added.
        const referencerUri = URI.file(referencerPath).toString();
        const openDoc = createDoc(
            '<topic id="r1"><title>R</title><body><xref href="target.dita"/></body></topic>',
            referencerUri
        );
        const docs = createDocs(openDoc);

        const result = await handleComputeMoveEdits(
            { moves: [{ oldUri: URI.file(oldPath).toString(), newUri: URI.file(newPath).toString() }] },
            docs,
            [tmpDir]
        );

        assert.ok(result?.changes?.[referencerUri], 'should scan the in-memory buffer, not stale disk content');
        assert.strictEqual(result!.changes![referencerUri][0].newText, 'renamed.dita');
    });

    test('handles multiple simultaneous moves in one request', async () => {
        const oldPathA = path.join(tmpDir, 'a.dita');
        const newPathA = path.join(tmpDir, 'a-renamed.dita');
        const oldPathB = path.join(tmpDir, 'b.dita');
        const newPathB = path.join(tmpDir, 'b-renamed.dita');
        const referencerPath = path.join(tmpDir, 'referencer.dita');

        fs.writeFileSync(newPathA, '<topic id="a1"><title>A</title></topic>');
        fs.writeFileSync(newPathB, '<topic id="b1"><title>B</title></topic>');
        fs.writeFileSync(
            referencerPath,
            '<topic id="r1"><body><xref href="a.dita"/><xref href="b.dita"/></body></topic>'
        );

        const result = await handleComputeMoveEdits(
            {
                moves: [
                    { oldUri: URI.file(oldPathA).toString(), newUri: URI.file(newPathA).toString() },
                    { oldUri: URI.file(oldPathB).toString(), newUri: URI.file(newPathB).toString() },
                ]
            },
            createDocs(),
            [tmpDir]
        );

        const referencerUri = URI.file(referencerPath).toString();
        const edits = result!.changes![referencerUri];
        assert.strictEqual(edits.length, 2, 'both hrefs should be rewritten');
        const newTexts = edits.map(e => e.newText).sort();
        assert.deepStrictEqual(newTexts, ['a-renamed.dita', 'b-renamed.dita']);
    });

    test('a keyref value is never mistaken for a file path (regression)', async () => {
        const oldPath = path.join(tmpDir, 'target.dita');
        const newPath = path.join(tmpDir, 'renamed.dita');
        const referencerPath = path.join(tmpDir, 'referencer.dita');

        fs.writeFileSync(newPath, '<topic id="t1"><title>T</title></topic>');
        // "target.dita" also happens to be usable as a bare keyref value here
        // -- must not be resolved as if it were a relative file path.
        fs.writeFileSync(referencerPath, '<topic id="r1"><body><topicref keyref="target.dita"/></body></topic>');

        const result = await handleComputeMoveEdits(
            { moves: [{ oldUri: URI.file(oldPath).toString(), newUri: URI.file(newPath).toString() }] },
            createDocs(),
            [tmpDir]
        );

        assert.ok(!result, 'a keyref attribute must never be treated as a file-path reference');
    });
});
