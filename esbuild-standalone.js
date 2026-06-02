/**
 * Build standalone distributable bundles.
 * Outputs dist/lsp-server.js and dist/mcp-server.js.
 *
 * Usage: node esbuild-standalone.js [--minify] [--sourcemap]
 *
 * These bundles can be copied to other projects and run with Node.js.
 * No VS Code or npm install required at the target.
 */
const esbuild = require('esbuild');

const minify = process.argv.includes('--minify');
const sourcemap = process.argv.includes('--sourcemap');

const sharedOptions = {
    bundle: true,
    format: 'cjs',
    minify,
    sourcemap,
    sourcesContent: false,
    platform: 'node',
    logLevel: 'silent',
};

async function main() {
    // Standalone LSP server (node dist/lsp-server.js --stdio)
    const lspCtx = await esbuild.context({
        ...sharedOptions,
        entryPoints: ['server/src/standalone.ts'],
        outfile: 'dist/lsp-server.js',
    });

    // MCP server (node dist/mcp-server.js)
    const mcpCtx = await esbuild.context({
        ...sharedOptions,
        entryPoints: ['mcp/src/server.ts'],
        outfile: 'dist/mcp-server.js',
        nodePaths: ['server/node_modules'],
    });

    await Promise.all([lspCtx.rebuild(), mcpCtx.rebuild()]);
    await Promise.all([lspCtx.dispose(), mcpCtx.dispose()]);

    const fs = require('fs');
    const lspSize = (fs.statSync('dist/lsp-server.js').size / 1024).toFixed(0);
    const mcpSize = (fs.statSync('dist/mcp-server.js').size / 1024).toFixed(0);
    console.log(`dist/lsp-server.js  ${lspSize} KB`);
    console.log(`dist/mcp-server.js  ${mcpSize} KB`);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
