# DitaCraft Roadmap

This document outlines the planned features, improvements, and future direction for DitaCraft. It's designed to help users and contributors understand where the project is heading and find opportunities to contribute.

## Current Status (v0.7.2)

DitaCraft is a production-ready VS Code extension for DITA editing and publishing with the following complete features:

| Feature | Status | Completeness |
|---------|--------|--------------|
| Syntax Highlighting | Complete | 100% |
| Smart Navigation (Ctrl+Click) | Complete | 100% |
| **TypesXML DTD Validation** | Complete | 100% |
| **Modular Validation Engines** | Complete | 100% |
| DTD Validation (DITA 1.3) | Complete | 100% |
| OASIS XML Catalog Support | Complete | 100% |
| Key Space Resolution | Complete | 95% |
| Real-time Validation | Complete | 100% |
| **Rate Limiting (DoS Protection)** | Complete | 100% |
| DITA-OT Publishing | Complete | 100% |
| Live HTML5 Preview | Complete | 100% |
| Preview Theme Support | Complete | 100% |
| Preview Custom CSS | Complete | 100% |
| Preview Scroll Sync | Complete | 100% |
| Preview Print Mode | Complete | 100% |
| DITA-OT Output Highlighting | Complete | 100% |
| DITA-OT Error Diagnostics | Complete | 100% |
| DITA Map Visualizer | Complete | 100% |
| Code Snippets (21) | Complete | 100% |
| Security (XXE, Path Traversal) | Complete | 100% |
| cSpell Integration | Complete | 100% |
| Dynamic Configuration | Complete | 100% |
| CI Security Audit | Complete | 100% |
| Error Handling Utilities | Complete | 100% |
| Code Coverage (c8) | Complete | 100% |
| Architecture Documentation | Complete | 100% |
| DITA User Guide | Complete | 100% |
| **LSP: Diagnostics** | Complete | 100% |
| **LSP: IntelliSense (Completion)** | Complete | 100% |
| **LSP: Hover Documentation** | Complete | 100% |
| **LSP: Document Symbols** | Complete | 100% |
| **LSP: Workspace Symbols** | Complete | 100% |
| **LSP: Go to Definition** | Complete | 100% |
| **LSP: Find References** | Complete | 100% |
| **LSP: Rename** | Complete | 100% |
| **LSP: Formatting** | Complete | 100% |
| **LSP: Code Actions** | Complete | 100% |
| **LSP: Linked Editing** | Complete | 100% |
| **LSP: Folding Ranges** | Complete | 100% |
| **LSP: Document Links** | Complete | 100% |
| **LSP: Key Space Resolution** | Complete | 100% |
| **DITAVAL Support** | Complete | 100% |
| **cSpell Auto-Prompt** | Complete | 100% |
| **LSP: Cross-Reference Validation** | Complete | 100% |
| **LSP: DITA Rules Engine (35 rules + custom)** | Complete | 100% |
| **LSP: Profiling/Subject Scheme Validation** | Complete | 100% |
| **LSP: Subject Scheme Service** | Complete | 100% |
| **LSP: Error-Tolerant XML Tokenizer** | Complete | 100% |
| **LSP: DITA Version Detection** | Complete | 100% |
| **LSP: 12 Code Actions** | Complete | 100% |
| **12 LSP Settings** | Complete | 100% |
| **Glossref Element Support** | Complete | 100% |
| **Glossentry/Troubleshooting Validation** | Complete | 100% |
| **Server Test Suite (697 tests)** | Complete | 100% |
| **LSP Architecture Documentation** | Complete | 100% |
| **Activity Bar: DITA Explorer** | Complete | 100% |
| **Activity Bar: Key Space View** | Complete | 100% |
| **Activity Bar: Diagnostics View** | Complete | 100% |
| **File Decoration Provider** | Complete | 100% |
| **Shared Map Parser** | Complete | 100% |
| **Key Usage Scanner** | Complete | 100% |
| **LSP: Localization (i18n)** | Complete | 100% |
| **LSP: DITA 2.0 Rules (10 rules)** | Complete | 100% |
| **LSP: Conref/Key Preview on Hover** | Complete | 100% |
| **LSP: RNG Validation Service** | Complete | 100% |
| **LSP: Catalog Validation Service** | Complete | 100% |
| **Root Map Management** | Complete | 100% |
| **Key Scope Support** | Complete | 100% |
| **Subject Scheme Hierarchy Grouping** | Complete | 100% |
| **Smart Debouncing** | Complete | 100% |
| **DITA Specialization Support** | Complete | 100% |
| **New Extension Logo** | Complete | 100% |
| **Validation Deduplication** | Complete | 100% |
| **Diagnostics View Dedup** | Complete | 100% |
| **cSpell Auto-Prompt Setting** | Complete | 100% |
| **Stale Diagnostics Cleanup** | Complete | 100% |
| **LSP: Bookmap Validation** | Complete | 100% |
| **LSP: Topicref Validation** | Complete | 100% |
| **LSP: Single-Quote ID Support** | Complete | 100% |
| **Improved Error Ranges** | Complete | 100% |
| **Multi-Version DTD Support (1.2/1.3/2.0)** | Complete | 100% |
| **External XML Catalog Support** | Complete | 100% |
| **Scope Validation (DITA-SCOPE-001/002/003)** | Complete | 100% |
| **Circular Reference Detection (DITA-CYCLE-001)** | Complete | 100% |
| **Workspace Validation Command** | Complete | 100% |
| **Cross-File Duplicate ID Detection (DITA-ID-003)** | Complete | 100% |
| **Unused Topic Detection (DITA-ORPHAN-001)** | Complete | 100% |
| **ValidationPipeline (12-phase orchestrator)** | Complete | 100% |
| **Shared Utilities (textUtils, patterns)** | Complete | 100% |
| **DITA-OT Guide Validation** | Complete | 100% |
| **DITA-OT Error Code Catalog (160+ codes)** | Complete | 100% |
| **Validation Report WebView** | Complete | 100% |
| **Per-Rule Severity Overrides** | Complete | 100% |
| **Comment-Based Rule Suppression** | Complete | 100% |
| **Custom Regex Rules Validator** | Complete | 100% |
| **Large File Optimization** | Complete | 100% |
| **3 Additional Quick Fixes (12 total)** | Complete | 100% |
| **DITA 2.0 Test Coverage (25 tests)** | Complete | 100% |

