/**
 * Test helper for MCP integration tests.
 * Creates temp DITA workspaces, spawns MCP server, and provides MCP Client.
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import * as path from 'path';
import * as fs from 'fs';

// Helper is at mcp/test/helper.ts, compiled to mcp/out/test/mcp/test/helper.js
// Need to go up 5 levels to repo root, then dist/mcp-server.js
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..');
const SERVER_SCRIPT = path.join(REPO_ROOT, 'dist', 'mcp-server.js');

export interface TestWorkspace {
    dir: string;
    client: Client;
    addFile(name: string, content: string): string;
    callTool(name: string, args: Record<string, unknown>): Promise<unknown>;
    callToolRaw(name: string, args: Record<string, unknown>): Promise<{ isError?: boolean; content: Array<{ type: string; text?: string }> }>;
    cleanup(): Promise<void>;
}

export async function createTestWorkspace(): Promise<TestWorkspace> {
    const dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'ditacraft-mcp-test-'));
    const transport = new StdioClientTransport({
        command: 'node',
        args: [SERVER_SCRIPT],
        env: { ...process.env, WORKSPACE: dir, DITACRAFT_LOG_LEVEL: 'error' },
    });

    const client = new Client({ name: 'mcp-test', version: '1.0' }, { capabilities: {} });
    await client.connect(transport);

    const ws: TestWorkspace = {
        dir,
        client,
        addFile(name: string, content: string): string {
            const fp = path.join(dir, name);
            const parent = path.dirname(fp);
            if (!fs.existsSync(parent)) {
                fs.mkdirSync(parent, { recursive: true });
            }
            fs.writeFileSync(fp, content);
            return fp;
        },
        async callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
            const result = await client.callTool({ name, arguments: args });
            const text = (result.content as Array<{ type: string; text?: string }>)[0]?.text ?? '{}';
            try {
                return JSON.parse(text);
            } catch {
                return { raw: text, isError: result.isError };
            }
        },
        async callToolRaw(name: string, args: Record<string, unknown>) {
            const result = await client.callTool({ name, arguments: args });
            return { isError: result.isError as boolean | undefined, content: result.content as Array<{ type: string; text?: string }> };
        },
        async cleanup() {
            await client.close();
            fs.rmSync(dir, { recursive: true, force: true });
        },
    };
    return ws;
}
