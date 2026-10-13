#!/usr/bin/env node
/* eslint-disable no-console */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

if (process.argv.length < 6) {
    console.error('Usage: node run-lsp-diagnostics.js <lspServerJs> <workspaceRoot> <mapFilesJson> <outputJson> [--ditaot-profile]');
    process.exit(1);
}

const [lspServerJs, workspaceRoot, mapFilesJson, outputJson, maybeProfileFlag] = process.argv.slice(2);
const lspServerPath = path.resolve(lspServerJs);
const files = JSON.parse(fs.readFileSync(mapFilesJson, 'utf8'));
const ditaOtProfile = maybeProfileFlag === '--ditaot-profile';
const profileSettings = ditaOtProfile ? {
    validationEngine: 'typesxml',
    ditaRulesEnabled: false,
    subjectSchemeValidationEnabled: false,
    crossRefValidationEnabled: true,
    maxNumberOfProblems: 1000,
    comparisonProfile: 'ditaot',
} : null;

const extensionRoot = path.resolve(path.dirname(path.dirname(lspServerPath)));
const server = spawn(process.execPath, [lspServerPath, '--stdio'], {
    cwd: workspaceRoot,
    env: { ...process.env, DITACRAFT_EXTENSION_ROOT: extensionRoot },
    stdio: ['pipe', 'pipe', 'pipe'],
});

let stderrOutput = '';
server.stderr.on('data', (chunk) => {
    stderrOutput += chunk.toString('utf8');
});

let nextId = 1;
const pending = new Map();
let buffer = Buffer.alloc(0);
let serverExitError = null;

function send(msg) {
    const body = Buffer.from(JSON.stringify(msg), 'utf8');
    server.stdin.write(`Content-Length: ${body.length}\r\n\r\n`);
    server.stdin.write(body);
}

function request(method, params) {
    if (serverExitError) {
        return Promise.resolve({ error: { message: serverExitError } });
    }
    const id = nextId++;
    send({ jsonrpc: '2.0', id, method, params });
    return new Promise((resolve) => pending.set(id, resolve));
}

function failPending(errorMessage) {
    for (const resolve of pending.values()) {
        resolve({ error: { message: errorMessage } });
    }
    pending.clear();
}

server.on('exit', (code, signal) => {
    const details = stderrOutput.trim();
    const base = `LSP server exited early (code=${code}, signal=${signal ?? 'none'})`;
    const message = details ? `${base}\n${details}` : base;
    serverExitError = message;
    failPending(message);
});

server.stdout.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    for (;;) {
        const sep = buffer.indexOf('\r\n\r\n');
        if (sep < 0) return;
        const header = buffer.subarray(0, sep).toString('utf8');
        const m = /Content-Length:\s*(\d+)/i.exec(header);
        if (!m) {
            buffer = buffer.subarray(sep + 4);
            continue;
        }
        const len = Number(m[1]);
        if (buffer.length < sep + 4 + len) return;
        const msg = JSON.parse(buffer.subarray(sep + 4, sep + 4 + len).toString('utf8'));
        buffer = buffer.subarray(sep + 4 + len);

        if (msg.method && msg.id !== undefined) {
            const result = msg.method === 'workspace/configuration'
                ? (msg.params.items || []).map(() => profileSettings)
                : null;
            send({ jsonrpc: '2.0', id: msg.id, result });
        } else if (msg.id !== undefined && pending.has(msg.id)) {
            pending.get(msg.id)(msg);
            pending.delete(msg.id);
        }
    }
});

function toSummary(items) {
    const errors = items.filter((d) => d.severity === 1).length;
    const warnings = items.filter((d) => d.severity === 2).length;
    const infos = items.filter((d) => d.severity === 3).length;
    const hints = items.filter((d) => d.severity === 4).length;
    const codes = [...new Set(items.map((d) => String(d.code ?? '')).filter(Boolean))].sort();
    return { total: items.length, errors, warnings, infos, hints, codes };
}

(async () => {
    const rootUri = pathToFileURL(workspaceRoot).href;
    const init = await request('initialize', {
        processId: process.pid,
        rootUri,
        capabilities: { workspace: { configuration: true } },
        workspaceFolders: [{ uri: rootUri, name: 'parity-workspace' }],
    });
    if (init.error) {
        throw new Error(`Initialize failed: ${init.error.message ?? 'unknown error'}`);
    }
    send({ jsonrpc: '2.0', method: 'initialized', params: {} });

    const results = [];
    for (const file of files) {
        const text = fs.readFileSync(file, 'utf8');
        const uri = pathToFileURL(file).href;

        send({
            jsonrpc: '2.0',
            method: 'textDocument/didOpen',
            params: { textDocument: { uri, languageId: 'dita', version: 1, text } },
        });

        const diag = await request('textDocument/diagnostic', { textDocument: { uri } });
        if (diag.error) {
            throw new Error(`Diagnostic request failed for ${file}: ${diag.error.message ?? 'unknown error'}`);
        }
        const items = (diag.result && diag.result.items) || [];
        results.push({ file, uri, ...toSummary(items), items });

        send({
            jsonrpc: '2.0',
            method: 'textDocument/didClose',
            params: { textDocument: { uri } },
        });
    }

    const shutdown = await request('shutdown', null);
    if (shutdown.error) {
        throw new Error(`Shutdown failed: ${shutdown.error.message ?? 'unknown error'}`);
    }
    send({ jsonrpc: '2.0', method: 'exit' });

    fs.writeFileSync(outputJson, JSON.stringify({
        generatedAt: new Date().toISOString(),
        workspaceRoot,
        fileCount: files.length,
        ditaOtProfile,
        results,
    }, null, 2));
    process.exit(0);
})().catch((err) => {
    console.error(err);
    try { send({ jsonrpc: '2.0', method: 'exit' }); } catch { /* ignore */ }
    process.exit(1);
});
