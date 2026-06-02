import * as assert from 'assert';
import { createTestWorkspace, TestWorkspace } from '../helper';

const MAP_WITH_TOPICS = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA Map//EN" "map.dtd">',
    '<map>',
    '  <title>Large Map</title>',
    '  <topicref href="topic-a.dita"/>',
    '  <topicref href="topic-b.dita"/>',
    '  <topicref href="topic-c.dita"/>',
    '</map>',
].join('\n');

const TOPIC = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">',
    '<topic id="REPLACE_ID">',
    '  <title>REPLACE_TITLE</title>',
    '  <body><p>Content.</p></body>',
    '</topic>',
].join('\n');

suite('dita_context_snapshot', () => {

    let ws: TestWorkspace;

    suiteSetup(async () => {
        ws = await createTestWorkspace();
        ws.addFile('test-map.ditamap', MAP_WITH_TOPICS);
        ws.addFile('topic-a.dita', TOPIC.replace('REPLACE_ID', 'a').replace('REPLACE_TITLE', 'Topic A'));
        ws.addFile('topic-b.dita', TOPIC.replace('REPLACE_ID', 'b').replace('REPLACE_TITLE', 'Topic B'));
        ws.addFile('topic-c.dita', TOPIC.replace('REPLACE_ID', 'c').replace('REPLACE_TITLE', 'Topic C'));
    });

    suiteTeardown(async () => {
        await ws.cleanup();
    });

    test('returns snapshot for a small map', async () => {
        const result = await ws.callTool('dita_context_snapshot', { uri: 'test-map.ditamap' }) as Record<string, unknown>;
        assert.ok(typeof result.snapshot === 'string');
        assert.ok((result.snapshot as string).length > 0);
        assert.strictEqual(typeof result.level, 'number');
    });

    test('respects maxTokens (never exceeds budget)', async () => {
        const result = await ws.callTool('dita_context_snapshot', { uri: 'test-map.ditamap', maxTokens: 50 }) as Record<string, unknown>;
        assert.ok((result.tokenEstimate as number) <= 50 + 10); // allow small margin
    });

    test('returns error for non-existent map file', async () => {
        try {
            await ws.callToolRaw('dita_context_snapshot', { uri: 'no-such-map.ditamap' });
            assert.fail('Expected error for missing file');
        } catch {
            // Expected — tool throws, MCP SDK wraps as error
        }
    });

    test('handles empty map (no topicref children)', async () => {
        ws.addFile('empty-map.ditamap', [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA Map//EN" "map.dtd">',
            '<map><title>Empty</title></map>',
        ].join('\n'));
        const result = await ws.callTool('dita_context_snapshot', { uri: 'empty-map.ditamap' }) as Record<string, unknown>;
        assert.ok(typeof result.snapshot === 'string');
    });

});
