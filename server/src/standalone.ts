/**
 * Standalone LSP server entry point.
 *
 * Usage:  node dist/lsp-server.js --stdio
 *
 * The --stdio flag switches from IPC to stdin/stdout transport,
 * making the server usable from any LSP client (not just VS Code).
 *
 * To embed in another Node.js project, copy dist/lsp-server.js and dtds/:
 *
 *   const { spawn } = require('child_process');
 *   const server = spawn('node', ['lsp-server.js', '--stdio'], {
 *     cwd: '/path/to/dita/workspace',
 *     env: { DITACRAFT_EXTENSION_ROOT: __dirname },
 *   });
 *   // Communicate via server.stdin / server.stdout using vscode-languageserver
 *
 * The DITACRAFT_EXTENSION_ROOT env var points to the directory containing
 * the dtds/ folder (DITA 1.2/1.3/2.0 DTD files). Defaults to the parent
 * of the bundle location.
 */

import * as path from 'path';

// Determine extension root (where dtds/ lives).
// The bundle lives at dist/lsp-server.js; dtds/ is one level up at the repo root.
const extensionRoot = process.env.DITACRAFT_EXTENSION_ROOT
    || path.resolve(__dirname, '..');

process.env.DITACRAFT_EXTENSION_ROOT = extensionRoot;

// Dynamically import and run the server (same as server.ts but with
// corrected extension root for standalone distribution).
import('./server').catch((err) => {
    process.stderr.write(`[ditacraft-lsp] Failed to start LSP server: ${String(err)}\n`);
    process.exit(1);
});