### Recent Changes (v0.7.2)
- **Per-Rule Severity Override** — `ditacraft.validationSeverityOverrides` setting: map any diagnostic code to error/warning/information/hint/off; applied as post-processing in the validation pipeline
- **Comment-Based Rule Suppression** — `<!-- ditacraft-disable CODE -->` / `<!-- ditacraft-enable CODE -->` for range-based suppression; `<!-- ditacraft-disable-file CODE -->` for whole-file suppression; CRLF-aware line counting with exclusive endLine semantics
- **Custom Regex Rules** — `ditacraft.customRulesFile` points to a JSON file defining regex patterns with fileType filtering (topic, concept, task, reference, glossentry, troubleshooting, map, bookmap), severity mapping, and mtime-based cache invalidation
- **Large File Optimization** — `ditacraft.largeFileThresholdKB` (default 500): files exceeding threshold skip phases 6–12 for performance; shows DITA-PERF-001 informational diagnostic
- **3 New Quick Fixes** — Sanitize invalid ID (DITA-ID-002), insert missing `<booktitle>` (DITA-STRUCT-006), insert missing `<mainbooktitle>` (DITA-STRUCT-007); total now 12 code actions
- **DITA 2.0 Test Coverage** — 25 new tests for all 10 DITA 2.0 rules (SCH-050 through SCH-059) including self-closing audio/video element handling
- **Bug Fixes** — CRLF handling in suppression comment parsing, exclusive endLine for suppression ranges, large file threshold boundary (`>=`), self-closing audio/video regex (SCH-054/055)
- **Test Coverage Boost** — 559→697 server tests (+138), new test files (customRulesValidator, expanded ditaRulesValidator/validationPipeline/codeActions)
- **1380+ Total Tests** — Client (683) + Server (697)

