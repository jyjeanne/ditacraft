# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**DitaCraft** is a comprehensive VS Code extension for editing and publishing DITA (Darwin Information Typing Architecture) XML files. It provides syntax highlighting, real-time validation, smart navigation, LSP-based IntelliSense, live HTML preview, and one-click DITA-OT publishing. The project uses a **client-server architecture**: the client extension handles UI commands and a separate LSP server handles all language intelligence.

**Key Stats:**
- 1,376+ tests (683 client + 703 server)
- 23,000+ lines of TypeScript code
- Client: ES2020, CommonJS, esbuild bundled
- Server: 13-phase validation pipeline, LSP 3.17+
- Validation: TypesXML DTD (OASIS catalog), optional RelaxNG, 43 DITA rules, custom regex rules

---

## Building & Development

### Install Dependencies
```bash
npm install
```

### Compile (Client + Server)
```bash
npm run compile
```
Runs type checking and esbuild for both client and server via `esbuild.js`. Produces `out/extension.js` and `server/out/server.js`.

### Type-Check Only (No Emit)
```bash
npm run check-types
```
Runs `tsc --noEmit` for both client and server. Faster than a full compile when you only want type errors.

### Development Watch Mode (Recommended)
```bash
npm run watch
```
Runs esbuild and TypeScript in watch mode. Press **F5** in VS Code to launch in debug mode. Reload with **Ctrl+R** to test changes.

### Package Extension
```bash
npm run package
```
Runs `vsce package` to produce a `.vsix` file for manual installation or publishing.

### Linting
```bash
npm run lint
```
ESLint with TypeScript support. Uses `@typescript-eslint/parser` and `.eslintrc.json`.

---

## Testing

### Client Tests (VS Code Integration)
```bash
npm test
```
Runs integration tests using `@vscode/test-electron`. Timeout: 10 seconds per test.

To run a single test: Modify `src/test/suite/index.ts` to filter tests by name.

### Server Tests (Standalone Mocha, No VS Code)
```bash
cd server
npm test
```
Compiles TypeScript and runs Mocha: `mocha out/test/**/*.test.js --ui tdd --timeout 10000`

To run a single server test:
```bash
cd server
npm test -- --grep "test suite name"
```
Example: `npm test -- --grep "validateDITADocument"`

### Code Coverage

**Client:**
```bash
npm run coverage
```
Enforces: 63% lines, 63% statements, 70% functions, 73% branches.

**Server:**
```bash
cd server && npm run coverage
```
Enforces: 90% lines/statements/functions, 80% branches.

---

## Project Architecture

### High-Level Structure

**Client-Server Architecture:**
- **Client** (`src/`) — VS Code extension: commands, UI views, file operations, configuration
- **LSP Server** (`server/src/`) — Separate Node.js process via IPC: validation, IntelliSense, navigation, formatting

The client starts the server as a child process. They communicate via LSP 3.17+ (JSON-RPC over stdio).

**Key Integration Points:**
- `src/languageClient.ts` — Initializes LSP client, manages connection
- `server/src/server.ts` — LSP server entry point, registers all feature handlers
- Validation runs in pull-based diagnostics: client requests → server's `ValidationPipeline` runs 13 phases → returns `Diagnostic[]`

### Validation Pipeline (13 Phases)

The `ValidationPipeline` in `server/src/services/validationPipeline.ts` orchestrates all validation with error isolation (if phase 6 crashes, phases 7-13 still run):

1. XML well-formedness (fast-xml-parser)
2. DITA structure (root, DOCTYPE, required children)
3. ID validation (duplicates, format, quote consistency)
4. Content model validation
5. DTD validation (TypesXML + OASIS catalog) OR RelaxNG (salve-annos)
6. DITA rules (43 Schematron-equivalent rules, version-gated)
7. Custom rules (user-defined regex patterns)
8. Cross-reference validation (href/conref/keyref targets exist)
9. Profiling validation (subject scheme controlled values)
10. Circular reference detection (DFS for href/mapref cycles)
11. Workspace validation (cross-file duplicate IDs, unused topics)
12. DITAVAL validation
13. Suppression application (comment-based rule suppression)

**Key Design Decisions:**
- Severity overrides: `ditacraft.validationSeverityOverrides` changes any diagnostic code's severity
- Comment suppression: `<!-- ditacraft-disable CODE -->` / `<!-- ditacraft-enable CODE -->` ranges suppress rules
- Large file optimization: Files > 500 KB skip phases 6-12
- Smart debouncing: Topics 300ms, Maps 1000ms, per-document cancellation

