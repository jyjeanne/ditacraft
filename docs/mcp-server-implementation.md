# DitaCraft MCP Server Implementation Specification

**Version:** 1.2
**Date:** June 2026
**Status:** Specification for v0.8.0 (Planned)
**Author:** DitaCraft Core Team

---

## Executive Summary

The **Model Context Protocol (MCP) Server** for DitaCraft is a standalone Node.js process that exposes DITA intelligence — validation, key space resolution, context snapshots, map analysis, and reference resolution — to external AI agents via the MCP standard (JSON-RPC 2.0 over stdio).

It bundles the existing `server/src/` modules (`KeySpaceService`, `ValidationPipeline`, `contextGraph`, `contextSnapshot`, `fragmentValidator`, `definition`) directly into a self-contained esbuild bundle. No VS Code or LSP IPC required — agents spawn the process via stdio.

- **6 MCP Tools** — validate, snapshot, key-space, map-structure, resolve-reference, explain-key
- **3 MCP Resources** — workspace maps, diagnostics, keys (read-only URI queries)
- **standalone** — single `node dist/mcp-server.js` process, no VS Code dependency

Compatible clients: **opencode**, **Claude Desktop**, **Continue**, **Cursor**, and any MCP-aware agent.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [MCP Tools](#3-mcp-tools)
4. [MCP Resources](#4-mcp-resources)
5. [Data Models](#5-data-models)
6. [Backend Integration](#6-backend-integration)
7. [Project Structure & Build](#7-project-structure--build)
8. [Implementation Phases](#8-implementation-phases)
9. [Test Plan](#9-test-plan)
10. [Benefits for External Agents](#10-benefits-for-external-agents)
11. [Client Examples](#11-client-examples)
12. [Security & Privacy](#12-security--privacy)
13. [Appendices](#13-appendices)

---

## 1. Overview

### 1.1 Purpose

The MCP server lets external AI agents:
- **Validate DITA content** — files and XML fragments
- **Understand DITA structure** — browse maps, topic hierarchies, key spaces
- **Resolve references** — follow href, keyref, conref, conkeyref chains
- **Query workspace state** — inspect diagnostics, key definitions, map lists
- **Generate context for LLM prompts** — token-budgeted snapshots of DITA maps

### 1.2 Why MCP?

The [Model Context Protocol](https://modelcontextprotocol.io) (Anthropic) is an open standard providing:
- **Decoupled agent architecture** — clients connect via stdio, HTTP, or SSE
- **Tool & resource discovery** — agents introspect available capabilities via `tools/list`
- **Structured JSON-RPC 2.0** — standard request/response with error codes
- **Progress notifications** — for long-running operations (e.g. workspace validation)
- **Cancellation** — agents can cancel in-flight tool calls
- **Language-agnostic SDKs** — Python, Node, Go, Rust

### 1.3 Scope

**Included in v0.8.0:**
- 6 MCP tools (see §3)
- 3 MCP resources (see §4)
- stdio transport
- Standalone bundle (no VS Code dependency)
- Workspace isolation (path validation)
- Unit + integration tests (~65 test cases)

**Out of scope for v0.8.0:**
- HTTP/SSE transport (v0.9.0)
- Real-time subscriptions / notifications (v0.9.0)
- Persistent sessions or disk caches
- Remote agent authentication (API keys)

---

## 2. Architecture

### 2.1 Standalone Process Model

The MCP server is a **self-contained Node.js process**. It bundles `server/src/` modules directly — there is no LSP server, no IPC, and no VS Code dependency.

```
┌───────────────────────────────────────────────────┐
│  Agent (opencode, Claude Desktop, Cursor, etc.)   │
│         │                                         │
│         │ stdio (JSON-RPC 2.0 over stdin/stdout)  │
│         ▼                                         │
│  ┌────────────────────────────────────────┐       │
│  │  MCP Server (Node.js, esbuild bundle)   │       │
│  │                                        │       │
│  │  mcp/src/server.ts                     │       │
│  │  ├─ MCP protocol handler               │       │
│  │  ├─ Tool dispatchers (6 tools)         │       │
│  │  ├─ Resource providers (3 resources)   │       │
│  │  ├─ WorkspaceValidator (path security) │       │
│  │  └─ ResponseCache (TTL in-memory)      │       │
│  │                                        │       │
│  │  Bundled from server/src/:             │       │
│  │  ├─ ValidationPipeline                 │       │
│  │  ├─ KeySpaceService                    │       │
│  │  ├─ contextGraph / contextSnapshot     │       │
│  │  ├─ fragmentValidator                  │       │
│  │  ├─ CatalogValidationService           │       │
│  │  └─ SubjectSchemeService               │       │
│  └────────────────────────────────────────┘       │
│                                                   │
│  ┌─ No VS Code needed ──────────────────────────┐ │
│  │  Only requirement: Node.js 18+              │ │
│  │  Workspace root set via WORKSPACE env var    │ │
│  └──────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────┘
```

### 2.2 Startup Sequence

1. Agent spawns `node dist/mcp-server.js` with env vars: `WORKSPACE`, optional `DITACRAFT_LOG_LEVEL`
2. Server initializes: reads `WORKSPACE` from env, creates services
3. Server performs **MCP initialize handshake** over stdin/stdout:
   - Receives `InitializeRequest`
   - Responds with `InitializeResult` declaring capabilities, server name (`ditacraft-mcp`), version
   - Registers tools (their schemas) and resources (their URI templates)
4. Agent calls `tools/list` / `resources/list` to discover capabilities
5. Agent calls tools / reads resources — server invokes bundled backend modules directly

### 2.3 Shutdown

- Process exits cleanly when stdin closes
- `shutdown()` called on `KeySpaceService` (cleans up timers/caches)
- No persistent state on disk; next startup is fresh

### 2.4 Configuration

**Environment variables** (set by the agent's MCP config):

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `WORKSPACE` | Yes | — | Absolute path to the DITA project root |
| `DITACRAFT_LOG_LEVEL` | No | `warn` | `debug`, `info`, `warn`, `error` |
| `DITACRAFT_DITA_VERSION` | No | `auto` | Override auto-detected DITA version |
| `DITACRAFT_KEYSPACE_TTL_MINUTES` | No | `5` | Key space cache TTL |
| `DITACRAFT_VALIDATION_ENGINE` | No | `typesxml` | `built-in`, `typesxml`, or `xmllint` |

**Agent-side** (opencode example):

```jsonc
// ~/.config/opencode/opencode.json
{
  "mcpServers": {
    "ditacraft": {
      "command": "node",
      "args": ["/path/to/ditacraft/dist/mcp-server.js"],
      "env": {
        "WORKSPACE": "/home/user/projects/my-dita-docs",
        "DITACRAFT_LOG_LEVEL": "warn"
      }
    }
  }
}
```

### 2.5 Dependencies

```bash
npm install --save @modelcontextprotocol/sdk   # MCP protocol + JSON Schema
```

Esbuild bundles `@modelcontextprotocol/sdk` and all `server/src/` modules into `dist/mcp-server.js`. No runtime `node_modules` needed except Node.js built-ins.

### 2.6 Logging

All diagnostic output goes to **stderr** (stdout is reserved for JSON-RPC). Use a minimal structured logger:

```typescript
// mcp/src/logger.ts
const levels = { debug: 0, info: 1, warn: 2, error: 3 } as const;
type Level = keyof typeof levels;
let currentLevel: Level = 'warn';

export function setLevel(level: Level) { currentLevel = level; }

export function log(level: Level, message: string) {
    if (levels[level] >= levels[currentLevel]) {
        process.stderr.write(`[ditacraft-mcp] [${level.toUpperCase()}] ${message}\n`);
    }
}
```

### 2.7 Progress & Cancellation

- **Progress:** For `dita_validate` with `uri`, use MCP progress tokens via `server.sendNotification('notifications/progress', ...)` to report validation phase progress.
- **Cancellation:** All tool handlers accept an `AbortSignal` (from MCP's `_meta.progressToken` + cancellation). The `ValidationPipeline.validate()` already accepts a `CancellationToken` — wire MCP's signal to it.

---

## 3. MCP Tools

### Tool Overview

| # | Tool Name | Purpose | Est. Lines |
|---|-----------|---------|------------|
| 1 | `dita_validate` | Validate a file or XML fragment | ~80 |
| 2 | `dita_context_snapshot` | Token-budgeted map snapshot for LLM | ~40 |
| 3 | `dita_key_space` | List all defined keys & resolved targets | ~60 |
| 4 | `dita_map_structure` | Map topic hierarchy (JSON / tree / CSV) | ~50 |
| 5 | `dita_resolve_reference` | Resolve href, keyref, conref, conkeyref | ~70 |
| 6 | `dita_explain_key` | Detailed key resolution trace | ~40 |

All tools declare JSON Schema for their inputs. Tools output structured JSON with a `content` array of `{ type: "text", text: string }` as required by the MCP specification.

---

### 3.1 `dita_validate`

Validates a DITA file or XML fragment and returns diagnostics.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "uri": {
      "type": "string",
      "description": "File to validate. Relative to workspace or file:// URI."
    },
    "fragment": {
      "type": "string",
      "description": "Raw XML string to validate in-memory."
    },
    "fragmentType": {
      "type": "string",
      "enum": ["map", "topic", "topicref", "element"],
      "description": "Required when fragment is provided. Context hint for wrapping bare XML."
    }
  }
}
```
At least one of `uri` or `fragment` must be present. `fragmentType` is required when `fragment` is set.

**Output:**
```json
{
  "isValid": true,
  "filePath": "topics/intro.dita",
  "diagnostics": [
    {
      "code": "DITA-STRUCT-003",
      "message": "Missing <title> element",
      "severity": "error",
      "line": 1,
      "column": 1,
      "endLine": 1,
      "endColumn": 40
    }
  ],
  "errorCount": 1,
  "warningCount": 0,
  "validationTimeMs": 42
}
```

**Backend:**
- `uri` path → read file from disk, create `TextDocument`, call `ValidationPipeline.validate()`
- `fragment` → call `handleValidateFragment()` from `server/src/features/fragmentValidator.ts`

**Progress:** For files > 500KB, report progress via MCP progress notifications (phase name, elapsed time).

**Cancellation:** Accept `_signal` (AbortSignal). Pass to `pipeline.validate()` as `CancellationToken`.

---

### 3.2 `dita_context_snapshot`

Returns a token-budgeted text representation of a DITA map for LLM prompt injection.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "uri": {
      "type": "string",
      "description": "Map file to snapshot (relative to workspace or file:// URI)."
    },
    "maxTokens": {
      "type": "number",
      "default": 8000,
      "description": "Token budget (approx. 4 chars = 1 token)."
    },
    "strategy": {
      "type": "string",
      "enum": ["breadth-first", "depth-first", "by-relevance"],
      "default": "breadth-first"
    },
    "focusUri": {
      "type": "string",
      "description": "Topic URI for Level 3 sliding-window mode."
    }
  },
  "required": ["uri"]
}
```

**Output:**
```json
{
  "snapshot": "Map: Getting Started (15 topics)\n  [concept] intro.dita — Overview\n  ...",
  "tokenEstimate": 3250,
  "truncated": false,
  "level": 2,
  "strategy": "breadth-first"
}
```

**Levels** (computed by `handleBuildContextSnapshot`):
- **Level 1** — structural XML summary (highest fidelity)
- **Level 2** — tabular text outline (compact fallback when Level 1 exceeds budget)
- **Level 3** — sliding window around focusUri with surrounding context (±N siblings/ancestors)

**Backend:** `handleBuildContextSnapshot()` from `server/src/features/contextSnapshot.ts`. No LSP — called directly.

---

### 3.3 `dita_key_space`

Lists all defined keys and their resolved targets from the key space.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "mapUri": {
      "type": "string",
      "description": "Root map file (optional). Auto-discovered if omitted."
    },
    "includeScopes": {
      "type": "boolean",
      "default": true,
      "description": "Include keyscope-qualified key names."
    },
    "includeProvenance": {
      "type": "boolean",
      "default": false,
      "description": "Include source file and line number for each key."
    }
  }
}
```

When `mapUri` is omitted, the tool auto-discovers the root map by scanning the workspace for `*.ditamap` files, picking the first one (or the one with `isRoot` based on file heuristics).

**Output:**
```json
{
  "mapUri": "guides/main.ditamap",
  "totalKeys": 156,
  "keys": [
    {
      "keyName": "product-name",
      "navtitle": "DitaCraft",
      "targetUri": "keys/product-meta.dita",
      "targetFragment": "product-name",
      "scope": "product.lib",
      "sourceFile": "guides/main.ditamap",
      "sourceLine": 24
    }
  ]
}
```

**Backend:**
1. Determine root map: if `mapUri` provided, use it; otherwise auto-discover via `KeySpaceService`'s root map discovery (or glob `**/!(submap)*.ditamap`)
2. Call `keySpaceService.buildKeySpace(rootMapPath)`
3. Call `keySpaceService.getAllKeys(rootMapPath)` — note: `getAllKeys` needs a context file path; use the root map path itself
4. Serialize `KeyDefinition[]` to output JSON, applying `includeScopes` / `includeProvenance` filters

---

### 3.4 `dita_map_structure`

Returns the full topic hierarchy and metadata for a DITA map.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "mapUri": {
      "type": "string",
      "description": "Map file to analyze."
    },
    "depth": {
      "type": "number",
      "default": 4,
      "description": "Max recursion depth for nested maps."
    },
    "includeMetadata": {
      "type": "boolean",
      "default": true
    },
    "format": {
      "type": "string",
      "enum": ["json", "tree", "csv"],
      "default": "json"
    }
  },
  "required": ["mapUri"]
}
```

**Output (tree format — text):**
```
Map: Getting Started (15 topics)
  [concept] intro/overview.dita — Overview
  [task] intro/install.dita — Installation
  [chapter] chapters/ch1.dita — Chapter 1
    [concept] chapters/ch1/concepts.dita — Core Concepts
    [task] chapters/ch1/tasks.dita — Getting Started Tasks
```

**Backend:**
1. Call `handleGetContextGraph({ uri: mapUri, depth, includeMetadata })` — returns `ContextGraph` (JSON)
2. If `format` is `tree`, post-process the `ContextGraph` into a tree-text string
3. If `format` is `csv`, post-process into CSV rows: `type,uri,title`

---

### 3.5 `dita_resolve_reference`

Resolves an href, keyref, conref, or conkeyref to its target file and element.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "fromUri": {
      "type": "string",
      "description": "Source file URI (for relative path resolution). Optional — uses workspace root if omitted."
    },
    "reference": {
      "type": "string",
      "description": "The attribute value (href path, key name, or conref target)."
    },
    "referenceType": {
      "type": "string",
      "enum": ["href", "keyref", "conref", "conkeyref"],
      "description": "Type of reference to resolve."
    }
  },
  "required": ["reference", "referenceType"]
}
```

**Output:**
```json
{
  "resolved": true,
  "targetUri": "file:///workspace/topics/other-chapter.dita",
  "targetFragment": "section-intro",
  "targetTitle": "Other Chapter",
  "targetType": "concept",
  "resolutionTrace": [
    "scope-lookup: ch1.other-chapter → not found",
    "unqualified-lookup: other-chapter → found"
  ]
}
```

**Backend:** Uses the same logic as `handleDefinition()` from `server/src/features/definition.ts`:
- **keyref** → `keySpaceService.resolveKey(keyName, fromUri)`, then resolve `targetFile` + `elementId`
- **conkeyref** → parse `keyname/elementid`, resolve key, then locate element
- **href / conref** → `parseReference(value)`, resolve relative path from `fromUri` directory, `findElementByIdOffset()` for fragments
- Trace is built from `keySpaceService.explainKey()` for keyref/conkeyref paths, or constructed manually for href/conref

---

### 3.6 `dita_explain_key`

Returns a detailed trace of how a key resolves through scopes and keyref chains.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "keyName": {
      "type": "string",
      "description": "The key name to trace."
    },
    "contextFilePath": {
      "type": "string",
      "description": "The file from which the key is referenced (determines scope context)."
    }
  },
  "required": ["keyName", "contextFilePath"]
}
```

**Output:**
```json
{
  "keyName": "product-name",
  "contextFilePath": "topics/chapter1.dita",
  "contextScope": "product.lib",
  "resolved": true,
  "definition": {
    "keyName": "product-name",
    "targetUri": "file:///workspace/keys/product-meta.dita",
    "sourceFile": "guides/main.ditamap",
    "sourceLine": 24
  },
  "steps": [
    {
      "type": "context-scope-lookup",
      "attempted": "product.lib.product-name",
      "found": false,
      "note": "No scoped match; falling back to unqualified lookup"
    },
    {
      "type": "unqualified-lookup",
      "attempted": "product-name",
      "found": true,
      "note": "Found in root map keydef at line 24"
    }
  ]
}
```

**Backend:** `keySpaceService.explainKey(keyName, contextFilePath)` → `KeyResolutionReport`. Serialize directly.

---

## 4. MCP Resources

MCP resources are read-only data URIs queried via `resources/read`.

### 4.1 `dita://workspace/maps`

Lists all DITA maps discovered in the workspace.

**URI Template:** `dita://workspace/maps`
**MIME Type:** `application/json`

```json
{
  "maps": [
    {
      "uri": "file:///workspace/guides/main.ditamap",
      "title": "Main Guide",
      "topicCount": 42,
      "isRoot": true,
      "lastModified": "2026-06-02T01:25:00Z"
    }
  ]
}
```

**Backend:** `glob.sync('**/*.ditamap', { cwd: workspace, absolute: true })` + `glob.sync('**/*.bookmap', ...)`.
For each map, read the file to extract `<title>` and count `<topicref>` elements. `isRoot` is true if the file is at `{workspace}/guides/main.ditamap` or has been explicitly set via the root map heuristic.

### 4.2 `dita://workspace/diagnostics`

Current validation state across workspace files. Computed on-demand by validating all discovered DITA files.

**URI Template:** `dita://workspace/diagnostics?severity=error,warning&limit=100&filePattern=topics/*`
**MIME Type:** `application/json`

Query parameters:
- `severity` — comma-separated filter: `error,warning,information,hint` (default: all)
- `limit` — max results (default 100)
- `filePattern` — minimatch glob to filter files (default: all)

```json
{
  "totalCount": 23,
  "diagnostics": [
    {
      "file": "topics/chapter1.dita",
      "line": 42,
      "code": "DITA-STRUCT-003",
      "message": "Missing <title> element",
      "severity": "error"
    }
  ]
}
```

**Backend:** The MCP server has an internal `DiagnosticsStore` class. When `dita_validate` is called for a file, the store updates. On `resources/read`:
1. If cache is fresh (< 1 min since last validate), return cached
2. Otherwise, re-validate all `.dita`/`.ditamap`/`.bookmap` files in the workspace using `ValidationPipeline.validate()` for each
3. Aggregate results, apply severity/filePattern/limit filters
4. Return JSON

**Performance note:** First call may be slow on large workspaces. Use MCP progress notifications. Subsequent calls use cache.

### 4.3 `dita://workspace/keys`

All defined keys with their resolved targets.

**URI Template:** `dita://workspace/keys?includeScopes=true&search=platform`
**MIME Type:** `application/json`

Query parameters:
- `includeScopes` — include key scope qualifications (default true)
- `search` — filter key names by case-insensitive substring (default: all)

```json
{
  "totalKeys": 156,
  "keys": [
    {
      "keyName": "product-name",
      "navtitle": "DitaCraft",
      "targetUri": "file:///workspace/keys/product-meta.dita",
      "targetFragment": "product-name"
    }
  ]
}
```

**Backend:** Same as `dita_key_space` tool with defaults. Auto-discovers root map, builds key space, returns key list.

---

## 5. Data Models

### 5.1 Shared Types (bundled from `server/src/`)

From `server/src/features/contextGraph.ts`:
```typescript
interface ContextGraph { rootMap: MapNode; topics: TopicNode[]; relations: RelationNode[]; keyDefinitions: KeyDef[]; totalTokenEstimate: number; }
interface MapNode { uri: string; title: string; children: (MapNode | TopicRefNode)[]; }
interface TopicRefNode { href: string; uri: string; title?: string; }
interface TopicNode { uri: string; title: string; type: 'concept' | 'task' | 'reference' | 'generic' | 'unknown'; shortDescSummary?: string; elementCount: number; }
interface RelationNode { fromUri: string; toUri: string; relType: 'topicref' | 'mapref' | 'keydef'; }
interface KeyDef { keyName: string; href?: string; navtitle?: string; }
```

From `server/src/services/keySpaceService.ts`:
```typescript
interface KeyResolutionReport { keyName: string; contextFilePath: string; contextScope?: string; resolved: boolean; definition?: KeyDefinition; steps: ResolutionStep[]; }
interface ResolutionStep { type: 'context-scope-lookup' | 'unqualified-lookup' | 'peer-map-lookup' | 'keyref-hop'; attempted: string; found: boolean; definition?: KeyDefinition; note: string; }
interface KeyDefinition { keyName: string; targetFile?: string; elementId?: string; sourceMap: string; sourceLine?: number; scope?: string; processingRole?: string; keyref?: string; metadata?: KeyMetadata; }
```

All MCP tool input schemas are declared using JSON Schema so agents discover them via `tools/list`.

---

## 6. Backend Integration

### 6.1 Direct Module Import (No LSP)

The MCP server imports `server/src/` modules directly via esbuild bundling. No LSP server runs — no IPC. The modules are all pure TypeScript with zero VS Code dependencies.

| MCP Tool | Backend Function | Source File |
|----------|-----------------|-------------|
| `dita_validate` (uri) | `ValidationPipeline.validate()` | `server/src/services/validationPipeline.ts` |
| `dita_validate` (fragment) | `handleValidateFragment()` | `server/src/features/fragmentValidator.ts` |
| `dita_context_snapshot` | `handleBuildContextSnapshot()` | `server/src/features/contextSnapshot.ts` |
| `dita_map_structure` | `handleGetContextGraph()` | `server/src/features/contextGraph.ts` |
| `dita_key_space` | `KeySpaceService.buildKeySpace()` + `getAllKeys()` | `server/src/services/keySpaceService.ts` |
| `dita_resolve_reference` | Logic from `handleDefinition()` | `server/src/features/definition.ts` |
| `dita_explain_key` | `KeySpaceService.explainKey()` | `server/src/services/keySpaceService.ts` |

### 6.2 Service Initialization (MCP Server Startup)

On startup, create the same service graph as `server.ts` but without LSP connection:

```typescript
// mcp/src/server.ts startup
import { KeySpaceService } from '../../server/src/services/keySpaceService';
import { ValidationPipeline } from '../../server/src/services/validationPipeline';
import { CatalogValidationService } from '../../server/src/services/catalogValidationService';
import { SubjectSchemeService } from '../../server/src/services/subjectSchemeService';

const workspaceRoot = process.env.WORKSPACE;
if (!workspaceRoot) { /* fatal: exit with error */ }

const subjectSchemeService = new SubjectSchemeService();
const catalogService = new CatalogValidationService();
catalogService.initialize(extensionPath);  // extensionPath is the extension root in VSIX layout

const validationPipeline = new ValidationPipeline(
    catalogService, /* rngService */ undefined, subjectSchemeService,
    (msg) => log('debug', msg),
);

const keySpaceService = new KeySpaceService(
    [workspaceRoot],
    async () => ({ keySpaceCacheTtlMinutes: 5, maxLinkMatches: 10000 }),
    (msg) => log('debug', msg),
);
```

**Extension root discovery:** Since the MCP bundle is at `dist/mcp-server.js` inside the VSIX (alongside `out/extension.js`, `server/out/server.js`, `dtds/`, etc.), the extension root is `path.resolve(__dirname, '..')`.

### 6.3 Caching

In-memory TTL cache (no disk persistence):

| Data | TTL | Invalidation |
|------|-----|-------------|
| Context graph | 5 min | Per-URI; invalidated on new snapshot request for same map |
| Key space | 5 min | Managed by `KeySpaceService`'s built-in cache |
| Diagnostics | 1 min | Invalidated after any `dita_validate` call |
| Map list | 10 min | Invalidated on-demand only |

---

## 7. Project Structure & Build

### 7.1 Directory Layout

```
ditacraft/
├── mcp/                              # NEW: MCP server package
│   ├── tsconfig.json                 # Extends root, includes mcp/src + server/src
│   ├── package.json                  # Minimal (no new deps; uses root's @modelcontextprotocol/sdk)
│   └── src/
│       ├── server.ts                 # Entry point: MCP initialize + tool/resource dispatch
│       ├── logger.ts                 # stderr logger with level control
│       ├── workspace.ts              # Path validation, URI resolution (security)
│       └── tools/
│           ├── ditaValidate.ts       # dita_validate handler
│           ├── ditaContextSnapshot.ts # dita_context_snapshot handler
│           ├── ditaKeySpace.ts       # dita_key_space handler
│           ├── ditaMapStructure.ts   # dita_map_structure handler + tree/CSV formatters
│           ├── ditaResolveReference.ts # dita_resolve_reference handler
│           └── ditaExplainKey.ts     # dita_explain_key handler
├── server/
│   └── src/                          # Existing LSP server (bundled into MCP)
├── src/                              # VS Code extension client
├── esbuild.js                        # Add 3rd build target: mcp/src/server.ts → dist/mcp-server.js
└── package.json                      # Add @modelcontextprotocol/sdk dependency
```

### 7.2 Build Integration

Add MCP build target in `esbuild.js` (alongside client + server):

```js
// Build MCP server — bundles server/src/ + mcp/src/ + @modelcontextprotocol/sdk
const mcpCtx = await esbuild.context({
    ...sharedOptions,
    entryPoints: ['mcp/src/server.ts'],
    outfile: 'dist/mcp-server.js',
    // NO vscode external — everything is bundled
});
```

**Why `dist/` not `mcp/out/`:** The VSIX lives at the extension root. Putting the MCP bundle at `dist/mcp-server.js` makes the launch path simple: `node dist/mcp-server.js`. The `compile` script already includes esbuild, so adding this target automatically includes it.

**Key:** `mcp.tsconfig.json` must allow importing from `server/src/`. Configure `paths` or set `rootDir` to repo root:

```json
{
  "compilerOptions": {
    "rootDir": "..",
    "outDir": "out",
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*", "../server/src/**/*"]
}
```

### 7.3 VSIX Packaging

Add `dist/mcp-server.js` to the `.vscodeignore` allowlist (or ensure it's not in the ignore list). The VSIX ships with:
- `out/extension.js` (client)
- `server/out/server.js` (LSP server)
- `dist/mcp-server.js` (MCP server)
- `dtds/` (DITA DTD files)
- `snippets/`, `syntaxes/`, `resources/`

---

## 8. Implementation Phases

### Phase 0 — Prerequisites (0.5 day)

- [ ] `npm install --save @modelcontextprotocol/sdk`
- [ ] Create `mcp/` directory with `tsconfig.json` and `package.json`
- [ ] Add MCP build target to `esbuild.js` (entry: `mcp/src/server.ts`, output: `dist/mcp-server.js`)
- [ ] Add `dist/mcp-server.js` to `.vscodeignore` exempt list (ensure it ships in VSIX)
- [ ] Verify `tsc --noEmit -p mcp/tsconfig.json` passes (type-check MCP + server code together)

### Phase 1 — Core Infrastructure (1.5 days)

- [ ] `mcp/src/logger.ts` — stderr logger with configurable level
- [ ] `mcp/src/workspace.ts` — path validation
  - `resolvePath(input: string, workspace: string): string` — normalize to `file://` URI
  - `validatePath(uri: string, workspace: string): boolean` — check within workspace, reject traversal/URLs/UNC/null bytes
- [ ] `mcp/src/server.ts` — MCP server entry point
  - Read `WORKSPACE` from env (fatal exit if missing)
  - Initialize `CatalogValidationService`, `ValidationPipeline`, `KeySpaceService`, `SubjectSchemeService`
  - Create MCP server with `StdioServerTransport`
  - Register tool handlers (6 tools with JSON Schema input declarations)
  - Register resource handlers (3 resources with URI templates)
  - Handle `initialize`, `tools/list`, `tools/call`, `resources/list`, `resources/read`
  - Handle shutdown (cleanup KeySpaceService timers)
  - Handle progress tokens (`notifications/progress` for long validation)
  - Handle cancellation (AbortSignal → CancellationToken)
- [ ] `mcp/src/diagnosticsStore.ts` — in-memory diagnostics accumulator
  - `update(fileUri, diagnostics)` — store last-known diagnostics per file
  - `query({ severity?, limit?, filePattern? })` — filtered query
  - `clear()` — full reset

### Phase 2 — Tool Implementations (2 days)

- [ ] `mcp/src/tools/ditaValidate.ts`
  - URI mode: read file, create TextDocument, run `pipeline.validate()`
  - Fragment mode: call `handleValidateFragment()`
  - Wire progress + cancellation
  - Update `DiagnosticsStore` on completion
- [ ] `mcp/src/tools/ditaContextSnapshot.ts`
  - Call `handleBuildContextSnapshot(params, keySpaceService)`
  - Validate URI against workspace
- [ ] `mcp/src/tools/ditaKeySpace.ts`
  - Auto-discover root map if `mapUri` not provided
  - `keySpaceService.buildKeySpace(rootMapPath)`
  - `keySpaceService.getAllKeys(rootMapPath)` (use root map path as context file path)
  - Apply includeScopes / includeProvenance filters
- [ ] `mcp/src/tools/ditaMapStructure.ts`
  - Call `handleGetContextGraph({ uri, depth, includeMetadata })`
  - Post-process: `format === 'tree'` → tree-text string; `format === 'csv'` → CSV rows
- [ ] `mcp/src/tools/ditaResolveReference.ts`
  - Implement resolution logic mirroring `handleDefinition()` from `server/src/features/definition.ts`
  - For keyref: `keySpaceService.resolveKey()`
  - For conkeyref: parse `key/element`, resolve both
  - For href/conref: `parseReference()` + `findElementByIdOffset()`
  - Build resolution trace from `explainKey()` or manually
- [ ] `mcp/src/tools/ditaExplainKey.ts`
  - Call `keySpaceService.explainKey(keyName, contextFilePath)`
  - Serialize `KeyResolutionReport` to output

### Phase 3 — Resource Implementations (1 day)

- [ ] `mcp/src/resources/maps.ts`
  - `glob.sync('**/*.ditamap', ...)` + `glob.sync('**/*.bookmap', ...)`
  - For each map: read file, extract `<title>`, count `<topicref>` elements
  - Determine `isRoot` via heuristic or explicit root map setting
- [ ] `mcp/src/resources/diagnostics.ts`
  - Parse query parameters (`severity`, `limit`, `filePattern`)
  - If cache expired, re-validate workspace
  - Query `DiagnosticsStore` with filters
- [ ] `mcp/src/resources/keys.ts`
  - Same as `dita_key_space` tool with default params + `search` filter
  - Parse query params (`includeScopes`, `search`)

### Phase 4 — Testing & Review (2 days)

See §9 Test Plan for all test cases.

- [ ] Tool handler unit tests (6 test files)
- [ ] Resource provider unit tests (3 test files)
- [ ] Infrastructure unit tests (workspace, diagnosticsStore, logger)
- [ ] Integration tests (MCP protocol handshake, tool calls, resource reads, errors, cancellation)
- [ ] Performance: validate large map, large workspace, token budget enforcement
- [ ] Security: path traversal, URL rejection, UNC rejection, null byte rejection

### Phase 5 — Documentation & Examples (0.5 day)

- [ ] opencode config example in README.md
- [ ] Claude Desktop config example in README.md
- [ ] Update AGENTS.md: add `mcp/` directory + build commands
- [ ] Add `DITACRAFT_MCP.md` or section in README explaining MCP integration for users

---

## 9. Test Plan

All MCP tests are server-side tests (no VS Code needed). They run with Mocha TDD (`suite`/`test`), same as the existing `server/test/` suite. Test files go in `mcp/test/`.

**Test setup:** Each test creates a temp directory with DITA fixture files, sets `process.env.WORKSPACE`, starts MCP server via `StdioServerTransport` + `Client` from `@modelcontextprotocol/sdk`, sends JSON-RPC messages, and reads responses.

### 9.1 Tool Handler Unit Tests

**File:** `mcp/test/tools/ditaValidate.test.ts` (14 tests)
```
dita_validate
  File validation
    ✓ validates a valid topic file → isValid=true, no diagnostics
    ✓ validates a topic missing <title> → returns DITA-STRUCT-003
    ✓ validates a file with broken XML syntax → returns DITA-XML-001
    ✓ validates a file that doesn't exist → JSON-RPC error code -32000
    ✓ respects maxNumberOfProblems (truncates diagnostics at limit)
    ✓ validates a bookmap → detects missing <booktitle>
  Fragment validation
    ✓ validates a valid topic fragment → isValid=true
    ✓ validates a map fragment missing <title> → diagnostics present
    ✓ validates a bare <topicref> (wrapped in <map> context) → succeeds
    ✓ validates a bare element (wrapped in <topic><body> context) → succeeds
  Error handling
    ✓ rejects invalid fragmentType → JSON-RPC error code -32602
    ✓ rejects missing both uri and fragment → JSON-RPC error code -32602
    ✓ handles UTF-8 content with CJK characters → no corruption
    ✓ validation with AbortSignal cancels mid-pipeline → no result returned
```

**File:** `mcp/test/tools/ditaContextSnapshot.test.ts` (9 tests)
```
dita_context_snapshot
  ✓ returns Level 1 XML snapshot for a small map
  ✓ returns Level 2 text outline when Level 1 exceeds maxTokens
  ✓ returns Level 3 sliding window when focusUri is provided
  ✓ never exceeds maxTokens budget
  ✓ truncation flag is true when map content exceeds budget
  ✓ returns error for non-existent map file
  ✓ depth-first strategy produces output different from breadth-first
  ✓ handles empty map (no <topicref> children)
  ✓ handles map with circular mapref references (no infinite loop)
```

**File:** `mcp/test/tools/ditaKeySpace.test.ts` (9 tests)
```
dita_key_space
  ✓ returns all keys with default parameters
  ✓ includeScopes=false omits scope-qualified key names
  ✓ includeProvenance=true returns sourceFile and sourceLine per key
  ✓ returns empty array when no mapUri and no root map in workspace
  ✓ handles keyscope inheritance (PushDown) — scoped keys present
  ✓ handles keyref chains (multi-hop) — indirect keys resolved
  ✓ handles scope explosion cap (50,000 keys) — returns truncated flag
  ✓ auto-discovers root map when mapUri is omitted
  ✓ rejects path outside workspace → error
```

**File:** `mcp/test/tools/ditaMapStructure.test.ts` (8 tests)
```
dita_map_structure
  ✓ returns JSON structure by default (valid ContextGraph)
  ✓ tree format produces indented text with [type] labels
  ✓ csv format produces valid CSV with headers (type,uri,title)
  ✓ respects depth limit — nested maps beyond depth are truncated
  ✓ includeMetadata=false omits titles and element counts
  ✓ returns error for missing map file
  ✓ handles map with 100+ topicrefs without hanging
  ✓ handles circular map references (mapref loop) — depth-limited, no infinite recursion
```

**File:** `mcp/test/tools/ditaResolveReference.test.ts` (11 tests)
```
dita_resolve_reference
  ✓ resolves href to absolute file path
  ✓ resolves href with fragment identifier (#element-id)
  ✓ resolves keyref through key space → target file + element
  ✓ resolves conref with cross-file path and fragment
  ✓ resolves conkeyref (keyname/elementid) to element
  ✓ returns resolved=false for unknown key name
  ✓ returns resolved=false for broken href file path
  ✓ returns resolved=false for conref when target element missing
  ✓ includes resolution trace steps for keyref path
  ✓ includes resolution trace steps for multi-hop keyref chain
  ✓ resolves href from fromUri context (relative path)
```

**File:** `mcp/test/tools/ditaExplainKey.test.ts` (7 tests)
```
dita_explain_key
  ✓ returns full resolution trace for found key
  ✓ returns all lookup steps even when key not found (resolved=false)
  ✓ shows keyscope context in trace (contextScope field)
  ✓ shows keyref chain hops in trace (multiple keyref-hop steps)
  ✓ handles key defined in nested scope (parent + child)
  ✓ handles key defined via peer map lookup
  ✓ returns error for contextFilePath outside workspace
```

### 9.2 Resource Provider Unit Tests

**File:** `mcp/test/resources/maps.test.ts` (6 tests)
```
dita://workspace/maps
  ✓ lists all .ditamap files in workspace
  ✓ includes .bookmap files alongside .ditamap files
  ✓ includes isRoot=true for the discovered root map
  ✓ includes title extracted from <title> element
  ✓ includes topicCount from <topicref> children
  ✓ returns empty maps array when workspace has no DITA maps
```

**File:** `mcp/test/resources/diagnostics.test.ts` (6 tests)
```
dita://workspace/diagnostics
  ✓ returns diagnostics after at least one file validated
  ✓ severity=error filter returns only errors
  ✓ severity=error,warning filter returns errors and warnings
  ✓ limit=10 returns at most 10 results
  ✓ filePattern=topics/* filters files by glob
  ✓ returns empty diagnostics when workspace has valid files
```

**File:** `mcp/test/resources/keys.test.ts` (5 tests)
```
dita://workspace/keys
  ✓ returns all defined keys from key space
  ✓ search=product filters key names by substring (case-insensitive)
  ✓ search returns empty when no match
  ✓ includeScopes=false omits scope prefix from key names
  ✓ returns empty when no keys defined in workspace
```

### 9.3 Infrastructure Unit Tests

**File:** `mcp/test/workspace.test.ts` (10 tests)
```
WorkspaceValidator
  ✓ resolves relative path within workspace to file:// URI
  ✓ resolves file:// URI within workspace
  ✓ rejects path traversing > 8 levels above workspace
  ✓ rejects absolute path outside workspace (/etc/passwd)
  ✓ rejects http:// URL
  ✓ rejects https:// URL
  ✓ rejects UNC path (\\server\share\file)
  ✓ rejects path with null byte injection
  ✓ normalizes forward/backward slashes
  ✓ rejects empty string input
```

**File:** `mcp/test/diagnosticsStore.test.ts` (8 tests)
```
DiagnosticsStore
  ✓ accumulates diagnostics per file URI
  ✓ query() returns all diagnostics by default
  ✓ query() filters by severity
  ✓ query() filters by file pattern glob
  ✓ query() respects limit
  ✓ update() replaces previous diagnostics for same URI
  ✓ clear() removes all stored diagnostics
  ✓ handles empty diagnostics array (valid file, no errors)
```

**File:** `mcp/test/logger.test.ts` (4 tests)
```
Logger
  ✓ writes to stderr when level >= current
  ✓ suppresses debug when level is warn
  ✓ setLevel changes filtering
  ✓ log format includes timestamp and level
```

### 9.4 MCP Protocol Integration Tests

**File:** `mcp/test/integration.test.ts` (10 tests)
```
MCP Protocol Integration
  ✓ initialize handshake completes successfully
  ✓ initialize returns server info (name: ditacraft-mcp, version)
  ✓ tools/list returns 6 tools with names and inputSchemas
  ✓ resources/list returns 3 resources with URI templates
  ✓ tools/call('dita_validate', {uri}) returns valid JSON-RPC result
  ✓ tools/call errors follow JSON-RPC error object format
  ✓ resources/read('dita://workspace/maps') returns JSON
  ✓ multiple sequential tool calls all succeed
  ✓ concurrent tool calls (3 parallel) all resolve correctly
  ✓ server process exits cleanly on stdin close
```

### 9.5 Performance Tests (Integration)

**File:** `mcp/test/performance.test.ts` (6 tests)
```
Performance
  ✓ dita_validate cold start < 500ms (first call after startup)
  ✓ dita_validate warm < 100ms (cached, same file)
  ✓ dita_context_snapshot large map (200+ topics) < 2s
  ✓ dita_map_structure 1000+ topicrefs < 3s (depth=4)
  ✓ dita_key_space 500+ keys < 1s (with scopes)
  ✓ MCP server startup < 1s (spawn to initialize complete)
```

### 9.6 Security Tests

**File:** `mcp/test/security.test.ts` (6 tests)
```
Security
  ✓ path traversal with ../ exceeding 8 levels is rejected
  ✓ path traversal via symlink outside workspace is rejected
  ✓ null byte in path is rejected
  ✓ HTTP URL as file URI is rejected
  ✓ absolute system path (/etc, C:\Windows) is rejected
  ✓ fragment validation does not execute entities (XXE safe)
```

### 9.7 Test Count Summary

| Category | Files | Tests |
|----------|-------|-------|
| Tool handlers | 6 | 58 |
| Resource providers | 3 | 17 |
| Infrastructure | 3 | 22 |
| Integration | 1 | 10 |
| Performance | 1 | 6 |
| Security | 1 | 6 |
| **Total** | **15** | **119** |

---

## 10. Benefits for External Agents

### 10.1 Why MCP Over Custom APIs

| Aspect | MCP | Custom REST/gRPC |
|--------|-----|------------------|
| Discovery | Agents introspect via `tools/list` + `resources/list` | Must hardcode API knowledge |
| Schemas | JSON Schema for inputs/outputs | Ad-hoc documentation |
| Transport | stdio (local, zero network) | Requires HTTP server + port |
| Ecosystem | opencode, Claude, Cursor, Continue, Zed, etc. | Per-tool integrations |
| Security | Workspace isolation, no network, no auth needed | Must build auth/authz |
| Progress | Built-in progress notifications | Must implement |
| Cancellation | AbortSignal propagation | Must implement |

### 10.2 Benefits for opencode

opencode is a terminal-first AI coding agent. With the DitaCraft MCP server, opencode can:

- **Validate DITA in CI/CD** — `opencode run "@ditacraft validate topics/"` catches errors before review
- **Analyze documentation structure** — `@ditacraft show me chapters/main.ditamap` exposes the doc layout
- **Resolve broken references** — `@ditacraft resolve keyref install-guide` debugs key resolution
- **Generate LLM context** — `@ditacraft snapshot guides/main.ditamap` injects DITA awareness into prompts
- **Check diagnostics** — `@ditacraft what diagnostics does the workspace have?` queries validation state
- **Cross-repo analysis** — multiple MCP servers (one per DITA project) enable cross-project documentation work

### 10.3 Workflow Examples

**CI validation hook:**
```bash
opencode run "@ditacraft validate all DITA files. Report errors."
# → Agent discovers maps, validates each, reports: "3 errors in topics/chapter1.dita"
```

**Documentation-aware coding:**
```
User: What keys reference 'install-guide'?
Agent: [calls dita_explain_key('install-guide', 'topics/chapter1.dita')]
       install-guide resolves via:
         Step 1: context-scope → ch1.install-guide → not found
         Step 2: unqualified → install-guide → keydef at line 42
       Definition: keyref='setup-guide' → 2-hop chain
       → setup-guide → topics/setup.dita
```

---

## 11. Client Examples

### 11.1 opencode

```jsonc
// ~/.config/opencode/opencode.json
{
  "mcpServers": {
    "ditacraft": {
      "command": "node",
      "args": ["/path/to/ditacraft/dist/mcp-server.js"],
      "env": {
        "WORKSPACE": "/home/user/projects/my-dita-docs"
      }
    }
  }
}
```

```
> @ditacraft validate topics/intro.dita
> @ditacraft show me the map structure as a tree
> @ditacraft explain why keyref install-guide isn't resolving
```

### 11.2 Claude Desktop

```json
// macOS: ~/Library/Application Support/Claude/claude_desktop_config.json
// Windows: %APPDATA%\Claude\claude_desktop_config.json
// Linux: ~/.config/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "ditacraft": {
      "command": "node",
      "args": ["/absolute/path/to/dist/mcp-server.js"],
      "env": { "WORKSPACE": "/path/to/dita/project" }
    }
  }
}
```

### 11.3 Cursor

```json
// .cursor/mcp.json
{
  "mcpServers": {
    "ditacraft": {
      "command": "node",
      "args": ["dist/mcp-server.js"],
      "env": { "WORKSPACE": "${workspaceFolder}" }
    }
  }
}
```

---

## 12. Security & Privacy

### 12.1 Workspace Isolation

All file paths resolved relative to `WORKSPACE` env var:

| Allowed | Rejected |
|---------|----------|
| `topics/intro.dita` (relative) | `/etc/passwd` |
| `file:///workspace/topics/intro.dita` | `https://example.com/malware.xml` |
| `C:\project\topics\file.dita` (workspace=`C:\project`) | `../../../../sensitive.dita` (> 8 levels) |
| | `C:\Windows\System32\config\SAM` |
| | `\\server\share\file` (UNC) |
| | Paths with null bytes (`\x00`) |

### 12.2 No External Transmission

- MCP tools never send document content to external services (stdio is local)
- Diagnostics contain only error codes, line/column — no prose context
- Snapshots contain only DITA metadata (titles, types, structure) — no document bodies
- Key definitions contain only key names, target URIs, navtitles — no content previews

### 12.3 Authentication

**stdio mode (v0.8.0):** No authentication. The agent runs on the same machine; security is enforced by OS file permissions.

**HTTP mode (v0.9.0+):** Will require `Authorization: Bearer <key>`.

---

## 13. Appendices

### Appendix A: MCP Protocol Sequence

```
Agent                              MCP Server
  │                                    │
  │── spawn node dist/mcp-server ────>│  (WORKSPACE env var)
  │                                    │  Init KeySpaceService, ValidationPipeline
  │<── initialize request ────────────│
  │── initialize response ───────────>│  (capabilities, serverInfo: name/version)
  │                                    │
  │── tools/list request ────────────>│
  │<── 6 tools with schemas ──────────│
  │                                    │
  │── tools/call (dita_validate) ────>│
  │                                    │  ValidationPipeline.validate()
  │<── tool result (diagnostics) ─────│  (JSON-RPC response)
  │                                    │
  │── resources/read (dita://...) ───>│
  │                                    │  DiagnosticsStore.query() / glob
  │<── resource content (JSON) ───────│
  │                                    │
  │── stdin close ───────────────────>│
  │                                    │  keySpaceService.shutdown()
  │                                    │  process.exit(0)
```

### Appendix B: JSON-RPC Error Codes

| Code | Meaning |
|------|---------|
| -32602 | Invalid params (wrong type, missing required field, invalid enum) |
| -32603 | Internal error (pipeline crashed, service initialization failed) |
| -32000 | Workspace error (path outside workspace, file not found) |
| -32001 | Rate limit (too many concurrent validation requests) |

Note: Validation errors (e.g. DITA-STRUCT-003) are NOT JSON-RPC errors. They are valid tool results with `isValid: false`.

### Appendix C: Implementation Checklist

#### Phase 0 — Prerequisites
- [ ] `npm install --save @modelcontextprotocol/sdk`
- [ ] Create `mcp/` directory with `tsconfig.json`
- [ ] Add MCP build target to `esbuild.js`
- [ ] Add `dist/mcp-server.js` to VSIX .vscodeignore allowlist

#### Phase 1 — Core Infrastructure
- [ ] `mcp/src/logger.ts`
- [ ] `mcp/src/workspace.ts` (path validation)
- [ ] `mcp/src/server.ts` (MCP entry point + service init)
- [ ] `mcp/src/diagnosticsStore.ts`

#### Phase 2 — Tool Implementations
- [ ] `mcp/src/tools/ditaValidate.ts`
- [ ] `mcp/src/tools/ditaContextSnapshot.ts`
- [ ] `mcp/src/tools/ditaKeySpace.ts`
- [ ] `mcp/src/tools/ditaMapStructure.ts`
- [ ] `mcp/src/tools/ditaResolveReference.ts`
- [ ] `mcp/src/tools/ditaExplainKey.ts`

#### Phase 3 — Resource Implementations
- [ ] `mcp/src/resources/maps.ts`
- [ ] `mcp/src/resources/diagnostics.ts`
- [ ] `mcp/src/resources/keys.ts`

#### Phase 4 — Tests (119 test cases, 15 files)
- [ ] `mcp/test/tools/ditaValidate.test.ts` (14 tests)
- [ ] `mcp/test/tools/ditaContextSnapshot.test.ts` (9 tests)
- [ ] `mcp/test/tools/ditaKeySpace.test.ts` (9 tests)
- [ ] `mcp/test/tools/ditaMapStructure.test.ts` (8 tests)
- [ ] `mcp/test/tools/ditaResolveReference.test.ts` (11 tests)
- [ ] `mcp/test/tools/ditaExplainKey.test.ts` (7 tests)
- [ ] `mcp/test/resources/maps.test.ts` (6 tests)
- [ ] `mcp/test/resources/diagnostics.test.ts` (6 tests)
- [ ] `mcp/test/resources/keys.test.ts` (5 tests)
- [ ] `mcp/test/workspace.test.ts` (10 tests)
- [ ] `mcp/test/diagnosticsStore.test.ts` (8 tests)
- [ ] `mcp/test/logger.test.ts` (4 tests)
- [ ] `mcp/test/integration.test.ts` (10 tests)
- [ ] `mcp/test/performance.test.ts` (6 tests)
- [ ] `mcp/test/security.test.ts` (6 tests)

#### Phase 5 — Documentation
- [ ] opencode config example in README.md
- [ ] Claude Desktop config example in README.md
- [ ] Update AGENTS.md with `mcp/` directory + build commands
- [ ] Add MCP section to README

---

**Last Updated:** June 2026
**Next Review:** September 2026 (post-v0.8.0)
