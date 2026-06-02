/**
 * Quick integration smoke test for the MCP server.
 * Spawns the server process, runs initialize + tools/list, tests all tools.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import * as path from 'path';
import * as fs from 'fs';

async function main() {
    const serverScript = path.resolve(import.meta.dirname, '..', '..', 'dist', 'mcp-server.js');

    // Create a minimal DITA workspace
    const tmpDir = path.join(import.meta.dirname, '..', '..', '.mcp-test-workspace');
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.mkdirSync(tmpDir, { recursive: true });

    const topicXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">
<topic id="intro">
  <title>Introduction</title>
  <body><p>Hello world.</p></body>
</topic>`;
    fs.writeFileSync(path.join(tmpDir, 'intro.dita'), topicXml);

    const mapXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA Map//EN" "map.dtd">
<map>
  <title>Test Map</title>
  <topicref href="intro.dita" keys="intro-key"/>
</map>`;
    fs.writeFileSync(path.join(tmpDir, 'test.ditamap'), mapXml);

    // Spawn MCP server
    const transport = new StdioClientTransport({
        command: 'node',
        args: [serverScript],
        env: { ...process.env, WORKSPACE: tmpDir, DITACRAFT_LOG_LEVEL: 'warn' },
    });

    const client = new Client(
        { name: 'smoke-test', version: '1.0.0' },
        { capabilities: {} },
    );

    await client.connect(transport);
    console.log('Connected to MCP server');

    // ── List tools ────────────────────────────────────────────────────

    const toolsResult = await client.listTools();
    console.log(`Found ${toolsResult.tools.length} tools:`);
    for (const tool of toolsResult.tools) {
        console.log(`  - ${tool.name}: ${tool.description?.slice(0, 60) ?? '(none)'}`);
    }

    // ── List resources ────────────────────────────────────────────────

    const resourcesResult = await client.listResources();
    console.log(`Found ${resourcesResult.resources.length} resources:`);
    for (const res of resourcesResult.resources) {
        console.log(`  - ${res.uri}: ${res.description?.slice(0, 60) ?? '(none)'}`);
    }

    // Helper: call a tool and parse JSON result
    async function callAndParse(name: string, args: Record<string, unknown>): Promise<unknown> {
        const result = await client.callTool({ name, arguments: args });
        if (result.isError) {
            const text = (result.content as Array<{ type: string; text: string }>)[0]?.text ?? '';
            if (text.startsWith('{')) {
                return JSON.parse(text);
            }
            return { error: text };
        }
        const text = (result.content as Array<{ type: string; text: string }>)[0]?.text ?? '{}';
        try {
            return JSON.parse(text);
        } catch {
            return { raw: text };
        }
    }

    // ── Test: dita_validate (valid file) ──────────────────────────────

    let passed = 0;
    let failed = 0;

    console.log('\n--- Testing dita_validate (valid) ---');
    const data1 = await callAndParse('dita_validate', { uri: 'intro.dita' }) as Record<string, unknown>;
    assert(!!data1.isValid, 'valid file should be valid');
    assert(data1.errorCount === 0, 'no errors expected');

    // ── Test: dita_validate (broken file) ─────────────────────────────

    console.log('--- Testing dita_validate (broken XML) ---');
    fs.writeFileSync(path.join(tmpDir, 'broken.dita'), '<topic><title>Bad</topic>');
    const data2 = await callAndParse('dita_validate', { uri: 'broken.dita' }) as Record<string, unknown>;
    assert(!data2.isValid, 'broken XML should not be valid');
    assert((data2.errorCount as number) > 0, 'errors expected');

    // ── Test: dita_validate (fragment) ────────────────────────────────

    console.log('--- Testing dita_validate (fragment) ---');
    const data3 = await callAndParse('dita_validate', {
        fragment: '<topic id="test"><title>Test</title><body><p>OK</p></body></topic>',
        fragmentType: 'topic',
    }) as Record<string, unknown>;
    assert(!!data3.isValid, 'valid fragment should be valid');

    // ── Test: dita_validate (missing params) ──────────────────────────

    console.log('--- Testing dita_validate (missing params) ---');
    const data4 = await callAndParse('dita_validate', {}) as Record<string, unknown>;
    assert(typeof data4.error === 'string', 'error expected for missing params');

    // ── Test: dita_key_space ──────────────────────────────────────────

    console.log('--- Testing dita_key_space ---');
    const data5 = await callAndParse('dita_key_space', { includeProvenance: true }) as Record<string, unknown>;
    assert((data5.totalKeys as number) > 0, 'keys expected in workspace');

    // ── Test: dita_resolve_reference ──────────────────────────────────

    console.log('--- Testing dita_resolve_reference ---');
    const data6 = await callAndParse('dita_resolve_reference', { reference: 'intro-key', referenceType: 'keyref', fromUri: 'intro.dita' }) as Record<string, unknown>;
    console.log(`  resolved: ${data6.resolved}, targetUri: ${data6.targetUri || 'N/A'}`);
    assert(!!data6.resolved, 'key should resolve');

    // ── Test: dita_explain_key ────────────────────────────────────────

    console.log('--- Testing dita_explain_key ---');
    const data7 = await callAndParse('dita_explain_key', { keyName: 'intro-key', contextFilePath: 'intro.dita' }) as Record<string, unknown>;
    console.log(`  resolved: ${data7.resolved}, steps: ${(data7.steps as unknown[] || []).length}`);
    assert(!!data7.resolved, 'key should resolve in explain');

    // ── Test: dita_map_structure ──────────────────────────────────────

    console.log('--- Testing dita_map_structure ---');
    const structResult = await client.callTool({ name: 'dita_map_structure', arguments: { mapUri: 'test.ditamap', format: 'tree' } });
    const structText = (structResult.content as Array<{ type: string; text: string }>)[0]?.text ?? '';
    console.log(structText.slice(0, 200));

    // ── Test: dita_context_snapshot ───────────────────────────────────

    console.log('--- Testing dita_context_snapshot ---');
    const snapData = await callAndParse('dita_context_snapshot', { uri: 'test.ditamap', maxTokens: 1000 }) as Record<string, unknown>;
    console.log(`  level: ${snapData.level}, truncated: ${snapData.truncated}`);

    // ── Test: workspace/maps resource ─────────────────────────────────

    console.log('--- Testing dita://workspace/maps ---');
    const mapsRes = await client.readResource({ uri: 'dita://workspace/maps' });
    const mapsText = mapsRes.contents[0]?.text ?? '{}';
    const mapsData = JSON.parse(mapsText) as Record<string, unknown>;
    assert(((mapsData.maps as unknown[])?.length ?? 0) > 0, 'maps resource should find maps');

    // ── Test: workspace/keys resource ─────────────────────────────────

    console.log('--- Testing dita://workspace/keys ---');
    const keysRes = await client.readResource({ uri: 'dita://workspace/keys' });
    const keysText = keysRes.contents[0]?.text ?? '{}';
    const keysData = JSON.parse(keysText) as Record<string, unknown>;
    assert((keysData.totalKeys as number) > 0, 'keys resource should find keys');

    // ── Test: workspace/diagnostics resource ──────────────────────────

    console.log('--- Testing dita://workspace/diagnostics ---');
    const diagRes = await client.readResource({ uri: 'dita://workspace/diagnostics' });
    const diagText = diagRes.contents[0]?.text ?? '{}';
    console.log(`  diagnostics totalCount: ${JSON.parse(diagText).totalCount}`);

    // ── Cleanup ───────────────────────────────────────────────────────

    await client.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
    console.log(`\n${'='.repeat(50)}`);
    console.log(`✅ All ${passed} assertions passed`);
    if (failed > 0) {
        console.log(`❌ ${failed} assertions FAILED`);
        process.exit(1);
    }

    function assert(condition: boolean, msg: string) {
        if (condition) {
            passed++;
        } else {
            console.error(`  ❌ FAIL: ${msg}`);
            failed++;
        }
    }
}

main().catch((err) => {
    console.error('\n❌ Smoke test crashed:', err);
    process.exit(1);
});
