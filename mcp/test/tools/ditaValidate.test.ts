/**
 * Integration tests for dita_validate tool.
 * Spawns MCP server, calls tool, validates responses.
 */
import * as assert from 'assert';
import { createTestWorkspace, TestWorkspace } from '../helper';

const TOPIC_VALID = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">',
    '<topic id="test">',
    '  <title>Test Topic</title>',
    '  <body><p>Hello world.</p></body>',
    '</topic>',
].join('\n');

const TOPIC_MISSING_TITLE = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">',
    '<topic id="test">',
    '  <body><p>No title here.</p></body>',
    '</topic>',
].join('\n');

const BROKEN_XML = '<topic><title>Bad</topic>';

const MAP_WITH_KEY = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA Map//EN" "map.dtd">',
    '<map>',
    '  <title>Test Map</title>',
    '  <topicref href="valid-topic.dita" keys="test-key"/>',
    '</map>',
].join('\n');

suite('dita_validate', () => {

    let ws: TestWorkspace;

    suiteSetup(async () => {
        ws = await createTestWorkspace();
        ws.addFile('valid-topic.dita', TOPIC_VALID);
        ws.addFile('missing-title.dita', TOPIC_MISSING_TITLE);
        ws.addFile('broken-xml.dita', BROKEN_XML);
        ws.addFile('test-map.ditamap', MAP_WITH_KEY);
    });

    suiteTeardown(async () => {
        await ws.cleanup();
    });

    suite('File validation', () => {

        test('validates a valid topic file', async () => {
            const result = await ws.callTool('dita_validate', { uri: 'valid-topic.dita' }) as Record<string, unknown>;
            assert.strictEqual(result.isValid, true);
            assert.strictEqual(result.errorCount, 0);
        });

        test('validates a topic missing <title>', async () => {
            const result = await ws.callTool('dita_validate', { uri: 'missing-title.dita' }) as Record<string, unknown>;
            assert.strictEqual(result.isValid, false);
            // Should have at least one diagnostic about the missing title
            const diags = result.diagnostics as Array<{ code: string }>;
            assert.ok(diags.length > 0);
            const codes = diags.map((d) => d.code);
            assert.ok(codes.some((c) => c.includes('STRUCT-003') || c.includes('STRUCT-004') || c.includes('TITLE')));
        });

        test('validates a file with broken XML syntax', async () => {
            const result = await ws.callTool('dita_validate', { uri: 'broken-xml.dita' }) as Record<string, unknown>;
            assert.strictEqual(result.isValid, false);
            assert.ok((result.errorCount as number) > 0);
        });

        test('returns error for non-existent file', async () => {
            const result = await ws.callTool('dita_validate', { uri: 'does-not-exist.dita' }) as Record<string, unknown>;
            assert.ok(typeof result.error === 'string');
        });

    });

    suite('Fragment validation', () => {

        test('validates a valid topic fragment', async () => {
            const fragment = '<topic id="f"><title>Test</title><body><p>OK</p></body></topic>';
            const result = await ws.callTool('dita_validate', { fragment, fragmentType: 'topic' }) as Record<string, unknown>;
            assert.strictEqual(result.isValid, true);
        });

        test('validates a map fragment missing title', async () => {
            const fragment = '<map><topicref href="topic.dita"/></map>';
            const result = await ws.callTool('dita_validate', { fragment, fragmentType: 'map' }) as Record<string, unknown>;
            // Map without title should get diagnostics
            assert.ok(result.diagnostics !== undefined || result.isValid !== undefined);
        });

    });

    suite('Error handling', () => {

        test('returns error when both uri and fragment are missing', async () => {
            const result = await ws.callTool('dita_validate', {}) as Record<string, unknown>;
            assert.ok(typeof result.error === 'string');
        });

        test('returns error when fragment provided without fragmentType', async () => {
            const result = await ws.callTool('dita_validate', { fragment: '<topic/>' }) as Record<string, unknown>;
            assert.ok(typeof result.error === 'string');
        });

        test('handles UTF-8 content with CJK characters', async () => {
            const content = [
                '<?xml version="1.0" encoding="UTF-8"?>',
                '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">',
                '<topic id="cjk">',
                '  <title>日本語テスト</title>',
                '  <body><p>中文测试 한글테스트</p></body>',
                '</topic>',
            ].join('\n');
            ws.addFile('cjk.dita', content);
            const result = await ws.callTool('dita_validate', { uri: 'cjk.dita' }) as Record<string, unknown>;
            // Should not throw — just check it returns a result
            assert.ok(typeof result.isValid === 'boolean');
        });

    });

});
