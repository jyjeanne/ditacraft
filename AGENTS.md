# DitaCraft

DitaCraft is a VS Code extension for editing and publishing DITA XML content. It provides a full-featured Language Server Protocol (LSP) implementation with validation, IntelliSense, navigation, and DITA-OT publishing integration.

## Build, Test, and Lint

```bash
# Install dependencies (two separate package.json: root + server)
npm ci && cd server && npm ci
#   ^^ CI uses npm ci; local dev can use npm install if needed.

# Full build (type-check both projects + esbuild bundle both)
npm run compile

# Type-check only (client + server, faster than full compile)
npm run check-types

# Build only (esbuild, skips type-check)
npm run esbuild-base -- --sourcemap

# Watch mode (esbuild watch + tsc watch in parallel; F5 to debug)
npm run watch

# Lint (client only; server/ is excluded in eslint.config.mjs)
npm run lint

# Server tests (Mocha TDD, standalone, no VS Code needed)
cd server && npm test

# Server tests — single suite
cd server && npm test -- --grep "suite name"

# Client tests (requires @vscode/test-electron harness; xvfb-run on headless Linux)
# NOTE: npm test at root also runs pretest: compile-tests + lint. If lint fails, tests won't run.
npm test

# Client coverage (client only; uses c8 thresholds from root package.json)
npm run coverage

# Server coverage (server only; thresholds: 90% lines/stmts/funcs, 80% branches)
cd server && npm run coverage

# MCP server tests (Mocha TDD, standalone, no VS Code needed)
cd mcp && npx tsc -p test/tsconfig.json && npx mocha out/test/mcp/test/*.test.js out/test/mcp/test/**/*.test.js --ui tdd --timeout 30000

# MCP server — build only
npm run esbuild-base -- --sourcemap   # builds client + server + MCP

# MCP server — smoke test (requires tsx)
npx tsx mcp/test/smoke-test.ts
```

**Important script chain:** `npm test` triggers `pretest` → `npm run compile-tests && npm run lint` → then `node ./out/test/runTest.js`. `compile-tests` is just `tsc -p ./` (compiles client source to `out/`, not the same as `check-types`). Server tests are completely independent — they compile + run via their own `tsc -p tsconfig.test.json && mocha ...`.

Server tests (`server/test/`) use Mocha TDD (`suite`/`test` blocks) with `--ui tdd --timeout 10000`. Client tests (`src/test/suite/`) require the VS Code test electron harness. Always run server tests to validate LSP changes; client tests need `xvfb-run` on headless Linux.

## Architecture

This is a **client-server VS Code extension** using the Language Server Protocol:

- **Client** (`src/`): VS Code extension that registers commands, tree view providers, webview panels, and starts the language server. Entry point: `src/extension.ts`. The language client is configured in `src/languageClient.ts` and communicates over IPC.
- **Server** (`server/`): Standalone LSP server with its own `package.json`, `tsconfig.json`, and dependencies. Entry point: `server/src/server.ts`. It wires all `connection.on*` handlers to feature modules. Handler wiring is extracted into `server/src/serverHandlers.ts`.
- **MCP Server** (`mcp/`): Standalone MCP server (Model Context Protocol) for external AI agents. Entry point: `mcp/src/server.ts`. Bundles `server/src/` modules directly — no VS Code dependency. Exposes 6 tools and 3 resources over stdio JSON-RPC. Built by esbuild to `dist/mcp-server.js`.
- **Build**: `esbuild.js` bundles all three targets: client (`src/extension.ts` → `out/extension.js`), server (`server/src/server.ts` → `server/out/server.js`), and MCP server (`mcp/src/server.ts` → `dist/mcp-server.js`). Client externalizes `vscode`; server and MCP bundle everything. Accepts `--watch`, `--minify`, `--sourcemap` flags.

### Server internals (`server/src/`)