### Key Services

**ValidationPipeline** — Orchestrates 13 phases, applies severity overrides and comment suppression

**SuppressionEngine** — Parses inline suppression comments and filters diagnostics by range or file; extracted from the pipeline for testability

**KeySpaceService** — Parses DITA maps, builds key space (BFS traversal), handles @keyscope nesting, 5-min cache TTL

**SubjectSchemeService** — Parses subject scheme maps, extracts controlled value constraints, caches schemes

**CatalogValidationService** — TypesXML DTD validation with OASIS Catalog, parser pool (3 instances), DITA 1.0-2.0

**RngValidationService** — Optional RelaxNG validation (salve-annos + saxes), grammar caching (max 20 schemas)

### Directory Reference

```
src/                          # Client extension
  extension.ts                # Activation, command registration, lifecycle
  languageClient.ts           # LSP client initialization
  commands/                   # Command handlers
  providers/                  # VS Code API (validators, views, webviews)
  utils/                      # DITA-OT wrapper, key space, config, logger
  test/                       # 683 client tests

server/
  src/
    server.ts                 # LSP entry point, handler wiring
    serverHandlers.ts         # Handler registration and capabilities
    settings.ts               # Per-document config caching
    features/                 # LSP handlers (validation, completion, hover, etc.)
    services/                 # Domain services (ValidationPipeline, KeySpaceService, etc.)
    utils/                    # Shared utilities (xmlTokenizer, referenceParser, workspaceScanner)
    messages/                 # Localization (en.json, fr.json)
    data/                     # Static schema data (ditaSchema.ts, ditaSpecialization.ts)
  test/                       # 703 server tests (standalone Mocha)

dtds/                         # DITA 1.2, 1.3, 2.0 DTDs + OASIS catalogs
docs/                         # Architecture docs
```

---

## Common Workflows

### Adding a New LSP Feature

1. Create `server/src/features/myfeature.ts` with a handler function
2. Add types to `server/src/utils/types.ts` if needed
3. Wire handler in `server/src/serverHandlers.ts`: `connection.onMyFeature(handleMyFeature)`
4. Add tests in `server/test/myfeature.test.ts` using `createDoc()` helper
5. Run: `cd server && npm test -- --grep "myfeature"`

### Adding a New DITA Validation Rule

1. Define rule in `server/src/features/ditaRulesValidator.ts` (add to `DITA_RULES` array)
2. Add diagnostic code to `server/src/utils/diagnosticCodes.ts`
3. Add message to `server/src/messages/en.json` and `fr.json`
4. Add test in `server/test/ditaRulesValidator.test.ts`
5. Rule runs in Phase 6 of ValidationPipeline
6. Toggleable via `ditacraft.ditaRulesEnabled` and `ditacraft.ditaRulesCategories`

### Adding a New Client Command

1. Create handler in `src/commands/mycommand.ts`
2. Register in `src/extension.ts` under `registerCommands()`
3. Add entry to `package.json` under `contributes.commands`
4. Add tests in `src/test/suite/mycommand.test.ts`
5. Run: `npm test`

### Debugging the LSP Server

1. Set breakpoints in `server/src/features/*.ts`
2. Run extension in debug mode (F5 in VS Code)
3. Open Developer Tools (**Help → Toggle Developer Tools**)
4. Console tab shows LSP server logs (via `connection.console.log()`)
5. For file logging: set `ditacraft.enableFileLogging: true` and `ditacraft.logLevel: debug`

---

## Configuration & Settings

Core settings (in `package.json` `contributes.configuration`):

| Setting | Type | Default | Purpose |
|---------|------|---------|---------|
| `ditacraft.ditaOtPath` | string | "" | DITA-OT installation path |
| `ditacraft.validationEngine` | string | "typesxml" | built-in, typesxml, or xmllint |
| `ditacraft.ditaRulesEnabled` | boolean | true | Enable DITA rules validation |
| `ditacraft.ditaRulesCategories` | string[] | all | Categories: mandatory, recommendation, authoring, accessibility |
| `ditacraft.crossRefValidationEnabled` | boolean | true | Cross-file reference checks |
| `ditacraft.subjectSchemeValidationEnabled` | boolean | true | Subject scheme constraint checks |
| `ditacraft.validationSeverityOverrides` | object | {} | Per-rule severity (error/warning/info/hint/off) |
| `ditacraft.customRulesFile` | string | "" | Path to custom regex rules JSON file |
| `ditacraft.largeFileThresholdKB` | number | 500 | Skip heavy phases for files > threshold |
| `ditacraft.logLevel` | string | "info" | debug, info, warn, error |

