import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { URI } from 'vscode-uri';
import { handleComputeBatchMetadataEdits } from '../src/features/batchMetadata';
import { SubjectSchemeService } from '../src/services/subjectSchemeService';
import { KeySpaceService } from '../src/services/keySpaceService';
import { createDoc, createDocs } from './helper';

function createKeySpaceService(tmpDir: string): KeySpaceService {
    return new KeySpaceService(
        [tmpDir],
        async () => ({ keySpaceCacheTtlMinutes: 5, maxLinkMatches: 10000 }),
        () => {}
    );
}

function createSchemeService(schemeContent: string, dir: string): SubjectSchemeService {
    const filePath = path.join(dir, 'scheme.ditamap');
    fs.writeFileSync(filePath, schemeContent, 'utf-8');
    const service = new SubjectSchemeService();
    service.registerSchemes([filePath]);
    return service;
}

const NO_SCHEME_SERVICE = new SubjectSchemeService(); // no registerSchemes() call — hasSchemeData() is false

const AUDIENCE_SCHEME = `<subjectScheme>
  <subjectdef keys="aud">
    <subjectdef keys="internal"/>
    <subjectdef keys="external"/>
  </subjectdef>
  <enumerationdef>
    <attributedef name="audience"/>
    <subjectdef keyref="aud"/>
  </enumerationdef>
</subjectScheme>`;

