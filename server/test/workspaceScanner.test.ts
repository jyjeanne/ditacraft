import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { URI } from 'vscode-uri';
import { collectDitaFiles, findCrossFileReferences, referenceMatchesTarget } from '../src/utils/workspaceScanner';
import { offsetToPosition, normalizeFsPath } from '../src/utils/textUtils';
import { ReferenceOccurrence } from '../src/utils/referenceParser';
import { KeySpaceService, KeyDefinition } from '../src/services/keySpaceService';

function mockKeySpaceService(resolve: (keyName: string, contextFilePath: string) => KeyDefinition | null): KeySpaceService {
    return {
        resolveKey: async (keyName: string, contextFilePath: string) => resolve(keyName, contextFilePath),
    } as unknown as KeySpaceService;
}

function makeRef(type: ReferenceOccurrence['type'], value: string): ReferenceOccurrence {
    return { type, value, valueStart: 0, valueEnd: value.length };
}

suite('referenceMatchesTarget', () => {
    const contextFile = path.join(path.sep, 'ws', 'referencer.dita');
    const targetFile = path.join(path.sep, 'ws', 'target.dita');
    const normalizedTarget = normalizeFsPath(targetFile);

    test('href resolving to the target file matches', async () => {
        const matches = await referenceMatchesTarget(
            makeRef('href', 'target.dita'), contextFile, normalizedTarget, undefined
        );
        assert.strictEqual(matches, true);
    });

    test('href resolving elsewhere does not match', async () => {
        const matches = await referenceMatchesTarget(
            makeRef('href', 'other.dita'), contextFile, normalizedTarget, undefined
        );
        assert.strictEqual(matches, false);
    });

    test('fragment-only href matches only when contextFile is the target itself', async () => {
        const inTarget = await referenceMatchesTarget(
            makeRef('href', '#someId'), targetFile, normalizedTarget, undefined
        );
        assert.strictEqual(inTarget, true);

        const inOther = await referenceMatchesTarget(
            makeRef('href', '#someId'), contextFile, normalizedTarget, undefined
        );
        assert.strictEqual(inOther, false);
    });

    test('conkeyref resolving to the target file matches', async () => {
        const keySpaceService = mockKeySpaceService(() => ({
            keyName: 'mykey', targetFile, sourceMap: targetFile,
        }));
        const matches = await referenceMatchesTarget(
            makeRef('conkeyref', 'mykey/elemId'), contextFile, normalizedTarget, keySpaceService
        );
        assert.strictEqual(matches, true);
    });

    test('conkeyref resolving elsewhere does not match', async () => {
        const keySpaceService = mockKeySpaceService(() => ({
            keyName: 'mykey', targetFile: path.join(path.sep, 'ws', 'unrelated.dita'), sourceMap: contextFile,
        }));
        const matches = await referenceMatchesTarget(
            makeRef('conkeyref', 'mykey/elemId'), contextFile, normalizedTarget, keySpaceService
        );
        assert.strictEqual(matches, false);
    });

    test('conkeyref without a KeySpaceService is excluded and logged', async () => {
        const logs: string[] = [];
        const matches = await referenceMatchesTarget(
            makeRef('conkeyref', 'mykey/elemId'), contextFile, normalizedTarget, undefined, (msg) => logs.push(msg)
        );
        assert.strictEqual(matches, false);
        assert.ok(logs.some(m => m.includes('mykey/elemId')));
    });

    test('keyref (no file part to verify) always matches', async () => {
        const matches = await referenceMatchesTarget(
            makeRef('keyref', 'somekey'), contextFile, normalizedTarget, undefined
        );
        assert.strictEqual(matches, true);
    });
});

