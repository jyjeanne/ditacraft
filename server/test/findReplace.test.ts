import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { URI } from 'vscode-uri';
import { handleComputeFindReplaceEdits, buildSearchPattern, expandReplacement } from '../src/features/findReplace';
import { createDoc, createDocs } from './helper';

suite('buildSearchPattern', () => {
    test('escapes literal query characters when not in regex mode', () => {
        const pattern = buildSearchPattern('a.b', false, true, false);
        assert.strictEqual(pattern.test('axb'), false, 'the literal "." must not match any character');
        assert.strictEqual(pattern.test('a.b'), true);
    });

    test('uses the query as-is (unescaped) in regex mode', () => {
        const pattern = buildSearchPattern('a.b', true, true, false);
        assert.strictEqual(pattern.test('axb'), true);
    });

    test('is case-insensitive when caseSensitive is false', () => {
        const pattern = buildSearchPattern('foo', false, false, false);
        assert.strictEqual(pattern.test('FOO'), true);
    });

    test('is case-sensitive when caseSensitive is true', () => {
        const pattern = buildSearchPattern('foo', false, true, false);
        assert.strictEqual(pattern.test('FOO'), false);
    });

    test('anchors to word boundaries when wholeWord is true', () => {
        const pattern = buildSearchPattern('cat', false, true, true);
        assert.strictEqual(pattern.test('concatenate'), false, 'should not match "cat" inside "concatenate"');
        assert.strictEqual(pattern.test('the cat sat'), true);
    });

    test('throws for an invalid regex in regex mode', () => {
        assert.throws(() => buildSearchPattern('(unclosed', true, true, false));
    });
});

suite('expandReplacement', () => {
    function matchOf(text: string, re: RegExp): RegExpExecArray {
        const m = re.exec(text);
        assert.ok(m, 'expected a match');
        return m!;
    }

    test('expands $& to the full match', () => {
        const m = matchOf('hello world', /world/);
        assert.strictEqual(expandReplacement('[$&]', m), '[world]');
    });

    test('expands $1/$2 to capture groups', () => {
        const m = matchOf('2024-01-15', /(\d{4})-(\d{2})-(\d{2})/);
        assert.strictEqual(expandReplacement('$2/$3/$1', m), '01/15/2024');
    });

    test('expands $$ to a literal dollar sign', () => {
        const m = matchOf('100', /100/);
        assert.strictEqual(expandReplacement('$$100', m), '$100');
    });

    test('leaves a reference to a non-existent group untouched', () => {
        const m = matchOf('abc', /abc/);
        assert.strictEqual(expandReplacement('$9', m), '$9');
    });
});

