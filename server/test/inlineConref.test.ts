import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { URI } from 'vscode-uri';
import { handleComputeInlineConrefEdit, findConrefElementAtOffset } from '../src/features/inlineConref';
import { KeySpaceService } from '../src/services/keySpaceService';
import { createDoc, createDocs } from './helper';

function createKeySpaceService(tmpDir: string): KeySpaceService {
    return new KeySpaceService(
        [tmpDir],
        async () => ({ keySpaceCacheTtlMinutes: 5, maxLinkMatches: 10000 }),
        () => {}
    );
}

suite('findConrefElementAtOffset', () => {
    test('finds a self-closing conref element containing the offset', () => {
        const text = '<topic id="t"><body><p conref="x.dita#t/e"/></body></topic>';
        const offset = text.indexOf('conref');
        const result = findConrefElementAtOffset(text, offset);
        assert.ok(result);
        assert.strictEqual(result!.attrType, 'conref');
        assert.strictEqual(result!.attrValue, 'x.dita#t/e');
        assert.strictEqual(result!.tagName, 'p');
    });

    test('finds a conkeyref element', () => {
        const text = '<topic id="t"><body><p conkeyref="mykey/e"></p></body></topic>';
        const offset = text.indexOf('conkeyref');
        const result = findConrefElementAtOffset(text, offset);
        assert.ok(result);
        assert.strictEqual(result!.attrType, 'conkeyref');
        assert.strictEqual(result!.attrValue, 'mykey/e');
    });

    test('returns undefined when the cursor is not on a conref/conkeyref element', () => {
        const text = '<topic id="t"><body><p>No reference here.</p></body></topic>';
        const offset = text.indexOf('No reference');
        assert.strictEqual(findConrefElementAtOffset(text, offset), undefined);
    });

    test('does not match a conref-looking fragment inside a comment', () => {
        const text = '<body><!-- <p conref="fake.dita#t/e"/> --><p>Real.</p></body>';
        const offset = text.indexOf('Real');
        assert.strictEqual(findConrefElementAtOffset(text, offset), undefined);
    });
});

