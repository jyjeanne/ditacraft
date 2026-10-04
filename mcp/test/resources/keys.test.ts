/**
 * Integration tests for the workspace-keys MCP resource.
 */
import * as assert from 'assert';
import { createTestWorkspace, TestWorkspace } from '../helper';

const MAP_WITH_KEYS = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA Map//EN" "map.dtd">',
    '<map>',
    '  <title>Key Map</title>',
    '  <keydef keys="product-name" href="topics/product.dita"/>',
    '  <keydef keys="install-guide" href="topics/install.dita"/>',
    '</map>',
].join('\n');

const TOPIC = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">',
    '<topic id="t"><title>T</title><body><p>.</p></body></topic>',
].join('\n');

suite('workspace-keys resource', () => {

    let ws: TestWorkspace;

    suiteSetup(async () => {
        ws = await createTestWorkspace();
        ws.addFile('keys.ditamap', MAP_WITH_KEYS);
        ws.addFile('topics/product.dita', TOPIC);
        ws.addFile('topics/install.dita', TOPIC);
    });

    suiteTeardown(async () => {
        await ws.cleanup();
    });

    async function readKeys(queryString = ''): Promise<{ totalKeys: number; keys: Array<Record<string, unknown>> }> {
        const uri = queryString
            ? `dita://workspace/keys?${queryString}`
            : 'dita://workspace/keys';
        const result = await ws.client.readResource({ uri });
        const text = (result.contents as Array<{ text?: string }>)[0]?.text ?? '{}';
        return JSON.parse(text);
    }

    test('returns totalKeys and keys array', async () => {
        const data = await readKeys();
        assert.ok(typeof data.totalKeys === 'number');
        assert.ok(Array.isArray(data.keys));
    });

    test('keys defined in .ditamap appear in resource', async () => {
        const data = await readKeys();
        assert.ok(data.totalKeys >= 2, `Expected >=2 keys, got ${data.totalKeys}`);
        const keyNames = data.keys.map((k) => k.keyName as string);
        assert.ok(keyNames.some((k) => k.includes('product-name')));
        assert.ok(keyNames.some((k) => k.includes('install-guide')));
    });

    test('each key entry has keyName', async () => {
        const data = await readKeys();
        for (const k of data.keys) {
            assert.ok(typeof k.keyName === 'string' && k.keyName.length > 0);
        }
    });

    // Query parameters used to make the resource "not found"; these tests failed (and passed
    // vacuously on an empty result).

    test('search param filters keys by name substring', async () => {
        const data = await readKeys('search=PRODUCT');
        assert.deepStrictEqual(data.keys.map((k) => k.keyName), ['product-name'], 'case-insensitive');
        assert.strictEqual(data.totalKeys, 1);
        assert.strictEqual((await readKeys('search=nothing-like-it')).totalKeys, 0);
    });

    test('includeScopes=false omits scope prefix', async () => {
        const data = await readKeys('includeScopes=false&search=install');
        assert.deepStrictEqual(data.keys.map((k) => k.keyName), ['install-guide']);
        for (const k of (await readKeys('includeScopes=false')).keys) {
            assert.ok(!(k.keyName as string).includes('.'));
        }
    });

    test('an unknown parameter or value is an error that says what to use', async () => {
        const error = async (query: string) => {
            try { await readKeys(query); return 'no error'; } catch (e) { return (e as Error).message; }
        };
        assert.match(await error('find=product'), /Unknown parameter "find" for dita:\/\/workspace\/keys: use includeScopes, search/);
        assert.match(await error('includeScopes=maybe'), /"includeScopes" must be true or false, not "maybe"/);
    });

    test('the filtered form is listed as a URI template', async () => {
        const { resourceTemplates } = await ws.client.listResourceTemplates();
        assert.ok(resourceTemplates.some((t) => t.uriTemplate === 'dita://workspace/keys{?includeScopes,search}'),
            JSON.stringify(resourceTemplates.map((t) => t.uriTemplate)));
    });

    test('returns empty keys array when workspace has no maps', async () => {
        const { createTestWorkspace: createWs } = await import('../helper');
        const emptyWs = await createWs();
        try {
            const result = await emptyWs.client.readResource({ uri: 'dita://workspace/keys' });
            const text = (result.contents as Array<{ text?: string }>)[0]?.text ?? '{}';
            const data = JSON.parse(text);
            assert.strictEqual(data.totalKeys, 0);
        } finally {
            await emptyWs.cleanup();
        }
    });

});