### Previous Changes (v0.7.1)
- **Validate Entire Guide** — New `DITA: Validate Entire Guide Using DITA-OT` command runs DITA-OT against root map; WebView report with severity filtering, search, grouping (by file/severity/module), JSON export, and DITA-OT build output link
- **DITA-OT Error Code Catalog** — 160+ error codes with human-readable descriptions and module categorization (Core, Processing, Transform, Indexing, PDF, XEP); enriches validation report with tooltips and module badges
- **Error Parser Enhancement** — Parser now captures PDFJ, PDFX, INDX, and XEPJ error code prefixes in addition to DOT* codes
- **ValidationPipeline Extraction** — Refactored 111-line monolithic validation handler into a 10-phase orchestrator class with per-phase error isolation (try/catch + logging)
- **Shared Utilities** — Extracted `textUtils.ts` (stripCommentsAndCDATA, stripCommentsAndCodeContent, offsetToRange, escapeRegex) and `patterns.ts` (TAG_ATTRS), eliminating 15 duplicate function definitions
- **Two-Variant Comment Stripping** — Basic `stripCommentsAndCDATA` vs `stripCommentsAndCodeContent` (also blanks codeblock/pre/screen/msgblock content)
- **Bug Fixes** — Profiling validation lastIndexOf positioning, code action single-quote ID handling, completion startPos negative clamping, XML tokenizer CRLF handling, openFile error handling
- **Test Coverage Boost** — 461→559 server tests (+98), 6 new test files (textUtils, validationPipeline, workspaceValidation, i18n, definition, workspaceScanner), 85% statement coverage
- **Specification Updates** — ARCHITECTURE.md, DITA_LSP_ARCHITECTURE.md, VALIDATION-SPECIFICATION.md all updated for 10-phase pipeline
- **Dependency Update** — fast-xml-parser ^5.3.4 → ^5.4.2
- **1242+ Total Tests** — Client (683) + Server (559)

### Previous Changes (v0.7.0)
- **Multi-Version DTD Support** — Bundled DITA 1.2, 1.3, and 2.0 DTDs with master OASIS XML Catalog chaining via `<nextCatalog>`
- **External XML Catalog** — New `ditacraft.xmlCatalogPath` setting for custom DTD specializations; hot-reloads on config change
- **Scope Validation** — Validates `scope="local|peer|external"` consistency with href format (DITA-SCOPE-001/002/003)
- **Circular Reference Detection** — DFS traversal detects structural map reference cycles (DITA-CYCLE-001); only follows topicref/mapref/chapter/etc., excludes keydef/xref/link hrefs and `.xml` files
- **Workspace Validation** — `DITA: Validate Workspace` command with progress notification
- **Cross-File Duplicate ID** — Workspace-wide root ID uniqueness detection (DITA-ID-003)
- **Unused Topic Detection** — Finds .dita files not referenced by any map (DITA-ORPHAN-001)
- **Glossref Element** — Full support across schema, autocompletion, explorer, map visualizer, content model, and hierarchy parser
- **Glossentry/Troubleshooting Topics** — Recognized as valid root elements with proper structure validation
- **Bug Fixes** — Bookmap in .ditamap false positive, SCH-023 section title false positive (depth-tracking), SCH-040 self-closing xref false positive, glossentry title validation, bookmap title boundary checks, circular ref false positives, and more
- **1087+ Total Tests** — Client (652) + Server (435)

### Previous Changes (v0.6.2)
- **Bookmap Validation** — LSP warns on missing `<booktitle>` and `<mainbooktitle>` elements (DITA-STRUCT-006, DITA-STRUCT-007)
- **Topicref Validation** — LSP flags `<topicref>` without target attributes (`href`, `keyref`, `keys`, `conref`, `conkeyref`); self-closing containers skipped (DITA-STRUCT-008)
- **Single-Quote ID Support** — `validateIDs` now handles `id='value'` via backreference regex `\bid=(["'])([^"']*)\1`
- **Improved Error Ranges** — Diagnostic underlines span full line (`col + 1000`, clamped by VS Code) or exact match bounds via `offsetToRange()`, replacing barely-visible 1-char squiggles
- **Validation Deduplication** — Disabled client-side on-save auto-validation; LSP server is now the sole real-time diagnostics provider, eliminating duplicate `dita` vs `dita-lsp` entries
- **Diagnostics View Dedup** — Identical diagnostics from multiple sources (e.g., `dita` and `dita-lsp`) are filtered by file/line/severity/message key
- **Stale Diagnostics Cleanup** — Client-side `dita` diagnostics from manual validation are cleared on save so they don't persist alongside fresh LSP `dita-lsp` diagnostics
- **cSpell Auto-Prompt** — Disabled by default via new `ditacraft.cspellAutoPrompt` setting; `DITA: Setup cSpell Configuration` command remains available
- **Bug Fixes** — Code action single-quote ID handling, DITA Explorer error handling, completion position clamping, XML tokenizer CRLF, `openFile` command declaration
- **Test Suite Rewrite** — Real-time validation tests updated for LSP-driven architecture; 11 new server tests for bookmap/topicref validation
- **1082 Total Tests** — Client (652) + Server (430)

