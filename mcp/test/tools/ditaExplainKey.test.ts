import * as assert from 'assert';
import { createTestWorkspace, TestWorkspace } from '../helper';

const MAP_WITH_KEYS = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA Map//EN" "map.dtd">',
    '<map>',
    '  <title>Explain Map</title>',
    '  <keydef keys="explain-key" href="topics/target.dita"/>',
    '</map>',
].join('\n');

const TOPIC_TARGET = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">',
    '<topic id="target"><title>Target</title><body><p>Content</p></body></topic>',
].join('\n');

suite('dita_explain_key', () => {

    let ws: TestWorkspace;

    suiteSetup(async () => {
        ws = await createTestWorkspace();
        ws.addFile('test-map.ditamap', MAP_WITH_KEYS);
        ws.addFile('topics/target.dita', TOPIC_TARGET);
    });

    suiteTeardown(async () => {
        await ws.cleanup();
    });

    test('returns full resolution trace for found key', async () => {
        const result = await ws.callTool('dita_explain_key', {
            keyName: 'explain-key',
            contextFilePath: 'test-map.ditamap',
        }) as Record<string, unknown>;
        assert.strictEqual(result.resolved, true);
        assert.ok(Array.isArray(result.steps));
        assert.ok((result.steps as unknown[]).length > 0);
    });

    test('returns all lookup steps even when key not found', async () => {
        const result = await ws.callTool('dita_explain_key', {
            keyName: 'no-such-key',
            contextFilePath: 'test-map.ditamap',
        }) as Record<string, unknown>;
        assert.strictEqual(result.resolved, false);
        assert.ok(Array.isArray(result.steps));
        // Should still have steps explaining the lookup
        assert.ok((result.steps as unknown[]).length > 0);
    });

    test('returns definition with targetUri for resolved key', async () => {
        const result = await ws.callTool('dita_explain_key', {
            keyName: 'explain-key',
            contextFilePath: 'test-map.ditamap',
        }) as Record<string, unknown>;
        assert.ok(result.definition);
        const def = result.definition as Record<string, unknown>;
        assert.ok((def.targetUri as string || '').includes('target.dita'));
    });

});
