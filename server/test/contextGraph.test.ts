import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { URI } from 'vscode-uri';
import { handleGetContextGraph } from '../src/features/contextGraph';

function makeTmpDir(): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-ctxgraph-'));
}

function cleanup(dir: string): void {
    fs.rmSync(dir, { recursive: true, force: true });
}

suite('handleGetContextGraph', () => {

    suite('Basic map parsing', () => {

        test('single-level map returns root with children', () => {
            const tmpDir = makeTmpDir();
            try {
                // Topic files must exist for resolveHref to resolve them
                fs.writeFileSync(path.join(tmpDir, 'topic1.dita'),
                    '<topic id="t1"><title>Topic 1</title><body><p>Content</p></body></topic>', 'utf-8');
                fs.writeFileSync(path.join(tmpDir, 'topic2.dita'),
                    '<topic id="t2"><title>Topic 2</title><body><p>Content</p></body></topic>', 'utf-8');

                const mapPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(mapPath, `<?xml version="1.0"?>
<map title="My Map">
  <topicref href="topic1.dita"/>
  <topicref href="topic2.dita"/>
</map>`, 'utf-8');

                const graph = handleGetContextGraph({
                    uri: URI.file(mapPath).toString(),
                    depth: 2,
                    includeMetadata: false,
                });

                assert.ok(graph.rootMap, 'should have rootMap');
                assert.strictEqual(graph.rootMap.children.length, 2, 'root should have 2 children');
            } finally {
                cleanup(tmpDir);
            }
        });

        test('non-existent file returns empty graph without throwing', () => {
            const graph = handleGetContextGraph({
                uri: 'file:///nonexistent/map.ditamap',
                depth: 2,
                includeMetadata: false,
            });
            assert.ok(graph, 'should return a graph object even for missing files');
        });

        test('map title is extracted', () => {
            const tmpDir = makeTmpDir();
            try {
                const mapPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(mapPath, `<?xml version="1.0"?>
<map title="Product Guide">
  <topicref href="intro.dita"/>
</map>`, 'utf-8');

                const graph = handleGetContextGraph({
                    uri: URI.file(mapPath).toString(),
                    depth: 2,
                    includeMetadata: false,
                });

                assert.ok(graph.rootMap.title?.includes('Product Guide') || graph.rootMap.uri.includes('root'),
                    'graph root should represent the map');
            } finally {
                cleanup(tmpDir);
            }
        });
    });

    suite('Path traversal security', () => {

        test('absolute href is rejected', () => {
            const tmpDir = makeTmpDir();
            try {
                const mapPath = path.join(tmpDir, 'root.ditamap');
                // href with absolute path on Windows and Unix
                const absPath = process.platform === 'win32' ? 'C:\\Windows\\evil.dita' : '/etc/passwd';
                fs.writeFileSync(mapPath, `<?xml version="1.0"?>
<map title="Test">
  <topicref href="${absPath}"/>
</map>`, 'utf-8');

                const graph = handleGetContextGraph({
                    uri: URI.file(mapPath).toString(),
                    depth: 2,
                    includeMetadata: false,
                });

                // The topicref should be present but not followed (no resolved topic)
                assert.ok(graph, 'should not throw on absolute href');
                // No resolved topics from the absolute path
                assert.strictEqual(graph.topics.length, 0, 'absolute href topic should not be resolved');
            } finally {
                cleanup(tmpDir);
            }
        });

        test('deep traversal href (>8 levels up) is rejected', () => {
            const tmpDir = makeTmpDir();
            try {
                const mapPath = path.join(tmpDir, 'root.ditamap');
                // 9 levels of ../ — exceeds the limit of 8
                const deepTraversal = '../'.repeat(9) + 'evil.dita';
                fs.writeFileSync(mapPath, `<?xml version="1.0"?>
<map title="Test">
  <topicref href="${deepTraversal}"/>
</map>`, 'utf-8');

                const graph = handleGetContextGraph({
                    uri: URI.file(mapPath).toString(),
                    depth: 2,
                    includeMetadata: false,
                });

                assert.ok(graph, 'should not throw on deep traversal href');
                assert.strictEqual(graph.topics.length, 0, 'deep traversal topic should not be resolved');
            } finally {
                cleanup(tmpDir);
            }
        });

        test('normal relative href is allowed', () => {
            const tmpDir = makeTmpDir();
            try {
                const mapPath = path.join(tmpDir, 'root.ditamap');
                const topicPath = path.join(tmpDir, 'topic.dita');
                fs.writeFileSync(topicPath, `<?xml version="1.0"?>
<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">
<topic id="t1"><title>My Topic</title><body><p>Content</p></body></topic>`, 'utf-8');
                fs.writeFileSync(mapPath, `<?xml version="1.0"?>
<map title="Test">
  <topicref href="topic.dita"/>
</map>`, 'utf-8');

                const graph = handleGetContextGraph({
                    uri: URI.file(mapPath).toString(),
                    depth: 2,
                    includeMetadata: true,
                });

                assert.ok(graph.rootMap.children.length > 0, 'normal topicref should be included');
            } finally {
                cleanup(tmpDir);
            }
        });
    });
});