| Directory | Purpose |
|-----------|---------|
| `features/` | One file per LSP capability (completion, hover, validation, codeActions, etc.). Each exports a handler function like `handleCompletion(params, documents, ...)`. |
| `services/` | Domain services: `validationPipeline.ts` orchestrates a 13-phase validation pipeline; `keySpaceService.ts` resolves DITA key spaces via BFS map traversal; `catalogValidationService.ts` handles DTD validation with OASIS catalogs. |
| `utils/` | Shared utilities: `xmlTokenizer.ts` (state-machine XML tokenizer), `i18n.ts` (localization), `diagnosticCodes.ts` (central code registry), `patterns.ts` (regex constants). |
| `data/` | Static schema data: `ditaSchema.ts` defines DITA element hierarchy, attributes, and documentation. |
| `messages/` | Localization JSON files (`en.json`, `fr.json`). |

### Client internals (`src/`)

| Directory | Purpose |
|-----------|---------|
| `commands/` | Command implementations (validate, publish, preview, file creation). Barrel-exported from `index.ts`. |
| `providers/` | Tree view providers (DITA Explorer, Key Space, Diagnostics), webview panels (preview, map visualizer, validation report), link/decoration providers. |
| `utils/` | Client utilities: `ditaOtWrapper.ts` (DITA-OT CLI integration), `errorUtils.ts` (safe error extraction + `fireAndForget` for async ops), `configurationManager.ts`, `logger.ts`. |

## Key Conventions

### Error handling
- Catch blocks use `catch (error: unknown)` — never assume error type.
- Use `getErrorMessage(error)` from `src/utils/errorUtils.ts` for safe message extraction.
- Use `fireAndForget()` from `src/utils/errorUtils.ts` to run async operations from synchronous activation contexts (prevents unhandled rejections).
- The validation pipeline wraps each phase in independent try-catch for error isolation — one phase failing must not break others.

### Diagnostic codes
All diagnostic codes are centralized in `server/src/utils/diagnosticCodes.ts` (e.g., `DITA-STRUCT-001`, `DITA-XREF-002`). Never define diagnostic code strings inline in feature files. Codes follow the pattern `DITA-{CATEGORY}-{NNN}` and are typed `as const`.

### i18n / Localization
Server diagnostic messages use the `t()` function from `server/src/utils/i18n.ts` with message keys from `server/src/messages/{locale}.json`. Use parameterized messages (e.g., `t('id.duplicate', idValue)`) — never interpolate directly into message strings. Add new keys to both `en.json` and `fr.json`.

### LSP feature pattern
Each LSP feature in `server/src/features/` exports a pure handler function that takes LSP params + `TextDocuments` (+ optional services). The server wires them in `serverHandlers.ts`. Keep features stateless — state lives in services.

### Test helpers
Server tests use `createDoc()` and `createDocs()` from `server/test/helper.ts` to create `TextDocument` instances and mock `TextDocuments` collections. These are lightweight and don't require a running server. Service interfaces in `server/src/services/interfaces.ts` provide contracts for mocking in tests.

### TypeScript strictness
Both `tsconfig.json` files enable `strict: true` with `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, and `noFallthroughCasesInSwitch`. The server `tsconfig.json` uses `composite: true`. Tests compile via `server/tsconfig.test.json` (extends server config, adds `mocha` types, sets `rootDir: "."`, `composite: false`).

### ESLint
- Active config is the flat config (`eslint.config.mjs`), covers only `src/**/*.ts`. The legacy `.eslintrc.json` is present but superseded.
- Server code (`server/`) is excluded from linting entirely.
- `@typescript-eslint/no-explicit-any` is warn-level (prefer typed alternatives).
- Unused variables prefixed with `_` are allowed.

### Debugging
- F5 launches extension in debug mode (preLaunchTask: `npm: compile`).
- Debug port: 6009 (attach config in `.vscode/launch.json` → "Attach to DITA Language Server").
- Server console output appears in VS Code's Developer Tools (**Help → Toggle Developer Tools**).

### CI
- Node 20, three-OS matrix (ubuntu, windows, macos).
- `npm audit --audit-level=high` must pass (runs in separate `security` job before `lint-and-test`).
- Server coverage thresholds (90% lines/stmts/funcs, 80% branches) checked only on Linux.
- Client coverage uses root c8 config thresholds.
- Release workflow triggers on `v*` tags; packages and uploads VSIX artifact.