suite('offsetToPosition', () => {
    test('offset 0 is line 0 character 0', () => {
        const pos = offsetToPosition('hello', 0);
        assert.strictEqual(pos.line, 0);
        assert.strictEqual(pos.character, 0);
    });

    test('character on first line', () => {
        const pos = offsetToPosition('hello', 3);
        assert.strictEqual(pos.line, 0);
        assert.strictEqual(pos.character, 3);
    });

    test('multiple lines with LF', () => {
        const text = 'line1\nline2\nline3';
        const pos = offsetToPosition(text, 8); // "ne2" -> line 1, char 2
        assert.strictEqual(pos.line, 1);
        assert.strictEqual(pos.character, 2);
    });

    test('start of second line', () => {
        const text = 'line1\nline2';
        const pos = offsetToPosition(text, 6); // "l" of line2
        assert.strictEqual(pos.line, 1);
        assert.strictEqual(pos.character, 0);
    });

    test('Windows line endings (CRLF)', () => {
        const text = 'line1\r\nline2\r\nline3';
        const pos = offsetToPosition(text, 9); // "ne2" -> line 1, char 2
        assert.strictEqual(pos.line, 1);
        assert.strictEqual(pos.character, 2);
    });

    test('empty string', () => {
        const pos = offsetToPosition('', 0);
        assert.strictEqual(pos.line, 0);
        assert.strictEqual(pos.character, 0);
    });

    test('offset at end of text', () => {
        const text = 'ab\ncd';
        const pos = offsetToPosition(text, 5); // past "d"
        assert.strictEqual(pos.line, 1);
        assert.strictEqual(pos.character, 2);
    });

    test('third line', () => {
        const text = 'a\nb\nc';
        const pos = offsetToPosition(text, 4); // "c"
        assert.strictEqual(pos.line, 2);
        assert.strictEqual(pos.character, 0);
    });

    test('standalone CR line endings', () => {
        const text = 'line1\rline2\rline3';
        const pos = offsetToPosition(text, 8); // "ne2" -> line 1, char 2
        assert.strictEqual(pos.line, 1);
        assert.strictEqual(pos.character, 2);
    });

    test('offset beyond text length is clamped', () => {
        const text = 'ab\ncd';
        const pos = offsetToPosition(text, 100);
        assert.strictEqual(pos.line, 1);
        assert.strictEqual(pos.character, 2);
    });

    test('negative offset is clamped to 0', () => {
        const pos = offsetToPosition('hello', -5);
        assert.strictEqual(pos.line, 0);
        assert.strictEqual(pos.character, 0);
    });
});

// ---------------------------------------------------------------------------
// collectDitaFiles
// ---------------------------------------------------------------------------

