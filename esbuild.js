const esbuild = require('esbuild');
const { compileGrammars } = require('./scripts/compile-grammars');

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
    // Grammar JSON for the visual preview (out/grammars/). Skipped when dtds/ and the
    // compiler are unchanged; must exist before packaging.
    await compileGrammars();

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

    // Build standalone LSP server (headless, no VS Code needed, node dist/lsp-server.js --stdio)
    const lspStandaloneCtx = await esbuild.context({
        ...sharedOptions,
        entryPoints: ['server/src/standalone.ts'],
        outfile: 'dist/lsp-server.js',
    });

    // Visual preview and visual editor pages: scripts and stylesheets (webview, browser target).
    // The editor bundles ProseMirror and the shared CST/serializer.
    const webviewCtx = await esbuild.context({
        ...sharedOptions,
        entryPoints: [
            { in: 'webview/preview/main.ts', out: 'preview' },
            { in: 'webview/preview/preview.css', out: 'preview' },
            { in: 'webview/editor/main.ts', out: 'editor' },
            { in: 'webview/editor/editor.css', out: 'editor' },
            { in: 'webview/properties/main.ts', out: 'properties' },
            { in: 'webview/properties/properties.css', out: 'properties' },
        ],
        outdir: 'out/webview',
        platform: 'browser',
        format: 'iife',
        target: 'es2020',
    });

    const contexts = [clientCtx, serverCtx, mcpCtx, lspStandaloneCtx, webviewCtx];
    if (watch) {
        await Promise.all(contexts.map((ctx) => ctx.watch()));
    } else {
        await Promise.all(contexts.map((ctx) => ctx.rebuild()));
        await Promise.all(contexts.map((ctx) => ctx.dispose()));
    }
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
