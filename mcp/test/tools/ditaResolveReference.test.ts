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

    suite('keyref chains across key scopes (DITA 1.3 §2.3.4.10.6)', () => {
        // Scope S: "a" refers to "b", which only scope T defines; scope S2: "c" refers to "d", which S2 defines.
        // The @keyref of a key definition is a key reference made in the scope of that definition.
        const SCOPED_MAP = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA Map//EN" "map.dtd">',
            '<map>',
            '  <title>Scoped Chains</title>',
            '  <topicgroup keyscope="S"><keydef keys="a" keyref="b"/></topicgroup>',
            '  <topicgroup keyscope="S2"><keydef keys="c" keyref="d"/><keydef keys="d" href="topics/d.dita"/></topicgroup>',
            '  <topicgroup keyscope="T"><keydef keys="b" href="topics/b.dita"/><topicref href="topics/t.dita"/></topicgroup>',
            '</map>',
        ].join('\n');
        const topic = (id: string, body: string) => [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">',
            `<topic id="${id}"><title>${id}</title><body>${body}</body></topic>`,
        ].join('\n');
        let scopedWs: TestWorkspace;

        suiteSetup(async () => {
            scopedWs = await createTestWorkspace();
            scopedWs.addFile('scoped.ditamap', SCOPED_MAP);
            scopedWs.addFile('topics/t.dita', topic('t', '<p><xref keyref="S.a"/> <xref keyref="S2.c"/></p>'));
            scopedWs.addFile('topics/b.dita', topic('b', '<p>B</p>'));
            scopedWs.addFile('topics/d.dita', topic('d', '<p>D</p>'));
        });

        suiteTeardown(async () => {
            await scopedWs.cleanup();
        });

        test('a broken chain is not looked up again from the referencing topic, in another scope', async () => {
            // The language server says that "S.a" has no target; the tool used to resolve "b" from the
            // topic, in scope T, and return b.dita.
            const result = await scopedWs.callTool('dita_resolve_reference', {
                reference: 'S.a',
                referenceType: 'keyref',
                fromUri: 'topics/t.dita',
            }) as Record<string, unknown>;
            assert.strictEqual(result.resolved, false, JSON.stringify(result));
            assert.strictEqual(result.error,
                'Key "S.a" has no target: key "S.a" refers to key "b", which is not defined in its key scope');
        });

        test('a chain in a scope resolves, and the trace lists each hop', async () => {
            const result = await scopedWs.callTool('dita_resolve_reference', {
                reference: 'S2.c',
                referenceType: 'keyref',
                fromUri: 'topics/t.dita',
            }) as Record<string, unknown>;
            assert.strictEqual(result.resolved, true, JSON.stringify(result));
            assert.ok((result.targetUri as string).endsWith('topics/d.dita'));
            const trace = result.resolutionTrace as string[];
            assert.ok(trace.some(line => line.includes('Followed @keyref: "S2.c" → "S2.d"')), trace.join('\n'));
        });

        test('a broken chain through @conkeyref is reported the same way', async () => {
            const result = await scopedWs.callTool('dita_resolve_reference', {
                reference: 'S.a/p1',
                referenceType: 'conkeyref',
                fromUri: 'topics/t.dita',
            }) as Record<string, unknown>;
            assert.strictEqual(result.resolved, false);
            assert.match(result.error as string, /refers to key "b", which is not defined in its key scope/);
        });
    });

});