suite('collectDitaFiles', () => {
    test('collects .dita, .ditamap and .bookmap files', () => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-ws-test-'));
        try {
            fs.writeFileSync(path.join(tmp, 'topic.dita'), '<topic/>');
            fs.writeFileSync(path.join(tmp, 'map.ditamap'), '<map/>');
            fs.writeFileSync(path.join(tmp, 'book.bookmap'), '<bookmap/>');
            const files = collectDitaFiles([tmp]);
            const names = files.map(f => path.basename(f)).sort();
            assert.deepStrictEqual(names, ['book.bookmap', 'map.ditamap', 'topic.dita']);
        } finally {
            fs.rmSync(tmp, { recursive: true, force: true });
        }
    });

    test('ignores non-DITA file extensions', () => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-ws-test-'));
        try {
            fs.writeFileSync(path.join(tmp, 'readme.txt'), 'text');
            fs.writeFileSync(path.join(tmp, 'style.css'), 'css');
            fs.writeFileSync(path.join(tmp, 'topic.dita'), '<topic/>');
            const files = collectDitaFiles([tmp]);
            assert.strictEqual(files.length, 1);
            assert.strictEqual(path.basename(files[0]), 'topic.dita');
        } finally {
            fs.rmSync(tmp, { recursive: true, force: true });
        }
    });

    test('skips node_modules and .git directories', () => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-ws-test-'));
        try {
            const nodeModules = path.join(tmp, 'node_modules');
            const gitDir = path.join(tmp, '.git');
            fs.mkdirSync(nodeModules);
            fs.mkdirSync(gitDir);
            fs.writeFileSync(path.join(nodeModules, 'ignored.dita'), '<topic/>');
            fs.writeFileSync(path.join(gitDir, 'also-ignored.dita'), '<topic/>');
            fs.writeFileSync(path.join(tmp, 'real.dita'), '<topic/>');
            const files = collectDitaFiles([tmp]);
            assert.strictEqual(files.length, 1);
            assert.strictEqual(path.basename(files[0]), 'real.dita');
        } finally {
            fs.rmSync(tmp, { recursive: true, force: true });
        }
    });

    test('skips hidden directories (starting with .)', () => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-ws-test-'));
        try {
            const hidden = path.join(tmp, '.hidden');
            fs.mkdirSync(hidden);
            fs.writeFileSync(path.join(hidden, 'hidden.dita'), '<topic/>');
            fs.writeFileSync(path.join(tmp, 'visible.dita'), '<topic/>');
            const files = collectDitaFiles([tmp]);
            assert.strictEqual(files.length, 1);
            assert.strictEqual(path.basename(files[0]), 'visible.dita');
        } finally {
            fs.rmSync(tmp, { recursive: true, force: true });
        }
    });

    test('handles unreadable directory gracefully', () => {
        // Pass a path that does not exist — readdirSync throws, walk returns early
        const nonExistent = path.join(os.tmpdir(), 'ditacraft-ws-nonexistent-' + Date.now());
        const files = collectDitaFiles([nonExistent]);
        assert.deepStrictEqual(files, []);
    });

    test('recurses into subdirectories', () => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-ws-test-'));
        try {
            const sub = path.join(tmp, 'concepts');
            fs.mkdirSync(sub);
            fs.writeFileSync(path.join(sub, 'concept.dita'), '<concept/>');
            fs.writeFileSync(path.join(tmp, 'root.dita'), '<topic/>');
            const files = collectDitaFiles([tmp]);
            assert.strictEqual(files.length, 2);
        } finally {
            fs.rmSync(tmp, { recursive: true, force: true });
        }
    });
});

// ---------------------------------------------------------------------------
// findCrossFileReferences
// ---------------------------------------------------------------------------