suite('handleComputeInlineConrefEdit', () => {
    let tmpDir: string;

    setup(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-inlineconref-test-'));
    });

    teardown(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    test('inlines a same-file conref (no file part in the fragment)', async () => {
        const filePath = path.join(tmpDir, 'topic.dita');
        fs.writeFileSync(
            filePath,
            '<topic id="t"><body><p id="source">Canonical text.</p><p conref="#source"/></body></topic>'
        );
        const uri = URI.file(filePath).toString();
        const offset = fs.readFileSync(filePath, 'utf-8').indexOf('conref');

        const result = await handleComputeInlineConrefEdit({ uri, offset }, createDocs(), undefined);

        assert.ok(result.edit, result.reason ?? 'expected an edit');
        const edit = result.edit!.changes![uri][0];
        assert.strictEqual(edit.newText, '<p>Canonical text.</p>');
    });

    test('inlines a cross-file conref, resolving the target relative to the source file\'s directory', async () => {
        const targetPath = path.join(tmpDir, 'shared.dita');
        fs.writeFileSync(targetPath, '<topic id="t"><body><p id="warning">Shared warning text.</p></body></topic>');
        const sourcePath = path.join(tmpDir, 'topic.dita');
        fs.writeFileSync(sourcePath, '<topic id="t"><body><p conref="shared.dita#t/warning"/></body></topic>');
        const uri = URI.file(sourcePath).toString();
        const offset = fs.readFileSync(sourcePath, 'utf-8').indexOf('conref');

        const result = await handleComputeInlineConrefEdit({ uri, offset }, createDocs(), undefined);

        assert.ok(result.edit, result.reason ?? 'expected an edit');
        assert.strictEqual(result.edit!.changes![uri][0].newText, '<p>Shared warning text.</p>');
    });

    test('inlines a conkeyref using the usage\'s own /elementid suffix', async () => {
        fs.writeFileSync(path.join(tmpDir, 'shared.dita'), '<topic id="t"><body><p id="e1">First.</p><p id="e2">Second.</p></body></topic>');
        fs.writeFileSync(
            path.join(tmpDir, 'root.ditamap'),
            '<?xml version="1.0"?><map><keydef keys="mykey" href="shared.dita"/></map>'
        );
        const sourcePath = path.join(tmpDir, 'topic.dita');
        fs.writeFileSync(sourcePath, '<topic id="t"><body><p conkeyref="mykey/e2"/></body></topic>');
        const uri = URI.file(sourcePath).toString();
        const offset = fs.readFileSync(sourcePath, 'utf-8').indexOf('conkeyref');
        const keySpaceService = createKeySpaceService(tmpDir);

        try {
            const result = await handleComputeInlineConrefEdit({ uri, offset }, createDocs(), keySpaceService);
            assert.ok(result.edit, result.reason ?? 'expected an edit');
            assert.strictEqual(result.edit!.changes![uri][0].newText, '<p>Second.</p>');
        } finally {
            keySpaceService.shutdown();
        }
    });

    test('falls back to the keydef\'s own element id when the conkeyref usage has none', async () => {
        fs.writeFileSync(path.join(tmpDir, 'shared.dita'), '<topic id="t"><body><p id="e1">Default target.</p></body></topic>');
        fs.writeFileSync(
            path.join(tmpDir, 'root.ditamap'),
            '<?xml version="1.0"?><map><keydef keys="mykey" href="shared.dita#t/e1"/></map>'
        );
        const sourcePath = path.join(tmpDir, 'topic.dita');
        fs.writeFileSync(sourcePath, '<topic id="t"><body><p conkeyref="mykey"/></body></topic>');
        const uri = URI.file(sourcePath).toString();
        const offset = fs.readFileSync(sourcePath, 'utf-8').indexOf('conkeyref');
        const keySpaceService = createKeySpaceService(tmpDir);

        try {
            const result = await handleComputeInlineConrefEdit({ uri, offset }, createDocs(), keySpaceService);
            assert.ok(result.edit, result.reason ?? 'expected an edit');
            assert.strictEqual(result.edit!.changes![uri][0].newText, '<p>Default target.</p>');
        } finally {
            keySpaceService.shutdown();
        }
    });

    test('returns a reason (no edit) when the cursor is not on a conref/conkeyref element', async () => {
        const filePath = path.join(tmpDir, 'topic.dita');
        fs.writeFileSync(filePath, '<topic id="t"><body><p>Plain paragraph.</p></body></topic>');
        const uri = URI.file(filePath).toString();
        const offset = fs.readFileSync(filePath, 'utf-8').indexOf('Plain');

        const result = await handleComputeInlineConrefEdit({ uri, offset }, createDocs(), undefined);
        assert.strictEqual(result.edit, null);
        assert.ok(result.reason);
    });

    test('returns a reason when the target element is not found in the target file', async () => {
        const targetPath = path.join(tmpDir, 'shared.dita');
        fs.writeFileSync(targetPath, '<topic id="t"><body><p id="other">x</p></body></topic>');
        const sourcePath = path.join(tmpDir, 'topic.dita');
        fs.writeFileSync(sourcePath, '<topic id="t"><body><p conref="shared.dita#t/missing"/></body></topic>');
        const uri = URI.file(sourcePath).toString();
        const offset = fs.readFileSync(sourcePath, 'utf-8').indexOf('conref');

        const result = await handleComputeInlineConrefEdit({ uri, offset }, createDocs(), undefined);
        assert.strictEqual(result.edit, null);
        assert.ok(result.reason?.includes('missing'));
    });

    test('returns a reason when no keySpaceService is available to resolve a conkeyref', async () => {
        const sourcePath = path.join(tmpDir, 'topic.dita');
        fs.writeFileSync(sourcePath, '<topic id="t"><body><p conkeyref="mykey/e"/></body></topic>');
        const uri = URI.file(sourcePath).toString();
        const offset = fs.readFileSync(sourcePath, 'utf-8').indexOf('conkeyref');

        const result = await handleComputeInlineConrefEdit({ uri, offset }, createDocs(), undefined);
        assert.strictEqual(result.edit, null);
        assert.ok(result.reason);
    });

    test('returns a reason when the conkeyref\'s key cannot be resolved', async () => {
        fs.writeFileSync(path.join(tmpDir, 'root.ditamap'), '<?xml version="1.0"?><map/>');
        const sourcePath = path.join(tmpDir, 'topic.dita');
        fs.writeFileSync(sourcePath, '<topic id="t"><body><p conkeyref="nosuchkey/e"/></body></topic>');
        const uri = URI.file(sourcePath).toString();
        const offset = fs.readFileSync(sourcePath, 'utf-8').indexOf('conkeyref');
        const keySpaceService = createKeySpaceService(tmpDir);

        try {
            const result = await handleComputeInlineConrefEdit({ uri, offset }, createDocs(), keySpaceService);
            assert.strictEqual(result.edit, null);
            assert.ok(result.reason?.includes('nosuchkey'));
        } finally {
            keySpaceService.shutdown();
        }
    });

    test('preserves the referencing element\'s other attributes (e.g. id, outputclass)', async () => {
        const filePath = path.join(tmpDir, 'topic.dita');
        fs.writeFileSync(
            filePath,
            '<topic id="t"><body><p id="source">Text.</p><p id="ref1" outputclass="note" conref="#source"/></body></topic>'
        );
        const uri = URI.file(filePath).toString();
        const offset = fs.readFileSync(filePath, 'utf-8').indexOf('id="ref1"');

        const result = await handleComputeInlineConrefEdit({ uri, offset }, createDocs(), undefined);
        assert.ok(result.edit, result.reason ?? 'expected an edit');
        assert.strictEqual(result.edit!.changes![uri][0].newText, '<p id="ref1" outputclass="note">Text.</p>');
    });

    test('splices in an empty body when the target element is itself self-closing/empty', async () => {
        const filePath = path.join(tmpDir, 'topic.dita');
        fs.writeFileSync(
            filePath,
            '<topic id="t"><body><data id="source"/><p conref="#source"/></body></topic>'
        );
        const uri = URI.file(filePath).toString();
        const offset = fs.readFileSync(filePath, 'utf-8').indexOf('conref');

        const result = await handleComputeInlineConrefEdit({ uri, offset }, createDocs(), undefined);
        assert.ok(result.edit, result.reason ?? 'expected an edit');
        assert.strictEqual(result.edit!.changes![uri][0].newText, '<p></p>');
    });

    test('preserves nested markup in the target content verbatim', async () => {
        const filePath = path.join(tmpDir, 'topic.dita');
        fs.writeFileSync(
            filePath,
            '<topic id="t"><body><p id="source">Text with <b>bold</b> emphasis.</p><p conref="#source"/></body></topic>'
        );
        const uri = URI.file(filePath).toString();
        const offset = fs.readFileSync(filePath, 'utf-8').indexOf('conref');

        const result = await handleComputeInlineConrefEdit({ uri, offset }, createDocs(), undefined);
        assert.ok(result.edit, result.reason ?? 'expected an edit');
        assert.strictEqual(result.edit!.changes![uri][0].newText, '<p>Text with <b>bold</b> emphasis.</p>');
    });

    test('uses in-memory (unsaved) content over stale disk content for the source document', async () => {
        const filePath = path.join(tmpDir, 'topic.dita');
        fs.writeFileSync(filePath, '<topic id="t"><body><p id="source">Old.</p><p>no conref here on disk</p></body></topic>');
        const uri = URI.file(filePath).toString();
        // Unsaved buffer adds a conref the disk copy doesn't have.
        const liveText = '<topic id="t"><body><p id="source">Old.</p><p conref="#source"/></body></topic>';
        const openDoc = createDoc(liveText, uri);
        const offset = liveText.indexOf('conref');

        const result = await handleComputeInlineConrefEdit({ uri, offset }, createDocs(openDoc), undefined);
        assert.ok(result.edit, result.reason ?? 'expected an edit');
        assert.strictEqual(result.edit!.changes![uri][0].newText, '<p>Old.</p>');
    });

    test('strips id attributes from nested descendants of the inlined content (regression: duplicate-id risk)', async () => {
        const filePath = path.join(tmpDir, 'topic.dita');
        fs.writeFileSync(
            filePath,
            '<topic id="t"><body><p id="source">Text with <ph id="marker">important</ph> emphasis.</p><p conref="#source"/></body></topic>'
        );
        const uri = URI.file(filePath).toString();
        const offset = fs.readFileSync(filePath, 'utf-8').indexOf('conref');

        const result = await handleComputeInlineConrefEdit({ uri, offset }, createDocs(), undefined);
        assert.ok(result.edit, result.reason ?? 'expected an edit');
        const newText = result.edit!.changes![uri][0].newText;
        assert.strictEqual(newText, '<p>Text with <ph>important</ph> emphasis.</p>');
        assert.ok(!newText.includes('id='));
    });

    test('rejects a conref target path that resolves outside the workspace (regression: path traversal)', async () => {
        const outsideDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-inlineconref-outside-'));
        try {
            const outsidePath = path.join(outsideDir, 'secret.dita');
            fs.writeFileSync(outsidePath, '<topic id="t"><body><p id="x">Secret.</p></body></topic>');

            const sourcePath = path.join(tmpDir, 'topic.dita');
            const relToOutside = path.relative(tmpDir, outsidePath);
            fs.writeFileSync(sourcePath, `<topic id="t"><body><p conref="${relToOutside}#t/x"/></body></topic>`);
            const uri = URI.file(sourcePath).toString();
            const offset = fs.readFileSync(sourcePath, 'utf-8').indexOf('conref');

            const result = await handleComputeInlineConrefEdit({ uri, offset }, createDocs(), undefined, [tmpDir]);
            assert.strictEqual(result.edit, null);
            assert.ok(result.reason?.includes('workspace'));
        } finally {
            fs.rmSync(outsideDir, { recursive: true, force: true });
        }
    });

    test('uses in-memory (unsaved) content over stale disk content for the target document', async () => {
        const targetPath = path.join(tmpDir, 'shared.dita');
        fs.writeFileSync(targetPath, '<topic id="t"><body><p id="e">Stale disk text.</p></body></topic>');
        const targetUri = URI.file(targetPath).toString();
        const liveTargetDoc = createDoc('<topic id="t"><body><p id="e">Fresh unsaved text.</p></body></topic>', targetUri);

        const sourcePath = path.join(tmpDir, 'topic.dita');
        fs.writeFileSync(sourcePath, '<topic id="t"><body><p conref="shared.dita#t/e"/></body></topic>');
        const uri = URI.file(sourcePath).toString();
        const offset = fs.readFileSync(sourcePath, 'utf-8').indexOf('conref');

        const result = await handleComputeInlineConrefEdit({ uri, offset }, createDocs(liveTargetDoc), undefined);
        assert.ok(result.edit, result.reason ?? 'expected an edit');
        assert.strictEqual(result.edit!.changes![uri][0].newText, '<p>Fresh unsaved text.</p>');
    });
});