suite('handleComputeBatchMetadataEdits', () => {
    let tmpDir: string;

    setup(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-batchmeta-test-'));
    });

    teardown(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    test('returns an empty result for an empty file list', async () => {
        const result = await handleComputeBatchMetadataEdits(
            { fileUris: [], attribute: 'audience', value: 'internal' },
            createDocs(),
            NO_SCHEME_SERVICE
        );
        assert.deepStrictEqual(result, { edit: null, updatedCount: 0, skipped: [] });
    });

    test('returns an empty result for an empty attribute name', async () => {
        const result = await handleComputeBatchMetadataEdits(
            { fileUris: ['file:///a.dita'], attribute: '', value: 'internal' },
            createDocs(),
            NO_SCHEME_SERVICE
        );
        assert.deepStrictEqual(result, { edit: null, updatedCount: 0, skipped: [] });
    });

    test('sets a new attribute on the root element when it is not already present', async () => {
        const filePath = path.join(tmpDir, 'topic.dita');
        fs.writeFileSync(filePath, '<topic id="t1"><title>T</title></topic>');
        const uri = URI.file(filePath).toString();

        const result = await handleComputeBatchMetadataEdits(
            { fileUris: [uri], attribute: 'audience', value: 'internal' },
            createDocs(),
            NO_SCHEME_SERVICE
        );

        assert.strictEqual(result.updatedCount, 1);
        assert.strictEqual(result.skipped.length, 0);
        assert.strictEqual(result.edit!.changes![uri][0].newText, ' audience="internal"');
    });

    test('replaces the value of an existing attribute on the root element', async () => {
        const filePath = path.join(tmpDir, 'topic.dita');
        fs.writeFileSync(filePath, '<topic id="t1" audience="external"><title>T</title></topic>');
        const uri = URI.file(filePath).toString();

        const result = await handleComputeBatchMetadataEdits(
            { fileUris: [uri], attribute: 'audience', value: 'internal' },
            createDocs(),
            NO_SCHEME_SERVICE
        );

        assert.strictEqual(result.updatedCount, 1);
        assert.strictEqual(result.edit!.changes![uri][0].newText, ' audience="internal"');
    });

    test('removes the attribute entirely when value is an empty string', async () => {
        const filePath = path.join(tmpDir, 'topic.dita');
        fs.writeFileSync(filePath, '<topic id="t1" audience="external"><title>T</title></topic>');
        const uri = URI.file(filePath).toString();

        const result = await handleComputeBatchMetadataEdits(
            { fileUris: [uri], attribute: 'audience', value: '' },
            createDocs(),
            NO_SCHEME_SERVICE
        );

        assert.strictEqual(result.updatedCount, 1);
        assert.strictEqual(result.edit!.changes![uri][0].newText, '');
    });

    test('is a no-op (not an error) when removing an attribute that is not present', async () => {
        const filePath = path.join(tmpDir, 'topic.dita');
        fs.writeFileSync(filePath, '<topic id="t1"><title>T</title></topic>');
        const uri = URI.file(filePath).toString();

        const result = await handleComputeBatchMetadataEdits(
            { fileUris: [uri], attribute: 'audience', value: '' },
            createDocs(),
            NO_SCHEME_SERVICE
        );

        assert.strictEqual(result.updatedCount, 0);
        assert.strictEqual(result.skipped.length, 0, 'nothing-to-remove is not a user-facing error');
        assert.strictEqual(result.edit, null);
    });

    test('treats a whitespace-only value the same as an empty one -- removes the attribute rather than rejecting it (regression)', async () => {
        // `/code-review` fix: a whitespace-only value (length > 0, but
        // trims to "") used to be treated as one invalid token by
        // validateAgainstSubjectScheme (`"".trim().split(/\s+/)` yields
        // `['']`), skipping the file with a confusing `"" not allowed for
        // @audience...` error instead of removing the attribute as the
        // batch-update command's own client-side trim already intends.
        const service = createSchemeService(AUDIENCE_SCHEME, tmpDir);
        const filePath = path.join(tmpDir, 'topic.dita');
        fs.writeFileSync(filePath, '<topic id="t1" audience="external"><title>T</title></topic>');
        const uri = URI.file(filePath).toString();

        const result = await handleComputeBatchMetadataEdits(
            { fileUris: [uri], attribute: 'audience', value: '   ' },
            createDocs(),
            service
        );

        assert.strictEqual(result.updatedCount, 1);
        assert.strictEqual(result.skipped.length, 0);
        assert.strictEqual(result.edit!.changes![uri][0].newText, '');
    });

    test('updates multiple files in one request', async () => {
        const pathA = path.join(tmpDir, 'a.dita');
        const pathB = path.join(tmpDir, 'b.dita');
        fs.writeFileSync(pathA, '<topic id="a"><title>A</title></topic>');
        fs.writeFileSync(pathB, '<topic id="b"><title>B</title></topic>');
        const uriA = URI.file(pathA).toString();
        const uriB = URI.file(pathB).toString();

        const result = await handleComputeBatchMetadataEdits(
            { fileUris: [uriA, uriB], attribute: 'audience', value: 'internal' },
            createDocs(),
            NO_SCHEME_SERVICE
        );

        assert.strictEqual(result.updatedCount, 2);
        assert.ok(result.edit!.changes![uriA]);
        assert.ok(result.edit!.changes![uriB]);
    });

    test('skips a file with no root element and reports why', async () => {
        const filePath = path.join(tmpDir, 'empty.dita');
        fs.writeFileSync(filePath, '<!-- just a comment, no element -->');
        const uri = URI.file(filePath).toString();

        const result = await handleComputeBatchMetadataEdits(
            { fileUris: [uri], attribute: 'audience', value: 'internal' },
            createDocs(),
            NO_SCHEME_SERVICE
        );

        assert.strictEqual(result.updatedCount, 0);
        assert.strictEqual(result.skipped.length, 1);
        assert.strictEqual(result.skipped[0].uri, uri);
        assert.ok(result.skipped[0].reason.includes('root element'));
    });

    test('skips a file that cannot be read and reports why', async () => {
        const uri = URI.file(path.join(tmpDir, 'does-not-exist.dita')).toString();

        const result = await handleComputeBatchMetadataEdits(
            { fileUris: [uri], attribute: 'audience', value: 'internal' },
            createDocs(),
            NO_SCHEME_SERVICE
        );

        assert.strictEqual(result.updatedCount, 0);
        assert.strictEqual(result.skipped.length, 1);
        assert.strictEqual(result.skipped[0].uri, uri);
    });

    test('uses in-memory (unsaved) content over stale disk content for an open document', async () => {
        const filePath = path.join(tmpDir, 'topic.dita');
        fs.writeFileSync(filePath, '<topic id="t1" audience="external"><title>T</title></topic>');
        const uri = URI.file(filePath).toString();
        const openDoc = createDoc('<topic id="t1"><title>T</title></topic>', uri); // no audience attr in the open buffer

        const result = await handleComputeBatchMetadataEdits(
            { fileUris: [uri], attribute: 'audience', value: 'internal' },
            createDocs(openDoc),
            NO_SCHEME_SERVICE
        );

        // Since the open buffer has no existing audience attribute, this
        // must insert a new one -- if stale disk content were used instead,
        // it would incorrectly compute a "replace" edit.
        assert.strictEqual(result.edit!.changes![uri][0].newText, ' audience="internal"');
    });

    test('accepts a value allowed by a registered subject scheme', async () => {
        const service = createSchemeService(AUDIENCE_SCHEME, tmpDir);
        const filePath = path.join(tmpDir, 'topic.dita');
        fs.writeFileSync(filePath, '<topic id="t1"><title>T</title></topic>');
        const uri = URI.file(filePath).toString();

        const result = await handleComputeBatchMetadataEdits(
            { fileUris: [uri], attribute: 'audience', value: 'internal' },
            createDocs(),
            service
        );

        assert.strictEqual(result.updatedCount, 1);
        assert.strictEqual(result.skipped.length, 0);
    });

    test('rejects a value not allowed by a registered subject scheme, with the reason (regression: no DITA-PROF-001 introduced)', async () => {
        const service = createSchemeService(AUDIENCE_SCHEME, tmpDir);
        const filePath = path.join(tmpDir, 'topic.dita');
        fs.writeFileSync(filePath, '<topic id="t1"><title>T</title></topic>');
        const uri = URI.file(filePath).toString();

        const result = await handleComputeBatchMetadataEdits(
            { fileUris: [uri], attribute: 'audience', value: 'bogus-value' },
            createDocs(),
            service
        );

        assert.strictEqual(result.updatedCount, 0, 'an invalid value must not produce an edit');
        assert.strictEqual(result.edit, null);
        assert.strictEqual(result.skipped.length, 1);
        assert.ok(result.skipped[0].reason.includes('bogus-value'));
        assert.ok(result.skipped[0].reason.includes('audience'));
    });

    test('rejecting the value for every file in the batch produces no edit at all', async () => {
        const service = createSchemeService(AUDIENCE_SCHEME, tmpDir);
        const pathA = path.join(tmpDir, 'a.dita');
        const pathB = path.join(tmpDir, 'b.dita');
        fs.writeFileSync(pathA, '<topic id="a"><title>A</title></topic>');
        fs.writeFileSync(pathB, '<topic id="b"><title>B</title></topic>');
        const uriA = URI.file(pathA).toString();
        const uriB = URI.file(pathB).toString();

        const result = await handleComputeBatchMetadataEdits(
            { fileUris: [uriA, uriB], attribute: 'audience', value: 'nope' },
            createDocs(),
            service
        );

        assert.strictEqual(result.updatedCount, 0);
        assert.strictEqual(result.edit, null);
        assert.strictEqual(result.skipped.length, 2);
    });

    test('applies the readable file and skips the unreadable one within the same batch (regression)', async () => {
        const readablePath = path.join(tmpDir, 'readable.dita');
        fs.writeFileSync(readablePath, '<topic id="r"><title>R</title></topic>');
        const readableUri = URI.file(readablePath).toString();
        const missingUri = URI.file(path.join(tmpDir, 'does-not-exist.dita')).toString();

        const result = await handleComputeBatchMetadataEdits(
            { fileUris: [readableUri, missingUri], attribute: 'audience', value: 'internal' },
            createDocs(),
            NO_SCHEME_SERVICE
        );

        assert.strictEqual(result.updatedCount, 1, 'the readable file in the batch should still be updated');
        assert.ok(result.edit!.changes![readableUri]);
        assert.strictEqual(result.skipped.length, 1);
        assert.strictEqual(result.skipped[0].uri, missingUri);
    });

    test('does not validate against a subject scheme for an uncontrolled attribute', async () => {
        // AUDIENCE_SCHEME only controls "audience" -- "otherprops" has no
        // registered scheme, so any value should be accepted unchanged.
        const service = createSchemeService(AUDIENCE_SCHEME, tmpDir);
        const filePath = path.join(tmpDir, 'topic.dita');
        fs.writeFileSync(filePath, '<topic id="t1"><title>T</title></topic>');
        const uri = URI.file(filePath).toString();

        const result = await handleComputeBatchMetadataEdits(
            { fileUris: [uri], attribute: 'otherprops', value: 'anything-goes' },
            createDocs(),
            service
        );

        assert.strictEqual(result.updatedCount, 1);
        assert.strictEqual(result.skipped.length, 0);
    });

    test('preserves other attributes when setting a new one', async () => {
        const filePath = path.join(tmpDir, 'topic.dita');
        fs.writeFileSync(filePath, '<topic id="t1" outputclass="foo"><title>T</title></topic>');
        const uri = URI.file(filePath).toString();

        const result = await handleComputeBatchMetadataEdits(
            { fileUris: [uri], attribute: 'audience', value: 'internal' },
            createDocs(),
            NO_SCHEME_SERVICE
        );

        // The edit is a targeted insertion, not a full-tag rewrite -- the
        // existing id/outputclass attributes are simply untouched text
        // outside the edit's range.
        const edit = result.edit!.changes![uri][0];
        assert.strictEqual(edit.newText, ' audience="internal"');
        assert.strictEqual(edit.range.start.line, edit.range.end.line);
    });

    test('escapes special characters in the attribute value', async () => {
        const filePath = path.join(tmpDir, 'topic.dita');
        fs.writeFileSync(filePath, '<topic id="t1"><title>T</title></topic>');
        const uri = URI.file(filePath).toString();

        const result = await handleComputeBatchMetadataEdits(
            { fileUris: [uri], attribute: 'otherprops', value: 'a&b<c"d' },
            createDocs(),
            NO_SCHEME_SERVICE
        );

        assert.strictEqual(result.edit!.changes![uri][0].newText, ' otherprops="a&amp;b&lt;c&quot;d"');
    });

    test('does not mistake a tag-like fragment inside a leading comment for the root element (regression)', async () => {
        const filePath = path.join(tmpDir, 'topic.dita');
        fs.writeFileSync(
            filePath,
            '<?xml version="1.0"?><!DOCTYPE topic><!-- TODO: remove <placeholder foo="x"/> before publishing --><topic id="t1"><title>T</title></topic>'
        );
        const uri = URI.file(filePath).toString();

        const result = await handleComputeBatchMetadataEdits(
            { fileUris: [uri], attribute: 'audience', value: 'internal' },
            createDocs(),
            NO_SCHEME_SERVICE
        );

        assert.strictEqual(result.updatedCount, 1);
        assert.strictEqual(result.skipped.length, 0);
        // Root element must be <topic>, not the comment's <placeholder/> --
        // the inserted attribute must land right after "topic".
        const newText = result.edit!.changes![uri][0].newText;
        assert.strictEqual(newText, ' audience="internal"');
        const originalContent = fs.readFileSync(filePath, 'utf-8');
        const insertOffset = originalContent.indexOf('<topic') + '<topic'.length;
        assert.strictEqual(
            result.edit!.changes![uri][0].range.start.character,
            insertOffset,
            'the edit must be anchored right after the real <topic> root, not the comment\'s <placeholder/>'
        );
    });

    suite('per-file subject scheme scoping (regression: must not rely on the shared service\'s already-registered state)', () => {
        test('rejects an invalid value for a file resolved via keySpaceService, even though the shared service has no schemes registered directly', async () => {
            fs.writeFileSync(path.join(tmpDir, 'scheme.ditamap'), AUDIENCE_SCHEME, 'utf-8');
            fs.writeFileSync(
                path.join(tmpDir, 'root.ditamap'),
                `<?xml version="1.0"?><map><mapref href="scheme.ditamap"/></map>`,
                'utf-8'
            );
            const filePath = path.join(tmpDir, 'topic.dita');
            fs.writeFileSync(filePath, '<topic id="t1"><title>T</title></topic>');
            const uri = URI.file(filePath).toString();

            // A fresh service with nothing registered on it -- if batchMetadata
            // fell back to the shared service's own (empty) state instead of
            // resolving this file's own scheme via keySpaceService, validation
            // would silently no-op and the invalid value would be written.
            const freshService = new SubjectSchemeService();
            const keySpaceService = createKeySpaceService(tmpDir);
            try {
                const result = await handleComputeBatchMetadataEdits(
                    { fileUris: [uri], attribute: 'audience', value: 'bogus-value' },
                    createDocs(),
                    freshService,
                    keySpaceService
                );

                assert.strictEqual(result.updatedCount, 0, 'an invalid value must not produce an edit even without prior registerSchemes()');
                assert.strictEqual(result.skipped.length, 1);
                assert.ok(result.skipped[0].reason.includes('bogus-value'));
            } finally {
                keySpaceService.shutdown();
            }
        });

        test('accepts a valid value for a file resolved via keySpaceService, even though the shared service has no schemes registered directly', async () => {
            fs.writeFileSync(path.join(tmpDir, 'scheme.ditamap'), AUDIENCE_SCHEME, 'utf-8');
            fs.writeFileSync(
                path.join(tmpDir, 'root.ditamap'),
                `<?xml version="1.0"?><map><mapref href="scheme.ditamap"/></map>`,
                'utf-8'
            );
            const filePath = path.join(tmpDir, 'topic.dita');
            fs.writeFileSync(filePath, '<topic id="t1"><title>T</title></topic>');
            const uri = URI.file(filePath).toString();

            const freshService = new SubjectSchemeService();
            const keySpaceService = createKeySpaceService(tmpDir);
            try {
                const result = await handleComputeBatchMetadataEdits(
                    { fileUris: [uri], attribute: 'audience', value: 'internal' },
                    createDocs(),
                    freshService,
                    keySpaceService
                );

                assert.strictEqual(result.updatedCount, 1);
                assert.strictEqual(result.skipped.length, 0);
            } finally {
                keySpaceService.shutdown();
            }
        });
    });
});
