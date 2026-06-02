/**
 * Integration tests for the workspace-diagnostics MCP resource.
 */
import * as assert from 'assert';
import { createTestWorkspace, TestWorkspace } from '../helper';

const TOPIC_MISSING_TITLE = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">',
    '<topic id="test">',
    '  <body><p>No title here.</p></body>',
    '</topic>',
].join('\n');

const TOPIC_VALID = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">',
    '<topic id="test">',
    '  <title>OK</title>',
    '  <body><p>Valid.</p></body>',
    '</topic>',
].join('\n');

suite('workspace-diagnostics resource', () => {

    let ws: TestWorkspace;

    suiteSetup(async () => {
        ws = await createTestWorkspace();
        ws.addFile('missing-title.dita', TOPIC_MISSING_TITLE);
        ws.addFile('valid.dita', TOPIC_VALID);
        // Populate the diagnostics store by running validation
        await ws.callTool('dita_validate', { uri: 'missing-title.dita' });
        await ws.callTool('dita_validate', { uri: 'valid.dita' });
    });

    suiteTeardown(async () => {
        await ws.cleanup();
    });

    async function readDiagnostics(queryString = ''): Promise<{ totalCount: number; diagnostics: Array<Record<string, unknown>> }> {
        const uri = queryString
            ? `dita://workspace/diagnostics?${queryString}`
            : 'dita://workspace/diagnostics';
        const result = await ws.client.readResource({ uri });
        const text = (result.contents as Array<{ text?: string }>)[0]?.text ?? '{}';
        return JSON.parse(text);
    }

    test('returns totalCount and diagnostics array', async () => {
        const data = await readDiagnostics();
        assert.ok(typeof data.totalCount === 'number');
        assert.ok(Array.isArray(data.diagnostics));
    });

    test('diagnostics from missing-title file appear after validation', async () => {
        const data = await readDiagnostics();
        assert.ok(data.totalCount > 0, 'Expected at least one diagnostic from missing-title.dita');
    });

    test('each diagnostic has required fields', async () => {
        const data = await readDiagnostics();
        if (data.diagnostics.length > 0) {
            const d = data.diagnostics[0];
            assert.ok(typeof d.file === 'string');
            assert.ok(typeof d.line === 'number');
            assert.ok(typeof d.column === 'number');
            assert.ok(typeof d.code === 'string');
            assert.ok(typeof d.message === 'string');
            assert.ok(typeof d.severity === 'string');
        }
    });

    test('severity filter returns only requested severities', async () => {
        const data = await readDiagnostics('severity=error');
        for (const d of data.diagnostics) {
            assert.strictEqual(d.severity, 'error');
        }
    });

    test('limit param caps the number of results', async () => {
        // Validate a few files to ensure we have results
        const data = await readDiagnostics('limit=1');
        assert.ok(data.diagnostics.length <= 1);
        // totalCount still reflects the full count
        assert.ok(data.totalCount >= data.diagnostics.length);
    });

    test('filePattern filters to matching files only', async () => {
        const data = await readDiagnostics('filePattern=**%2Fmissing-title.dita');
        for (const d of data.diagnostics) {
            assert.ok((d.file as string).includes('missing-title.dita'));
        }
    });

});
