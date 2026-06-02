import * as assert from 'assert';
import { createTestWorkspace, TestWorkspace } from '../helper';

const MAP_WITH_KEYS = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA Map//EN" "map.dtd">',
    '<map>',
    '  <title>Key Map</title>',
    '  <keydef keys="product-name" href="keys/product.dita"/>',
    '  <keydef keys="install-guide" href="topics/install.dita"/>',
    '  <topicref href="topics/intro.dita" keys="intro"/>',
    '</map>',
].join('\n');

const KEYS_TOPIC = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">',
    '<topic id="REPLACE_ID">',
    '  <title>REPLACE_TITLE</title>',
    '  <body><p>Content.</p></body>',
    '</topic>',
].join('\n');

suite('dita_key_space', () => {

    let ws: TestWorkspace;

    suiteSetup(async () => {
        ws = await createTestWorkspace();
        ws.addFile('test-map.ditamap', MAP_WITH_KEYS);
        ws.addFile('keys/product.dita', KEYS_TOPIC.replace('REPLACE_ID', 'product').replace('REPLACE_TITLE', 'Product'));
        ws.addFile('topics/install.dita', KEYS_TOPIC.replace('REPLACE_ID', 'install').replace('REPLACE_TITLE', 'Install'));
        ws.addFile('topics/intro.dita', KEYS_TOPIC.replace('REPLACE_ID', 'intro').replace('REPLACE_TITLE', 'Intro'));
    });

    suiteTeardown(async () => {
        await ws.cleanup();
    });

    test('returns all keys with default parameters', async () => {
        const result = await ws.callTool('dita_key_space', {}) as Record<string, unknown>;
        assert.ok((result.totalKeys as number) > 0);
        const keys = result.keys as Array<Record<string, unknown>>;
        const keyNames = keys.map((k) => k.keyName);
        assert.ok(keyNames.includes('product-name') || keyNames.includes('test-map.product-name'));
    });

    test('includeScopes=false omits scope-qualified key names', async () => {
        const result = await ws.callTool('dita_key_space', { includeScopes: false }) as Record<string, unknown>;
        const keys = result.keys as Array<Record<string, unknown>>;
        // All key names should not contain dots (no scope prefix)
        for (const k of keys) {
            assert.ok(!(k.keyName as string).includes('.'));
        }
    });

    test('includeProvenance=true returns sourceFile and sourceLine', async () => {
        const result = await ws.callTool('dita_key_space', { includeProvenance: true }) as Record<string, unknown>;
        const keys = result.keys as Array<Record<string, unknown>>;
        assert.ok(keys.length > 0);
        // At least one key should have sourceFile
        const withSrc = keys.filter((k) => k.sourceFile);
        assert.ok(withSrc.length > 0);
    });

    test('auto-discovers root map when mapUri is omitted', async () => {
        const result = await ws.callTool('dita_key_space', {}) as Record<string, unknown>;
        assert.ok((result.totalKeys as number) > 0);
    });

    test('returns empty array when workspace has no maps', async () => {
        // Create a new workspace with no maps
        const { createTestWorkspace: createWs } = await import('../helper');
        const emptyWs = await createWs();
        const result = await emptyWs.callTool('dita_key_space', {}) as Record<string, unknown>;
        assert.strictEqual(result.totalKeys, 0);
        await emptyWs.cleanup();
    });

});