### Previous Changes (v0.6.1)
- **Localization (i18n)** — All 67 diagnostic messages localized in English and French, auto-detected from VS Code display language
- **DITA 2.0 Rules** — 10 new rules (SCH-050 to SCH-059) for removed elements (`<boolean>`, `<indextermref>`, `<object>`, learning specializations) and removed attributes (`@print`, `@copy-to`, `@navtitle`, `@query`), plus `<audio>`/`<video>` accessibility rules
- **DITA Rules Engine Expansion** — Total rules increased from 18 to 35, adding nested `<xref>` detection, deprecated role values, `<abstract>` structure, `<pre>` forbidden elements, `@id` recommendations, single-paragraph body detection
- **Root Map Management** — Explicit root map selection via `DITA: Set Root Map` / `DITA: Clear Root Map` commands with status bar indicator and workspace persistence
- **RNG Validation Service** — Optional RelaxNG schema validation using `salve-annos` + `saxes` with grammar caching (up to 20 schemas) and parser pool
- **Catalog Validation Service** — DTD validation via TypesXML with OASIS XML Catalog resolution and parser pool (3 instances) for efficient reuse
- **Conref/Key Preview on Hover** — Hover over `keyref`/`conkeyref` to see resolved content inline (target file, navtitle, shortdesc, XML preview)
- **Subject Scheme Enhancements** — Hierarchy grouping in completions (e.g., `Platform > Linux > Ubuntu`), default value preselection, lazy merged scheme data
- **Key Scope Support** — Full `@keyscope` attribute handling with scope-qualified key references
- **Smart Debouncing** — Per-document cancellation with type-aware delays (300ms topics, 1000ms maps)
- **DITA Specialization** — `@class` attribute matching for accurate element identification across DITA specializations
- **3 New Settings** — `ditacraft.ditaVersion`, `ditacraft.schemaFormat`, `ditacraft.rngSchemaPath`
- **2 New Commands** — `DITA: Set Root Map`, `DITA: Clear Root Map (Auto-Discover)`
- **New Extension Logo** — Updated branding with phoenix-rising-from-book icon
- **User Guide Update** — 17 files updated + 8 new DITA topics (localization, root map, 6 glossary entries)
- **Bug Fixes** — Code action single-quote ID handling, DITA Explorer error handling, completion position clamping, XML tokenizer CRLF support, `openFile` command declaration
- **1040+ Total Tests** — Client (620) + Server (419)

### Previous Changes (v0.6.0)
- **Activity Bar Views** — Dedicated DitaCraft sidebar with DITA Explorer, Key Space, and Diagnostics views
- **DITA Explorer** — Tree showing all workspace maps with hierarchy, type icons, context menus, auto-refresh
- **Key Space View** — Defined/undefined/unused keys with usage navigation, debounced refresh
- **Diagnostics View** — Aggregated issues with group-by-file/severity, auto-refresh on diagnostics changes
- **File Decorations** — Error/warning badges on tree items from validation diagnostics
- **Shared Utilities** — Extracted `mapHierarchyParser.ts`, created `keyUsageScanner.ts`, shared `isDitaFilePath()`
- **Cross-Reference Validation** — Validates href, conref, keyref, conkeyref targets across files (6 diagnostic codes: DITA-XREF-001..003, DITA-KEY-001..003)
- **DITA Rules Engine** — 22 Schematron-equivalent rules in 4 categories (mandatory, recommendation, authoring, accessibility), filtered by DITA version
- **Profiling Validation** — Subject scheme controlled value validation (DITA-PROF-001)
- **Subject Scheme Service** — Parses subject scheme maps for controlled vocabularies with per-file caching and TTL
- **Error-Tolerant XML Tokenizer** — State-machine tokenizer (8 states, 22 token types) with error recovery for malformed XML
- **DITA Version Detection** — Auto-detects DITA version from `@DITAArchVersion` attribute or DOCTYPE declaration
- **4 New Code Actions** — Add `otherrole`, remove deprecated `<indextermref>`, convert `alt` attribute to `<alt>` element, add missing `<alt>` to `<image>`
- **5 New Settings** — `maxNumberOfProblems`, `ditaRulesEnabled`, `ditaRulesCategories`, `crossRefValidationEnabled`, `subjectSchemeValidationEnabled`
- **LSP Architecture Documentation** — Comprehensive `DITA_LSP_ARCHITECTURE.md` describing server internals, patterns, and dependency graph
- **1010+ Total Tests** — Client (620) + Server (398)

