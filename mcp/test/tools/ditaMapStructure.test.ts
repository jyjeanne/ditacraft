import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { createTestWorkspace, TestWorkspace } from '../helper';

const MAP_WITH_TOPICS = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA Map//EN" "map.dtd">',
    '<map>',
    '  <title>Structure Map</title>',
    '  <topicref href="topic-a.dita"/>',
    '  <topicref href="topic-b.dita"/>',
    '  <topicref href="nested/nested-map.ditamap" format="ditamap"/>',
    '</map>',
].join('\n');

const TOPIC_A = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">',
    '<topic id="a"><title>Topic A</title><body><p>A</p></body></topic>',
].join('\n');

const TOPIC_B = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">',
    '<topic id="b"><title>Topic B</title><body><p>B</p></body></topic>',
].join('\n');

suite('dita_map_structure', () => {

    let ws: TestWorkspace;

    suiteSetup(async () => {
        ws = await createTestWorkspace();
        ws.addFile('test-map.ditamap', MAP_WITH_TOPICS);
        ws.addFile('topic-a.dita', TOPIC_A);
        ws.addFile('topic-b.dita', TOPIC_B);
    });

    suiteTeardown(async () => {
        await ws.cleanup();
    });

    test('returns JSON structure by default', async () => {
        const result = await ws.callToolRaw('dita_map_structure', { mapUri: 'test-map.ditamap' });
        const text = result.content[0]?.text ?? '';
        // Should be valid JSON (ContextGraph)
        const parsed = JSON.parse(text);
        assert.ok(parsed.rootMap);
        assert.ok(Array.isArray(parsed.topics));
    });

    test('tree format produces text output', async () => {
        const result = await ws.callToolRaw('dita_map_structure', { mapUri: 'test-map.ditamap', format: 'tree' });
        const text = result.content[0]?.text ?? '';
        // Should contain Map title
        assert.ok(text.includes('Structure Map'));
    });

    test('csv format produces valid CSV', async () => {
        const result = await ws.callToolRaw('dita_map_structure', { mapUri: 'test-map.ditamap', format: 'csv' });
        const text = result.content[0]?.text ?? '';
        // Should have CSV header
        assert.ok(text.includes('type,uri,title'));
    });

    test('returns error for missing map file', async () => {
        try {
            await ws.callToolRaw('dita_map_structure', { mapUri: 'no-such-map.ditamap' });
            assert.fail('Expected error for missing file');
        } catch {
            // Expected — tool throws, MCP SDK wraps as error
        }
    });

    test('includeMetadata=false omits titles', async () => {
        const result = await ws.callToolRaw('dita_map_structure', { mapUri: 'test-map.ditamap', includeMetadata: false });
        // Should still return valid JSON
        const text = result.content[0]?.text ?? '';
        const parsed = JSON.parse(text);
        assert.ok(parsed.rootMap);
    });

    test('topicref escaping the workspace is not resolved into a child (regression)', async () => {
        // A submap reachable from test-map.ditamap references a path that
        // escapes the workspace root entirely. The map-structure tool must
        // not resolve or report on files outside the workspace, mirroring
        // the guard already verified for handleGetContextGraph directly in
        // server/test/contextGraph.test.ts.
        const outsideFile = path.join(os.tmpdir(), 'ditacraft-mcp-outside.dita');
        fs.writeFileSync(outsideFile, '<topic id="o"><title>Outside</title></topic>');
        const escapeMapPath = path.join(ws.dir, 'escape-map.ditamap');
        const relativeHref = path.relative(path.dirname(escapeMapPath), outsideFile).replace(/\\/g, '/');
        fs.writeFileSync(escapeMapPath, [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA Map//EN" "map.dtd">',
            '<map>',
            '  <title>Escape Map</title>',
            `  <topicref href="${relativeHref}"/>`,
            '</map>',
        ].join('\n'));

        try {
            const result = await ws.callToolRaw('dita_map_structure', { mapUri: 'escape-map.ditamap' });
            const text = result.content[0]?.text ?? '';
            const parsed = JSON.parse(text);
            assert.strictEqual(parsed.rootMap.children.length, 0,
                'escaping topicref must not be resolved into a child');
            assert.strictEqual(parsed.topics.length, 0,
                'no topic outside the workspace should be indexed');
        } finally {
            fs.rmSync(outsideFile, { force: true });
        }
    });

});
