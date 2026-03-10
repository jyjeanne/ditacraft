# DitaCraft LSP Improvements Plan

> Based on feature comparison with [dita-language-server](../dita-language-server/) (Java/LSP4J)
> Generated: 2026-03-09 — Revised: 2026-03-09

## Legend

| Priority | Meaning |
|----------|---------|
| P0 | Critical — major gap in DITA compliance or LSP quality |
| P1 | High — significant value for DITA authors |
| P2 | Medium — nice-to-have improvement |
| P3 | Low — polish / long-term |

---

## 1. Real Schematron Validation Engine — P0

**Current state (DitaCraft):** DITA rules are validated via 16 regex-based patterns in `ditaRulesValidator.ts` (~500 lines). Rules operate on cleaned text with comments/CDATA stripped. This approach cannot express complex XPath assertions (e.g., "shortdesc must be inside abstract", "pre must not contain image/object"), is fragile with nested structures, and is hard to extend for specializations.

**dita-language-server approach:** Uses a real Schematron engine powered by **SchXslt2** (XSLT-based Schematron transpiler) with a `dita.sch` schema containing **26 patterns** organized into version-specific phases (mandatory, recommendation, convention, authoring — for DITA 1.0–1.3). SVRL output is converted to LSP diagnostics with precise XPath-based location.