### Previous Changes (v0.5.0)
- **DITA Language Server** - Full LSP implementation with 14 language features in a dedicated process
- **IntelliSense** - Context-aware element, attribute, and value completions (364 DITA elements)
- **DITAVAL Support** - Full IntelliSense, validation, and hover for `.ditaval` files (7 elements)
- **Hover Documentation** - Element docs from DITA schema with children fallback
- **Document & Workspace Symbols** - Hierarchical outline (Ctrl+Shift+O) and cross-file search (Ctrl+T)
- **Go to Definition** - Navigate href/conref/keyref/conkeyref with server-side key space resolution
- **Find References & Rename** - Cross-file ID reference search and rename with updates
- **Formatting** - Token-based XML formatter with inline/block/preformatted handling
- **Code Actions** - 5 quick fixes: missing DOCTYPE, missing ID, missing title, empty elements, duplicate IDs
- **Linked Editing** - Simultaneous open/close XML tag name editing with depth-aware nesting
- **Folding Ranges & Document Links** - Collapsible elements/comments/CDATA and clickable references
- **Key Space Resolution Fix** - Improved root map discovery (searches all the way to workspace root)
- **cSpell Auto-Prompt** - Suggests cSpell configuration setup when extension detected
- **cSpell Setup Fix** - Fixed path resolution bug in bundled extension
- **TypeScript Project References** - Proper multi-project TypeScript setup for client + server
- **Server Test Suite** - 190 standalone Mocha tests across 10 files
- **CI Integration** - Server tests + type-checking in GitHub Actions (ci.yml + release.yml)
- **737+ Total Tests** - Client (547) + Server (190)

### Previous Changes (v0.4.2)
- **Modular Validation Engine** - Refactored to pluggable architecture with Strategy pattern
- **Rate Limiting** - DoS protection for validation (10 req/sec per file)
- **Architecture Documentation** - Comprehensive ARCHITECTURE.md with data flow diagrams
- **DITA User Guide** - Complete ~80-file documentation in DITA format
- **547+ Tests** - Expanded test suite with security and edge case coverage

---

## Milestone 1: Developer Experience & Quality (v0.3.0) ✅ COMPLETE

**Focus:** Improve code quality, test coverage, and developer experience.

