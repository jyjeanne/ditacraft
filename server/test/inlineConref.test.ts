import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { URI } from 'vscode-uri';
import { handleComputeInlineConrefEdit, findConrefElementAtOffset, rebaseContentReferences, rebaseReference, resolvedOpenTag } from '../src/features/inlineConref';
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

            // Workspace-folder scoping (`tmpDir` as the only root) comes from
            // `keySpaceService.getWorkspaceFolders()` -- narrowed internally
            // via `effectiveWorkspaceFolders`, not passed in directly.
            const keySpaceService = createKeySpaceService(tmpDir);
            try {
                const result = await handleComputeInlineConrefEdit({ uri, offset }, createDocs(), keySpaceService);
                assert.strictEqual(result.edit, null);
                assert.ok(result.reason?.includes('workspace'));
            } finally {
                keySpaceService.shutdown();
            }
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

    /** Inline the conref of `sourceRel`'s first reuse element; both files written first. */
    async function inline(files: Record<string, string>, sourceRel: string): Promise<{ newText?: string; reason?: string }> {
        for (const [rel, content] of Object.entries(files)) {
            fs.mkdirSync(path.dirname(path.join(tmpDir, rel)), { recursive: true });
            fs.writeFileSync(path.join(tmpDir, rel), content);
        }
        const sourcePath = path.join(tmpDir, sourceRel);
        const uri = URI.file(sourcePath).toString();
        const offset = files[sourceRel].search(/conref=|conkeyref=/);
        const result = await handleComputeInlineConrefEdit({ uri, offset }, createDocs(), undefined);
        return { newText: result.edit?.changes?.[uri]?.[0].newText, reason: result.reason };
    }

    test('the inlined element gets the target element\'s attributes it does not set, except id (regression: a reused important note became a plain note)', async () => {
        const result = await inline({
            'shared.dita': '<topic id="t"><body><note id="backup" type="important" audience="admin" outputclass="boxed">Back up <b id="b1">first</b>.</note></body></topic>',
            'topic.dita': '<topic id="u"><body><note audience="user" conref="shared.dita#t/backup"/></body></topic>',
        }, 'topic.dita');
        assert.strictEqual(result.newText, '<note audience="user" type="important" outputclass="boxed">Back up <b>first</b>.</note>');
    });

    test('-dita-use-conref-target takes the target\'s value; every conref attribute is consumed', async () => {
        const result = await inline({
            'shared.dita': '<topic id="t"><body><note id="n" type="warning" product=\'kit\'>Careful.</note></body></topic>',
            'topic.dita': '<topic id="u"><body><note id="mine" type="-dita-use-conref-target" conref="shared.dita#t/n" conkeyref="k/n"></note></body></topic>',
        }, 'topic.dita');
        assert.strictEqual(result.newText, '<note id="mine" type="warning" product=\'kit\'>Careful.</note>');
    });

    test('relative references among the target\'s attributes are rewritten for the new place', async () => {
        const files = {
            'shared/lib.dita': '<topic id="lib"><body>'
                + '<image id="logo" href="../images/logo.png" placement="break"/>'
                + '<xref id="x1" href="#lib/other"/><xref id="x2" href="#./other"/><xref id="x3" href="https://example.com/a b"/>'
                + '<p id="other">Other.</p></body></topic>',
            'topic.dita': '<topic id="u"><body><image conref="shared/lib.dita#lib/logo"/><xref conref="shared/lib.dita#lib/x1"/>'
                + '<xref conref="shared/lib.dita#lib/x2"/><xref conref="shared/lib.dita#lib/x3"/></body></topic>',
        };
        assert.strictEqual((await inline(files, 'topic.dita')).newText, '<image href="images/logo.png" placement="break"></image>');
        const at = async (needle: string) => {
            const uri = URI.file(path.join(tmpDir, 'topic.dita')).toString();
            const result = await handleComputeInlineConrefEdit({ uri, offset: files['topic.dita'].indexOf(needle) }, createDocs(), undefined);
            return result.edit?.changes?.[uri]?.[0].newText;
        };
        assert.strictEqual(await at('lib/x1'), '<xref href="shared/lib.dita#lib/other"></xref>', 'a same-file reference names the file');
        assert.strictEqual(await at('lib/x2'), '<xref href="shared/lib.dita#lib/other"></xref>', 'a same-topic reference names the file and the topic');
        assert.strictEqual(await at('lib/x3'), '<xref href="https://example.com/a b"></xref>', 'a URL stays');
    });

    test('relative references inside the inlined content are rewritten for the new place (regression: they were copied as written)', async () => {
        const result = await inline({
            'shared/lib.dita': '<topic id="lib"><body><note id="n">See <xref href="other.dita"/>, <image href="../images/a.png"/>, '
                + '<ph conref="#lib/word"/>, <xref href="#./sec"/>, <xref href="https://example.com/x" scope="external"/>, <xref keyref="k"/>'
                + '<!-- <xref href="old.dita"/> --></note><p id="word">w</p><section id="sec"/></body></topic>',
            'topic.dita': '<topic id="u"><body><note conref="shared/lib.dita#lib/n"/></body></topic>',
        }, 'topic.dita');
        assert.strictEqual(result.newText, '<note>See <xref href="shared/other.dita"/>, <image href="images/a.png"/>, '
            + '<ph conref="shared/lib.dita#lib/word"/>, <xref href="shared/lib.dita#lib/sec"/>, <xref href="https://example.com/x" scope="external"/>, <xref keyref="k"/>'
            + '<!-- <xref href="old.dita"/> --></note>');
    });

    test('references inside the content stay as written when the target is in the same folder', async () => {
        const result = await inline({
            'shared.dita': '<topic id="t"><body><note id="n">See <xref href="other.dita#o/p"/> and <image href="img/a.png"/>.</note></body></topic>',
            'topic.dita': '<topic id="u"><body><note conref="shared.dita#t/n"/></body></topic>',
        }, 'topic.dita');
        assert.strictEqual(result.newText, '<note>See <xref href="other.dita#o/p"/> and <image href="img/a.png"/>.</note>');
    });

    test('refuses a conrefend range or a conaction push (not one element)', async () => {
        const target = '<topic id="t"><body><p id="a">A</p><p id="b">B</p></body></topic>';
        const range = await inline({ 'shared.dita': target, 'topic.dita': '<topic id="u"><body><p conref="shared.dita#t/a" conrefend="shared.dita#t/b"/></body></topic>' }, 'topic.dita');
        assert.strictEqual(range.newText, undefined);
        assert.ok(/conrefend/.test(range.reason ?? ''), range.reason ?? '');
        const push = await inline({ 'shared.dita': target, 'topic.dita': '<topic id="u"><body><p conaction="pushreplace" conref="shared.dita#t/a">New A</p></body></topic>' }, 'topic.dita');
        assert.strictEqual(push.newText, undefined);
    });
});