suite('handleComputeFindReplaceEdits', () => {
    let tmpDir: string;

    setup(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-findreplace-test-'));
    });

    teardown(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    const baseParams = {
        query: '',
        replacement: '',
        useRegex: false,
        caseSensitive: true,
        wholeWord: false
    };

    test('returns an empty result when no workspace folders are given', async () => {
        const result = await handleComputeFindReplaceEdits(
            { ...baseParams, query: 'x' },
            createDocs(),
            undefined
        );
        assert.deepStrictEqual(result, { edit: null, matchCount: 0, fileCount: 0 });
    });

    test('returns an empty result for an empty query', async () => {
        const result = await handleComputeFindReplaceEdits(baseParams, createDocs(), [tmpDir]);
        assert.deepStrictEqual(result, { edit: null, matchCount: 0, fileCount: 0 });
    });

    test('returns an empty result for an invalid regex query', async () => {
        const result = await handleComputeFindReplaceEdits(
            { ...baseParams, query: '(unclosed', useRegex: true },
            createDocs(),
            [tmpDir]
        );
        assert.deepStrictEqual(result, { edit: null, matchCount: 0, fileCount: 0 });
    });

    test('replaces a literal match across a single file', async () => {
        const filePath = path.join(tmpDir, 'topic.dita');
        fs.writeFileSync(filePath, '<topic id="t1"><title>Old Title</title></topic>');

        const result = await handleComputeFindReplaceEdits(
            { ...baseParams, query: 'Old Title', replacement: 'New Title' },
            createDocs(),
            [tmpDir]
        );

        const uri = URI.file(filePath).toString();
        assert.strictEqual(result.matchCount, 1);
        assert.strictEqual(result.fileCount, 1);
        assert.strictEqual(result.edit!.changes![uri][0].newText, 'New Title');
    });

    test('replaces every occurrence within a file, not just the first', async () => {
        const filePath = path.join(tmpDir, 'topic.dita');
        fs.writeFileSync(filePath, '<topic id="t1"><p>foo</p><p>foo</p><p>foo</p></topic>');

        const result = await handleComputeFindReplaceEdits(
            { ...baseParams, query: 'foo', replacement: 'bar' },
            createDocs(),
            [tmpDir]
        );

        assert.strictEqual(result.matchCount, 3);
    });

    test('scans every DITA content file in the workspace, skipping unrelated file types', async () => {
        const ditaPath = path.join(tmpDir, 'a.dita');
        const mapPath = path.join(tmpDir, 'b.ditamap');
        const txtPath = path.join(tmpDir, 'c.txt');
        fs.writeFileSync(ditaPath, '<topic id="a"><title>needle</title></topic>');
        fs.writeFileSync(mapPath, '<map><topicref navtitle="needle"/></map>');
        fs.writeFileSync(txtPath, 'needle');

        const result = await handleComputeFindReplaceEdits(
            { ...baseParams, query: 'needle', replacement: 'found' },
            createDocs(),
            [tmpDir]
        );

        assert.strictEqual(result.fileCount, 2, 'only the two DITA files should be scanned');
        assert.ok(result.edit!.changes![URI.file(ditaPath).toString()]);
        assert.ok(result.edit!.changes![URI.file(mapPath).toString()]);
        assert.ok(!result.edit!.changes![URI.file(txtPath).toString()]);
    });

    test('restricts the search to scopeUri when given', async () => {
        const filePathA = path.join(tmpDir, 'a.dita');
        const filePathB = path.join(tmpDir, 'b.dita');
        fs.writeFileSync(filePathA, '<topic id="a"><title>needle</title></topic>');
        fs.writeFileSync(filePathB, '<topic id="b"><title>needle</title></topic>');

        const result = await handleComputeFindReplaceEdits(
            { ...baseParams, query: 'needle', replacement: 'found', scopeUri: URI.file(filePathA).toString() },
            createDocs(),
            [tmpDir]
        );

        assert.strictEqual(result.fileCount, 1);
        assert.ok(result.edit!.changes![URI.file(filePathA).toString()]);
        assert.ok(!result.edit!.changes![URI.file(filePathB).toString()]);
    });

    test('ignores a match inside an XML comment (comment-aware matching)', async () => {
        const filePath = path.join(tmpDir, 'topic.dita');
        fs.writeFileSync(
            filePath,
            '<topic id="t1"><!-- needle in a comment --><p>needle in real content</p></topic>'
        );

        const result = await handleComputeFindReplaceEdits(
            { ...baseParams, query: 'needle', replacement: 'found' },
            createDocs(),
            [tmpDir]
        );

        assert.strictEqual(result.matchCount, 1, 'only the occurrence outside the comment should match');
    });

    test('ignores a match inside a CDATA section (comment-aware matching)', async () => {
        const filePath = path.join(tmpDir, 'topic.dita');
        fs.writeFileSync(
            filePath,
            '<topic id="t1"><p><![CDATA[needle in cdata]]>needle in real content</p></topic>'
        );

        const result = await handleComputeFindReplaceEdits(
            { ...baseParams, query: 'needle', replacement: 'found' },
            createDocs(),
            [tmpDir]
        );

        assert.strictEqual(result.matchCount, 1);
    });

    test('preserves match offsets so a replacement lands at the right position despite blanked comments', async () => {
        // The stripped (comment-blanked) text and the original text differ
        // in *content* but must stay identical in *length/line structure* --
        // this verifies a replacement computed against the stripped text
        // still applies correctly to the real, unblanked original.
        const filePath = path.join(tmpDir, 'topic.dita');
        const content = '<topic id="t1"><!-- a comment --><title>needle</title></topic>';
        fs.writeFileSync(filePath, content);

        const result = await handleComputeFindReplaceEdits(
            { ...baseParams, query: 'needle', replacement: 'found' },
            createDocs(),
            [tmpDir]
        );

        const uri = URI.file(filePath).toString();
        const edit = result.edit!.changes![uri][0];
        assert.strictEqual(edit.newText, 'found');
        assert.strictEqual(
            content.slice(
                content.indexOf('needle'),
                content.indexOf('needle') + 'needle'.length
            ),
            'needle',
            'sanity check on the fixture itself'
        );
    });

    test('uses in-memory (unsaved) content over stale disk content for an open document', async () => {
        const filePath = path.join(tmpDir, 'topic.dita');
        fs.writeFileSync(filePath, '<topic id="t1"><title>old</title></topic>'); // stale on disk
        const uri = URI.file(filePath).toString();
        const openDoc = createDoc('<topic id="t1"><title>needle</title></topic>', uri);

        const result = await handleComputeFindReplaceEdits(
            { ...baseParams, query: 'needle', replacement: 'found' },
            createDocs(openDoc),
            [tmpDir]
        );

        assert.strictEqual(result.matchCount, 1, 'should search the in-memory buffer, not stale disk content');
    });

    test('expands regex capture groups in the replacement when useRegex is true', async () => {
        const filePath = path.join(tmpDir, 'topic.dita');
        fs.writeFileSync(filePath, '<topic id="t1"><p>2024-01-15</p></topic>');

        const result = await handleComputeFindReplaceEdits(
            {
                ...baseParams,
                query: '(\\d{4})-(\\d{2})-(\\d{2})',
                replacement: '$2/$3/$1',
                useRegex: true
            },
            createDocs(),
            [tmpDir]
        );

        const uri = URI.file(filePath).toString();
        assert.strictEqual(result.edit!.changes![uri][0].newText, '01/15/2024');
    });

    test('treats $ as a literal character in non-regex mode (regression)', async () => {
        const filePath = path.join(tmpDir, 'topic.dita');
        fs.writeFileSync(filePath, '<topic id="t1"><p>price</p></topic>');

        const result = await handleComputeFindReplaceEdits(
            { ...baseParams, query: 'price', replacement: '$1 each' },
            createDocs(),
            [tmpDir]
        );

        const uri = URI.file(filePath).toString();
        assert.strictEqual(
            result.edit!.changes![uri][0].newText,
            '$1 each',
            '$1 must not be treated as a capture-group reference outside regex mode'
        );
    });

    test('respects wholeWord matching', async () => {
        const filePath = path.join(tmpDir, 'topic.dita');
        fs.writeFileSync(filePath, '<topic id="t1"><p>cat concatenate cat</p></topic>');

        const result = await handleComputeFindReplaceEdits(
            { ...baseParams, query: 'cat', replacement: 'dog', wholeWord: true },
            createDocs(),
            [tmpDir]
        );

        assert.strictEqual(result.matchCount, 2, 'only the two standalone "cat" occurrences should match');
    });

    test('matches a whole word ending in an accented character (regression: \\b is ASCII-only)', async () => {
        const filePath = path.join(tmpDir, 'topic.dita');
        fs.writeFileSync(filePath, '<topic id="t1"><p>Le café est chaud</p></topic>');

        const result = await handleComputeFindReplaceEdits(
            { ...baseParams, query: 'café', replacement: 'thé', wholeWord: true },
            createDocs(),
            [tmpDir]
        );

        assert.strictEqual(result.matchCount, 1, 'a bare \\b would fail to find a boundary after "é"');
    });

    test('does not match "café" as a substring of a longer accented word with wholeWord (regression)', async () => {
        const filePath = path.join(tmpDir, 'topic.dita');
        fs.writeFileSync(filePath, '<topic id="t1"><p>cafétéria</p></topic>');

        const result = await handleComputeFindReplaceEdits(
            { ...baseParams, query: 'café', replacement: 'thé', wholeWord: true },
            createDocs(),
            [tmpDir]
        );

        assert.strictEqual(result.matchCount, 0, '"café" inside "cafétéria" is not a standalone word');
    });

    test('does not rewrite a non-DITA file even when explicitly scoped to it (regression)', async () => {
        const txtPath = path.join(tmpDir, 'notes.txt');
        fs.writeFileSync(txtPath, 'needle');

        const result = await handleComputeFindReplaceEdits(
            { ...baseParams, query: 'needle', replacement: 'found', scopeUri: URI.file(txtPath).toString() },
            createDocs(),
            [tmpDir]
        );

        assert.deepStrictEqual(
            result,
            { edit: null, matchCount: 0, fileCount: 0 },
            'a non-DITA scopeUri must be rejected, not silently rewritten'
        );
    });

    test('correctly scans a file count larger than the bounded-concurrency limit (regression)', async () => {
        const fileCount = 15; // > MAX_CONCURRENT_READS (10)
        for (let i = 0; i < fileCount; i++) {
            fs.writeFileSync(path.join(tmpDir, `topic-${i}.dita`), `<topic id="t${i}"><title>needle</title></topic>`);
        }

        const result = await handleComputeFindReplaceEdits(
            { ...baseParams, query: 'needle', replacement: 'found' },
            createDocs(),
            [tmpDir]
        );

        assert.strictEqual(result.fileCount, fileCount, 'every file should be scanned regardless of the concurrency cap');
        assert.strictEqual(result.matchCount, fileCount);
    });

    test('does not hang on a zero-length-match-capable regex (regression)', async function() {
        this.timeout(5000);
        const filePath = path.join(tmpDir, 'topic.dita');
        fs.writeFileSync(filePath, '<topic id="t1"><p>abc</p></topic>');

        const result = await handleComputeFindReplaceEdits(
            { ...baseParams, query: 'x*', replacement: '-', useRegex: true },
            createDocs(),
            [tmpDir]
        );

        assert.ok(result.matchCount > 0, 'should complete and report at least the zero-length matches found');
    });

    test('returns an empty result when nothing matches anywhere', async () => {
        const filePath = path.join(tmpDir, 'topic.dita');
        fs.writeFileSync(filePath, '<topic id="t1"><title>Title</title></topic>');

        const result = await handleComputeFindReplaceEdits(
            { ...baseParams, query: 'not-present-anywhere', replacement: 'x' },
            createDocs(),
            [tmpDir]
        );

        assert.deepStrictEqual(result, { edit: null, matchCount: 0, fileCount: 0 });
    });
});
