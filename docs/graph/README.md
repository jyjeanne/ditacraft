# DitaCraft Knowledge Graph

This folder is **generated** by [graphify](https://github.com/rhanka/graphify) from the
DitaCraft codebase (client extension, LSP server, MCP server, docs). Do not edit by hand.

| Artifact | Description |
|----------|-------------|
| `graph.json` | Queryable knowledge graph (nodes, edges, Louvain communities) |
| `flows.json` | Execution flows derived from CALLS edges (for impact analysis) |
| `GRAPH_REPORT.md` | Findings, statistics, and suggested queries |
| `graph.svg` | Static graph visualization |
| `studio/studio.html` | Self-contained interactive viewer - open directly in a browser |

## Regenerating

```bash
npm run graph          # one-shot rebuild + publish
npm run watch:graph    # auto-rebuild on code changes (also part of "npm run watch")
```

The graph is also refreshed automatically by the `knowledge-graph` GitHub Actions
workflow on every push to `main` that touches code.

## Querying

```bash
npx graphify query "how does validation work" --graph docs/graph/graph.json
npx graphify explain "ValidationPipeline" --graph docs/graph/graph.json
npx graphify summary docs/graph/graph.json
```