suite('resolvedOpenTag', () => {
    const same = (v: string) => v;
    test('keeps the referencing tag as written, adds the target\'s other attributes before ">"', () => {
        assert.strictEqual(resolvedOpenTag('<p\n   outputclass="x"\n   conref="a.dita#t/p"/>', '<p id="p" class="- topic/p " audience="a">', same), '<p\n   outputclass="x" audience="a">');
        assert.strictEqual(resolvedOpenTag('<p conref="#t/p">', '<p id="p"/>', same), '<p>');
    });
});

suite('rebaseContentReferences', () => {
    test('rewrites reference attributes in start tags only, keeping quotes and layout', () => {
        const up = (v: string) => `up/${v}`;
        assert.strictEqual(
            rebaseContentReferences('a <xref\n  href=\'x.dita\' outputclass="href"/><?pi href="p"?><![CDATA[<image href="c"/>]]><data href="d" name="n"/>', up),
            'a <xref\n  href=\'up/x.dita\' outputclass="href"/><?pi href="p"?><![CDATA[<image href="c"/>]]><data href="up/d" name="n"/>');
        assert.strictEqual(rebaseContentReferences('plain text', up), 'plain text');
    });
});

suite('rebaseReference', () => {
    test('rewrites a relative reference written in one file for another', () => {
        const from = path.join(path.sep, 'w', 'shared', 'lib.dita');
        const to = path.join(path.sep, 'w', 'topics', 'a.dita');
        assert.strictEqual(rebaseReference('../images/x.png', from, to, 'lib'), '../images/x.png', 'sibling folders: the same path');
        assert.strictEqual(rebaseReference('img/x.png#f', from, to, 'lib'), '../shared/img/x.png#f');
        assert.strictEqual(rebaseReference('#lib/el', from, to, 'lib'), '../shared/lib.dita#lib/el');
        assert.strictEqual(rebaseReference('#./el', from, to, 'lib'), '../shared/lib.dita#lib/el');
        assert.strictEqual(rebaseReference('#./el', from, from, 'lib'), '#./el', 'same file: unchanged');
        assert.strictEqual(rebaseReference('mailto:a@b.c', from, to, 'lib'), 'mailto:a@b.c');
        assert.strictEqual(rebaseReference('/abs/x.png', from, to, 'lib'), '/abs/x.png');
    });
});