Settings cached per-document in `server/src/settings.ts`, broadcast via `workspace/didChangeConfiguration`.

---

## Diagnostic Codes

Codes follow pattern `DITA-XXX-NNN` (e.g., `DITA-XML-001`, `DITA-SCH-023`). Central registry in `server/src/utils/diagnosticCodes.ts` (78+ codes):

- `DITA-XML-*` — XML well-formedness
- `DITA-STRUCT-*` — DITA structure validation
- `DITA-ID-*` — ID validation and uniqueness
- `DITA-SCOPE-*` — href scope consistency
- `DITA-SCH-*` — Schematron-equivalent DITA rules (1-59, including DITA 2.0)
- `DITA-XREF-*` — Cross-reference validation
- `DITA-CYCLE-*` — Circular reference detection
- `DITA-PROF-*` — Profiling/subject scheme validation
- `DITA-ORD-*` — Orphan/unused topic detection

Each code maps to a message in `server/src/messages/en.json` (and `fr.json` for French).

---

## Localization (i18n)

All diagnostic messages are translatable. Files:
- `server/src/messages/en.json` — English (80+ messages)
- `server/src/messages/fr.json` — French (80+ messages)

To add a message:
1. Add same key to both `en.json` and `fr.json`
2. Reference in handler: `i18n.get('DITA_MSG_KEY')`
3. Server auto-detects client locale and applies correct bundle

---

## Testing Best Practices

### Client Test Pattern
```typescript
suite('My Test Suite', () => {
    suiteSetup(async function() {
        this.timeout(30000);
        const api = extension.exports as DitaCraftAPI;
        serverReady = await api?.waitForLanguageClientReady(20000);
    });
    test('should do something', async () => {
        const diagnostics = await waitForErrors(uri, 3000);
        assert.ok(diagnostics.length > 0);
    });
});
```

### Server Test Pattern
```typescript
suite('My Feature', () => {
    test('should validate correctly', () => {
        const doc = createDoc('<dita>...</dita>', 'file:///test.dita');
        const diags = myValidator(doc);
        assert.strictEqual(diags[0].code, 'DITA-CODE-001');
    });
});
```

**Key Helpers:**
- `createDoc(content, uri)` — Mock TextDocument
- `waitForErrors(uri, timeout)` — Poll for diagnostic errors in client tests
- `defaultSettings()` — Standard DitaCraftSettings

---

## Key Files to Know

**Client Entry:** `src/extension.ts`, `src/languageClient.ts`
**Server Entry:** `server/src/server.ts`, `server/src/serverHandlers.ts`
**Core Validation:** `server/src/services/validationPipeline.ts`, `server/src/features/validation.ts`, `server/src/features/ditaRulesValidator.ts`
**Key Services:** `server/src/services/keySpaceService.ts`, `server/src/services/catalogValidationService.ts`, `server/src/services/subjectSchemeService.ts`, `server/src/services/suppressionEngine.ts`
**Service Interfaces:** `server/src/services/interfaces.ts` — contracts for `IKeySpaceService`, `ISubjectSchemeService`, `ICatalogValidationService`; use these for mocking in tests
**Config & Utils:** `src/utils/configurationManager.ts`, `server/src/utils/xmlTokenizer.ts`, `server/src/utils/diagnosticCodes.ts`

---

## Notes for Future Work

- **Large files:** > 500 KB skip phases 6-12 by design; threshold configurable
- **Key space:** 5-minute cache TTL; refresh with **DITA: Refresh Key Space** command
- **DITA versions:** Auto-detected from @DITAArchVersion or DOCTYPE; override with ditacraft.ditaVersion
- **Custom rules:** Load from JSON file (ditacraft.customRulesFile); support fileType filtering
- **Comment suppression:** Three directives — `<!-- ditacraft-disable CODE -->` / `<!-- ditacraft-enable CODE -->` for range-based suppression; `<!-- ditacraft-disable-file CODE -->` suppresses a rule for the entire file
- **Performance:** Smart debouncing (300ms topics, 1000ms maps) with per-document cancellation
- **Security:** XXE protection, path traversal validation, command injection prevention, quote-aware entity pre-checks
