# DitaCraft release history

Release notes of the earlier versions, as they appeared in the README. The [CHANGELOG](../CHANGELOG.md)
has the detailed list of changes; the [README](../README.md#recent-updates) shows the latest ones.

## Version 0.8.2
**Security Hardening, Key Space & Validation Race Fixes, Knowledge Graph**

**Added:**
- **Knowledge Graph (graphify)** — `npm run graph` generates a queryable codebase graph (`docs/graph/graph.json`, `GRAPH_REPORT.md`, `graph.svg`, interactive studio viewer, `flows.json`) via local tree-sitter AST extraction — no LLM/API keys. Auto-regenerates in `npm run watch` and on every push to `main`.

**Fixed — Security / path traversal:**
- Shared `isPathWithinWorkspace()` guard applied consistently across hover, completion, definition, cross-reference validation, circular-reference detection, document links, and the MCP context-graph handler
- Documents opened outside every workspace folder no longer misapply workspace-boundary checks to same-directory sibling references

**Fixed — Key space / cross-file references:**
- Diamond-shaped `@keyscope` map graphs no longer lose keys from re-visited submaps
- Windows case-mismatch in key-space path comparisons resolved (could silently miss key lookups/cache invalidation)
- Rename and Find All References now verify `conkeyref` matches resolve to the target file via the key space before rewriting/reporting, instead of matching on element-ID text alone
- Cross-file reference/rename `resolveKey` calls now run in parallel

**Fixed — Validation pipeline races and caching:**
- Timed-out/cancelled async validation phases no longer cache their empty fallback as a valid result (could mask broken links up to 5 minutes)
- Cancellation/budget-exceeded exits now still apply severity overrides, comment suppression, and the diagnostics cap
- Profiling validation now uses an immutable per-document subject-scheme snapshot instead of shared cross-document state
- AI Quick Fix now checks document version/closed state before applying an edit, preventing stale-edit application after a slow LLM call
- Settings cache no longer permanently poisoned by a single transient configuration-fetch failure
- Saving a `.dita` topic now correctly invalidates cross-reference diagnostics cached in other open documents

**Fixed — Editing / navigation:**
- Consolidated a recurring mismatched-closing-tag stack-desync bug (found across content model validation, symbols, folding, completion) into a shared `resyncStackToMatch()` helper
- DITA-SCH-011 quick fix no longer rewrites the wrong `<image>` element
- `body`/`conbody`/`section` content models now accept `parml`, `screen`, `syntaxdiagram`
- DITA-OT progress percentages no longer misapplied as cumulative increments

**Dependencies:** `@anthropic-ai/sdk` → 0.112.4, `vscode-languageclient` → 10.0.1, `fast-xml-parser` → 5.10.1, `typesxml` → 2.2.1, `c8` → 12.0.0, plus dev-dependency and `actions/setup-node` bumps

**1770+ Total Tests** — Client (710) + Server (977) + MCP (83)

## Version 0.8.1
**Preview Auto-Refresh Fix & Build Tooling**
- **Preview auto-refresh on save** (#96) — `ditacraft.previewAutoRefresh` now actually re-renders the preview when the previewed source file is saved (debounced 500ms, serialized refreshes, focus-preserving)
- **CommonJS test build fix** — resolved a `MODULE_TYPELESS_PACKAGE_JSON` failure in the test runner
- **vscode-languageclient 10 resolution fix** — corrected `moduleResolution` for the new `exports`-based package layout
- **Minimum VS Code version raised to 1.125.0** to match the bumped `@types/vscode`, restoring `vsce package`
- **Dependencies** — `vscode-languageclient` 9.0.1 → 10.0.0, `@vscode/test-electron` 2.5.2 → 3.0.0, `@types/node` 25.9.3 → 26.0.0, `actions/checkout` 6 → 7

## Version 0.8.0
**MCP Server, Standalone LSP Server & Standalone Bundles**

**MCP Server (`mcp/`):**
- **Standalone MCP server** — `dist/mcp-server.js` (3.2 MB, no `node_modules` needed); exposes DitaCraft's DITA intelligence to any MCP-aware AI agent (opencode, Claude Desktop, Cursor, Continue)
- **6 MCP tools** — `dita_validate`, `dita_context_snapshot`, `dita_key_space`, `dita_map_structure`, `dita_resolve_reference`, `dita_explain_key`
- **3 MCP resources** — `dita://workspace/maps`, `dita://workspace/diagnostics`, `dita://workspace/keys`
- **Workspace isolation** — Path traversal protection, HTTP/UNC/null-byte rejection; all communication stays local via stdio transport
- **Smoke test** — `npx tsx mcp/test/smoke-test.ts` validates all tools and resources end-to-end

**Standalone LSP Server (`dist/lsp-server.js`):**
- Self-contained bundle (2.0 MB); no `node_modules` needed at runtime
- Launch via `node dist/lsp-server.js --stdio`; embed via `child_process.spawn` in any Node.js LSP client
- Set `DITACRAFT_EXTENSION_ROOT` to point to the directory containing `dtds/`

**Build Commands:**
- `npm run build-standalone` — produces both `dist/mcp-server.js` and `dist/lsp-server.js`
- `npm run package` — produces the VS Code extension `.vsix` file

**Testing:**
- MCP server tests: `cd mcp && npx tsc -p test/tsconfig.json && npx mocha out/test/mcp/test/*.test.js --ui tdd --timeout 30000`
- LSP standalone smoke test: `npx tsx mcp/test/lsp-smoke-test.ts`

**1564+ Total Tests** — Client (683) + Server (881)

---

## Version 0.7.4
**AI Integration — GitHub Copilot, Anthropic, OpenAI & Ollama**

**AI Infrastructure:**
- **LLMRouterService** — Provider cascade with automatic fallback: Copilot (`vscode.lm`) → Anthropic → OpenAI → Ollama; `auto`, `copilot-only`, `byok-only`, `local-only` modes
- **CircuitBreaker** — Per-provider resilience: 3 failures in 5 min opens the breaker (10 min cooldown); AbortError (cancellations) never counted as failures
- **MetricsCollector** — Rolling buffer (1000 entries) tracking request count, latency, and error rate per provider
- **SecretManager** — API keys stored via `vscode.SecretStorage` (OS keychain); no plaintext settings

**AI Features:**
- **@ditacraft Chat Participant** — 4 slash commands: `/restructure`, `/validate`, `/explain`, `/suggest-reuse`
- **F2: AI Map Restructure** — AI proposes restructured map hierarchy; diff view with user confirmation before writing
- **F3: AI Quick Fix** — Code Actions "Fix with AI" for 12 diagnostic codes (CM-001/002/003, XREF-001/003/004, STRUCT-003/004/005/008, DTD-001, XML-001)
- **F4: AI Completion** — AI-enriched IntelliSense for element content and attribute values
- **Configure AI WebView** — Guided setup for provider selection, API keys, feature toggles, and live metrics

**LSP Additions:**
- `dita/getContextGraph`, `dita/validateFragment`, `dita/buildContextSnapshot` (Levels 1/2/3 sliding window)

**1537+ Total Tests** — Client (642) + Server (895)

## Version 0.7.3
**Key Space Algorithm Completion, Validation Pipeline Hardening, TypeScript 6.0 & TypesXML 2.0**

**Key Space (7-gap improvement plan complete):**
- **Keyref Chains** — Multi-hop keyref resolution across scopes; chain scope prefix bug fixed so chains inside scoped peer maps resolve correctly
- **Keyscope Inheritance & Inline Branches** — PushDown scope inheritance and `@keyscope` on non-map topicrefs treated as anonymous scope branches per DITA 1.3 spec; three additional cascade/fallback/peer-map spec improvements
- **Provenance Tracking** — `sourceLine` (1-based) added to `KeyDefinition`; qualified scope aliases inherit source line from their origin definition
- **Scope Explosion Cap** — `MAX_KEY_SPACE_ENTRIES` (50,000) gates all 6 qualified-alias insertion sites; `scopeExplosionWarning` flag set on `KeySpace` when cap is hit
- **Resolution Reporting** — `explainKey()` returns `KeyResolutionReport` with full lookup trace and keyref chain steps; `reportKeySpace()` / `formatResolutionReport()` provide human-readable key-space summaries
- **Bug Fixes (4)** — XMLParser is now a class-level singleton (was re-instantiated per call), topicmeta array guard for duplicate `<topicmeta>` elements, `?xml` PI pseudo-node skipping in `collectXmlElements`

**Validation Pipeline:**
- **Pipeline Budget** — Configurable `pipelineBudgetMs` (default 30 s) with early-exit before each major phase; prevents runaway validation on large or complex files
- **ReDoS Protection** — Custom regex rules screened for nested-quantifier patterns; 10,000-match iteration cap and 2 s timeout enforced per rule
- **LSP 3.17 Conformance** — `executeCommandProvider`, `serverInfo` (name + version from package.json), and `interFileDependencies: true` advertised in `InitializeResult`
- **Range Formatting Fix** — Falls back to full-document replacement when structural reflow detected, preventing silent content loss
- **DITA-OT Error Parsing** — Severity-first log format (`[ERROR] [DOTJ013E]`) now recognized alongside legacy `[DOTJ013E][ERROR]` format

**Dependencies & Tooling:**
- **TypesXML 2.0.0** — Upgraded from 1.19.0
- **TypeScript 6.0** — Upgraded from 5.9.3; `moduleResolution: node` with `ignoreDeprecations: "6.0"`, explicit `typeRoots` in all tsconfig files

**Earlier 0.7.3 changes:**
- **cSpell Simplification** — Replaced 350-term DITA word list with two `ignoreRegExpList` patterns; `DITA: Setup cSpell Configuration` command deprecated
- **LSP Async File I/O** — All sync `fs` calls in `hover.ts` converted to `fs/promises`; `[object Promise]` in hover output fixed
- **Security: DOCTYPE `]>` Bypass Fix** — Quote-aware regex prevents `]>` inside quoted entity values from terminating internal-subset scan early (billion-laughs / XXE bypass)
- **Security: `ENTITY_ANY_RE` Hardening** — Quote-aware alternation prevents early `>` termination inside `SYSTEM` identifiers
- **1537+ Total Tests** — Client (683) + Server (881); key space service tests expanded from 7 to 100+

## Version 0.7.2
**Advanced Validation Controls, Custom Rules, Architecture Improvements**
- **Per-Rule Severity Override** — New `ditacraft.validationSeverityOverrides` setting lets you change any diagnostic code's severity (error, warning, information, hint) or suppress it entirely with `"off"`
- **Comment-Based Rule Suppression** — Inline `<!-- ditacraft-disable CODE -->` / `<!-- ditacraft-enable CODE -->` directives for range-based suppression; `<!-- ditacraft-disable-file CODE -->` for whole-file suppression
- **Custom Regex Rules** — Define custom validation rules in a JSON file (`ditacraft.customRulesFile`); supports regex patterns, fileType filtering, severity mapping, and mtime-based caching
- **Large File Optimization** — Files exceeding `ditacraft.largeFileThresholdKB` (default 500 KB) skip heavy validation phases (6–12) for performance; shows DITA-PERF-001 informational diagnostic
- **3 New Quick Fixes** — Sanitize invalid ID format (DITA-ID-002), insert missing `<booktitle>` (DITA-STRUCT-006), insert missing `<mainbooktitle>` (DITA-STRUCT-007); total now 12 quick fixes
- **43 DITA Rules** — Rule count corrected from 35 to 43 (29 SCH + 4 ATTR + 4 TABLE + 6 additional authoring rules)
- **DITA 2.0 Test Coverage** — 25 new tests covering all 10 DITA 2.0 rules (SCH-050 through SCH-059) including self-closing audio/video elements
- **Architecture Improvements** — Extracted `SuppressionEngine` from ValidationPipeline; centralized `diagnosticCodes.ts` registry (78 codes); service interfaces (`IKeySpaceService`, `ISubjectSchemeService`, `ICatalogValidationService`); shared `types.ts` eliminates circular dependency; deduplicated `offsetToPosition` into single canonical implementation; SubjectSchemeService cache bug fix; robust `deactivate()` error handling
- **Bug Fixes** — CRLF handling in comment suppression, exclusive endLine for suppression ranges, threshold boundary comparison, self-closing audio/video regex for SCH-054/055, SubjectSchemeService stale cache on scheme change
- **1375+ Total Tests** — Client (678) + Server (697)

## Version 0.7.1
**ValidationPipeline, Guide Validation & Bug Fixes**
- **Validate Entire Guide** — New `DITA: Validate Entire Guide Using DITA-OT` command runs DITA-OT against root map; results displayed in WebView report with filtering (severity), search, grouping (by file/severity/module), and JSON export; enriched with 160+ DITA-OT error code descriptions
- **ValidationPipeline Extraction** — Refactored validation handler into 10-phase orchestrator with per-phase error isolation
- **Shared Utilities** — Extracted textUtils.ts and patterns.ts, eliminating 15 duplicate function definitions
- **Bug Fixes** — Profiling validation positioning, code action single-quote IDs, completion startPos clamping, XML tokenizer CRLF, openFile error handling, parser regex for PDF/INDX/XEP codes
- **1242+ Total Tests** — Client (683) + Server (559)

## Version 0.7.0
**Multi-Version DTD, Workspace Analysis, Glossref & Validation Fixes**
- **Multi-Version DTD Support** — Bundled DITA 1.2, 1.3, and 2.0 DTDs with OASIS XML Catalog chaining; `ditacraft.xmlCatalogPath` setting for custom specializations
- **Scope Validation** — Validates `scope="local|peer|external"` consistency with href format (DITA-SCOPE-001/002/003)
- **Circular Reference Detection** — DFS traversal detects structural map reference cycles; only follows topicref/mapref/chapter/etc. (not keydef/xref/link), excludes `.xml` files
- **Workspace Validation** — `DITA: Validate Workspace` command with progress, cross-file duplicate ID detection, and unused topic detection
- **Glossref Element** — Full support across schema, autocompletion, explorer, map visualizer, content model, and hierarchy parser
- **Glossentry/Troubleshooting Support** — Recognized as valid topic root elements; glossentry validates `<glossterm>` as first child (not `<title>`)
- **Bookmap in .ditamap** — Bookmaps using `.ditamap` extension no longer produce false root element errors
- **SCH-023 Fix** — Section title rule now uses depth-tracking to count only direct-child titles (ignores titles in nested `<fig>`, `<div>`, etc.)
- **SCH-040 Fix** — Self-closing `<xref/>` no longer triggers false nested-xref error
- **Bug Fixes** — Bookmap title boundary checks, conditional mainbooktitle warning, single-quote ID handling, error ranges, completion position clamping, XML tokenizer CRLF, openFile command
- **652 Client Tests + 435 Server Tests** — 1087+ total

## Version 0.6.1
**Localization, DITA 2.0 Rules, Root Map & Validation Enhancements**
- **Localization (i18n)** — All 67 diagnostic messages translatable; English + French bundles included; auto-detects LSP locale
- **DITA 2.0 Rules** — 10 new version-specific rules (SCH-050 to SCH-059): removed elements (`<boolean>`, `<indextermref>`, `<object>`, learning specializations), removed attributes (`@print`, `@copy-to`, `@navtitle`, `@query`), `<audio>`/`<video>` fallback accessibility checks
- **43 Total DITA Rules** — Expanded from 18 to 43 Schematron-equivalent rules across 5 categories (mandatory, recommendation, authoring, accessibility, DITA 2.0 removal); version-gated per DITA version
- **Root Map Feature** — Set/clear explicit root map via command palette or clickable status bar item; workspace-level `rootMap` setting; auto-discover mode by default
- **DITA Specialization** — `@class` attribute matching for specialization-aware element handling; pre-built matchers for 20+ element types
- **Catalog Validation Service** — DTD validation with OASIS XML Catalog resolution and parser pool (3 concurrent instances)
- **RNG Validation Service** — Optional RelaxNG schema validation via salve-annos + saxes; grammar compilation with caching (max 20 schemas)
- **Subject Scheme Enhancements** — Hierarchy path display in completions, grouping by parent subject, default value preselection
- **Conref Content Preview** — Hover on `conref`/`conkeyref` shows inline preview of referenced content
- **Smart Debouncing** — Tiered validation delays (300ms topics, 1000ms maps) with per-document cancellation
- **Key Scope Support** — `@keyscope` attribute handling with scope-qualified key resolution
- **New Logo** — Updated extension icon
- **Bug Fixes** — Code action single-quote ID handling, DITA Explorer error handling, completion position clamping, XML tokenizer CRLF, `openFile` declaration

## Version 0.6.0
**Project Management, Activity Bar Views & Advanced LSP**
- **Activity Bar Views** — DITA Explorer, Key Space, and Diagnostics views in dedicated sidebar
- **File Decorations** — Error/warning badges on tree items from validation diagnostics
- **Cross-Reference Validation** — Validates href, conref, keyref, and conkeyref targets across files (6 diagnostic codes)
- **DITA Rules Engine** — Schematron-equivalent rules in 4 categories (mandatory, recommendation, authoring, accessibility)
- **Profiling Validation** — Subject scheme controlled value validation with automatic scheme discovery
- **Subject Scheme Service** — Parses subject scheme maps for controlled vocabularies with caching
- **Error-Tolerant XML Tokenizer** — State-machine tokenizer with error recovery for malformed XML
- **DITA Version Detection** — Auto-detects DITA version from `@DITAArchVersion` or DOCTYPE
- **4 New Code Actions** — Add missing `otherrole`, remove deprecated `<indextermref>`, convert `alt` attribute to element, add missing `<alt>` to `<image>`
- **5 New Settings** — `maxNumberOfProblems`, `ditaRulesEnabled`, `ditaRulesCategories`, `crossRefValidationEnabled`, `subjectSchemeValidationEnabled`
- **LSP Architecture Documentation** — Comprehensive `DITA_LSP_ARCHITECTURE.md` describing server internals
- **1040+ Total Tests** — Client (620) + Server (419)

## Version 0.5.0
**DITA Language Server with IntelliSense**
- ✅ **Full LSP Implementation** - 14 language features in a dedicated server process
- ✅ **IntelliSense** - Context-aware completion for elements, attributes, and values (364 DITA elements)
- ✅ **DITAVAL Support** - Full IntelliSense, validation, and hover docs for `.ditaval` files
- ✅ **Hover Documentation** - Element docs from DITA schema with children fallback
- ✅ **Document & Workspace Symbols** - Outline view and cross-file symbol search (Ctrl+T)
- ✅ **Go to Definition** - Navigate href/conref/keyref targets with full key space resolution
- ✅ **Find References & Rename** - Cross-file ID references and rename with updates
- ✅ **Formatting** - XML formatter with inline/block/preformatted element handling
- ✅ **Code Actions** - 5 quick fixes (DOCTYPE, ID, title, empty element, duplicate ID)
- ✅ **Linked Editing** - Simultaneous open/close tag name editing
- ✅ **Folding & Document Links** - Collapsible ranges and clickable references
- ✅ **Key Space Resolution Fix** - Improved root map discovery across nested directories
- ✅ **cSpell Auto-Prompt** - Suggests cSpell setup when extension detected without config
- ✅ **Server Test Suite** - 190 standalone Mocha tests (no VS Code dependency)
- ✅ **737+ Total Tests** - Client (547) + Server (190) with CI integration

## Version 0.4.2
**Architecture, Security & Documentation**
- ✅ **Modular Validation Engine** - Refactored validation with pluggable engine architecture
- ✅ **Rate Limiting** - DoS protection for validation operations (10 req/sec per file)
- ✅ **Adaptive Cache Cleanup** - Intelligent cache management that skips cleanup when empty
- ✅ **Architecture Documentation** - Comprehensive ARCHITECTURE.md with data flow diagrams
- ✅ **DITA User Guide** - Complete user documentation in DITA format (55 files with bookmap, glossary, index)
- ✅ **Preview Scroll Sync Fix** - Fixed scroll sync for content smaller than viewport
- ✅ **Preview Print Mode Fix** - Fixed toolbar injection for non-standard HTML structures
- ✅ **547+ Tests** - Expanded test suite with security and edge case coverage

## Version 0.4.1
**TypesXML DTD Validation**
- ✅ **TypesXML DTD Validation** - Pure TypeScript validation with 100% W3C conformance (no native dependencies)
- ✅ **OASIS XML Catalog Support** - Full DITA public identifier resolution via TypesXML
- ✅ **Three Validation Engines** - TypesXML (default), built-in, xmllint

## Version 0.4.0
**Enhanced Preview, Build Output & Map Visualizer**
- ✅ **DITA Map Visualizer** - Interactive tree view showing map hierarchies with navigation
- ✅ **Bidirectional Scroll Sync** - Editor and preview scroll positions stay synchronized
- ✅ **Print Preview Mode** - Print-optimized view with dedicated print button
- ✅ **Syntax-Highlighted Build Output** - DITA-OT output with automatic colorization by log level
- ✅ **Log Level Detection** - Errors, warnings, info, debug messages auto-classified
- ✅ **Build Timestamps** - Build start and completion times displayed
- ✅ **Circular Reference Detection** - Map visualizer detects and warns about circular map references
- ✅ **490+ Tests** - Comprehensive test suite with new feature coverage

## Version 0.3.0
**Developer Experience & Quality Milestone**
- ✅ **Code Coverage with c8** - Switched from nyc to c8 for VS Code extension-compatible coverage
- ✅ **Coverage Threshold Enforcement** - CI enforces minimum coverage (62% lines, 65% functions, 73% branches)
- ✅ **CI Security Audit** - Dedicated security audit job with weekly scheduled scans
- ✅ **Cross-Platform CI** - Tests run on Windows, macOS, and Linux
- ✅ **Dynamic Configuration** - Centralized ConfigurationManager with real-time change propagation
- ✅ **Advanced Element Navigation** - Same-file and cross-file element navigation with fragment support
- ✅ **Configurable Settings** - Validation debounce, key space TTL, DITA-OT timeout, max link matches
- ✅ **Code Quality** - Removed unused dependencies, consolidated file reading, standardized async patterns

## Version 0.2.4
- ✅ **Fixed DITA-OT HTML5 Publishing** - Resolved Windows path case sensitivity issue
- ✅ **Comprehensive Test Suite** - 307+ tests including error handling tests
- ✅ **Improved Error Handling** - Added `fireAndForget` utility for safe async handling

## Version 0.2.0
- ✅ **Full Key Space Resolution** - Navigate `@keyref`, `@conkeyref`, and key-based references with automatic key space building
- ✅ **Enhanced Security** - XXE neutralization, path traversal protection, and command injection prevention
- ✅ **Performance Optimizations** - Async file operations, intelligent caching (1-min TTL), and file watcher debouncing
- ✅ **Content Reference Navigation** - Ctrl+Click on `@conref` attributes to navigate to referenced content
- ✅ **Better UI Responsiveness** - Async operations prevent UI blocking during file operations

## Version 0.1.3 Fixes
- ✅ **Fixed preview and publishing with paths containing spaces** - File paths with spaces now work correctly
- ✅ **Fixed DITA validation** - Title element is now correctly validated as required per DTD spec
- ✅ **Enhanced DTD validation** - Added proper DTD validation support with xmllint
- ✅ **Improved error messages** - Better, more descriptive validation and publishing error messages
- ✅ **Fixed file path validation** - Comprehensive checks to ensure files are being processed
- ✅ **Added verbose logging** - Detailed console logging for easier debugging
