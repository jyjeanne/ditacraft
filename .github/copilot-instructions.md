# DitaCraft — Copilot Instructions

DitaCraft is a VS Code extension for editing and publishing DITA XML content. It provides a full-featured Language Server Protocol (LSP) implementation with validation, IntelliSense, navigation, and DITA-OT publishing integration.

## Build, Test, and Lint

```bash
# Install dependencies (both client and server)
npm install && cd server && npm install && cd ..

# Full build (type-check + esbuild bundle)
npm run compile

# Type-check only (client + server)
npm run check-types

# Lint
npm run lint

# Server tests (Mocha TDD, fast, no VS Code needed)
cd server && npm test

# Run a single server test file
cd server && tsc -p tsconfig.test.json && npx mocha out/test/validation.test.js --ui tdd --timeout 10000

# Client tests (requires VS Code test electron harness)
npm test

# Coverage
npm run coverage
```

Server tests (`server/test/`) are Mocha TDD (`suite`/`test` blocks) and can run standalone. Client tests (`src/test/suite/`) require the VS Code test electron runner via `@vscode/test-electron`. Always run server tests to validate LSP changes; client tests need `xvfb-run` on headless Linux.

## Architecture

This is a **client-server VS Code extension** using the Language Server Protocol:

- **Client** (`src/`): VS Code extension that registers commands, tree view providers, webview panels, and starts the language server. Entry point: `src/extension.ts`. The language client is configured in `src/languageClient.ts` and communicates over IPC.
- **Server** (`server/`): Standalone LSP server with its own `package.json`, `tsconfig.json`, and dependencies. Entry point: `server/src/server.ts`. It wires all `connection.on*` handlers to feature modules.
- **Build**: `esbuild.js` bundles both client (`src/extension.ts` → `out/extension.js`) and server (`server/src/server.ts` → `server/out/server.js`) as CommonJS.

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
- Use `fireAndForget()` to run async operations from synchronous activation contexts (prevents unhandled rejections).
- The validation pipeline wraps each phase in independent try-catch for error isolation — one phase failing must not break others.

### Diagnostic codes
All diagnostic codes are centralized in `server/src/utils/diagnosticCodes.ts` (e.g., `DITA-STRUCT-001`, `DITA-XREF-002`). Never define diagnostic code strings inline in feature files.

### i18n / Localization
Server diagnostic messages use the `t()` function from `server/src/utils/i18n.ts` with message keys from `server/src/messages/{locale}.json`. Use parameterized messages (e.g., `t('id.duplicate', idValue)`) — never interpolate directly into message strings.

### LSP feature pattern
Each LSP feature in `server/src/features/` exports a pure handler function that takes LSP params + `TextDocuments` (+ optional services). The server wires them in `server.ts`. Keep features stateless — state lives in services.

### Test helpers
Server tests use `createDoc()` and `createDocs()` from `server/test/helper.ts` to create `TextDocument` instances and mock `TextDocuments` collections. These are lightweight and don't require a running server.

### TypeScript strictness
Both `tsconfig.json` files enable `strict: true` with `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, and `noFallthroughCasesInSwitch`.

### ESLint
- `@typescript-eslint/no-explicit-any` is warn-level (prefer typed alternatives).
- Unused variables prefixed with `_` are allowed.
- Root `npm run lint` runs the root ESLint config (primarily client code). The LSP server has its own config/ignores under `server/`.

## Running tests (fast paths)

### Server (LSP) tests (Mocha TDD)

```bash
cd server

# Run all server tests
npm test

# Run a single suite/test by name
npm test -- --grep "validateDITADocument"

# Run a single compiled test file directly
tsc -p tsconfig.test.json && npx mocha out/test/validation.test.js --ui tdd --timeout 10000
```

### Client (VS Code integration) tests

```bash
# Runs via @vscode/test-electron
npm test
```

To focus on a single client test, filter/limit what gets required in `src\test\suite\index.ts` (the harness loads tests from there).

## High-level architecture (how it hangs together)

- This is a **VS Code extension (client) + separate LSP server (server)** communicating over **IPC / LSP 3.17+**.
- Client entry + wiring:
  - `src\extension.ts` registers commands, views, providers, and starts the language client.
  - `src\languageClient.ts` configures the language client and launches the server process.
- Server entry + wiring:
  - `server\src\server.ts` is the LSP entry point.
  - `server\src\serverHandlers.ts` wires `connection.on*` handlers to feature modules.
- Build output:
  - `esbuild.js` bundles client → `out\extension.js` and server → `server\out\server.js` (CommonJS).

## Validation + diagnostics model (server)

- The core validator is `server\src\services\validationPipeline.ts`: a **13-phase pipeline** with **per-phase try/catch isolation** (one phase failing must not break others).
- Performance guardrails:
  - Smart debouncing: topics ~300ms, maps ~1000ms, with per-document cancellation.
  - Large file optimization: files over the configured threshold skip heavier phases.
- Diagnostics conventions:
  - **Never inline diagnostic code strings**: add/update codes in `server\src\utils\diagnosticCodes.ts`.
  - **All diagnostic text is localized**: messages come from `server\src\messages\{locale}.json` and are retrieved via `t()` from `server\src\utils\i18n.ts`.
  - Severity overrides are driven by the `ditacraft.validationSeverityOverrides` setting (applied in the pipeline).
  - Suppression is comment-based:
    - `<!-- ditacraft-disable CODE -->` / `<!-- ditacraft-enable CODE -->` (range)
    - `<!-- ditacraft-disable-file CODE -->` (entire file)
  - Settings are cached per-document in `server\src\settings.ts` and refreshed via `workspace/didChangeConfiguration`.

## Feature implementation patterns

- **Server features** live in `server\src\features\` and export handler functions (stateless). Put state/caching in `server\src\services\`.
- **Client commands** live in `src\commands\`:
  - Register command handlers in `src\extension.ts`.
  - Add command contributions in `package.json` under `contributes.commands`.
- Tests:
  - Server tests use helpers like `createDoc()` / `createDocs()` from `server\test\helper.ts` to mock `TextDocuments` without running VS Code.
  - Client tests run in the VS Code test harness and typically assert via diagnostics/commands.
