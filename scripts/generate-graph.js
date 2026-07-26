#!/usr/bin/env node
/**
 * Generates the DitaCraft knowledge graph into docs/graph using graphify
 * (@sentropic/graphify). Extraction is pure local tree-sitter AST parsing:
 * no LLM calls, no API keys required.
 *
 * Usage:
 *   node scripts/generate-graph.js           One-shot: rebuild graph and publish docs/graph
 *   node scripts/generate-graph.js --watch   Watch mode: rebuild + republish on code changes
 *
 * Published artifacts (docs/graph/):
 *   graph.json        Queryable knowledge graph (nodes, edges, communities)
 *   GRAPH_REPORT.md   Human-readable findings and suggested queries
 *   graph.svg         Static visualization (embeds in READMEs)
 *   studio/           Self-contained interactive Ontology Studio (open studio.html)
 *   README.md         Folder documentation
 *
 * Working state lives in .graphify/ (git-ignored); docs/graph is the committed output.
 */

const { spawnSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const STATE_DIR = path.join(ROOT, '.graphify');
const OUT_DIR = path.join(ROOT, 'docs', 'graph');
// The package's "exports" map hides its internals from require.resolve,
// so locate the CLI entry (package.json "bin") directly.
const GRAPHIFY_CLI = path.join(ROOT, 'node_modules', '@sentropic', 'graphify', 'dist', 'cli.js');

const WATCH_MODE = process.argv.includes('--watch');
const EXPORT_DEBOUNCE_MS = 3000;

function runGraphify(args, options = {}) {
    const result = spawnSync(process.execPath, [GRAPHIFY_CLI, ...args], {
        cwd: ROOT,
        stdio: 'inherit',
        ...options
    });
    if (result.status !== 0) {
        throw new Error(`graphify ${args[0]} exited with status ${result.status}`);
    }
}

function rebuildGraph() {
    // Code-only rebuild: AST extraction + Louvain clustering, no LLM stages.
    runGraphify(['update', '.', '--no-description', '--no-label']);
}

function publishOutputs() {
    const graphJson = path.join(STATE_DIR, 'graph.json');
    if (!fs.existsSync(graphJson)) {
        throw new Error(`Missing ${graphJson} - graph rebuild did not produce output`);
    }

    fs.mkdirSync(OUT_DIR, { recursive: true });

    runGraphify(['studio', 'export', path.join(OUT_DIR, 'studio'), '--state', STATE_DIR, '--full-offline']);
    runGraphify(['export', 'svg', '--graph', graphJson, '--out', path.join(OUT_DIR, 'graph.svg')]);

    fs.copyFileSync(graphJson, path.join(OUT_DIR, 'graph.json'));
    fs.copyFileSync(path.join(STATE_DIR, 'GRAPH_REPORT.md'), path.join(OUT_DIR, 'GRAPH_REPORT.md'));
    fs.writeFileSync(path.join(OUT_DIR, 'README.md'), folderReadme());

    console.log(`[generate-graph] Published knowledge graph to ${path.relative(ROOT, OUT_DIR)}/`);
}

function folderReadme() {
    return `# DitaCraft Knowledge Graph

This folder is **generated** by [graphify](https://github.com/rhanka/graphify) from the
DitaCraft codebase (client extension, LSP server, MCP server, docs). Do not edit by hand.

| Artifact | Description |
|----------|-------------|
| \`graph.json\` | Queryable knowledge graph (nodes, edges, Louvain communities) |
| \`GRAPH_REPORT.md\` | Findings, statistics, and suggested queries |
| \`graph.svg\` | Static graph visualization |
| \`studio/studio.html\` | Self-contained interactive viewer - open directly in a browser |

## Regenerating

\`\`\`bash
npm run graph          # one-shot rebuild + publish
npm run watch:graph    # auto-rebuild on code changes (also part of "npm run watch")
\`\`\`

The graph is also refreshed automatically by the \`knowledge-graph\` GitHub Actions
workflow on every push to \`main\` that touches code.

## Querying

\`\`\`bash
npx graphify query "how does validation work" --graph docs/graph/graph.json
npx graphify explain "ValidationPipeline" --graph docs/graph/graph.json
npx graphify summary docs/graph/graph.json
\`\`\`
`;
}

function watchAndPublish() {
    // graphify's own watcher rebuilds .graphify/graph.json on code saves;
    // we mirror every rebuild into docs/graph (debounced).
    const child = spawn(process.execPath, [GRAPHIFY_CLI, 'watch', '.'], {
        cwd: ROOT,
        stdio: 'inherit'
    });
    child.on('exit', (code) => process.exit(code ?? 0));

    let timer = null;
    fs.watchFile(path.join(STATE_DIR, 'graph.json'), { interval: 2000 }, () => {
        if (timer) { clearTimeout(timer); }
        timer = setTimeout(() => {
            try {
                publishOutputs();
            } catch (err) {
                console.error(`[generate-graph] Publish failed: ${err.message}`);
            }
        }, EXPORT_DEBOUNCE_MS);
    });
}

function main() {
    if (WATCH_MODE) {
        if (!fs.existsSync(path.join(STATE_DIR, 'graph.json'))) {
            rebuildGraph();
        }
        publishOutputs();
        watchAndPublish();
    } else {
        rebuildGraph();
        publishOutputs();
    }
}

main();