### Testing & CI/CD
- [x] Add code coverage reporting with c8 (nyc doesn't work with VS Code extensions)
- [x] Add coverage threshold enforcement (gradual: 62% lines, 65% functions, 73% branches)
- [x] Add security scanning (npm audit) to CI pipeline with weekly schedule
- [x] Test DITA-OT integration (currently untested)
- [x] Test publish/preview/file creation commands
- [x] Test cSpell setup command
- [x] Add Windows and macOS to CI test matrix
- [x] Add error handling utility tests (fireAndForget, getErrorMessage, tryAsync)

### Code Quality
- [x] Remove unused `xml2js` dependency
- [x] Consolidate file reading in validator (eliminate duplicate reads)
- [x] Create utility function for safe error message extraction
- [x] Standardize async/await patterns (remove Promise chains)

### Configuration Flexibility
- [x] Make validation debounce configurable (100-2000ms)
- [x] Make key space cache TTL configurable (1-30 minutes)
- [x] Make DITA-OT process timeout configurable (5-30 minutes)
- [x] Add `ditacraft.maxLinkMatches` setting (currently hardcoded at 10,000)
- [x] Implement dynamic configuration reloading (no extension reload required)
- [x] Add centralized ConfigurationManager with change notifications
- [x] Add dynamic auto-validate toggle (effective immediately)

### Navigation Improvements
- [x] Implement precise element navigation for same-file conref (`#element`)
- [x] Add element navigation for cross-file references with fragments
- [x] Support element navigation in xref and link elements

**Good First Issues:**
- ~~Remove `xml2js` from package.json~~ (Done)
- ~~Add npm audit to CI workflow~~ (Done)
- ~~Create error message utility function~~ (Done)

---

## Milestone 2: Enhanced Preview & Build Output (v0.4.0) ✅ COMPLETE

**Focus:** Complete the preview feature and enhance build output.

### WebView Preview ✅
- [x] Implement full WebView panel for HTML5 preview
- [x] Add preview synchronization (scroll sync between source and preview)
- [x] Add preview theme support (light/dark/auto)
- [x] Add print preview mode with print button
- [x] Support custom CSS for preview styling

### Output Panel Improvements ✅
- [x] Add syntax highlighting to DITA-OT output (LogOutputChannel)
- [x] Automatic log level detection (error, warn, info, debug, trace)
- [x] Parse errors and link back to source files
- [x] Add problem matcher for DITA-OT errors in Problems panel
- [x] Build timestamps and duration display

### Test Coverage ✅
- [x] 60+ tests for DitaOtOutputChannel (log level detection, patterns)
- [x] Tests for preview configuration settings
- [x] Tests for file creation commands (validate, generate content)
- [x] Tests for preview command (validateFilePath, findMainHtmlFile)
- [x] Rate limiter integration tests
- [x] Security and edge case tests
- [x] Total: 547+ passing tests

---

## Milestone 2.1: DITA Map Visualizer (v0.4.0) ✅ COMPLETE

**Focus:** Add visual tools for DITA map navigation.

### DITA Map Visualizer ✅
- [x] Create WebView showing visual hierarchy of maps and topics
- [x] Display topic relationships and references
- [x] Add interactive navigation from visualization to source
- [x] Show validation status on nodes (missing files highlighted)
- [x] Circular reference detection and warning
- [x] Element type icons (map, chapter, appendix, part, topic, key)
- [x] Expand/collapse all controls
- [x] Real-time refresh capability

---

## Milestone 3: IntelliSense & Content Assistance (v0.5.0) ✅ COMPLETE

**Focus:** Add intelligent editing features via a DITA Language Server (LSP).

### Language Server Foundation ✅
- [x] LSP server skeleton with JSON-RPC over IPC
- [x] Client wiring and capability negotiation
- [x] Server-side key space resolution with BFS, caching (TTL + LRU), debounced invalidation

### Diagnostics ✅
- [x] XML well-formedness validation (fast-xml-parser)
- [x] DITA structure validation (DOCTYPE, root element, ID, title, empty elements)
- [x] ID validation (duplicates, format, comment exclusion)
- [x] Map and bookmap validation

### Hover Provider ✅
- [x] Display element documentation from DITA schema on hover
- [x] Show children list for elements without full docs
- [x] Hover on opening and closing tag names

### Completion Provider ✅
- [x] Context-aware element completions (children of parent element)
- [x] Attribute completions (element-specific + common attributes)
- [x] Attribute value completions (enumerations from schema)
- [x] Snippet format with tab stops and closing tags

### Code Actions (Quick Fixes) ✅
- [x] Add missing DOCTYPE declaration (auto-detects root type)
- [x] Add missing ID to root element (derived from filename)
- [x] Add missing title element
- [x] Remove empty elements
- [x] Rename duplicate IDs to make unique

### Symbol Provider ✅
- [x] Document symbols - hierarchical outline with title extraction (Ctrl+Shift+O)
- [x] Workspace symbols - cross-file search with query matching (Ctrl+T)

### Navigation ✅
- [x] Go to definition for href/conref (same-file and cross-file)
- [x] Go to definition for keyref/conkeyref (via key space resolution)
- [x] Find references for element IDs across workspace
- [x] Cross-file rename with reference updates

### Editing Features ✅
- [x] XML formatting with inline/block/preformatted element handling
- [x] Linked editing ranges (simultaneous open/close tag name editing)
- [x] Folding ranges for elements, comments, and CDATA
- [x] Document links for href/conref/keyref with key resolution

### DITAVAL Support ✅
- [x] `.ditaval` language registration and LSP integration
- [x] 7 DITAVAL elements with IntelliSense, hover, and validation
- [x] DITAVAL-specific attributes (excludes DITA common attributes)
- [x] Root element validation (`<val>` required)

### Server Test Suite ✅
- [x] 190 standalone Mocha tests across 10 files (94.3% statement coverage)
- [x] No VS Code dependency (runs via `cd server && npm test`)
- [x] Integrated into GitHub Actions CI pipeline

---

## Milestone 4: Project Management & Views (v0.6.0) ✅ COMPLETE

**Focus:** Add VS Code sidebar views for better project navigation.

### DITA Explorer View ✅
- [x] Tree view showing all DITA maps in workspace
- [x] Expandable map hierarchy showing topic references
- [x] Icons indicating topic types (map, chapter, topic, keydef, appendix, part)
- [x] Validation status badges (errors, warnings) via file decorations
- [x] Context menu actions (open, validate, publish, show map visualizer)
- [x] Auto-refresh on file changes (debounced 500ms)

### Key Space View ✅
- [x] List all defined keys with their targets
- [x] Show key usage across documents
- [x] Navigate to key definitions and usages
- [x] Highlight undefined/unused keys (three groups: defined, undefined, unused)
- [x] Auto-refresh on file changes (debounced 1000ms)

### Diagnostics View ✅
- [x] Centralized view of all DITA validation issues
- [x] Filter by severity (error, warning, info, hint)
- [x] Group by file or by issue type
- [x] Quick navigation to issue location
- [x] Auto-refresh on diagnostics changes (debounced 300ms)

### Welcome View ✅
- [x] Show getting started actions when no DITA files open
- [x] Quick links to create new topic/map/bookmap
- [x] Separate welcome content for each view

### Test Coverage ✅
- [x] 72 new client tests across 5 test files
- [x] Total: 620+ client tests, 810+ combined with server

---

## Milestone 5: Advanced Validation & DTD Support (v0.7.0) ✅ COMPLETE

**Focus:** Multi-version DTD support, workspace-level analysis, and deeper validation.

### Validation Architecture
- [x] TypesXML integration for pure TypeScript DTD validation
- [x] OASIS XML Catalog support for DITA public identifier resolution
- [x] 100% W3C XML Conformance Test Suite compliance
- [x] Three validation engines: TypesXML (default), built-in, xmllint
- [x] 12-phase LSP validation pipeline with per-phase error isolation (XML → Structure → DTD → RNG → DITA Rules → Cross-refs → Profiling → Circular Refs → Workspace → Severity Overrides → Suppression → Custom Rules)
- [x] Validation architecture documented (`docs/VALIDATION-SPECIFICATION.md` v2.0)
- [x] Smart debouncing (300ms topics, 1000ms maps) with per-document cancellation

### Phase A — Multi-Version DTD Support
- [x] Support custom specializations (via `@class` attribute matching)
- [x] Auto-detect DITA version from content (`@DITAArchVersion` and DOCTYPE)
- [x] RNG (RelaxNG) validation service with grammar caching
- [x] Bundle DITA 1.2 DTDs — copied from `docs/dita.v1_2/dtd/`, chained via master catalog
- [x] Bundle DITA 2.0 DTDs + RNG schemas — copied from `docs/dita.v2_0/`, chained via master catalog
- [x] Master catalog with `<nextCatalog>` chaining — auto-resolves PUBLIC IDs for all DITA versions (1.2, 1.3, 2.0)
- [x] External XML catalog setting (`ditacraft.xmlCatalogPath`) — user-configurable catalog for custom DTD specializations

### Phase B — Enhanced Validation
- [x] Cross-file reference validation (href, conref, keyref, conkeyref targets — 6 diagnostic codes)
- [x] Schematron-equivalent rule engine (35 rules in 5 categories, version-filtered, including 10 DITA 2.0 rules) + custom regex rules from user JSON file
- [x] Conref/keyref target validation
- [x] Subject scheme / profiling attribute validation
- [x] Scope validation — validates `scope="local|peer|external"` consistency with href format (DITA-SCOPE-001/002/003)
- [x] Circular reference detection — DFS traversal with depth limiting detects href/conref/mapref cycles (DITA-CYCLE-001)

### Phase C — Workspace-Level Analysis
- [x] Workspace scanner utility — discovers all DITA files across workspace folders
- [x] Validate entire workspace command (`DITA: Validate Workspace`) with progress reporting
- [x] Cross-file duplicate ID detection — workspace-wide root ID uniqueness (DITA-ID-003)
- [x] Unused topic detection — finds topics not referenced by any map (DITA-ORPHAN-001)

---

## Milestone 6: Refactoring & Productivity (v0.8.0)

**Focus:** Add refactoring tools and productivity features.

### Refactoring Tools
- [ ] Rename key across all usages
- [ ] Rename element ID with reference updates
- [ ] Move topic with reference updates
- [ ] Extract topic from section
- [ ] Inline conref (replace reference with content)

### Templates & Scaffolding
- [ ] Custom topic templates
- [ ] Project initialization wizard
- [ ] Map scaffolding from outline
- [ ] Import from Markdown/HTML

### Productivity Features
- [ ] Multi-file find and replace (DITA-aware)
- [ ] Batch insert/update metadata
- [ ] Table editor (visual table manipulation)
- [ ] Image insertion with automatic figure wrapper

**Good First Issues:**
- Add custom template support for new topics
- Create simple table insertion command

---

## Milestone 7: Publishing Enhancements (v0.9.0)

**Focus:** Enhance publishing capabilities and workflow.

### Publishing Profiles
- [ ] Save and reuse publishing configurations
- [ ] Profile management UI
- [ ] Quick switch between profiles
- [ ] Share profiles via settings

### DITAVAL Integration
- [x] DITAVAL IntelliSense, validation, and hover (completed in v0.5.0)
- [ ] Visual condition editor
- [ ] Preview with conditions applied
- [ ] Condition highlighting in editor

### Build System Integration
- [ ] VS Code task definitions for DITA workflows
- [ ] Watch mode for continuous publishing
- [ ] Incremental publishing (only changed files)
- [ ] Custom DITA-OT plugin management

### Output Formats
- [ ] Markdown output support
- [ ] Custom transformation configurations
- [ ] Post-processing hooks
- [ ] Output comparison (diff between versions)

**Good First Issues:**
- ~~Add DITAVAL syntax highlighting~~ (Done in v0.5.0)
- Create publishing profile save/load

---

## Long-term Vision (v1.0.0+)

### AI-Powered Features
- [ ] AI-assisted content suggestions
- [ ] Automatic metadata generation
- [ ] Content quality scoring
- [ ] Translation assistance

### Performance
- [ ] Large workspace optimization (10,000+ files)
- [ ] Streaming validation for large documents
- [ ] Background indexing
- [ ] Memory usage optimization

### Ecosystem
- [ ] Plugin/extension API for custom features
- [ ] Theme marketplace for preview styles
- [ ] Community snippet library
- [ ] Integration with documentation platforms

---

## Contributing

We welcome contributions! Here's how to get started:

### Finding Work

1. **Good First Issues**: Look for issues labeled `good first issue`
2. **Help Wanted**: Check issues labeled `help wanted`
3. **Roadmap Items**: Pick unchecked items from milestones above
4. **Bug Fixes**: Check the [issues page](https://github.com/jyjeanne/ditacraft/issues)

### Contribution Guidelines

1. **Discuss First**: For large features, open an issue to discuss before implementing
2. **Follow Patterns**: Match existing code style and patterns
3. **Add Tests**: All new features should include tests
4. **Update Docs**: Update README/CHANGELOG as needed
5. **One PR Per Feature**: Keep pull requests focused

### Development Setup

```bash
git clone https://github.com/jyjeanne/ditacraft.git
cd ditacraft
npm install
npm run compile
# Press F5 in VS Code to run extension in debug mode
```

### Areas Needing Help

| Area | Difficulty | Skills Needed |
|------|------------|---------------|
| Test Coverage | Easy-Medium | TypeScript, Mocha |
| Documentation | Easy | Markdown, DITA knowledge |
| WebView Preview | Medium | TypeScript, HTML/CSS |
| IntelliSense Providers | Medium-Hard | VS Code API |
| DITAVAL Editor | Medium | VS Code WebView API |
| DTD Support | Hard | XML, DTD, DITA specifications |

---

## Feedback

Have ideas for features not listed here? We'd love to hear from you!

- **Feature Requests**: [Open an issue](https://github.com/jyjeanne/ditacraft/issues/new)
- **Discussions**: [GitHub Discussions](https://github.com/jyjeanne/ditacraft/discussions)
- **Questions**: Tag issues with `question` label

---

## Version History

| Version | Focus | Status |
|---------|-------|--------|
| v0.1.x | Initial release, basic features | Released |
| v0.2.x | Key space, navigation, security, CI security audit | Released |
| v0.3.0 | Developer experience & quality | Released |
| v0.4.0 | Preview, build output & Map Visualizer | Released |
| v0.4.1 | TypesXML DTD Validation | Released |
| v0.4.2 | Architecture, Rate Limiting, 547+ Tests | Released |
| v0.5.0 | LSP with 14 features, DITAVAL, 737+ Tests | Released |
| v0.6.0 | Activity bar views, advanced LSP, 1010+ Tests | Released |
| v0.6.1 | i18n, DITA 2.0 rules, root map, RNG/catalog, 1040+ Tests | Released |
| v0.6.2 | Bookmap/topicref validation, error ranges, dedup, 1082 Tests | Released |
| v0.7.0 | Multi-version DTD (1.2/1.3/2.0), scope/cycle validation, workspace analysis, glossref, 1087+ Tests | Released |
| v0.7.1 | Guide validation, error catalog, ValidationPipeline, bug fixes, 1242+ Tests | Released |
| v0.7.2 | Severity overrides, custom rules, large file optimization, 1380+ Tests | **Current** |
| v0.8.0 | Refactoring & productivity | Planned |
| v0.9.0 | Publishing enhancements | Planned |

---

*Last updated: March 2026 (v0.7.2 — Severity overrides, custom rules, large file optimization, 1380+ tests)*
