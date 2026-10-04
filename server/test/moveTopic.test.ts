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

    test('leaves a moved file\'s own references alone when they still resolve (in-place rename)', async () => {
        const oldPath = path.join(tmpDir, 'target.dita');
        const newPath = path.join(tmpDir, 'renamed.dita');
        const siblingPath = path.join(tmpDir, 'sibling.dita');

        fs.writeFileSync(siblingPath, '<topic id="s1"><title>S</title></topic>');
        // The moved file's own outbound href to sibling.dita is unaffected by
        // this in-place rename (same directory, so it's not stale).
        fs.writeFileSync(newPath, '<topic id="t1"><body><xref href="sibling.dita"/></body></topic>');

        const result = await handleComputeMoveEdits(
            { moves: [{ oldUri: URI.file(oldPath).toString(), newUri: URI.file(newPath).toString() }] },
            createDocs(),
            [tmpDir]
        );

        assert.ok(!result, 'nothing to rewrite');
    });

    /** Moves (old → new relative paths) applied on disk, then the edits computed: newTexts per file. */
    async function moveFiles(files: Record<string, string>, moves: Record<string, string>, docs = createDocs()) {
        for (const [rel, content] of Object.entries(files)) {
            fs.mkdirSync(path.dirname(path.join(tmpDir, rel)), { recursive: true });
            fs.writeFileSync(path.join(tmpDir, rel), content);
        }
        for (const [from, to] of Object.entries(moves)) {
            fs.mkdirSync(path.dirname(path.join(tmpDir, to)), { recursive: true });
            fs.renameSync(path.join(tmpDir, from), path.join(tmpDir, to));
        }
        const result = await handleComputeMoveEdits({
            moves: Object.entries(moves).map(([from, to]) => ({ oldUri: URI.file(path.join(tmpDir, from)).toString(), newUri: URI.file(path.join(tmpDir, to)).toString() })),
        }, docs, [tmpDir]);
        const byFile: Record<string, string[]> = {};
        for (const [uri, edits] of Object.entries(result?.changes ?? {})) {
            byFile[path.relative(tmpDir, URI.parse(uri).fsPath).split(path.sep).join('/')] = edits.map(e => e.newText);
        }
        return byFile;
    }

    test('rewrites a moved file\'s own references for its new folder (regression: they were left pointing from the old one)', async () => {
        const byFile = await moveFiles({
            'shared/notices.dita': '<topic id="notices"><title>N</title></topic>',
            'topics/install.dita': '<topic id="install"><title>I</title></topic>',
            'topics/setup.dita': '<topic id="setup"><title>S</title><body>'
                + '<note conref="../shared/notices.dita#notices/backup"/><image href="../images/a.png"/>'
                + '<xref href="install.dita"/><xref href="#setup/x"/><xref href="https://example.com/a.dita" scope="external"/>'
                + '<object data="media/v.mp4" codebase="media/"/></body></topic>',
        }, { 'topics/setup.dita': 'topics/config/setup.dita' });
        assert.deepStrictEqual(byFile['topics/config/setup.dita'], [
            '../../shared/notices.dita#notices/backup', '../../images/a.png', '../install.dita', '../media/v.mp4', '../media/',
        ], 'fragment-only references and URLs stay');
    });

    test('leaves references inside comments and CDATA sections (code samples) as written', async () => {
        const byFile = await moveFiles({
            'a.dita': '<topic id="a"><title>A</title><body><!-- <xref href="b.dita"/> --><codeblock><![CDATA[<xref href="b.dita"/>]]></codeblock>'
                + '<xref href="b.dita"/></body></topic>',
            'b.dita': '<topic id="b"><title>B</title></topic>',
        }, { 'a.dita': 'sub/a.dita' });
        assert.deepStrictEqual(byFile['sub/a.dita'], ['../b.dita']);
    });

    test('files moved together keep pointing at each other where they are now', async () => {
        const byFile = await moveFiles({
            'a.dita': '<topic id="a"><title>A</title><body><xref href="b.dita"/><xref href="c.dita"/></body></topic>',
            'b.dita': '<topic id="b"><title>B</title><body><xref href="a.dita#a"/></body></topic>',
            'c.dita': '<topic id="c"><title>C</title><body><xref href="a.dita"/><xref href="b.dita"/></body></topic>',
        }, { 'a.dita': 'sub/a.dita', 'b.dita': 'sub/b.dita' });
        assert.deepStrictEqual(byFile['sub/a.dita'], ['../c.dita'], 'b.dita is still next to it');
        assert.strictEqual(byFile['sub/b.dita'], undefined, 'a.dita is still next to it');
        assert.deepStrictEqual(byFile['c.dita'], ['sub/a.dita', 'sub/b.dita']);
    });

    test('a renamed file\'s references to itself follow the rename', async () => {
        const byFile = await moveFiles({
            'target.dita': '<topic id="t1"><title>T</title><body><xref href="target.dita#t1/x"/><p id="x"/></body></topic>',
        }, { 'target.dita': 'renamed.dita' });
        assert.deepStrictEqual(byFile['renamed.dita'], ['renamed.dita#t1/x']);
    });

    test('a moved folder moves everything in it: references in and out follow, references inside stay (regression: folder moves were ignored)', async () => {
        const byFile = await moveFiles({
            'map.ditamap': '<map><topicref href="topics/a.dita"/><topicref href="topics/sub/c.dita"/><topicref href="other.dita"/></map>',
            'other.dita': '<topic id="o"><title>O</title></topic>',
            'shared/s.dita': '<topic id="s"><title>S</title><body><image href="../topics/images/x.png"/><xref href="../topics/a.dita#a"/></body></topic>',
            'topics/a.dita': '<topic id="a"><title>A</title><body><xref href="b.dita"/><image href="images/x.png"/>'
                + '<xref href="../shared/s.dita"/><image href="../images/logo.png"/></body></topic>',
            'topics/b.dita': '<topic id="b"><title>B</title></topic>',
            'topics/images/x.png': 'png',
            'topics/sub/c.dita': '<topic id="c"><title>C</title><body><xref href="../a.dita"/><xref href="../../other.dita"/></body></topic>',
        }, { 'topics': 'content/topics' });
        assert.deepStrictEqual(byFile['map.ditamap'], ['content/topics/a.dita', 'content/topics/sub/c.dita']);
        assert.deepStrictEqual(byFile['shared/s.dita'], ['../content/topics/images/x.png', '../content/topics/a.dita#a'], 'an image in the folder follows it too');
        assert.deepStrictEqual(byFile['content/topics/a.dita'], ['../../shared/s.dita', '../../images/logo.png'], 'b.dita and images/x.png moved with it');
        assert.deepStrictEqual(byFile['content/topics/sub/c.dita'], ['../../../other.dita']);
        assert.strictEqual(byFile['other.dita'], undefined);
    });

    test('a renamed image or .ditaval: the references to it follow (regression: only DITA files and folders were followed)', async () => {
        const byFile = await moveFiles({
            'map.ditamap': '<map><ditavalref href="filters/web.ditaval"/><topicref href="topics/t.dita"/></map>',
            'filters/web.ditaval': '<val/>',
            'topics/t.dita': '<topic id="t"><title>T</title><body><image href="../images/old.png"/><image href="../images/other.png"/></body></topic>',
            'images/old.png': 'png',
            'images/other.png': 'png',
        }, { 'images/old.png': 'images/logo.png', 'filters/web.ditaval': 'profiles/web.ditaval' });
        assert.deepStrictEqual(byFile['map.ditamap'], ['profiles/web.ditaval']);
        assert.deepStrictEqual(byFile['topics/t.dita'], ['../images/logo.png'], 'other.png untouched');
        assert.strictEqual(Object.keys(byFile).length, 2, 'the moved files themselves are not read as DITA');
    });

    test('a folder renamed in place: references into it follow (a folder reference keeps its /)', async () => {
        const byFile = await moveFiles({
            't.dita': '<topic id="t"><title>T</title><body><image href="images/a.png"/><object data="images/v.mp4" codebase="images/"/></body></topic>',
            'images/a.png': 'png',
            'images/v.mp4': 'mp4',
        }, { 'images': 'pictures' });
        assert.deepStrictEqual(byFile['t.dita'], ['pictures/a.png', 'pictures/v.mp4', 'pictures/']);
    });

    test('rewrites an inbound conrefend, and keeps percent-encoded spaces encoded', async () => {
        const byFile = await moveFiles({
            'shared.dita': '<topic id="s"><title>S</title><body><p id="a"/><p id="b"/></body></topic>',
            'topic.dita': '<topic id="t"><title>T</title><body><p conref="shared.dita#s/a" conrefend="shared.dita#s/b"/>'
                + '<image href="my%20images/a.png"/></body></topic>',
        }, { 'shared.dita': 'lib/shared.dita', 'topic.dita': 'topics/topic.dita' });
        assert.deepStrictEqual(byFile['topics/topic.dita'], ['../lib/shared.dita#s/a', '../lib/shared.dita#s/b', '../my%20images/a.png']);
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
