# DitaCraft Validation Specification

**Version:** 3.0
**Date:** March 2026
**Status:** Implemented
**Author:** Jeremy Jeanne

---

## Executive Summary

This document describes the validation architecture implemented in DitaCraft v0.7.2. The system uses a **12-phase LSP-based validation pipeline** (`ValidationPipeline` class) running in a dedicated Language Server process, providing real-time diagnostics as the user types. Each phase is error-isolated so a failure in one doesn't discard results from others.

The original spec (v1.0, January 2025) explored different validation approaches. The chosen architecture combines a custom DITA Language Server with TypesXML DTD validation, optional RelaxNG validation, a 43-rule Schematron-equivalent engine, cross-reference validation, profiling/subject scheme validation, circular reference detection, workspace-level checks, per-rule severity overrides, comment-based rule suppression, and user-defined custom regex rules — all running in real-time with smart debouncing.

This document was originally prompted by feedback from Stan Doherty (OASIS DITA TC member, ACM SIGDOC) who noted that the built-in validation engine was insufficient and suggested exploring DITA-OT-based validation. The implemented solution goes beyond that suggestion by providing real-time, zero-dependency validation with bundled DTDs.

---

## Table of Contents

1. [Implemented Architecture](#1-implemented-architecture)
2. [Validation Pipeline](#2-validation-pipeline)
3. [Validation Phases](#3-validation-phases)
4. [Diagnostic Codes](#4-diagnostic-codes)
5. [Error Reporting](#5-error-reporting)
6. [Configuration](#6-configuration)
7. [Approaches Considered](#7-approaches-considered)
8. [Implementation History](#8-implementation-history)
9. [Remaining Work](#9-remaining-work)

---

## 1. Implemented Architecture

### 1.1 Architecture Overview

DitaCraft uses a **client-server architecture** with the LSP server as the sole real-time diagnostics provider:

```
┌─────────────────────────────────────────────────────────────────┐
│                    VS Code Client (Extension Host)              │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ Manual Validate   │  │ Diagnostics View │  │ Problems     │  │
│  │ (Ctrl+Shift+V)    │  │ (Activity Bar)   │  │ Panel        │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
│           │                     ▲                    ▲          │
│           │ client-side         │ dedup              │ LSP      │
│           ▼ 'dita' source      │ filter             │ 'dita-   │
│  ┌──────────────────┐          │                    │ lsp'     │
│  │ DitaValidator     │──────────┘                    │ source   │
│  │ (on-demand only)  │                               │          │
│  └──────────────────┘                               │          │
└─────────────────────────────────┬───────────────────┘          │
                                  │ IPC (JSON-RPC)               │
┌─────────────────────────────────▼───────────────────────────────┐
│                    LSP Server (Node.js process)                  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              Pull Diagnostics Handler (server.ts)          │  │
│  │  Smart debouncing: 300ms topics, 1000ms maps               │  │
│  │  Per-document cancellation                                 │  │
│  └──────────────────────┬─────────────────────────────────────┘  │
│                         │                                        │
│  ┌──────────────────────▼─────────────────────────────────────┐  │
│  │            12-Phase Validation Pipeline                    │  │
│  │            (ValidationPipeline — error-isolated phases)    │  │
│  │                                                            │  │
│  │  Phase 1-3: XML + structure + IDs    (validation.ts)       │  │
│  │  Phase 4:   DTD or RNG schema        (catalog/rng service) │  │
│  │  Phase 5:   Cross-references         (crossRefValidation)  │  │
│  │  Phase 6:   Subject scheme registration                    │  │
│  │  Phase 7:   Profiling validation     (profilingValidation) │  │
│  │  Phase 8:   43 DITA rules            (ditaRulesValidator)  │  │
│  │  Phase 9:   Circular ref detection   (circularRefDetection)│  │
│  │  Phase 10:  Workspace checks         (workspaceValidation) │  │
│  │  Phase 11:  Severity overrides + comment suppression       │  │
│  │  Phase 12:  Custom regex rules   (customRulesValidator)    │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### 1.2 Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| LSP as sole real-time provider | Eliminates duplicate diagnostics; client-side on-save validation disabled in v0.6.2 |
| Pull-based diagnostics (LSP 3.17) | Client requests diagnostics; server responds with `DocumentDiagnosticReportKind.Full` |
| `ValidationPipeline` class | Orchestrates all 12 phases; extracted from monolithic 111-line handler in server.ts |
| Error isolation per phase | Each phase in try/catch with logging; failure in one doesn't discard others |
| Smart debouncing per file type | 300ms for topics (fast feedback), 1000ms for maps (heavier processing) |
| Per-document cancellation | Typing cancels stale validation for the same document |
| Bundled DITA 1.3 DTDs | Zero-configuration; OASIS catalog resolves PUBLIC identifiers |
| Two-variant comment stripping | `stripCommentsAndCDATA` (basic) vs `stripCommentsAndCodeContent` (also blanks code elements) — centralized in `textUtils.ts` |

### 1.3 Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| LSP Framework | vscode-languageserver 9.x | JSON-RPC, document sync, capability negotiation |
| XML Parsing | fast-xml-parser | Layer 1: well-formedness checking |
| DTD Validation | TypesXML + OASIS Catalog | Layer 2: full DTD validation with public ID resolution |
| RNG Validation | salve-annos + saxes | Layer 3: optional RelaxNG schema validation |
| Regex Engine | Built-in RegExp | Layers 4-6: structure, rules, cross-refs |
| i18n | Custom t() with JSON bundles | 80+ diagnostic messages in English + French |

### 1.4 Validation Engines (Legacy Client-Side)

The client-side validation engines are retained for on-demand manual validation (`Ctrl+Shift+V`):

| Engine | Description | Status |
|--------|-------------|--------|
| `typesxml` | TypesXML DTD validation (default) | Active |
| `built-in` | fast-xml-parser + xmldom | Active (fallback) |
| `xmllint` | External xmllint binary | Active (if installed) |

---

## 2. Validation Pipeline

### 2.1 Trigger Flow

```
Document change (typing)
  └─> onDidChangeContent (server.ts)
        └─> Smart debounce (300ms topic / 1000ms map)
              └─> connection.languages.diagnostics.refresh()
                    └─> Pull diagnostics handler
                          └─> 6-layer pipeline
                                └─> Return Diagnostic[]
                                      └─> VS Code Problems Panel
```

### 2.2 Pipeline Execution Order

All 12 phases run sequentially inside `ValidationPipeline.validate()`, each wrapped in error isolation (try/catch with logging). Diagnostics are capped at `maxNumberOfProblems` (default 100). Large files (exceeding `largeFileThresholdKB`) skip phases 6–12 for performance:

```typescript
// services/validationPipeline.ts — ValidationPipeline.validate()
const diagnostics: Diagnostic[] = [];

// Phase 1-3: XML well-formedness + DITA structure + IDs
try { diagnostics.push(...validateDITADocument(document, settings)); }
catch (e) { this.log(`[validation] base validation failed: ${e}`); }

// Phase 4: Schema validation (DTD or RNG, mutually exclusive)
const useRng = this.rngValidation.isAvailable && settings.schemaFormat === 'rng';
if (!useRng && this.catalogValidation.isAvailable) { ... }
if (useRng) { ... }

// Phase 5: Cross-reference validation
if (settings.crossRefValidationEnabled !== false) { ... }

// Phase 6: Subject scheme registration
if (keySpaceService) { ... }

// Phase 7: Profiling attribute validation
if (settings.subjectSchemeValidationEnabled !== false) { ... }

// Phase 8: 43 DITA rules (Schematron-equivalent, version-filtered)
if (settings.ditaRulesEnabled !== false && !isLargeFile) { ... }

// Phase 9: Circular reference detection
if (settings.crossRefValidationEnabled !== false && !isLargeFile) { ... }

// Phase 10: Workspace-level checks (duplicate IDs, unused topics)
if (workspace.rootIdIndex.size > 0 && !isLargeFile) { ... }
if (workspace.unusedTopicPaths.size > 0 && !isLargeFile) { ... }

// Phase 11: Post-processing (severity overrides + comment suppression)
// 11a: Per-rule severity overrides from validationSeverityOverrides setting
// 11b: Comment-based rule suppression (ditacraft-disable/enable/disable-file)
applySeverityOverrides(diagnostics, settings.validationSeverityOverrides);
applyCommentSuppressions(diagnostics, text);

// Phase 12: Custom regex rules (user-defined JSON file)
if (settings.customRulesFile && !isLargeFile) { ... }

// Cap at maxNumberOfProblems
```

### 2.3 Comment/CDATA Stripping

All phases that analyze document content first strip comments and CDATA sections, replacing non-newline characters with spaces to preserve line/column offsets. Two variants are provided by `utils/textUtils.ts`:

```typescript
// Basic: strips comments and CDATA only
function stripCommentsAndCDATA(text: string): string {
    return text
        .replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n\r]/g, ' '))
        .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, (m) => m.replace(/[^\n\r]/g, ' '));
}

// Extended: also blanks code element content (codeblock, pre, screen, msgblock)
function stripCommentsAndCodeContent(text: string): string {
    return stripCommentsAndCDATA(text)
        .replace(/(<(codeblock|pre|screen|msgblock)\b[^>]*>)([\s\S]*?)(<\/\2>)/g,
            (_m, open, _tag, content, close) =>
                open + content.replace(/[^\n\r]/g, ' ') + close);
}
```

**Which variant to use:**
- `stripCommentsAndCodeContent` — Used by `validation.ts`, `crossRefValidation.ts`, `profilingValidation.ts` to prevent false positives from literal XML inside code examples
- `stripCommentsAndCDATA` — Used by `ditaRulesValidator.ts` (rules like SCH-041 need to inspect `<pre>` content) and `circularRefDetection.ts`, `workspaceValidation.ts`

---

## 3. Validation Phases

### Phase 1-3: XML Well-Formedness + Structure + IDs (`validation.ts`)

**Engine:** fast-xml-parser
**Trigger:** Every document change (debounced)
**Purpose:** Catch XML syntax errors (unclosed tags, mismatched tags, malformed attributes)

The DOCTYPE declaration is stripped before parsing (fast-xml-parser doesn't handle it), replaced with whitespace to preserve line offsets.

### Phase 4a: DTD Validation (`catalogValidationService.ts`)

**Engine:** TypesXML with OASIS XML Catalog
**Trigger:** Every document change (debounced)
**Purpose:** Validate document against its declared DTD

- Uses bundled DITA 1.3 DTDs at `<extensionPath>/dtds/`
- OASIS catalog at `<extensionPath>/dtds/catalog.xml` resolves PUBLIC identifiers
- Parser pool of 3 pre-configured instances for efficient reuse
- Shared catalog instance across all validations for grammar caching

### Phase 4b: RNG Validation (`rngValidationService.ts`)

**Engine:** salve-annos + saxes
**Trigger:** Every document change (debounced), when `schemaFormat` is `rng`
**Purpose:** Optional RelaxNG schema validation

- Grammar compilation with caching (max 20 schemas)
- Configurable schema path via `ditacraft.rngSchemaPath`
- Disabled by default (DTD is the default schema format)

### Phase 1-3 (continued): DITA Structure + ID Validation (`validation.ts`)

**Engine:** Regex-based analysis on raw text
**Trigger:** Every document change (debounced)
**Purpose:** DITA structural conformance

**Checks performed:**

| Check | File Types | Severity | Code |
|-------|-----------|----------|------|
| Missing DOCTYPE | .dita, .ditamap, .bookmap | Warning | DITA-STRUCT-001 |
| Invalid root element | all | Error | DITA-STRUCT-002 |
| Missing `id` on root | .dita | Error | DITA-STRUCT-003 |
| Empty `id` on root | .dita | Error | DITA-STRUCT-003 |
| Missing `<title>` | .dita (error), .ditamap (warning) | Error/Warning | DITA-STRUCT-004 |
| Empty elements (`<p>`, `<title>`, `<shortdesc>`) | all | Warning | DITA-STRUCT-005 |
| Missing `<booktitle>` | .bookmap | Warning | DITA-STRUCT-006 |
| Missing `<mainbooktitle>` | .bookmap (when `<booktitle>` exists) | Warning | DITA-STRUCT-007 |
| `<topicref>` without target | .ditamap, .bookmap | Info | DITA-STRUCT-008 |
| Duplicate IDs | all | Error | DITA-ID-001 |
| Invalid ID format | all | Warning | DITA-ID-002 |

**ID validation details:**
- Supports both double-quoted (`id="value"`) and single-quoted (`id='value'`) attributes
- Root elements (topic, map types) use XML ID rules: must start with letter/underscore
- Non-root elements use NMTOKEN rules: can start with digits
- IDs inside comments/CDATA are excluded

**Topicref validation details:**
- Warns when `<topicref>` lacks `href`, `keyref`, `keys`, `conref`, or `conkeyref`
- Self-closing `<topicref/>` elements are skipped (intentional grouping containers)
- Severity is Information (hint level) since href-less topicrefs are often legitimate

### Phase 8: DITA Rules Engine (`ditaRulesValidator.ts`)

**Engine:** 43 Schematron-equivalent rules implemented in TypeScript
**Trigger:** Every document change (debounced)
**Purpose:** DITA best practices, deprecated elements, accessibility

5 categories, version-filtered per DITA version (auto-detected from `@DITAArchVersion` or DOCTYPE):

| Category | Count | Examples |
|----------|-------|---------|
| **mandatory** | 4 | Missing `otherrole`, `othertype`; deprecated `<indextermref>`; `collection-type` misuse |
| **recommendation** | 8 | Deprecated elements/attributes; long `<shortdesc>`; `<topichead>` missing navtitle |
| **authoring** | 7 | `<xref>` in `<title>`; `<required-cleanup>`; trademark chars; multiple section titles |
| **accessibility** | 3 | Missing alt text on images/objects; abstract without shortdesc |
| **DITA 2.0 removal** | 13 | Removed elements (`<boolean>`, `<object>`, learning), removed attributes (`@print`, `@copy-to`) |

### Phase 5 + 7: Cross-References + Profiling

#### Phase 5: Cross-Reference Validation (`crossRefValidation.ts`)

Validates targets of `href`, `conref`, `keyref`, and `conkeyref` attributes:

| Code | Description |
|------|-------------|
| DITA-XREF-001 | Target file not found |
| DITA-XREF-002 | Topic ID not found in target |
| DITA-XREF-003 | Element ID not found in target |
| DITA-KEY-001 | Key not defined in any map |
| DITA-KEY-002 | Key has no target (no href on keydef) |
| DITA-KEY-003 | Element ID not found in key's target |

#### Phase 7: Profiling Validation (`profilingValidation.ts`)

Validates profiling attribute values against subject scheme controlled vocabularies:

| Code | Description |
|------|-------------|
| DITA-PROF-001 | Attribute value not allowed by subject scheme |

### Phase 9: Circular Reference Detection (`circularRefDetection.ts`)

**Engine:** DFS traversal with path tracking
**Trigger:** Every document change (debounced), when cross-ref validation is enabled
**Purpose:** Detect href/conref/mapref cycles that would cause infinite processing

Uses depth-first search to follow structural references (topicref, mapref, chapter, etc.) and conref attributes. Only follows DITA files (.dita, .ditamap, .bookmap). Maximum traversal depth of 50 to prevent runaway DFS on deep hierarchies.

| Code | Description |
|------|-------------|
| DITA-CYCLE-001 | Circular reference detected (displays the cycle path) |

### Phase 10: Workspace-Level Checks (`workspaceValidation.ts`)

**Engine:** Workspace-wide file scanning
**Trigger:** On-demand via `ditacraft.validateWorkspace` command
**Purpose:** Cross-file duplicate ID detection and unused topic detection

Requires explicit workspace validation command to build indices. Results are used by the pipeline for subsequent file validations until DITA files change.

| Code | Description |
|------|-------------|
| DITA-ID-003 | Cross-file duplicate root element ID |
| DITA-ORPHAN-001 | Topic file not referenced by any map |

### Phase 11: Post-Processing (Severity Overrides + Comment Suppression)

**Engine:** Pipeline post-processing
**Trigger:** After all diagnostic-producing phases complete
**Purpose:** Allow users to customize diagnostic severity and suppress rules inline

#### 11a: Per-Rule Severity Overrides

Configured via `ditacraft.validationSeverityOverrides` setting. Maps diagnostic codes to severity levels:

```json
{
    "ditacraft.validationSeverityOverrides": {
        "DITA-SCH-001": "hint",
        "DITA-ID-002": "off",
        "DITA-STRUCT-005": "error"
    }
}
```

Supported values: `"error"`, `"warning"`, `"information"`, `"hint"`, `"off"` (suppresses the diagnostic entirely).

#### 11b: Comment-Based Rule Suppression

Three directives are supported as XML comments:

| Directive | Scope |
|-----------|-------|
| `<!-- ditacraft-disable CODE [CODE2...] -->` | Suppresses codes from this line until a matching `enable` |
| `<!-- ditacraft-enable CODE [CODE2...] -->` | Re-enables suppressed codes from this line |
| `<!-- ditacraft-disable-file CODE [CODE2...] -->` | Suppresses codes for the entire file |

Suppression uses a range-based approach with exclusive `endLine` (the `enable` comment line is not suppressed). The parser is CRLF-aware, handling `\r\n`, `\r`, and `\n` line endings.

### Phase 12: Custom Regex Rules (`customRulesValidator.ts`)

**Engine:** User-defined regex patterns from a JSON file
**Trigger:** Every document change (debounced), when `customRulesFile` is set
**Purpose:** Allow users to define project-specific validation rules

The JSON file contains an array of rule definitions:

```json
{
    "rules": [
        {
            "id": "CUSTOM-001",
            "pattern": "<draft-comment\\b",
            "message": "Draft comments should be removed before publishing",
            "severity": "warning",
            "fileTypes": ["topic", "concept", "task", "reference"]
        }
    ]
}
```

Features:
- **fileType filtering**: Rules can target specific DITA file types (topic, concept, task, reference, glossentry, troubleshooting, map, bookmap)
- **mtime-based caching**: Rules file is re-read only when the file modification time changes
- **Comment immunity**: Patterns are matched against content with comments and CDATA stripped
- **Severity mapping**: Supports `"error"`, `"warning"`, `"information"`, `"hint"`

### Large File Optimization

Files exceeding `ditacraft.largeFileThresholdKB` (default 500 KB, 0 = disabled) skip phases 6–12 for performance. A single informational diagnostic is emitted:

| Code | Description |
|------|-------------|
| DITA-PERF-001 | Some validation checks were skipped for performance |

---

## 4. Diagnostic Codes

### Complete Code Reference

| Code | Phase | Severity | Description |
|------|-------|----------|-------------|
| DITA-XML-001 | 1-3 | Error | XML well-formedness violation |
| DITA-STRUCT-001 | 1-3 | Warning | Missing DOCTYPE declaration |
| DITA-STRUCT-002 | 1-3 | Error | Invalid root element for file type |
| DITA-STRUCT-003 | 1-3 | Error | Missing/empty `id` on root element |
| DITA-STRUCT-004 | 1-3 | Error/Warning | Missing `<title>` element |
| DITA-STRUCT-005 | 1-3 | Warning | Empty element |
| DITA-STRUCT-006 | 1-3 | Warning | Missing `<booktitle>` in bookmap |
| DITA-STRUCT-007 | 1-3 | Warning | Missing `<mainbooktitle>` in booktitle |
| DITA-STRUCT-008 | 1-3 | Info | `<topicref>` without target attribute |
| DITA-ID-001 | 1-3 | Error | Duplicate `id` attribute |
| DITA-ID-002 | 1-3 | Warning | Invalid ID format |
| DITA-DTD-001 | 4 | Error | DTD validation error |
| DITA-XREF-001..003 | 5 | Warning | Cross-reference target issues |
| DITA-KEY-001..003 | 5 | Warning | Key resolution issues |
| DITA-PROF-001 | 7 | Warning | Profiling value not allowed |
| DITA-SCH-001..046 | 8 | Various | DITA rules (43 codes) |
| DITA-SCH-050..059 | 8 | Various | DITA 2.0 removal rules (10 codes) |
| DITA-CYCLE-001 | 9 | Warning | Circular reference detected |
| DITA-ID-003 | 10 | Warning | Cross-file duplicate root ID |
| DITA-ORPHAN-001 | 10 | Info | Unused topic (not referenced by any map) |
| DITA-PERF-001 | — | Info | Heavy validation phases skipped (large file) |
| CUSTOM-* | 12 | Various | User-defined custom regex rules |

---

## 5. Error Reporting

### 5.1 Diagnostic Range Precision

Diagnostics use two range strategies:

1. **Full-line ranges** — `createRange(line, col)` returns `Range(line, col, line, col + 1000)`. VS Code clamps to end-of-line, producing a visible full-line underline.

2. **Exact match ranges** — `offsetToRange(text, start, end)` converts byte offsets to LSP positions with CRLF-aware line/column computation, producing precise underlines on the matched text.

### 5.2 Localization

All 80+ diagnostic messages are localized via the `t()` function with parameterized message keys:

- English: `server/src/messages/en.json`
- French: `server/src/messages/fr.json`
- Auto-detected from VS Code display language via LSP `locale` parameter

### 5.3 Deduplication

- **LSP is the sole real-time provider** — Client-side on-save auto-validation was disabled in v0.6.2
- **Diagnostics View** — Deduplicates by composite key: `file:line:col:severity:message`
- **Stale cleanup** — Client-side `dita` diagnostics from manual validation are cleared on save

---

## 6. Configuration

### 6.1 LSP Server Settings

| Setting | Type | Default | Purpose |
|---------|------|---------|---------|
| `maxNumberOfProblems` | number | 100 | Max diagnostics per file |
| `ditaRulesEnabled` | boolean | true | Enable DITA rules engine |
| `ditaRulesCategories` | string[] | all 5 | Rule categories to activate |
| `crossRefValidationEnabled` | boolean | true | Validate cross-references |
| `subjectSchemeValidationEnabled` | boolean | true | Validate profiling values |
| `ditaVersion` | string | `auto` | DITA version for rule filtering |
| `schemaFormat` | string | `dtd` | Schema format: `dtd` or `rng` |
| `rngSchemaPath` | string | `""` | Custom RNG schema file path |
| `validationSeverityOverrides` | object | `{}` | Per-rule severity overrides (code → severity/off) |
| `customRulesFile` | string | `""` | Absolute path to custom regex rules JSON file |
| `largeFileThresholdKB` | number | `500` | Skip heavy phases for files above this size (0 = disabled) |

### 6.2 Client-Side Settings

| Setting | Type | Default | Purpose |
|---------|------|---------|---------|
| `validationEngine` | string | `typesxml` | Engine for manual validation |
| `autoValidate` | boolean | true | Enable auto-validation (legacy, used by LSP debouncing) |
| `validationDebounceMs` | number | 300 | Client-side debounce (legacy) |

---

## 7. Approaches Considered

This section preserves the original analysis from v1.0 (January 2025) for reference.

### 7.1 Built-in XML Parser

**Status:** Implemented as Layer 1 (fast-xml-parser for well-formedness)

Used for real-time XML syntax checking. Cannot validate DTD/Schema, but fast enough for as-you-type feedback.

### 7.2 xmllint (libxml2)

**Status:** Available as client-side validation engine option

Full DTD/XSD validation but requires external installation. Superseded by TypesXML for zero-dependency DTD validation.

### 7.3 DITA-OT Validation

**Status:** Not implemented for validation (used for publishing only)

Too slow for real-time validation (2-10 seconds). Would provide the most comprehensive checks but the LSP 6-layer approach covers most use cases without external dependencies.

### 7.4 TypesXML DTD Validation

**Status:** Implemented as Layer 2

Pure TypeScript DTD validator with OASIS XML Catalog support. Bundled DITA 1.3 DTDs provide zero-configuration validation. 100% W3C XML Conformance Test Suite compliance.

### 7.5 RelaxNG Validation

**Status:** Implemented as Layer 3 (optional)

Via salve-annos + saxes. More expressive than DTDs. Grammar caching for performance. User-configurable schema path.

### 7.6 Schematron-Equivalent Rules

**Status:** Implemented as Layer 5

43 rules in TypeScript instead of XML Schematron format. No external processor needed. Version-filtered. Covers deprecated elements, accessibility, authoring best practices.

### 7.7 Custom DITA Language Server

**Status:** Fully implemented (v0.5.0+)

Full LSP with 14 language features. The original estimate of "3-6 months" proved accurate — development spanned from v0.5.0 through v0.6.2.

---

## 8. Implementation History

| Phase | Version | What was delivered |
|-------|---------|-------------------|
| Phase 1 | v0.4.1 | TypesXML DTD validation with bundled DITA 1.3 DTDs |
| Phase 2 | v0.5.0 | Full LSP server with 14 features, Layer 1+4 validation |
| Phase 3 | v0.6.0 | Layers 5+6: DITA rules (22), cross-refs, profiling, subject scheme |
| Phase 4 | v0.6.1 | Layer 2+3: Catalog + RNG services, i18n, 43 rules, DITA 2.0 |
| Phase 5 | v0.6.2 | Validation dedup, bookmap/topicref checks, improved error ranges, single-quote IDs |
| Phase 6 | v0.7.0 | ValidationPipeline extraction, shared utilities (textUtils, patterns), error isolation, circular ref + workspace checks, 461 server tests |
| Phase 7 | v0.7.1 | Guide validation, DITA-OT error catalog (160+ codes), validation report WebView, 559 server tests |
| Phase 8 | v0.7.2 | Severity overrides, comment suppression, custom regex rules, large file optimization, 3 new quick fixes (12 total), DITA 2.0 test coverage, 697 server tests |

### Requirements Status

| ID | Requirement | Status |
|----|-------------|--------|
| V-01 | XML well-formedness | **Done** (Layer 1) |
| V-02 | DTD validation | **Done** (Layer 2) |
| V-03 | Accurate line/column | **Done** (offsetToRange, findLineAndColumn) |
| V-04 | No external dependencies | **Done** (all bundled) |
| V-05 | DITA-specific constraints | **Done** (Layer 4+5) |
| V-06 | Cross-file references | **Done** (Layer 6a) |
| V-07 | Specialization support | **Done** (@class matching) |
| V-08 | Real-time validation | **Done** (smart debouncing) |
| V-09 | Batch validation | Planned |
| V-10 | Custom validation rules | **Done** (Phase 12: regex rules from JSON) |

---

## 9. Remaining Work

| Feature | Priority | Description |
|---------|----------|-------------|
| Batch validation | P2 | Validate entire workspace with progress reporting |
| DITA-OT validation option | P3 | "Piggy-back" approach for comprehensive pre-publish checks |
| ~~External catalog configuration~~ | ~~P3~~ | ~~Allow users to point to custom DTD catalogs~~ — **Done** (`ditacraft.xmlCatalogPath`) |
| ~~Custom validation rules~~ | ~~P3~~ | ~~User-defined rules via configuration~~ — **Done** (Phase 12: `ditacraft.customRulesFile`) |
| ~~DITA 1.2 / 2.0 DTDs~~ | ~~P3~~ | ~~Additional bundled DTD versions~~ — **Done** (bundled 1.2, 1.3, 2.0) |
| LightweightDITA | P3 | Support LwDITA (MDITA, HDITA) validation |

---

## Appendix A: DITA-OT Error Codes

Common DITA-OT error codes for reference:

| Code | Type | Description |
|------|------|-------------|
| DOTX001E | Error | File not found |
| DOTX002E | Error | Parse error in file |
| DOTX003E | Error | Invalid element in context |
| DOTX012W | Warning | Missing navtitle |
| DOTX013W | Warning | Missing short description |
| DOTJ003E | Error | Java processing error |
| DOTJ007I | Info | Processing file |

---

## Appendix B: XML Catalog Example

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE catalog PUBLIC "-//OASIS//DTD XML Catalogs V1.1//EN"
  "http://www.oasis-open.org/committees/entity/release/1.1/catalog.dtd">
<catalog xmlns="urn:oasis:names:tc:entity:xmlns:xml:catalog"
         prefer="public">

  <!-- DITA 1.3 DTDs -->
  <delegatePublic publicIdStartString="-//OASIS//DTD DITA"
    catalog="file:///path/to/dita-1.3/catalog-dita.xml"/>

  <!-- DITA 1.2 DTDs (fallback) -->
  <delegatePublic publicIdStartString="-//OASIS//DTD DITA 1.2"
    catalog="file:///path/to/dita-1.2/catalog-dita.xml"/>

</catalog>
```

---

## Appendix C: References

- [DITA Open Toolkit](https://www.dita-ot.org/)
- [OASIS DITA TC](https://www.oasis-open.org/committees/dita/)
- [libxml2 / xmllint](http://xmlsoft.org/)
- [LemMinX XML Language Server](https://github.com/eclipse/lemminx)
- [Schematron](http://schematron.com/)
- [TypesXML](https://github.com/nicolo-ribaudo/typesxml)
- [salve-annos](https://github.com/lddubeau/salve-annos)
- [ACM SIGDOC Structured Content](https://acm-sigdoc-structured.org/)

---

*Last updated: March 2026 (v0.7.2 — 12-phase ValidationPipeline with severity overrides, comment suppression, custom rules, large file optimization)*
