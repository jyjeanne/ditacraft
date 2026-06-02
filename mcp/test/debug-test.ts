import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import * as path from 'path';
import * as fs from 'fs';

async function main() {
    const tmpDir = path.resolve(import.meta.dirname, '..', '..', '.mcp-test-workspace2');
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.mkdirSync(tmpDir, { recursive: true });

    const topicXml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">',
        '<topic id="test">',
        '  <title>Test</title>',
        '  <body><p>Hello.</p></body>',
        '</topic>',
    ].join('\n');
    fs.writeFileSync(path.join(tmpDir, 'test.dita'), topicXml);

    const transport = new StdioClientTransport({
        command: 'node',
        args: [path.resolve(import.meta.dirname, '..', '..', 'dist', 'mcp-server.js')],
        env: { ...process.env, WORKSPACE: tmpDir, DITACRAFT_LOG_LEVEL: 'warn' },
        stderr: 'pipe',
    });
    transport.stderr?.on('data', (d: Buffer) => process.stderr.write('[server] ' + d.toString()));

    const client = new Client({ name: 'test', version: '1.0' }, { capabilities: {} });
    await client.connect(transport);
    console.log('connected');

    let r;
    try {
        r = await client.callTool({ name: 'dita_validate', arguments: { uri: 'test.dita' } });
        console.log('isError:', r.isError);
        const content = r.content as Array<{ type: string; text?: string }>;
        console.log('content[0].type:', content[0]?.type);
        console.log('content[0].text (first 500):', content[0]?.text?.slice(0, 500));
    } catch (e: unknown) {
        console.log('ERROR:', (e as Error).message?.slice(0, 300));
    }

    await client.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
}

main().catch(console.error);
