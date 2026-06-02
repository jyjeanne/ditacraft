/**
 * Minimal smoke test for standalone LSP server.
 * Sends initialize request and verifies the server responds.
 */
import { spawn } from 'child_process';
import * as path from 'path';

const serverScript = path.resolve(import.meta.dirname, '..', '..', 'dist', 'lsp-server.js');
const extensionRoot = path.resolve(import.meta.dirname, '..', '..');

const server = spawn('node', [serverScript, '--stdio'], {
    env: { ...process.env, DITACRAFT_EXTENSION_ROOT: extensionRoot },
    stdio: ['pipe', 'pipe', 'pipe'],
});

let output = '';
server.stdout.on('data', (chunk: Buffer) => { output += chunk.toString(); });
server.stderr.on('data', (chunk: Buffer) => { process.stderr.write(`[server] ${chunk}`); });

// Send initialize request
const initMsg = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
        processId: null,
        rootUri: 'file:///test-workspace',
        capabilities: {},
        workspaceFolders: [{ uri: 'file:///test-workspace', name: 'test' }],
    },
});
const header = `Content-Length: ${Buffer.byteLength(initMsg)}\r\n\r\n`;
server.stdin.write(header + initMsg);

// Send initialized notification
const initializedMsg = JSON.stringify({ jsonrpc: '2.0', method: 'initialized', params: {} });
const initHeader = `Content-Length: ${Buffer.byteLength(initializedMsg)}\r\n\r\n`;
server.stdin.write(initHeader + initializedMsg);

// Wait for response
setTimeout(() => {
    server.stdin.end();
    server.kill();

    try {
        // Parse LSP response from stdout
        const headerEnd = output.indexOf('\r\n\r\n');
        if (headerEnd === -1) {
            console.error('FAIL: No Content-Length header found');
            console.error('Output:', output.slice(0, 500));
            process.exit(1);
        }
        const bodyStart = headerEnd + 4;
        const contentLength = parseInt(output.match(/Content-Length: (\d+)/)?.[1] ?? '0', 10);
        const body = output.slice(bodyStart, bodyStart + contentLength);
        const response = JSON.parse(body);
        console.log('Server capabilities:', JSON.stringify(response.result?.capabilities ?? {}, null, 2).slice(0, 500));
        console.log('Server name:', response.result?.serverInfo?.name);
        console.log('Server version:', response.result?.serverInfo?.version);
        console.log('✅ Standalone LSP server responds correctly');
    } catch (e) {
        console.error('FAIL:', e);
        console.error('Raw output:', output.slice(0, 500));
        process.exit(1);
    }
}, 5000);
