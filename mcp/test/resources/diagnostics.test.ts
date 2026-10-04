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

    // Query parameters: a URI with a query string used to be "not found" (the SDK matched the
    // resource's URI exactly), so these tests failed — and passed vacuously on an empty result.

    async function readError(queryString: string): Promise<string> {
        try {
            await readDiagnostics(queryString);
            return 'no error';
        } catch (e) {
            return (e as Error).message;
        }
    }

    test('severity filter returns only requested severities', async () => {
        const all = await readDiagnostics('limit=0');
        const bySeverity = (...severities: string[]) => all.diagnostics.filter((d) => severities.includes(d.severity as string)).length;
        assert.ok(bySeverity('error') > 0, 'the topic without a title has an error');

        const errors = await readDiagnostics('severity=error');
        assert.strictEqual(errors.totalCount, bySeverity('error'));
        assert.ok(errors.diagnostics.every((d) => d.severity === 'error'));
        const several = await readDiagnostics('severity=error,warning,info');
        assert.strictEqual(several.totalCount, bySeverity('error', 'warning', 'information'), '"info" is "information"');
    });

    test('limit param caps the number of results', async () => {
        const all = await readDiagnostics('limit=0');
        assert.ok(all.totalCount > 1, `several diagnostics to cap, got ${all.totalCount}`);
        assert.strictEqual(all.diagnostics.length, all.totalCount, 'limit=0 returns them all');
        const one = await readDiagnostics('limit=1');
        assert.strictEqual(one.diagnostics.length, 1);
        assert.strictEqual(one.totalCount, all.totalCount, 'totalCount is the count before the limit');
    });

    test('filePattern filters to matching files only', async () => {
        const data = await readDiagnostics('filePattern=**%2Fmissing-title.dita');
        assert.ok(data.totalCount > 0);
        assert.ok(data.diagnostics.every((d) => (d.file as string).includes('missing-title.dita')));
        const none = await readDiagnostics('filePattern=**%2Fno-such-file.dita');
        assert.strictEqual(none.totalCount, 0);
    });

    test('parameters combine, in any order, and the contents echo the URI read', async () => {
        const a = await readDiagnostics('severity=error&limit=1&filePattern=**%2Fmissing-title.dita');
        const b = await readDiagnostics('filePattern=**%2Fmissing-title.dita&limit=1&severity=error');
        assert.strictEqual(a.diagnostics.length, 1);
        assert.deepStrictEqual(a, b);
        const result = await ws.client.readResource({ uri: 'dita://workspace/diagnostics?limit=1' });
        assert.strictEqual(result.contents[0].uri, 'dita://workspace/diagnostics?limit=1');
    });

    test('an unknown parameter or value is an error that says what to use', async () => {
        assert.match(await readError('servity=error'), /Unknown parameter "servity" for dita:\/\/workspace\/diagnostics: use severity, limit, filePattern/);
        assert.match(await readError('severity=fatal'), /Unknown severity "fatal": use error, warning, information, hint/);
        assert.match(await readError('limit=ten'), /"limit" must be a whole number \(0 for no limit\), not "ten"/);
    });

    test('the filtered form is listed as a URI template', async () => {
        const { resourceTemplates } = await ws.client.listResourceTemplates();
        assert.ok(resourceTemplates.some((t) => t.uriTemplate === 'dita://workspace/diagnostics{?severity,limit,filePattern}'),
            JSON.stringify(resourceTemplates.map((t) => t.uriTemplate)));
        const { resources } = await ws.client.listResources();
        assert.ok(resources.some((r) => r.uri === 'dita://workspace/diagnostics'), 'the plain resource is still listed');
    });

});
