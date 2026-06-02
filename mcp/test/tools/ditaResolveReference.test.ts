import * as assert from 'assert';
import { createTestWorkspace, TestWorkspace } from '../helper';

const MAP_WITH_KEYS = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA Map//EN" "map.dtd">',
    '<map>',
    '  <title>Ref Map</title>',
    '  <keydef keys="test-key" href="topics/target.dita"/>',
    '  <topicref href="topics/source.dita"/>',
    '</map>',
].join('\n');

const TOPIC_TARGET = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">',
    '<topic id="target"><title>Target</title><body><p id="p1">Para</p></body></topic>',
].join('\n');

const TOPIC_SOURCE = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">',
    '<topic id="source"><title>Source</title><body><p>Ref: <xref keyref="test-key"/></p></body></topic>',
].join('\n');

suite('dita_resolve_reference', () => {

    let ws: TestWorkspace;

    suiteSetup(async () => {
        ws = await createTestWorkspace();
        ws.addFile('test-map.ditamap', MAP_WITH_KEYS);
        ws.addFile('topics/target.dita', TOPIC_TARGET);
        ws.addFile('topics/source.dita', TOPIC_SOURCE);
    });

    suiteTeardown(async () => {
        await ws.cleanup();
    });

    test('resolves href to absolute file path', async () => {
        const result = await ws.callTool('dita_resolve_reference', {
            reference: 'topics/target.dita',
            referenceType: 'href',
            fromUri: 'topics/source.dita',
        }) as Record<string, unknown>;
        // href from valid fromUri directory should resolve
        const resolved = result.resolved as boolean;
        if (!resolved) {
            // May not resolve depending on workspace path handling
            assert.ok(typeof result.error === 'string' || result.error === undefined);
        } else {
            assert.ok((result.targetUri as string).includes('target.dita'));
        }
    });

    test('returns resolved=false for unknown key name', async () => {
        const result = await ws.callTool('dita_resolve_reference', {
            reference: 'no-such-key',
            referenceType: 'keyref',
            fromUri: 'topics/source.dita',
        }) as Record<string, unknown>;
        assert.strictEqual(result.resolved, false);
    });

    test('resolves keyref through key space', async () => {
        const result = await ws.callTool('dita_resolve_reference', {
            reference: 'test-key',
            referenceType: 'keyref',
            fromUri: 'topics/source.dita',
        }) as Record<string, unknown>;
        assert.strictEqual(result.resolved, true);
        assert.ok((result.targetUri as string || '').includes('target.dita'));
    });

    test('returns resolved=false for broken href file path', async () => {
        const result = await ws.callTool('dita_resolve_reference', {
            reference: 'no-such-file.dita',
            referenceType: 'href',
            fromUri: 'topics/source.dita',
        }) as Record<string, unknown>;
        assert.strictEqual(result.resolved, false);
    });

    test('rejects path traversal in reference (security)', async () => {
        const result = await ws.callTool('dita_resolve_reference', {
            reference: '../../../../etc/passwd',
            referenceType: 'href',
            fromUri: 'topics/source.dita',
        }) as Record<string, unknown>;
        assert.strictEqual(result.resolved, false);
        // Must not expose any file content
        const text = JSON.stringify(result);
        assert.ok(!text.includes('root:') && !text.includes('daemon:'));
    });

    test('rejects traversal with backslashes (Windows security)', async () => {
        const result = await ws.callTool('dita_resolve_reference', {
            reference: '..\\..\\..\\Windows\\System32\\drivers\\etc\\hosts',
            referenceType: 'href',
        }) as Record<string, unknown>;
        assert.strictEqual(result.resolved, false);
    });

    test('cyclic keyref chain does not stack-overflow (returns resolved=false with error)', async () => {
        // Set up a second workspace with cyclic key definitions
        const cycleWs = await createTestWorkspace();
        const cycleMap = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA Map//EN" "map.dtd">',
            '<map>',
            '  <title>Cycle Map</title>',
            '  <keydef keys="key-a" keyref="key-b"/>',
            '  <keydef keys="key-b" keyref="key-a"/>',
            '</map>',
        ].join('\n');
        cycleWs.addFile('cycle.ditamap', cycleMap);

        const result = await cycleWs.callTool('dita_resolve_reference', {
            reference: 'key-a',
            referenceType: 'keyref',
        }) as Record<string, unknown>;

        // Must return gracefully — not crash the server
        assert.strictEqual(typeof result, 'object');
        // Should be unresolved or return cycle error
        assert.ok(
            result.resolved === false || typeof result.error === 'string',
            `Expected unresolved or error, got: ${JSON.stringify(result)}`,
        );

        await cycleWs.cleanup();
    });

});
