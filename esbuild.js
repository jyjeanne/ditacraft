const esbuild = require('esbuild');

const watch = process.argv.includes('--watch');
const minify = process.argv.includes('--minify');
const sourcemap = process.argv.includes('--sourcemap');

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
    name: 'esbuild-problem-matcher',
    setup(build) {
        build.onStart(() => {
            console.log('[watch] build started');
        });
        build.onEnd((result) => {
            result.errors.forEach(({ text, location }) => {
                console.error(`✘ [ERROR] ${text}`);
                console.error(`    ${location.file}:${location.line}:${location.column}:`);
            });
            console.log('[watch] build finished');
        });
    }
};

/** Shared esbuild options */
const sharedOptions = {
    bundle: true,
    format: 'cjs',
    minify: minify,
    sourcemap: sourcemap,
    sourcesContent: false,
    platform: 'node',
    logLevel: 'silent',
    plugins: [esbuildProblemMatcherPlugin],
};

async function main() {
    // Build client (VS Code extension)
    const clientCtx = await esbuild.context({
        ...sharedOptions,
        entryPoints: ['src/extension.ts'],
        outfile: 'out/extension.js',
        external: ['vscode'],
    });

    // Build server (LSP server - no vscode external)
    const serverCtx = await esbuild.context({
        ...sharedOptions,
        entryPoints: ['server/src/server.ts'],
        outfile: 'server/out/server.js',
    });

    // Build MCP server (standalone - bundles server/src/ + mcp/src/ + @modelcontextprotocol/sdk)
    const mcpCtx = await esbuild.context({
        ...sharedOptions,
        entryPoints: ['mcp/src/server.ts'],
        outfile: 'dist/mcp-server.js',
        // Resolve server dependencies from server/node_modules (vscode-languageserver-*)
        nodePaths: ['server/node_modules'],
    });

    if (watch) {
        await Promise.all([clientCtx.watch(), serverCtx.watch(), mcpCtx.watch()]);
    } else {
        await Promise.all([clientCtx.rebuild(), serverCtx.rebuild(), mcpCtx.rebuild()]);
        await Promise.all([clientCtx.dispose(), serverCtx.dispose(), mcpCtx.dispose()]);
    }
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