**Missing rules in DitaCraft (present in dita-language-server's `dita.sch`):**

| Rule | dita.sch pattern | DitaCraft equivalent |
|------|-----------------|---------------------|
| `<xref>` cannot nest `<xref>` | `self_nested_xref` | Missing |
| `<pre>` must not contain image/object/sup/sub | `pre_content` | Missing |
| `<abstract>` should contain `<shortdesc>` | `abstract_shortdesc` | Missing |
| `<no-topic-nesting>` has no output processing | `no_topic_nesting` | Missing |
| Deprecated role values "sample"/"external" | `role_attr_value` | Missing |
| Single paragraph topic → use shortdesc | `single_paragraph` | Missing |
| `<section>` must have at most one `<title>` | `multiple_section_titles` | DITA-SCH-023 (exists) |
| Use `<tm>` element instead of ™/℠/® chars | `tm_character` | DITA-SCH-022 (exists) |

**Recommended TypeScript libraries:**

| Library | npm package | Version | License | Use case |
|---------|-------------|---------|---------|----------|
| **node-schematron** | `node-schematron` | 2.1.0 | MIT | Pure-JS Schematron interpreter using **fontoxpath** for XPath 3.1. No XSLT needed. Interprets `.sch` files directly. Lighter alternative — supports Schematron minimal syntax. |
| **SaxonJS** | `saxon-js` | 2.7.0 | Proprietary (free) | Full XSLT 3.0 / XPath 3.1 processor. Can run the standard ISO Schematron-to-XSLT pipeline (compile `.sch` → XSLT → execute → SVRL). Most powerful option. |
| **xslt3** (CLI) | `xslt3` | 2.7.0 | Proprietary (free) | CLI companion to saxon-js. Pre-compile `.sch` → SEF at build time for faster runtime. |

**Recommendation:** Start with `node-schematron` (MIT, pure JS, zero native deps). Fall back to `saxon-js` only if `node-schematron`'s minimal syntax is insufficient for complex DITA rules.

**Improvement plan:**
- [ ] Evaluate `node-schematron` vs `saxon-js` for Schematron execution
- [ ] Import `dita.sch` from dita-language-server or write a compatible schema with version-specific phases
- [ ] Add SVRL-to-LSP-diagnostic converter (map SVRL `<failed-assert>` / `<successful-report>` to `Diagnostic`)
- [ ] Add the 6 missing rules listed above to either the `.sch` file or the regex fallback
- [ ] Keep the existing regex rules as a fast fallback when Schematron engine is unavailable
- [ ] Support user-provided custom Schematron schemas for specialization validation
- [ ] Add a setting `ditacraft.schematronEnabled: boolean` (default: true)

**Files to modify/create:**
- `server/src/features/schematronValidator.ts` (new)
- `server/src/features/validation.ts` (integrate as new validation phase)
- `resources/schematron/dita.sch` (new — copy/adapt from dita-language-server)
- `package.json` (add `node-schematron` or `saxon-js` dependency)

---

## 2. DTD Grammar Caching & Parser Pool — P1

**Current state (DitaCraft):** Uses `fast-xml-parser` (v5.4.1) for well-formedness only (no DTD grammar) and `typesxml` (v1.17.0) for full DTD validation. Each validation run re-initializes the parser and re-reads DTD files. No caching of parsed grammar between invocations.

**dita-language-server approach:** `DITAGrammarCacheManager` pre-parses and caches 6 DITA DTD grammars (topic, concept, task, reference, map, subject scheme) in a `XMLGrammarPoolImpl` keyed by PUBLIC identifier. A `BlockingQueue<SAXParser>` pool (capacity: 10) with `ReadWriteLock` amortizes parser creation. Grammars are shared across all parser instances.

**Recommended TypeScript approach:**

`typesxml` (v1.17.0) already includes a full DTD parser internally. The improvement is to **cache the `typesxml` parser state** between runs:
- Create a singleton `GrammarCacheService` that holds pre-parsed DTD objects
- Reuse the same `typesxml` instance across validation runs instead of creating a new one per document
- Pre-warm the cache on server startup with common DITA PUBLIC identifiers

**Improvement plan:**
- [ ] Profile current validation to measure DTD parsing overhead (baseline)
- [ ] Create `GrammarCacheService` that caches `typesxml` parser/DTD state by PUBLIC identifier
- [ ] Pre-load common DITA DTDs on server startup: topic, concept, task, reference, map, bookmap
- [ ] Implement parser instance reuse (pool of 3–5 instances for concurrent validations)
- [ ] Benchmark after to measure latency improvement
- [ ] Add `typesxml` catalog support if available (see item 3)

**Files to modify/create:**
- `server/src/services/grammarCacheService.ts` (new)
- `server/src/features/validation.ts` (use cached grammar)

---

## 3. XML Catalog Resolution — P1

**Current state (DitaCraft):** DTDs are bundled in `/dtds/` directory. Resolution relies on DOCTYPE declarations and the validation engine's internal handling. No OASIS XML Catalog support. Users with custom specializations or non-standard DTD locations have no way to configure resolution.

**dita-language-server approach:** Uses **XMLResolver 6.0.21** with a `catalog.xml` that maps DITA PUBLIC identifiers (`-//OASIS//DTD DITA Topic//EN`, etc.) to local schema files. Supports DTD, RNG, and XSD resolution.

**Recommended TypeScript library:**

| Library | npm package | Version | License | Notes |
|---------|-------------|---------|---------|-------|
| **TypesXML** | `typesxml` | 1.17.0 | EPL 1.0 | Already a dependency! TypesXML includes a built-in OASIS XML Catalog resolver for PUBLIC/SYSTEM identifiers. This is the **only** pure-TS npm package with XML Catalog support. |

**Recommendation:** Leverage `typesxml`'s built-in catalog resolver (already a dependency) instead of adding a new library.

**Improvement plan:**
- [ ] Create `dtds/catalog.xml` mapping all DITA 1.3 PUBLIC identifiers to bundled DTDs
- [ ] Configure `typesxml` to use this catalog for DTD resolution
- [ ] Add setting `ditacraft.xmlCatalogPaths: string[]` for user-provided catalogs (specializations)
- [ ] Support cascading catalogs (bundled + user-provided)
- [ ] Document how users can add catalogs for custom DITA specializations

**Files to modify/create:**
- `dtds/catalog.xml` (new — OASIS catalog format)
- `server/src/services/catalogResolver.ts` (new — wraps typesxml catalog API)
- `server/src/settings.ts` (add `xmlCatalogPaths` setting)
- `package.json` > contributes > configuration (expose setting)

---

## 4. Map Merging via XSLT — P1

**Current state (DitaCraft):** `KeySpaceService` uses BFS traversal to walk the map hierarchy, extracting key definitions from elements with `keys` attribute. This approach does not handle cascading metadata correctly — metadata on parent `<topicref>` elements does not propagate to children, and `<mapref>` elements are not fully expanded with href relativization.

**dita-language-server approach:** Uses `merge.xsl` (XSLT 3.0 via Saxon-HE 12.9) to:
1. Recursively expand `<mapref>` elements by inlining referenced submaps
2. Relativize `@href` attributes from submaps to root map location
3. Produce a single flattened map for key/metadata extraction

**Recommended TypeScript libraries:**

| Library | npm package | Version | License | Notes |
|---------|-------------|---------|---------|-------|
| **SaxonJS** | `saxon-js` | 2.7.0 | Proprietary (free) | Full XSLT 3.0. Can run `merge.xsl` directly. 18k weekly downloads. |
| **xslt-processor** | `xslt-processor` | 3.4.0 | LGPL-3.0 | XSLT 1.0 only (partial 2.0). Open source. Would require rewriting `merge.xsl` in XSLT 1.0. |

**Recommendation:** If Schematron (item 1) already uses `saxon-js`, reuse it here. Otherwise, consider a pure-TS map merge implementation that handles cascading metadata without XSLT.

**Improvement plan:**
- [ ] **Option A (XSLT):** Add `saxon-js`, port `merge.xsl` from dita-language-server, compile to SEF at build time
- [ ] **Option B (Pure TS):** Extend `KeySpaceService` to handle cascading metadata and mapref expansion in TypeScript
- [ ] Handle metadata cascade: `<topicmeta>` on parent propagates to children
- [ ] Handle key scopes (`@keyscope` attribute)
- [ ] Relativize hrefs from submaps to root map base URI
- [ ] Add integration tests with nested map hierarchies

**Files to modify/create:**
- `server/src/services/mapMergeService.ts` (new)
- `server/src/services/keySpaceService.ts` (refactor to use merged map)
- `resources/xslt/merge.sef.json` (new — pre-compiled XSLT, if Option A)

---

## 5. Specialization Support via @class Attribute — P1

**Current state (DitaCraft):** Element identification uses hardcoded element names (e.g., `topic`, `concept`, `task`, `reference`). The DITA schema in `ditaSchema.ts` defines content models by element name. This breaks for DITA specializations where custom element names inherit from base types.

**dita-language-server approach:** Uses `@class` attribute matching throughout the codebase (e.g., `topic/topic`, `map/map`, `topic/xref`, `subjectScheme/enumerationdef`). Predicate functions check if an element's `@class` attribute contains the specialization pattern. This allows the server to work transparently with any DITA specialization.

**Improvement plan:**
- [ ] Add a utility function `matchesDitaClass(element, classPattern)` that checks `@class` attribute
- [ ] Refactor validation, completion, hover, and definition features to use class-based matching alongside element name matching
- [ ] Ensure cross-reference validation works for specialized elements (e.g., custom xref specializations)
- [ ] Update `ditaSchema.ts` to include class hierarchy information
- [ ] Add tests with specialized DITA content

**Files to modify/create:**
- `server/src/utils/ditaClassMatcher.ts` (new)
- `server/src/features/validation.ts`
- `server/src/features/completion.ts`
- `server/src/features/crossRefValidation.ts`
- `server/src/data/ditaSchema.ts` (add class attributes)

---

## 6. Precise Attribute-Level Location Tracking — P2

**Current state (DitaCraft):** `xmlTokenizer.ts` (~300 lines) is a state-machine tokenizer that tracks token positions. However, attribute locations are derived from regex matching within lines, leading to imprecise diagnostic ranges (e.g., highlighting the entire element instead of just the problematic attribute value).

**dita-language-server approach:** Custom `XmlSerializer` injects `loc:` namespace attributes with exact `line:column` ranges. A `TreeMap<PositionKey, Attribute>` provides O(log n) lookups.

**Recommended TypeScript libraries:**

| Library | npm package | Version | License | Notes |
|---------|-------------|---------|---------|-------|
| **slimdom + slimdom-sax-parser** | `slimdom` / `slimdom-sax-parser` | 4.3.5 / 1.5.3 | MIT | Standards-compliant DOM with `position: true` option that attaches `start`/`end` character offsets to every node. Best DOM + position tracking combo. |
| **saxes** | `saxes` | 5.0.1 | ISC | Fast SAX parser (fork of sax). Exposes `line`, `column`, `position`, `startTagPosition` during events. More precise than `@xmldom/xmldom`'s locator. |

**Recommendation:** Replace `@xmldom/xmldom` (currently used) with `slimdom` + `slimdom-sax-parser` for DOM operations that need position tracking. Use `saxes` for streaming SAX operations.

**Improvement plan:**
- [ ] Evaluate `slimdom-sax-parser` with `position: true` as a replacement for `@xmldom/xmldom` in position-sensitive contexts
- [ ] Enhance `xmlTokenizer.ts` to emit precise attribute name/value ranges (start offset, end offset)
- [ ] Build a document-level position-to-attribute index (sorted map for O(log n) lookups)
- [ ] Use precise ranges in diagnostics: highlight the attribute value, not the whole element
- [ ] Improve hover hit-testing: detect which exact attribute the cursor is on

**Files to modify:**
- `server/src/utils/xmlTokenizer.ts`
- `server/src/features/hover.ts`
- `server/src/features/completion.ts`
- `server/src/features/validation.ts`
- `server/src/features/crossRefValidation.ts`
- `package.json` (add `slimdom`, `slimdom-sax-parser`, `saxes` if adopted)

---

## 7. Enhanced Error Recovery for Malformed XML — P2

**Current state (DitaCraft):** The XML tokenizer is error-tolerant and can produce tokens from incomplete documents. However, `fast-xml-parser` validation (Phase 1) stops at the first XML error, and DITA structure validation (Phase 2+) is skipped entirely for malformed files.

**dita-language-server approach:** `XmlFilter` actively recovers from:
- Missing opening quotes on attribute values → injects quote
- Missing `=` between attribute name and value → injects `="`
- Incomplete elements → auto-closes them
- Continues collecting diagnostics after each recovery

**Improvement plan:**
- [ ] Add recovery strategies to `xmlTokenizer.ts`: handle missing quotes, missing `=`, unclosed tags
- [ ] Run DITA structure validation even when Phase 1 reports XML errors (best-effort)
- [ ] Provide completions and hover inside partially-written elements (use tokenizer output even for malformed XML)
- [ ] Report both XML syntax errors and DITA structural issues simultaneously
- [ ] Add a "relaxed" parsing mode for features (completion, hover) vs "strict" mode for validation

**Files to modify:**
- `server/src/utils/xmlTokenizer.ts`
- `server/src/features/validation.ts`
- `server/src/features/completion.ts`
- `server/src/features/hover.ts`

---

## 8. Conref Content Preview — P2

**Current state (DitaCraft):** Conref validation checks that target files and element IDs exist. Hover shows the resolved file path and fragment. Go-to-definition navigates to the target. But there is **no inline preview of the referenced content**.

**dita-language-server approach:** Hover on keyref/conkeyref shows the text content from the key definition (keywords, navtitle). This is partial — neither project shows the full resolved conref content.

**Improvement plan:**
- [ ] On hover over `conref` or `conkeyref`, resolve the target and show a preview of the referenced element's content (first ~200 chars)
- [ ] For `conkeyref`, resolve the key first, then the element ID in the target
- [ ] Handle nested conrefs (resolve one level only to avoid cycles)
- [ ] Show the preview as Markdown in the hover popup (with XML syntax highlighting via fenced code block)
- [ ] Add a code lens or inlay hint showing "conref → file.dita#topic/element" inline

**Files to modify:**
- `server/src/features/hover.ts` (add conref content resolution)
- `server/src/utils/referenceParser.ts` (extract element content from target file)

---

## 9. Subject Scheme: Completion Grouping & Hierarchy Display — P2

**Current state (DitaCraft):** `SubjectSchemeService` already supports nested `<subjectdef>` hierarchies, `<defaultSubject>`, element-specific binding, and merging of multiple schemes. Profiling validation works against controlled values. However, **completion items show a flat list** of allowed values with no hierarchy or grouping.

**dita-language-server approach:** Similar flat completion. Neither project groups completions by parent subject.

**Improvement plan (beyond dita-language-server):**
- [ ] Group completion items by parent subject (use `CompletionItem.sortText` prefix for grouping)
- [ ] Show the subject hierarchy path in completion item detail (e.g., "Platform > Linux > Ubuntu")
- [ ] Show default value as a preselected completion item
- [ ] Add a diagnostic hint when default value applies ("Using default value 'X' from subject scheme")

**Files to modify:**
- `server/src/features/completion.ts`
- `server/src/services/subjectSchemeService.ts` (expose hierarchy path)

---

## 10. Workspace Command: Set Root Map — P2

**Current state (DitaCraft):** Root maps are auto-discovered by scanning upward from the current file. Discovery priority: `root.ditamap` > `main.ditamap` > `master.ditamap` > first alphabetically. No way for users to override this.

**dita-language-server approach:** Provides a `dita.setRootMap` workspace command that explicitly sets the root map URI. Triggers map merging, key space building, and revalidation.

**Improvement plan:**
- [ ] Add `ditacraft.setRootMap` command (VS Code command palette)
- [ ] Show a quick pick list of all `.ditamap` files in the workspace
- [ ] Store selection in workspace settings (`ditacraft.rootMap` path)
- [ ] Override auto-discovery when explicitly set
- [ ] Revalidate all open documents when root map changes
- [ ] Show the active root map in the VS Code status bar
- [ ] Add `ditacraft.clearRootMap` command to revert to auto-discovery

**Files to modify/create:**
- `src/extension.ts` (register commands, status bar item)
- `server/src/server.ts` (handle `workspace/executeCommand`)
- `server/src/services/keySpaceService.ts` (explicit root map override)
- `package.json` (declare commands and configuration)

---

## 11. Localization / i18n of Diagnostic Messages — P2

**Current state (DitaCraft):** All diagnostic messages are hardcoded in English across `validation.ts`, `crossRefValidation.ts`, `ditaRulesValidator.ts`, and `profilingValidation.ts`.

**dita-language-server approach:** Uses Java `ResourceBundle` with `copy_en.properties` (9 message keys). Supports `InitializeParams.locale`.

**Improvement plan:**
- [ ] Extract all ~40 diagnostic messages to `server/src/messages/en.json`
- [ ] Create a `i18n(key, ...args)` utility that does message lookup + string interpolation
- [ ] Read `InitializeParams.locale` during initialization
- [ ] Load locale-specific bundle (fallback to English)
- [ ] Provide French (`fr.json`) as first additional locale
- [ ] Use VS Code's `vscode-nls` pattern for client-side strings

**Files to modify/create:**
- `server/src/messages/en.json` (new)
- `server/src/messages/fr.json` (new)
- `server/src/utils/i18n.ts` (new)
- `server/src/features/validation.ts`
- `server/src/features/crossRefValidation.ts`
- `server/src/features/ditaRulesValidator.ts`
- `server/src/features/profilingValidation.ts`

---

## 12. DITA 2.0 Rules & Validation — P3 ✅ DONE

**Implemented:**
- Audited all 23 existing rules and added `'2.0'` to version gates where applicable
- Added 10 new DITA 2.0-specific rules (SCH-050 through SCH-059):
  - SCH-050: `<boolean>` removed (error)
  - SCH-051: `<indextermref>` removed (error)
  - SCH-052: `<object>` removed — use `<audio>`, `<video>`, `<include>` (error)
  - SCH-053: Learning specializations removed (error)
  - SCH-054: `<audio>` missing `<fallback>` (accessibility warning)
  - SCH-055: `<video>` missing `<fallback>` (accessibility warning)
  - SCH-056: `@print` attribute removed (error)
  - SCH-057: `@copy-to` attribute removed (error)
  - SCH-058: `@navtitle` attribute removed (error)
  - SCH-059: `@query` attribute removed (error)
- Added DITA 2.0 elements to `ditaSchema.ts`: `audio`, `video`, `media-source`, `media-track`, `video-poster`, `fallback`, `include`, `keytext`, `strong`, `em`
- Added element docs and attribute definitions for all new elements
- Added `ditacraft.ditaVersion` setting (`'auto'` | version string) to override auto-detection
- Added 10 new i18n messages in both `en.json` and `fr.json`

**Files modified:**
- `server/src/features/ditaRulesValidator.ts`
- `server/src/data/ditaSchema.ts`
- `server/src/settings.ts`
- `server/src/server.ts`
- `server/src/messages/en.json`
- `server/src/messages/fr.json`
- `server/test/validation.test.ts`

---

## 13. RNG and XSD Schema Support — P3 ✅ DONE

**Implemented:**
- Evaluated and integrated `salve-annos` (v1.2.4) for RelaxNG validation with `saxes` for SAX parsing
- Created `RngValidationService` with:
  - Optional dependency loading (graceful fallback to DTD if salve-annos not installed)
  - RNG schema compilation and in-memory caching
  - JSON cache files (`.rng.json`) for faster subsequent loads
  - SAX event bridge: saxes parses XML → fires events into salve walker
  - Root element → RNG file mapping for automatic schema resolution
- Added `ditacraft.schemaFormat` setting (`'dtd'` default, `'rng'` opt-in)
- Added `ditacraft.rngSchemaPath` setting for user-configured RNG schema directory
- RNG schemas are NOT bundled — users point to their own (e.g., DITA-OT's `plugins/org.oasis-open.dita.v1_3/rng/`)

**Dependencies added:** `salve-annos`, `saxes`, `xregexp@4` (required by salve-annos)

**Files created:**
- `server/src/services/rngValidationService.ts`

**Files modified:**
- `server/src/settings.ts` — added `schemaFormat`, `rngSchemaPath`
- `server/src/server.ts` — wired RNG service initialization and validation
- `server/src/messages/en.json` — added `rng.validationError`
- `server/src/messages/fr.json` — added `rng.validationError`
- `server/test/validation.test.ts` — updated test settings
- `server/package.json` — new dependencies

---

## 14. Smart Debouncing with Cascade Revalidation — P3

**Current state (DitaCraft):** Fixed debounce delay (default 300ms, configurable 100–2000ms). All document changes use the same delay. KeySpaceService has its own debounced invalidation (300ms) on map file changes.

**dita-language-server approach:** `SmartDebouncer` with per-key cancellation and 1-second delay for root map changes. Triggers revalidation of all open documents when the map changes.

**Improvement plan:**
- [ ] Implement tiered debouncing: 300ms for topic files, 1000ms for map files
- [ ] When a `.ditamap` changes, revalidate all open topic files (their cross-refs and keys may have changed)
- [ ] Cancel in-flight validations when new edits arrive for the same file
- [ ] Deduplicate concurrent revalidation requests for the same document

**Files to modify:**
- `server/src/server.ts`
- `server/src/features/validation.ts`

---

## Summary Matrix

| # | Feature | Priority | Effort | Impact | Recommended Library |
|---|---------|----------|--------|--------|-------------------|
| 1 | Schematron validation engine | P0 | High | High | `node-schematron` (MIT) or `saxon-js` |
| 2 | DTD grammar caching | P1 | Medium | Medium | `typesxml` (already used) |
| 3 | XML catalog resolution | P1 | Low | High | `typesxml` (built-in catalog support) |
| 4 | Map merging | P1 | High | High | `saxon-js` or pure TS |
| 5 | Specialization via @class | P1 | Medium | High | N/A (pure TS utility) |
| 6 | Precise attribute locations | P2 | Medium | Medium | `slimdom` + `saxes` |
| 7 | Enhanced error recovery | P2 | Medium | Medium | N/A (extend tokenizer) |
| 8 | Conref content preview | P2 | Low | Medium | N/A (reuse existing parsers) |
| 9 | Subject scheme completion UX | P2 | Low | Low | N/A (enhance existing service) |
| 10 | Set root map command | P2 | Low | Medium | N/A (VS Code API) |
| 11 | Localization / i18n | P2 | Low | Low-Med | `vscode-nls` (client side) |
| 12 | DITA 2.0 rules | P3 | Medium | Medium | N/A |
| 13 | RNG/XSD schema support | P3 | High | Low | `salve-annos` |
| 14 | Smart tiered debouncing | P3 | Low | Low | N/A |

---

## Suggested Implementation Order

**Phase 1 — Quick wins (leverage existing deps): ✅ DONE**
1. ✅ **#3 XML Catalog** — TypesXML catalog validation service with OASIS catalog + bundled DTDs
2. ✅ **#10 Set Root Map** — VS Code commands, status bar, workspace settings, server-side override
3. ✅ **#9 Subject Scheme Completion UX** — hierarchy paths, grouping, default preselection

**Phase 2 — Core gaps: ✅ DONE**
4. ✅ **#5 Specialization via @class** — centralized `TOPIC_TYPE_NAMES`/`MAP_TYPE_NAMES` in `ditaSpecialization.ts`; refactored validation, completion, cross-ref, and code actions to use them
5. ✅ **#2 DTD Grammar Caching** — parser pool (3 instances) with catalog reuse in `catalogValidationService.ts`
6. ✅ **#1 Schematron Engine** — added 7 new rules (DITA-SCH-040 through 046): nested xref, pre content, abstract shortdesc, no-topic-nesting, deprecated role values, single-paragraph body, idless titled elements. Total: 23 rules covering all dita.sch patterns.

**Phase 3 — UX improvements: ✅ DONE**
7. ✅ **#8 Conref Content Preview** — conref/conkeyref hover preview with XML element extraction and depth-aware tag matching
8. ✅ **#6 Precise Attribute Locations** — `findAttrInTag` helper; 8 rules updated to highlight specific attribute instead of whole element; ID diagnostics now span full `id="value"` range
9. ✅ **#7 Enhanced Error Recovery** — unquoted attribute values in tokenizer; all validation phases run independently on malformed files

**Phase 4 — Polish: ✅ DONE**
10. ✅ **#4 Map Merging** — key scope support (`@keyscope`): scope-qualified keys (e.g., `lib.keyname`) stored alongside unqualified keys; root element keyscope detection; nested scope prefix propagation through submap traversal
11. ✅ **#11 Localization** — i18n utility with `t()` function, 49 messages extracted to `en.json`/`fr.json`, locale set from `InitializeParams.locale`
12. ✅ **#14 Smart Debouncing** — tiered delays (300ms topics, 1000ms maps), per-URI cancellation, map edits invalidate key space
13. ✅ **#12 DITA 2.0** — 10 new 2.0-specific rules (SCH-050–059), 2.0 elements in schema, `ditaVersion` override setting
14. ✅ **#13 RNG/XSD** — `RngValidationService` using salve-annos + saxes, grammar caching, `schemaFormat` + `rngSchemaPath` settings

---

## Features DitaCraft Already Has (Not in dita-language-server)

DitaCraft already surpasses dita-language-server in several areas:

| Feature | DitaCraft | dita-language-server |
|---------|-----------|---------------------|
| Document symbols (outline) | Yes | No |
| Workspace symbols (Ctrl+T) | Yes | No |
| Find references (cross-file) | Yes | No |
| Rename (workspace-wide) | Yes | No |
| Document formatting | Yes | No |
| Range formatting | Yes | No |
| Folding ranges | Yes | No |
| Linked editing (tag rename) | Yes | No |
| Document links (clickable) | Yes | No |
| Code actions (10+ quick fixes) | Yes | 1 only (email scope) |
| Multiple validation engines | Yes (built-in, typesxml, xmllint) | No (Xerces only) |
| Configurable rule categories | Yes (4 categories) | No |
| Incremental text sync | Yes | No (full sync) |
| DITAVAL file validation | Yes | No |
| Configurable debounce delay | Yes (100–2000ms) | No (fixed 1000ms) |
| Max problems cap | Yes (configurable) | No |
| Workspace folder tracking | Yes | No |

---

## Appendix: Current DitaCraft Rule Coverage vs dita-language-server

| Code | DitaCraft Rule | dita.sch Equivalent | Status |
|------|---------------|-------------------|--------|
| DITA-SCH-001 | role="other" requires @otherrole | `otherrole` | Covered |
| DITA-SCH-002 | note type="other" requires @othertype | `othernote` | Covered |
| DITA-SCH-003 | Deprecated `<indextermref>` | `indextermref` | Covered |
| DITA-SCH-004 | collection-type on reltable/relcolspec | `collection-type_on_rel` | Covered |
| DITA-SCH-010 | Deprecated `<boolean>` | `boolean` | Covered |
| DITA-SCH-011 | Deprecated @alt on image | `image_alt_attr` | Covered |
| DITA-SCH-012 | Deprecated @longdescref on image | `image_longdescref_attr` | Covered |
| DITA-SCH-013 | Deprecated @query | `query_attr` | Covered |
| DITA-SCH-014 | Deprecated @navtitle on topicref | `navtitle` | Covered |
| DITA-SCH-015 | Deprecated @title on map | `map_title_attribute` | Covered |
| DITA-SCH-016 | shortdesc 50+ words | `shortdesc_length` | Covered |
| DITA-SCH-017 | topichead missing navtitle | `topichead_navtitle` | Covered |
| DITA-SCH-020 | xref in title | `xref_in_title` | Covered |
| DITA-SCH-021 | required-cleanup present | `required-cleanup` | Covered |
| DITA-SCH-022 | Trademark chars → use `<tm>` | `tm_character` | Covered |
| DITA-SCH-023 | Multiple titles in section | `multiple_section_titles` | Covered |
| DITA-SCH-030 | Image missing alt text | `no_alt_desc` | Covered |
| DITA-SCH-031 | Object missing desc | `no_alt_desc` | Covered |
| DITA-SCH-040 | Nested `<xref>` in `<xref>` | `self_nested_xref` | Covered |
| DITA-SCH-041 | `<pre>` contains image/object/sup/sub | `pre_content` | Covered |
| DITA-SCH-042 | `<abstract>` missing `<shortdesc>` | `abstract_shortdesc` | Covered |
| DITA-SCH-043 | `<no-topic-nesting>` present | `no_topic_nesting` | Covered |
| DITA-SCH-044 | Deprecated role values sample/external | `role_attr_value` | Covered |
| DITA-SCH-045 | Single paragraph → use shortdesc | `single_paragraph` | Covered |
| DITA-SCH-046 | Elements with titles missing @id | `idless_title` | Covered |
| — | keyref attribute reserved (DITA 1.0-1.1) | `keyref_attr` | Skipped (version-specific, low priority) |
| DITA-SCH-050 | `<boolean>` removed in 2.0 | — | Covered (2.0) |
| DITA-SCH-051 | `<indextermref>` removed in 2.0 | — | Covered (2.0) |
| DITA-SCH-052 | `<object>` removed in 2.0 | — | Covered (2.0) |
| DITA-SCH-053 | Learning specializations removed in 2.0 | — | Covered (2.0) |
| DITA-SCH-054 | `<audio>` missing `<fallback>` | — | Covered (2.0) |
| DITA-SCH-055 | `<video>` missing `<fallback>` | — | Covered (2.0) |
| DITA-SCH-056 | `@print` removed in 2.0 | — | Covered (2.0) |
| DITA-SCH-057 | `@copy-to` removed in 2.0 | — | Covered (2.0) |
| DITA-SCH-058 | `@navtitle` removed in 2.0 | — | Covered (2.0) |
| DITA-SCH-059 | `@query` removed in 2.0 | — | Covered (2.0) |
