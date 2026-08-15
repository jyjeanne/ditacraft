#!/usr/bin/env node
/**
 * Generates the DitaCraft OKF (Open Knowledge Format) knowledge base into
 * docs/okf-knowledge using okf-rs (https://github.com/jyjeanne/okf-rs).
 *
 * Unlike graphify (scripts/generate-graph.js), okf-rs is a standalone Rust
 * CLI, not an npm devDependency -- there's no `npx okf-rs` to fall back to.
 * It must already be on PATH (or pointed at via OKF_RS_PATH), so this
 * script is opt-in and NOT part of `npm install`/`npm run watch`, unlike
 * graphify's generate-graph.js.
 *
 * Install okf-rs (see https://github.com/jyjeanne/okf-rs#installation):
 *   cargo install --git https://github.com/jyjeanne/okf-rs okf-cli
 *   # or download a prebuilt binary from a GitHub Release and put it on PATH
 *
 * Usage:
 *   node scripts/generate-okf-knowledge.js
 *   OKF_RS_PATH=/path/to/okf-rs node scripts/generate-okf-knowledge.js
 *
 * Published artifacts (docs/okf-knowledge/):
 *   index.md, classes/, functions/, interfaces/, modules/, packages/
 *     Markdown + YAML frontmatter concept files, cross-linked into a call
 *     graph -- see README.md inside the folder for the full artifact list.
 *
 * docs/graph/studio/assets/ (graphify's vendored, minified viewer bundle)
 * is excluded from the scan via .gitignore -- it isn't source code, and
 * being un-excluded once flooded the bundle with thousands of garbage
 * single/double-letter "concepts" extracted from minified JS.
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'docs', 'okf-knowledge');
const OKF_RS_BIN = process.env.OKF_RS_PATH || 'okf-rs';

function findOkfRs() {
    // `which`/`where` rather than trying to spawn directly, so a missing
    // binary produces a clear message instead of a raw ENOENT stack trace.
    const probe = spawnSync(process.platform === 'win32' ? 'where' : 'which', [OKF_RS_BIN], { encoding: 'utf-8' });
    if (probe.status !== 0) {
        console.error(`[generate-okf-knowledge] Could not find "${OKF_RS_BIN}" on PATH.`);
        console.error('');
        console.error('Install it (see https://github.com/jyjeanne/okf-rs#installation):');
        console.error('  cargo install --git https://github.com/jyjeanne/okf-rs okf-cli');
        console.error('  # or download a prebuilt binary from a GitHub Release and put it on PATH');
        console.error('');
        console.error('Or point directly at an existing binary: OKF_RS_PATH=/path/to/okf-rs node scripts/generate-okf-knowledge.js');
        process.exit(1);
    }
}

function run(args) {
    const result = spawnSync(OKF_RS_BIN, args, { cwd: ROOT, stdio: 'inherit' });
    if (result.status !== 0) {
        throw new Error(`okf-rs ${args[0]} exited with status ${result.status}`);
    }
}

function writeFolderReadme() {
    // okf-rs validate treats every .md inside the bundle as a concept file:
    // it must carry frontmatter with a `type` (any string -- the spec's only
    // mandatory field) and be linked from index.md ("no orphaned files").
    // `type: Documentation` plus the index.md link below (rather than a
    // frontmatter-less loose file) is what keeps `okf-rs validate` clean.
    fs.writeFileSync(path.join(OUT_DIR, 'README.md'), `---
type: Documentation
title: README
---

# DitaCraft OKF Knowledge Base

This folder is **generated** by [okf-rs](https://github.com/jyjeanne/okf-rs) from the
DitaCraft codebase (client extension, LSP server, MCP server) into a conformant
[Open Knowledge Format](https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing)
bundle: plain Markdown files with YAML frontmatter, cross-linked into a resolved call
graph, one file per package/module/class/interface/function/method. Do not edit by hand.

Complements [\`docs/graph/\`](../graph/), which is [graphify](https://github.com/rhanka/graphify)'s
own knowledge graph (a single \`graph.json\` + interactive viewer) -- both are generated from
the same source, via different tools with different strengths: graphify's \`graph.json\` is
built for programmatic querying (\`npx graphify query/explain/path\`) and a visual studio
viewer; this OKF bundle is built to be \`git diff\`-able per concept, and adds change-impact
analysis (\`okf-rs impact\`), a PR-review report generator (\`okf-rs review\`), and call-cycle
detection that aren't part of graphify's own feature set.

## Regenerating

\`\`\`bash
npm run okf   # requires okf-rs on PATH -- see scripts/generate-okf-knowledge.js
\`\`\`

Not wired into \`npm run watch\`/CI (unlike \`docs/graph\`'s graphify pipeline): okf-rs is a
standalone Rust binary, not an npm devDependency, so auto-regeneration would need a Rust
toolchain in CI. Regenerate manually after a significant change, same as any other
periodically-refreshed doc.

## Querying

\`\`\`bash
okf-rs search KeySpaceService docs/okf-knowledge
okf-rs explore KeySpaceService docs/okf-knowledge
okf-rs graph cycles docs/okf-knowledge
okf-rs graph communities docs/okf-knowledge
okf-rs coverage docs/okf-knowledge
\`\`\`

See \`okf-rs --help\` (or the [project README](https://github.com/jyjeanne/okf-rs#readme)) for
the full command list, including \`impact\`/\`review\` for change-impact analysis between two
git refs, and \`docs\` to render this bundle as an HTML site, PDF, or GraphML graph.
`);
}

/** Link README.md from index.md's listing -- okf-rs validate's "no orphaned files" rule requires every concept to be reachable from index.md. */
function linkReadmeFromIndex() {
    const indexPath = path.join(OUT_DIR, 'index.md');
    const content = fs.readFileSync(indexPath, 'utf-8');
    if (content.includes('README.md')) return; // already linked (idempotent across re-runs)
    fs.writeFileSync(indexPath, content.trimEnd() + '\n- [README](README.md)\n');
}

function main() {
    findOkfRs();
    fs.mkdirSync(OUT_DIR, { recursive: true });
    run(['generate', '.', '--output', path.relative(ROOT, OUT_DIR)]);
    writeFolderReadme();
    linkReadmeFromIndex();
    console.log(`[generate-okf-knowledge] Published OKF knowledge base to ${path.relative(ROOT, OUT_DIR)}/`);
}

main();
