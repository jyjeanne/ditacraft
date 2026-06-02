/**
 * Integration tests for the workspace-maps MCP resource.
 */
import * as assert from 'assert';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { createTestWorkspace, TestWorkspace } from '../helper';

const MAP_CONTENT = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA Map//EN" "map.dtd">',
    '<map>',
    '  <title>Test Map</title>',
    '  <topicref href="topics/a.dita"/>',
    '  <topicref href="topics/b.dita"/>',
    '</map>',
].join('\n');

const TOPIC = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">',
    '<topic id="t"><title>T</title><body><p>.</p></body></topic>',
].join('\n');

suite('workspace-maps resource', () => {

    let ws: TestWorkspace;

    suiteSetup(async () => {
        ws = await createTestWorkspace();
        ws.addFile('test.ditamap', MAP_CONTENT);
        ws.addFile('topics/a.dita', TOPIC);
        ws.addFile('topics/b.dita', TOPIC);
    });

    suiteTeardown(async () => {
        await ws.cleanup();
    });

    async function readMaps(): Promise<{ maps: Array<Record<string, unknown>> }> {
        const result = await ws.client.readResource({ uri: 'dita://workspace/maps' });
        const text = (result.contents as Array<{ text?: string }>)[0]?.text ?? '{}';
        return JSON.parse(text);
    }

    test('returns at least one map', async () => {
        const data = await readMaps();
        assert.ok(Array.isArray(data.maps));
        assert.ok(data.maps.length >= 1);
    });

    test('returned map entry has uri, title, topicCount, isRoot, lastModified', async () => {
        const data = await readMaps();
        const map = data.maps[0];
        assert.ok(typeof map.uri === 'string' && map.uri.startsWith('file://'));
        assert.ok(typeof map.title === 'string');
        assert.ok(typeof map.topicCount === 'number');
        assert.ok(typeof map.isRoot === 'boolean');
        assert.ok(typeof map.lastModified === 'string');
    });

    test('map uri points to the added .ditamap file', async () => {
        const data = await readMaps();
        const uris = data.maps.map((m) => m.uri as string);
        assert.ok(uris.some((u) => u.includes('test.ditamap')));
    });

    test('isRoot is true for map at workspace root', async () => {
        const data = await readMaps();
        const rootMap = data.maps.find((m) => (m.uri as string).includes('test.ditamap'));
        assert.ok(rootMap);
        assert.strictEqual(rootMap.isRoot, true);
    });

    test('returns empty maps array when workspace has no maps', async () => {
        const { createTestWorkspace: createWs } = await import('../helper');
        const emptyWs = await createWs();
        try {
            const result = await emptyWs.client.readResource({ uri: 'dita://workspace/maps' });
            const text = (result.contents as Array<{ text?: string }>)[0]?.text ?? '{}';
            const data = JSON.parse(text);
            assert.strictEqual(data.maps.length, 0);
        } finally {
            await emptyWs.cleanup();
        }
    });

});
