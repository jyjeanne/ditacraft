import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { URI } from 'vscode-uri';
import { offsetToPosition, collectDitaFiles, findCrossFileReferences } from '../src/utils/workspaceScanner';

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

    test('returns empty array when no DITA files exist in workspace', () => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-ws-test-'));
        try {
            const results = findCrossFileReferences('myId', path.join(tmp, 'target.dita'), [tmp]);
            assert.deepStrictEqual(results, []);
        } finally {
            fs.rmSync(tmp, { recursive: true, force: true });
        }
    });

    test('href with file path that resolves to target file is included', () => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-ws-test-'));
        try {
            // target file
            const targetPath = path.join(tmp, 'target.dita');
            fs.writeFileSync(targetPath, '<topic id="myId"/>');

            // referencing file — href points to target.dita#myId
            writeHrefFile(tmp, 'ref.ditamap', 'target.dita#myId');

            const results = findCrossFileReferences('myId', targetPath, [tmp]);
            assert.strictEqual(results.length, 1);
            assert.ok(results[0].uri.endsWith('ref.ditamap') || results[0].uri.includes('ref.ditamap'));
        } finally {
            fs.rmSync(tmp, { recursive: true, force: true });
        }
    });

    test('href with file path that does not resolve to target file is excluded', () => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-ws-test-'));
        try {
            const targetPath = path.join(tmp, 'target.dita');
            fs.writeFileSync(targetPath, '<topic id="myId"/>');

            // Points to other.dita#myId — different file, should not match
            const otherPath = path.join(tmp, 'other.dita');
            fs.writeFileSync(otherPath, '<topic id="myId"/>');
            writeHrefFile(tmp, 'ref.ditamap', 'other.dita#myId');

            const results = findCrossFileReferences('myId', targetPath, [tmp]);
            assert.strictEqual(results.length, 0);
        } finally {
            fs.rmSync(tmp, { recursive: true, force: true });
        }
    });

    test('fragment-only ref inside target file is included', () => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-ws-test-'));
        try {
            // The fragment-only href lives inside the target file itself
            const targetPath = path.join(tmp, 'target.dita');
            fs.writeFileSync(targetPath, '<topic id="root"><topicref href="#myId"/></topic>');

            const results = findCrossFileReferences('myId', targetPath, [tmp]);
            assert.strictEqual(results.length, 1);
        } finally {
            fs.rmSync(tmp, { recursive: true, force: true });
        }
    });

    test('fragment-only ref inside a different file is excluded', () => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-ws-test-'));
        try {
            const targetPath = path.join(tmp, 'target.dita');
            fs.writeFileSync(targetPath, '<topic id="myId"/>');

            // Fragment-only href in a *different* file — cannot resolve without context
            const otherPath = path.join(tmp, 'other.ditamap');
            fs.writeFileSync(otherPath, '<map><topicref href="#myId"/></map>');

            const results = findCrossFileReferences('myId', targetPath, [tmp]);
            assert.strictEqual(results.length, 0);
        } finally {
            fs.rmSync(tmp, { recursive: true, force: true });
        }
    });

    test('conkeyref match is included by element ID regardless of key', () => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-ws-test-'));
        try {
            const targetPath = path.join(tmp, 'target.dita');
            fs.writeFileSync(targetPath, '<topic id="myId"/>');

            // conkeyref uses "somekey/myId" — element ID matches, so it must be included
            const refPath = path.join(tmp, 'ref.ditamap');
            fs.writeFileSync(refPath, '<map><ph conkeyref="somekey/myId"/></map>');

            const results = findCrossFileReferences('myId', targetPath, [tmp]);
            assert.strictEqual(results.length, 1);
            assert.ok(results[0].uri.includes('ref.ditamap'));
        } finally {
            fs.rmSync(tmp, { recursive: true, force: true });
        }
    });

    test('excludeUri parameter causes the specified file to be skipped', () => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-ws-test-'));
        try {
            const targetPath = path.join(tmp, 'target.dita');
            fs.writeFileSync(targetPath, '<topic id="myId"/>');

            const refPath = path.join(tmp, 'ref.ditamap');
            fs.writeFileSync(refPath, '<map><topicref href="target.dita#myId"/></map>');
            const refUri = URI.file(refPath).toString();

            // Without excludeUri we get a result
            const withoutExclude = findCrossFileReferences('myId', targetPath, [tmp]);
            assert.strictEqual(withoutExclude.length, 1);

            // With excludeUri pointing to ref.ditamap, that file is skipped
            const withExclude = findCrossFileReferences('myId', targetPath, [tmp], refUri);
            assert.strictEqual(withExclude.length, 0);
        } finally {
            fs.rmSync(tmp, { recursive: true, force: true });
        }
    });

    test('documents parameter provides in-memory content instead of disk content', () => {
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

            const results = findCrossFileReferences('myId', targetPath, [tmp], undefined, stubDocuments);
            assert.strictEqual(results.length, 1);
            assert.ok(results[0].uri.includes('ref.ditamap'));
        } finally {
            fs.rmSync(tmp, { recursive: true, force: true });
        }
    });

    test('no matches returns empty array', () => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-ws-test-'));
        try {
            const targetPath = path.join(tmp, 'target.dita');
            fs.writeFileSync(targetPath, '<topic id="myId"/>');

            // A file that references a completely different ID
            const refPath = path.join(tmp, 'ref.ditamap');
            fs.writeFileSync(refPath, '<map><topicref href="target.dita#otherId"/></map>');

            const results = findCrossFileReferences('myId', targetPath, [tmp]);
            assert.deepStrictEqual(results, []);
        } finally {
            fs.rmSync(tmp, { recursive: true, force: true });
        }
    });
});
