import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import {
    buildRootIdIndex,
    detectCrossFileDuplicateIds,
    createUnusedTopicDiagnostic,
    WORKSPACE_CODES,
} from '../src/features/workspaceValidation';

function makeTmpDir(): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-wsval-'));
}

function cleanup(dir: string): void {
    fs.rmSync(dir, { recursive: true, force: true });
}

suite('workspaceValidation', () => {

    suite('buildRootIdIndex', () => {

        test('indexes root IDs from .dita files', () => {
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

                const index = buildRootIdIndex([tmpDir]);
                assert.ok(index.has('t1'), 'should index t1');
                assert.ok(index.has('c1'), 'should index c1');
                assert.strictEqual(index.get('t1')!.length, 1);
            } finally {
                cleanup(tmpDir);
            }
        });

        test('detects duplicate root IDs across files', () => {
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

                const index = buildRootIdIndex([tmpDir]);
                assert.ok(index.has('dup'));
                assert.strictEqual(index.get('dup')!.length, 2, 'should have 2 files with same root ID');
            } finally {
                cleanup(tmpDir);
            }
        });

        test('ignores .ditamap files', () => {
            const tmpDir = makeTmpDir();
            try {
                fs.writeFileSync(
                    path.join(tmpDir, 'root.ditamap'),
                    '<map id="m1"><title>Map</title></map>'
                );

                const index = buildRootIdIndex([tmpDir]);
                assert.strictEqual(index.size, 0, 'ditamap root IDs should not be indexed');
            } finally {
                cleanup(tmpDir);
            }
        });

        test('ignores files without root id', () => {
            const tmpDir = makeTmpDir();
            try {
                fs.writeFileSync(
                    path.join(tmpDir, 'noid.dita'),
                    '<topic><title>No ID</title></topic>'
                );

                const index = buildRootIdIndex([tmpDir]);
                assert.strictEqual(index.size, 0);
            } finally {
                cleanup(tmpDir);
            }
        });

        test('empty workspace returns empty index', () => {
            const tmpDir = makeTmpDir();
            try {
                const index = buildRootIdIndex([tmpDir]);
                assert.strictEqual(index.size, 0);
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

    suite('createUnusedTopicDiagnostic', () => {

        test('creates info-level diagnostic', () => {
            const diag = createUnusedTopicDiagnostic();
            assert.strictEqual(diag.code, WORKSPACE_CODES.UNUSED_TOPIC);
            assert.strictEqual(diag.severity, 3); // DiagnosticSeverity.Information
            assert.strictEqual(diag.range.start.line, 0);
        });
    });
});
