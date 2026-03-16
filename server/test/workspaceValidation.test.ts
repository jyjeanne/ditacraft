import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import {
    detectCrossFileDuplicateIds,
    createUnusedTopicDiagnostic,
    WorkspaceIndex,
    WORKSPACE_CODES,
} from '../src/features/workspaceValidation';

function makeTmpDir(): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-wsval-'));
}

function cleanup(dir: string): void {
    fs.rmSync(dir, { recursive: true, force: true });
}

suite('workspaceValidation', () => {

    suite('WorkspaceIndex (buildFull)', () => {

        test('indexes root IDs from .dita files', async () => {
            const tmpDir = makeTmpDir();
            try {
                fs.writeFileSync(
                    path.join(tmpDir, 'topic1.dita'),
                    '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">\n<topic id="t1"><title>T1</title></topic>'
                );
                fs.writeFileSync(
                    path.join(tmpDir, 'topic2.dita'),
                    '<!DOCTYPE concept PUBLIC "-//OASIS//DTD DITA Concept//EN" "concept.dtd">\n<concept id="c1"><title>C1</title></concept>'
                );

                const idx = new WorkspaceIndex();
                await idx.buildFull([tmpDir]);
                assert.ok(idx.rootIdIndex.has('t1'), 'should index t1');
                assert.ok(idx.rootIdIndex.has('c1'), 'should index c1');
                assert.strictEqual(idx.rootIdIndex.get('t1')!.length, 1);
            } finally {
                cleanup(tmpDir);
            }
        });

        test('detects duplicate root IDs across files', async () => {
            const tmpDir = makeTmpDir();
            try {
                fs.writeFileSync(
                    path.join(tmpDir, 'a.dita'),
                    '<topic id="dup"><title>A</title></topic>'
                );
                fs.writeFileSync(
                    path.join(tmpDir, 'b.dita'),
                    '<topic id="dup"><title>B</title></topic>'
                );

                const idx = new WorkspaceIndex();
                await idx.buildFull([tmpDir]);
                assert.ok(idx.rootIdIndex.has('dup'));
                assert.strictEqual(idx.rootIdIndex.get('dup')!.length, 2, 'should have 2 files with same root ID');
            } finally {
                cleanup(tmpDir);
            }
        });

        test('ignores .ditamap files', async () => {
            const tmpDir = makeTmpDir();
            try {
                fs.writeFileSync(
                    path.join(tmpDir, 'root.ditamap'),
                    '<map id="m1"><title>Map</title></map>'
                );

                const idx = new WorkspaceIndex();
                await idx.buildFull([tmpDir]);
                assert.strictEqual(idx.rootIdIndex.size, 0, 'ditamap root IDs should not be indexed');
            } finally {
                cleanup(tmpDir);
            }
        });

        test('ignores files without root id', async () => {
            const tmpDir = makeTmpDir();
            try {
                fs.writeFileSync(
                    path.join(tmpDir, 'noid.dita'),
                    '<topic><title>No ID</title></topic>'
                );

                const idx = new WorkspaceIndex();
                await idx.buildFull([tmpDir]);
                assert.strictEqual(idx.rootIdIndex.size, 0);
            } finally {
                cleanup(tmpDir);
            }
        });

        test('empty workspace returns empty index', async () => {
            const tmpDir = makeTmpDir();
            try {
                const idx = new WorkspaceIndex();
                await idx.buildFull([tmpDir]);
                assert.strictEqual(idx.rootIdIndex.size, 0);
            } finally {
                cleanup(tmpDir);
            }
        });
    });

    suite('detectCrossFileDuplicateIds', () => {

        test('returns diagnostic when root ID conflicts with other files', () => {
            const text = '<topic id="dup"><title>Test</title></topic>';
            const rootIdIndex = new Map<string, string[]>([
                ['dup', ['/path/to/a.dita', '/path/to/b.dita']],
            ]);

            const diags = detectCrossFileDuplicateIds(text, '/path/to/a.dita', rootIdIndex);
            assert.strictEqual(diags.length, 1);
            assert.strictEqual(diags[0].code, WORKSPACE_CODES.CROSS_FILE_DUPLICATE_ID);
        });

        test('returns empty when root ID is unique', () => {
            const text = '<topic id="unique"><title>Test</title></topic>';
            const rootIdIndex = new Map<string, string[]>([
                ['unique', ['/path/to/a.dita']],
            ]);

            const diags = detectCrossFileDuplicateIds(text, '/path/to/a.dita', rootIdIndex);
            assert.strictEqual(diags.length, 0);
        });

        test('returns empty when text has no root ID', () => {
            const text = '<topic><title>No ID</title></topic>';
            const rootIdIndex = new Map<string, string[]>();

            const diags = detectCrossFileDuplicateIds(text, '/path/to/a.dita', rootIdIndex);
            assert.strictEqual(diags.length, 0);
        });

        test('diagnostic range points to the id value', () => {
            const text = '<topic id="dup"><title>Test</title></topic>';
            const rootIdIndex = new Map<string, string[]>([
                ['dup', ['/path/to/a.dita', '/path/to/b.dita']],
            ]);

            const diags = detectCrossFileDuplicateIds(text, '/path/to/a.dita', rootIdIndex);
            assert.strictEqual(diags.length, 1);
            // "dup" starts at character 11 in '<topic id="dup">'
            assert.strictEqual(diags[0].range.start.line, 0);
            assert.strictEqual(diags[0].range.start.character, 11);
            assert.strictEqual(diags[0].range.end.character, 14); // "dup" is 3 chars
        });

        test('ignores IDs inside comments', () => {
            const text = '<!-- <topic id="dup"> -->\n<concept id="real"><title>T</title></concept>';
            const rootIdIndex = new Map<string, string[]>([
                ['real', ['/path/to/a.dita']],
            ]);

            const diags = detectCrossFileDuplicateIds(text, '/path/to/a.dita', rootIdIndex);
            assert.strictEqual(diags.length, 0);
        });
    });

    suite('WorkspaceIndex', () => {

        test('buildFull indexes root IDs', async () => {
            const tmpDir = makeTmpDir();
            try {
                fs.writeFileSync(path.join(tmpDir, 'a.dita'), '<topic id="t1"><title>A</title></topic>');
                fs.writeFileSync(path.join(tmpDir, 'b.dita'), '<concept id="c1"><title>B</title></concept>');

                const idx = new WorkspaceIndex();
                await idx.buildFull([tmpDir]);

                assert.ok(idx.initialized);
                assert.ok(idx.rootIdIndex.has('t1'));
                assert.ok(idx.rootIdIndex.has('c1'));
            } finally {
                cleanup(tmpDir);
            }
        });

        test('updateFile adds new file to index', async () => {
            const tmpDir = makeTmpDir();
            try {
                fs.writeFileSync(path.join(tmpDir, 'a.dita'), '<topic id="t1"><title>A</title></topic>');

                const idx = new WorkspaceIndex();
                await idx.buildFull([tmpDir]);
                assert.strictEqual(idx.rootIdIndex.size, 1);

                // Add a new file
                fs.writeFileSync(path.join(tmpDir, 'b.dita'), '<topic id="t2"><title>B</title></topic>');
                await idx.updateFile(path.join(tmpDir, 'b.dita'));

                assert.ok(idx.rootIdIndex.has('t2'));
                assert.strictEqual(idx.rootIdIndex.size, 2);
            } finally {
                cleanup(tmpDir);
            }
        });

        test('updateFile re-indexes changed file', async () => {
            const tmpDir = makeTmpDir();
            const filePath = path.join(tmpDir, 'a.dita');
            try {
                fs.writeFileSync(filePath, '<topic id="old"><title>A</title></topic>');

                const idx = new WorkspaceIndex();
                await idx.buildFull([tmpDir]);
                assert.ok(idx.rootIdIndex.has('old'));

                // Change the file's root ID
                fs.writeFileSync(filePath, '<topic id="new"><title>A</title></topic>');
                await idx.updateFile(filePath);

                assert.ok(!idx.rootIdIndex.has('old'), 'old ID should be removed');
                assert.ok(idx.rootIdIndex.has('new'), 'new ID should be present');
            } finally {
                cleanup(tmpDir);
            }
        });

        test('removeFile removes entry from index', async () => {
            const tmpDir = makeTmpDir();
            try {
                fs.writeFileSync(path.join(tmpDir, 'a.dita'), '<topic id="t1"><title>A</title></topic>');
                fs.writeFileSync(path.join(tmpDir, 'b.dita'), '<topic id="t1"><title>B</title></topic>');

                const idx = new WorkspaceIndex();
                await idx.buildFull([tmpDir]);
                assert.strictEqual(idx.rootIdIndex.get('t1')!.length, 2);

                idx.removeFile(path.join(tmpDir, 'a.dita'));
                assert.strictEqual(idx.rootIdIndex.get('t1')!.length, 1, 'should have 1 file left');
            } finally {
                cleanup(tmpDir);
            }
        });

        test('removeFile deletes key when last file removed', async () => {
            const tmpDir = makeTmpDir();
            try {
                fs.writeFileSync(path.join(tmpDir, 'a.dita'), '<topic id="t1"><title>A</title></topic>');

                const idx = new WorkspaceIndex();
                await idx.buildFull([tmpDir]);
                assert.ok(idx.rootIdIndex.has('t1'));

                idx.removeFile(path.join(tmpDir, 'a.dita'));
                assert.ok(!idx.rootIdIndex.has('t1'), 'key should be deleted');
            } finally {
                cleanup(tmpDir);
            }
        });

        test('updateFile ignores non-.dita files', async () => {
            const tmpDir = makeTmpDir();
            try {
                const idx = new WorkspaceIndex();
                await idx.buildFull([tmpDir]);

                fs.writeFileSync(path.join(tmpDir, 'root.ditamap'), '<map id="m1"><title>Map</title></map>');
                await idx.updateFile(path.join(tmpDir, 'root.ditamap'));

                assert.strictEqual(idx.rootIdIndex.size, 0);
            } finally {
                cleanup(tmpDir);
            }
        });

        test('updateFile is no-op before initialization', async () => {
            const idx = new WorkspaceIndex();
            assert.ok(!idx.initialized);
            // Should not throw
            await idx.updateFile('/nonexistent/file.dita');
            assert.strictEqual(idx.rootIdIndex.size, 0);
        });

        test('clear resets index', async () => {
            const tmpDir = makeTmpDir();
            try {
                fs.writeFileSync(path.join(tmpDir, 'a.dita'), '<topic id="t1"><title>A</title></topic>');

                const idx = new WorkspaceIndex();
                await idx.buildFull([tmpDir]);
                assert.ok(idx.initialized);
                assert.strictEqual(idx.rootIdIndex.size, 1);

                idx.clear();
                assert.ok(!idx.initialized);
                assert.strictEqual(idx.rootIdIndex.size, 0);
            } finally {
                cleanup(tmpDir);
            }
        });
    });

    suite('createUnusedTopicDiagnostic', () => {

        test('creates info-level diagnostic', () => {
            const diag = createUnusedTopicDiagnostic();
            assert.strictEqual(diag.code, WORKSPACE_CODES.UNUSED_TOPIC);
            assert.strictEqual(diag.severity, 3); // DiagnosticSeverity.Information
            assert.strictEqual(diag.range.start.line, 0);
        });
    });
});