suite('findCrossFileReferences', () => {
    /**
     * Build a minimal DITA topic file that contains an href pointing to
     * targetRelPath#topicId/elementId and write it to dir/filename.
     */
    function writeHrefFile(dir: string, filename: string, hrefValue: string): string {
        const filePath = path.join(dir, filename);
        fs.writeFileSync(filePath, `<map><topicref href="${hrefValue}"/></map>`);
        return filePath;
    }

    test('returns empty array when no DITA files exist in workspace', async () => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-ws-test-'));
        try {
            const results = await findCrossFileReferences('myId', path.join(tmp, 'target.dita'), [tmp]);
            assert.deepStrictEqual(results, []);
        } finally {
            fs.rmSync(tmp, { recursive: true, force: true });
        }
    });

    test('href with file path that resolves to target file is included', async () => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-ws-test-'));
        try {
            // target file
            const targetPath = path.join(tmp, 'target.dita');
            fs.writeFileSync(targetPath, '<topic id="myId"/>');

            // referencing file — href points to target.dita#myId
            writeHrefFile(tmp, 'ref.ditamap', 'target.dita#myId');

            const results = await findCrossFileReferences('myId', targetPath, [tmp]);
            assert.strictEqual(results.length, 1);
            assert.ok(results[0].uri.endsWith('ref.ditamap') || results[0].uri.includes('ref.ditamap'));
        } finally {
            fs.rmSync(tmp, { recursive: true, force: true });
        }
    });

    test('href with file path that does not resolve to target file is excluded', async () => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-ws-test-'));
        try {
            const targetPath = path.join(tmp, 'target.dita');
            fs.writeFileSync(targetPath, '<topic id="myId"/>');

            // Points to other.dita#myId — different file, should not match
            const otherPath = path.join(tmp, 'other.dita');
            fs.writeFileSync(otherPath, '<topic id="myId"/>');
            writeHrefFile(tmp, 'ref.ditamap', 'other.dita#myId');

            const results = await findCrossFileReferences('myId', targetPath, [tmp]);
            assert.strictEqual(results.length, 0);
        } finally {
            fs.rmSync(tmp, { recursive: true, force: true });
        }
    });

    test('fragment-only ref inside target file is included', async () => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-ws-test-'));
        try {
            // The fragment-only href lives inside the target file itself
            const targetPath = path.join(tmp, 'target.dita');
            fs.writeFileSync(targetPath, '<topic id="root"><topicref href="#myId"/></topic>');

            const results = await findCrossFileReferences('myId', targetPath, [tmp]);
            assert.strictEqual(results.length, 1);
        } finally {
            fs.rmSync(tmp, { recursive: true, force: true });
        }
    });

    test('fragment-only ref inside a different file is excluded', async () => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-ws-test-'));
        try {
            const targetPath = path.join(tmp, 'target.dita');
            fs.writeFileSync(targetPath, '<topic id="myId"/>');

            // Fragment-only href in a *different* file — cannot resolve without context
            const otherPath = path.join(tmp, 'other.ditamap');
            fs.writeFileSync(otherPath, '<map><topicref href="#myId"/></map>');

            const results = await findCrossFileReferences('myId', targetPath, [tmp]);
            assert.strictEqual(results.length, 0);
        } finally {
            fs.rmSync(tmp, { recursive: true, force: true });
        }
    });

    test('conkeyref match is excluded without a KeySpaceService to verify it (regression)', async () => {
        // Without a way to resolve the key, an element-ID text match alone is
        // not proof the conkeyref actually targets this file — it must be
        // excluded rather than reported as a possibly-false-positive reference.
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-ws-test-'));
        try {
            const targetPath = path.join(tmp, 'target.dita');
            fs.writeFileSync(targetPath, '<topic id="myId"/>');

            const refPath = path.join(tmp, 'ref.ditamap');
            fs.writeFileSync(refPath, '<map><ph conkeyref="somekey/myId"/></map>');

            const logs: string[] = [];
            const results = await findCrossFileReferences(
                'myId', targetPath, [tmp], undefined, undefined, undefined, (msg) => logs.push(msg)
            );
            assert.strictEqual(results.length, 0);
            assert.ok(
                logs.some(m => m.includes('somekey/myId')),
                'skipping an unverifiable conkeyref should be logged so it is not silently dropped (regression)'
            );
        } finally {
            fs.rmSync(tmp, { recursive: true, force: true });
        }
    });

    test('conkeyref resolving to the target file is included; resolving elsewhere is excluded (regression)', async () => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-ws-test-'));
        try {
            const targetPath = path.join(tmp, 'target.dita');
            const unrelatedPath = path.join(tmp, 'unrelated.dita');
            fs.writeFileSync(targetPath, '<topic id="myId"/>');
            fs.writeFileSync(unrelatedPath, '<topic id="myId"/>');

            const refPath = path.join(tmp, 'ref.ditamap');
            fs.writeFileSync(refPath,
                '<map><ph conkeyref="goodkey/myId"/><ph conkeyref="badkey/myId"/></map>');

            const keySpaceService = mockKeySpaceService((keyName) => {
                if (keyName === 'goodkey') return { keyName, targetFile: targetPath, sourceMap: targetPath };
                if (keyName === 'badkey') return { keyName, targetFile: unrelatedPath, sourceMap: unrelatedPath };
                return null;
            });

            const results = await findCrossFileReferences(
                'myId', targetPath, [tmp], undefined, undefined, keySpaceService
            );
            assert.strictEqual(results.length, 1, 'only the conkeyref resolving to the target file should match');
        } finally {
            fs.rmSync(tmp, { recursive: true, force: true });
        }
    });

    test('multiple conkeyrefs per file resolve concurrently without mismatching ref-to-result (regression)', async () => {
        // Regression for parallelizing resolveKey calls: each ref's match
        // result must still map back to that same ref's position, not get
        // shuffled by concurrent resolution order.
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-ws-test-'));
        try {
            const targetPath = path.join(tmp, 'target.dita');
            const unrelatedPath = path.join(tmp, 'unrelated.dita');
            fs.writeFileSync(targetPath, '<topic id="myId"/>');
            fs.writeFileSync(unrelatedPath, '<topic id="myId"/>');

            const refPath = path.join(tmp, 'ref.ditamap');
            const content =
                '<map>' +
                '<ph conkeyref="badkey1/myId"/>' +
                '<ph conkeyref="goodkey/myId"/>' +
                '<ph conkeyref="badkey2/myId"/>' +
                '</map>';
            fs.writeFileSync(refPath, content);

            const keySpaceService = mockKeySpaceService((keyName) => {
                if (keyName === 'goodkey') return { keyName, targetFile: targetPath, sourceMap: targetPath };
                return { keyName, targetFile: unrelatedPath, sourceMap: unrelatedPath };
            });

            const results = await findCrossFileReferences(
                'myId', targetPath, [tmp], undefined, undefined, keySpaceService
            );

            assert.strictEqual(results.length, 1, 'only the goodkey conkeyref should match');
            const expectedOffset = content.indexOf('goodkey');
            const expectedPos = offsetToPosition(content, expectedOffset);
            assert.strictEqual(results[0].range.start.line, expectedPos.line);
            assert.strictEqual(results[0].range.start.character, expectedPos.character);
        } finally {
            fs.rmSync(tmp, { recursive: true, force: true });
        }
    });

    test('excludeUri parameter causes the specified file to be skipped', async () => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-ws-test-'));
        try {
            const targetPath = path.join(tmp, 'target.dita');
            fs.writeFileSync(targetPath, '<topic id="myId"/>');

            const refPath = path.join(tmp, 'ref.ditamap');
            fs.writeFileSync(refPath, '<map><topicref href="target.dita#myId"/></map>');
            const refUri = URI.file(refPath).toString();

            // Without excludeUri we get a result
            const withoutExclude = await findCrossFileReferences('myId', targetPath, [tmp]);
            assert.strictEqual(withoutExclude.length, 1);

            // With excludeUri pointing to ref.ditamap, that file is skipped
            const withExclude = await findCrossFileReferences('myId', targetPath, [tmp], refUri);
            assert.strictEqual(withExclude.length, 0);
        } finally {
            fs.rmSync(tmp, { recursive: true, force: true });
        }
    });

    test('documents parameter provides in-memory content instead of disk content', async () => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-ws-test-'));
        try {
            const targetPath = path.join(tmp, 'target.dita');
            fs.writeFileSync(targetPath, '<topic id="myId"/>');

            // On disk the referencing file has NO reference to myId
            const refPath = path.join(tmp, 'ref.ditamap');
            fs.writeFileSync(refPath, '<map/>');
            const refUri = URI.file(refPath).toString();

            // In-memory version DOES reference myId
            const inMemoryContent = '<map><topicref href="target.dita#myId"/></map>';

            // Minimal TextDocuments stub — only needs .get()
            const stubDocuments = {
                get(uri: string) {
                    if (uri === refUri) {
                        return { getText: () => inMemoryContent };
                    }
                    return undefined;
                },
            } as any;

            const results = await findCrossFileReferences('myId', targetPath, [tmp], undefined, stubDocuments);
            assert.strictEqual(results.length, 1);
            assert.ok(results[0].uri.includes('ref.ditamap'));
        } finally {
            fs.rmSync(tmp, { recursive: true, force: true });
        }
    });

    test('no matches returns empty array', async () => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-ws-test-'));
        try {
            const targetPath = path.join(tmp, 'target.dita');
            fs.writeFileSync(targetPath, '<topic id="myId"/>');

            // A file that references a completely different ID
            const refPath = path.join(tmp, 'ref.ditamap');
            fs.writeFileSync(refPath, '<map><topicref href="target.dita#otherId"/></map>');

            const results = await findCrossFileReferences('myId', targetPath, [tmp]);
            assert.deepStrictEqual(results, []);
        } finally {
            fs.rmSync(tmp, { recursive: true, force: true });
        }
    });
});
