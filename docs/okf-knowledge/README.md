---
type: Documentation
title: README
---

# DitaCraft OKF Knowledge Base

This folder is **generated** by [okf-rs](https://github.com/jyjeanne/okf-rs) from the
DitaCraft codebase (client extension, LSP server, MCP server) into a conformant
[Open Knowledge Format](https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing)
bundle: plain Markdown files with YAML frontmatter, cross-linked into a resolved call
graph, one file per package/module/class/interface/function/method. Do not edit by hand.

Complements [`docs/graph/`](../graph/), which is [graphify](https://github.com/rhanka/graphify)'s
own knowledge graph (a single `graph.json` + interactive viewer) -- both are generated from
the same source, via different tools with different strengths: graphify's `graph.json` is
built for programmatic querying (`npx graphify query/explain/path`) and a visual studio
viewer; this OKF bundle is built to be `git diff`-able per concept, and adds change-impact
analysis (`okf-rs impact`), a PR-review report generator (`okf-rs review`), and call-cycle
detection that aren't part of graphify's own feature set.

## Regenerating

```bash
npm run okf   # requires okf-rs on PATH -- see scripts/generate-okf-knowledge.js
```

Not wired into `npm run watch`/CI (unlike `docs/graph`'s graphify pipeline): okf-rs is a
standalone Rust binary, not an npm devDependency, so auto-regeneration would need a Rust
toolchain in CI. Regenerate manually after a significant change, same as any other
periodically-refreshed doc.

## Querying

```bash
okf-rs search KeySpaceService docs/okf-knowledge
okf-rs explore KeySpaceService docs/okf-knowledge
okf-rs graph cycles docs/okf-knowledge
okf-rs graph communities docs/okf-knowledge
okf-rs coverage docs/okf-knowledge
```

See `okf-rs --help` (or the [project README](https://github.com/jyjeanne/okf-rs#readme)) for
the full command list, including `impact`/`review` for change-impact analysis between two
git refs, and `docs` to render this bundle as an HTML site, PDF, or GraphML graph.
