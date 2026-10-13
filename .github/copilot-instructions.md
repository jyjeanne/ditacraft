# DitaCraft — Copilot Instructions

DitaCraft is a VS Code extension for DITA authoring and publishing.  
It has three TypeScript targets:

- **Client extension** (`src/`) for VS Code UI/commands/providers
- **LSP server** (`server/src/`) for validation, completion, navigation
- **MCP server** (`mcp/src/`) for external agent/tooling integration

## Build, test, and lint (source of truth: `package.json`)

```bash
# Install dependencies
npm install
cd server && npm install && cd ..

# Full compile (type-check + bundle)
npm run compile

# Type-check only (client + server + webview)
npm run check-types

# Bundle only
npm run esbuild-base -- --sourcemap

# Watch mode
npm run watch

# Lint (root ESLint flat config)
npm run lint

# Root client/integration tests (VS Code test harness)
npm test

# Shared pure-Mocha client-core tests (no VS Code host)
npm run test:shared

# Server tests
cd server && npm test

# MCP tests
npm run test:mcp

# Coverage
npm run coverage
cd server && npm run coverage
```

### Practical testing guidance

- For **server/LSP** changes, always run `cd server && npm test`.
- For **client command/provider/UI** changes, run `npm test`.
- For **shared preview/editor core** changes (`src/shared/**`), run `npm run test:shared`.
- Run the smallest relevant suite first, then expand only if needed.

## Architecture quick map

### Client (`src/`)

- Entry: `src/extension.ts`
- LSP client wiring: `src/languageClient.ts`
- Key areas:
  - `src/commands/` command handlers
  - `src/providers/` tree views, diagnostics view, webviews
  - `src/utils/` DITA-OT wrapper, config, logging, error helpers
  - `src/shared/` environment-neutral preview/editor core

### Server (`server/src/`)

- Entry: `server/src/server.ts`
- Handler composition: `server/src/serverHandlers.ts`
- Key areas:
  - `features/` stateless LSP handlers
  - `services/` stateful orchestration/caching/business logic
  - `utils/` tokenizer, diagnostics registry, i18n helpers, shared primitives
  - `messages/` localized message bundles (`en.json`, `fr.json`)

### MCP (`mcp/src/`)

- Entry: `mcp/src/server.ts`
- Uses server-side logic to expose tooling over MCP/stdio

## OKF knowledge graph usage (mandatory for non-trivial tasks)

### Source of truth

The project's OKF knowledge graph is in:

`docs/okf-knowledge/`

Treat this directory as a first-class architectural and conceptual reference.

### Mandatory research policy

Before answering a non-trivial question, proposing architecture, implementing a feature, refactoring, debugging, or changing conventions:

1. Search `docs/okf-knowledge/` for relevant concepts.
2. Read the relevant concept files and follow linked dependencies when needed.
3. Extract documented relationships, constraints, and architectural decisions.
4. Compare graph evidence with current code before proposing or applying changes.
5. Use source code and tests to verify details that may have changed.

Do not rely only on source search when relevant OKF knowledge exists.

### Evidence and conflict handling

- Cite relevant OKF file paths in explanations.
- Distinguish facts from assumptions or recommendations.
- If graph and source disagree, report the discrepancy and determine what reflects current behavior.
- Never invent concepts, dependencies, or decisions.
- If no relevant OKF evidence exists, state it and continue with source-code research.

### Efficient retrieval

- Start from root/index concepts when available.
- Search by concept/component/dependency terms tied to the task.
- Read only relevant concept files and directly related links.
- Expand scope only when initial evidence is insufficient.

### Completion expectation for non-trivial tasks

Briefly report:

- OKF concepts consulted
- Source files inspected
- Any conflicts, missing knowledge, or assumptions

For trivial edits, avoid disproportionate graph exploration.

## Core implementation conventions

### Error handling

- Use `catch (error: unknown)`.
- Use `getErrorMessage()` from `src/utils/errorUtils.ts` when surfacing errors.
- Use `fireAndForget()` for async work launched from sync activation points.
- Keep failure isolation in pipelines/services (one phase failure must not cascade).

### Diagnostics

- **Never inline diagnostic code strings** in feature logic.
- Use `server/src/utils/diagnosticCodes.ts` as the single source of truth.
- Preserve diagnostic ranges and related information quality for editor UX.

### Localization

- Server diagnostics/messages must use `t()` from `server/src/utils/i18n.ts`.
- Add new localization keys to **both**:
  - `server/src/messages/en.json`
  - `server/src/messages/fr.json`

### Stateless feature pattern

- Keep `server/src/features/*` handlers stateless and deterministic.
- Put caches and mutable state in `server/src/services/*`.

### Type safety

- Repository is strict TypeScript (`strict`, `noImplicitReturns`, etc.).
- Prefer proper typing/guards over `any`.
- Keep edits lint-clean in touched files.

## Validation model (server)

`server/src/services/validationPipeline.ts` orchestrates a multi-phase pipeline with per-phase isolation, including:

- XML well-formedness and DITA structure checks
- ID/content model/DTD or RelaxNG checks
- DITA rules/custom rules
- Cross-reference, profiling, cycle, workspace checks
- Suppression application and severity overrides

Performance behavior to preserve:

- Document-type-aware debounce
- Cancellation-aware execution
- Large-file phase throttling based on settings

## Testing helpers and patterns

- Server tests: `server/test/helper.ts` (`createDoc()`, `createDocs()`).
- Prefer focused regression tests for each bug fix.
- Add tests where behavior changed; avoid broad snapshot-style overreach.

## Linting and config notes

- Active linter config is `eslint.config.mjs` (flat config).
- Root lint mainly targets `src/**/*.ts` and `webview/**/*.ts`.
- `server/` is excluded from root lint; server correctness is guarded by strict TS + tests.

## Change hygiene for Copilot

- Make minimal, targeted changes; avoid unrelated refactors.
- Follow existing naming and file organization.
- Update nearby tests when behavior changes.
- Keep docs aligned when commands/workflows/conventions change.
