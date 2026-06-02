import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { URI } from 'vscode-uri';
import { handleBuildContextSnapshot, BuildContextSnapshotParams } from '../src/features/contextSnapshot';

function makeTmpDir(): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-snap-'));
}

function cleanup(dir: string): void {
    fs.rmSync(dir, { recursive: true, force: true });
}

function writeMap(dir: string, name: string, content: string): string {
    const p = path.join(dir, name);
    fs.writeFileSync(p, content, 'utf-8');
    return p;
}

function snap(mapPath: string, maxTokens: number, strategy: BuildContextSnapshotParams['strategy'] = 'breadth-first', focusUri?: string) {
    return handleBuildContextSnapshot({
        uri: URI.file(mapPath).toString(),
        maxTokens,
        strategy,
        focusUri,
    });
}

const MINIMAL_MAP = (n: number): string => {
    const refs = Array.from({ length: n }, (_, i) =>
        `  <topicref href="topic${i + 1}.dita" />`
    ).join('\n');
    return `<?xml version="1.0"?>\n<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA Map//EN" "map.dtd">\n<map title="Test Map">\n${refs}\n</map>`;
};

suite('handleBuildContextSnapshot', () => {

    suite('Level 1 — structural XML summary', () => {

        test('small map fits in Level 1', () => {
            const tmpDir = makeTmpDir();
            try {
                const mapPath = writeMap(tmpDir, 'test.ditamap', MINIMAL_MAP(3));
                const result = snap(mapPath, 8000);
                assert.ok(result.snapshot.length > 0, 'snapshot should not be empty');
                assert.strictEqual(result.truncated, false, 'should not be truncated');
                assert.strictEqual(result.level, 1, 'should use Level 1 for small maps');
                assert.ok(result.snapshot.includes('ditamap-structure'), 'Level 1 should contain ditamap-structure tag');
            } finally {
                cleanup(tmpDir);
            }
        });

        test('Level 1 token estimate matches content length', () => {
            const tmpDir = makeTmpDir();
            try {
                const mapPath = writeMap(tmpDir, 'test.ditamap', MINIMAL_MAP(2));
                const result = snap(mapPath, 8000);
                // Token estimate = ceil(len / 4)
                const expectedTokens = Math.ceil(result.snapshot.length / 4);
                assert.strictEqual(result.tokenEstimate, expectedTokens);
            } finally {
                cleanup(tmpDir);
            }
        });
    });

    suite('Level 2 — tabular text outline', () => {

        test('when token budget is tiny, falls back to Level 2 or 3', () => {
            const tmpDir = makeTmpDir();
            try {
                const mapPath = writeMap(tmpDir, 'test.ditamap', MINIMAL_MAP(5));
                // Budget of 1 token is far too small for any Level 1 XML; forces Level 2 or 3
                const result = snap(mapPath, 1);
                assert.ok(result.level >= 2, `should use Level 2 or 3, got ${result.level}`);
            } finally {
                cleanup(tmpDir);
            }
        });

        test('Level 2 snapshot starts with Map: line', () => {
            const tmpDir = makeTmpDir();
            try {
                const mapPath = writeMap(tmpDir, 'test.ditamap', MINIMAL_MAP(5));
                // Budget sized to force Level 2 but fit within it
                const result = snap(mapPath, 30);
                if (result.level === 2) {
                    assert.ok(result.snapshot.startsWith('Map:'), 'Level 2 should start with "Map:"');
                }
            } finally {
                cleanup(tmpDir);
            }
        });
    });

    suite('Level 3 — sliding window', () => {

        test('very tight budget falls through to Level 3', () => {
            const tmpDir = makeTmpDir();
            try {
                const mapPath = writeMap(tmpDir, 'test.ditamap', MINIMAL_MAP(10));
                // Budget of 5 tokens cannot fit even Level 2 header
                const result = snap(mapPath, 5);
                assert.strictEqual(result.level, 3, 'should use Level 3 under extreme budget pressure');
                assert.ok(result.snapshot.includes('sliding window'), 'Level 3 should mention sliding window');
            } finally {
                cleanup(tmpDir);
            }
        });

        test('Level 3 snapshot contains topic count in header', () => {
            const tmpDir = makeTmpDir();
            try {
                const mapPath = writeMap(tmpDir, 'test.ditamap', MINIMAL_MAP(10));
                const result = snap(mapPath, 5);
                if (result.level === 3) {
                    assert.ok(/\d+ topics total/.test(result.snapshot), 'Level 3 should show topic count');
                }
            } finally {
                cleanup(tmpDir);
            }
        });

        test('Level 3 is used even for small maps when budget is tiny', () => {
            const tmpDir = makeTmpDir();
            try {
                // Only 3 topics, but budget is 1 token — well below Level 2 minimum
                const mapPath = writeMap(tmpDir, 'test.ditamap', MINIMAL_MAP(3));
                const result = snap(mapPath, 1);
                // Shouldn't hard-truncate; should use Level 3 sliding window
                assert.ok(result.level === 3 || result.truncated, 'should handle extreme budget gracefully');
                assert.ok(!result.snapshot.includes('[truncated]') || result.level === 3,
                    'Level 3 should not produce mid-sentence hard truncation');
            } finally {
                cleanup(tmpDir);
            }
        });
    });

    suite('Non-map files', () => {

        test('non-existent file returns an empty or error snapshot gracefully', () => {
            const result = snap('/nonexistent/file.ditamap', 8000);
            // Should not throw; should return some fallback
            assert.ok(typeof result.snapshot === 'string');
        });
    });
});
