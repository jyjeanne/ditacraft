# DitaCraft Validation Specification

**Version:** 2.0
**Date:** March 2026
**Status:** Implemented
**Author:** Jeremy Jeanne

---

## Executive Summary

This document describes the validation architecture implemented in DitaCraft v0.6.2. The system uses a **6-layer LSP-based validation pipeline** running in a dedicated Language Server process, providing real-time diagnostics as the user types.

The original spec (v1.0, January 2025) explored different validation approaches. The chosen architecture combines a custom DITA Language Server with TypesXML DTD validation, optional RelaxNG validation, a 35-rule Schematron-equivalent engine, cross-reference validation, and profiling/subject scheme validation — all running in real-time with smart debouncing.

This document was originally prompted by feedback from Stan Doherty (OASIS DITA TC member, ACM SIGDOC) who noted that the built-in validation engine was insufficient and suggested exploring DITA-OT-based validation. The implemented solution goes beyond that suggestion by providing real-time, zero-dependency validation with bundled DTDs.

---

## Table of Contents

1. [Implemented Architecture](#1-implemented-architecture)
2. [Validation Pipeline](#2-validation-pipeline)
3. [Validation Layers](#3-validation-layers)
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
│  │                 6-Layer Validation Pipeline                 │  │
│  │                                                            │  │
│  │  Layer 1: XML well-formedness        (fast-xml-parser)     │  │
│  │  Layer 2: DTD validation             (TypesXML + catalog)  │  │
│  │  Layer 3: RNG validation             (salve-annos, opt.)   │  │
│  │  Layer 4: DITA structure + IDs       (validation.ts)       │  │
│  │  Layer 5: 35 DITA rules              (ditaRulesValidator)  │  │
│  │  Layer 6: Cross-refs + profiling     (crossRef + profiling)│  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### 1.2 Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| LSP as sole real-time provider | Eliminates duplicate diagnostics; client-side on-save validation disabled in v0.6.2 |
| Pull-based diagnostics (LSP 3.17) | Client requests diagnostics; server responds with `DocumentDiagnosticReportKind.Full` |
| Smart debouncing per file type | 300ms for topics (fast feedback), 1000ms for maps (heavier processing) |
| Per-document cancellation | Typing cancels stale validation for the same document |
| Bundled DITA 1.3 DTDs | Zero-configuration; OASIS catalog resolves PUBLIC identifiers |
| Comment/CDATA stripping | All layers operate on cleaned text; line structure preserved for offset accuracy |

### 1.3 Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| LSP Framework | vscode-languageserver 9.x | JSON-RPC, document sync, capability negotiation |
| XML Parsing | fast-xml-parser | Layer 1: well-formedness checking |
| DTD Validation | TypesXML + OASIS Catalog | Layer 2: full DTD validation with public ID resolution |
| RNG Validation | salve-annos + saxes | Layer 3: optional RelaxNG schema validation |
| Regex Engine | Built-in RegExp | Layers 4-6: structure, rules, cross-refs |
| i18n | Custom t() with JSON bundles | 70 diagnostic messages in English + French |

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

Each layer runs sequentially. Diagnostics are capped at `maxNumberOfProblems` (default 100):

```typescript
// server.ts — pull diagnostics handler
const diagnostics: Diagnostic[] = [];

// Layer 1+4: XML well-formedness + DITA structure + IDs
diagnostics.push(...validateDITADocument(textDocument, settings));

// Layer 2: DTD validation (TypesXML + OASIS catalog)
if (catalogValidationService.isAvailable) {
    diagnostics.push(...catalogValidationService.validate(text));
}

// Layer 3: RNG validation (optional)
if (rngValidationService.isAvailable && settings.schemaFormat === 'rng') {
    diagnostics.push(...rngValidationService.validate(text));
}

// Layer 5: 35 DITA rules (Schematron-equivalent)
if (settings.ditaRulesEnabled) {
    diagnostics.push(...validateDitaRules(text, settings));
}

// Layer 6a: Cross-reference validation
if (settings.crossRefValidationEnabled) {
    diagnostics.push(...validateCrossReferences(text, uri, ...));
}

// Layer 6b: Profiling/subject scheme validation
if (settings.subjectSchemeValidationEnabled) {
    diagnostics.push(...validateProfilingAttributes(text, ...));
}
```

### 2.3 Comment/CDATA Stripping

All layers that analyze document content first strip comments and CDATA sections, replacing non-newline characters with spaces to preserve line/column offsets:

```typescript
function stripCommentsAndCDATA(text: string): string {
    return text
        .replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n\r]/g, ' '))
        .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, (m) => m.replace(/[^\n\r]/g, ' '));
}
```

---

## 3. Validation Layers

### Layer 1: XML Well-Formedness (`validation.ts`)

**Engine:** fast-xml-parser
**Trigger:** Every document change (debounced)
**Purpose:** Catch XML syntax errors (unclosed tags, mismatched tags, malformed attributes)

The DOCTYPE declaration is stripped before parsing (fast-xml-parser doesn't handle it), replaced with whitespace to preserve line offsets.

### Layer 2: DTD Validation (`catalogValidationService.ts`)

**Engine:** TypesXML with OASIS XML Catalog
**Trigger:** Every document change (debounced)
**Purpose:** Validate document against its declared DTD

- Uses bundled DITA 1.3 DTDs at `<extensionPath>/dtds/`
- OASIS catalog at `<extensionPath>/dtds/catalog.xml` resolves PUBLIC identifiers
- Parser pool of 3 pre-configured instances for efficient reuse
- Shared catalog instance across all validations for grammar caching

### Layer 3: RNG Validation (`rngValidationService.ts`)

**Engine:** salve-annos + saxes
**Trigger:** Every document change (debounced), when `schemaFormat` is `rng`
**Purpose:** Optional RelaxNG schema validation

- Grammar compilation with caching (max 20 schemas)
- Configurable schema path via `ditacraft.rngSchemaPath`
- Disabled by default (DTD is the default schema format)

### Layer 4: DITA Structure + ID Validation (`validation.ts`)

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

### Layer 5: DITA Rules Engine (`ditaRulesValidator.ts`)

**Engine:** 35 Schematron-equivalent rules implemented in TypeScript
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

### Layer 6: Cross-References + Profiling

#### 6a: Cross-Reference Validation (`crossRefValidation.ts`)

Validates targets of `href`, `conref`, `keyref`, and `conkeyref` attributes:

| Code | Description |
|------|-------------|
| DITA-XREF-001 | Target file not found |
| DITA-XREF-002 | Topic ID not found in target |
| DITA-XREF-003 | Element ID not found in target |
| DITA-KEY-001 | Key not defined in any map |
| DITA-KEY-002 | Key has no target (no href on keydef) |
| DITA-KEY-003 | Element ID not found in key's target |

#### 6b: Profiling Validation (`profilingValidation.ts`)

Validates profiling attribute values against subject scheme controlled vocabularies:

| Code | Description |
|------|-------------|
| DITA-PROF-001 | Attribute value not allowed by subject scheme |

---

## 4. Diagnostic Codes

### Complete Code Reference

| Code | Layer | Severity | Description |
|------|-------|----------|-------------|
| DITA-XML-001 | 1 | Error | XML well-formedness violation |
| DITA-DTD-001 | 2 | Error | DTD validation error |
| DITA-STRUCT-001 | 4 | Warning | Missing DOCTYPE declaration |
| DITA-STRUCT-002 | 4 | Error | Invalid root element for file type |
| DITA-STRUCT-003 | 4 | Error | Missing/empty `id` on root element |
| DITA-STRUCT-004 | 4 | Error/Warning | Missing `<title>` element |
| DITA-STRUCT-005 | 4 | Warning | Empty element |
| DITA-STRUCT-006 | 4 | Warning | Missing `<booktitle>` in bookmap |
| DITA-STRUCT-007 | 4 | Warning | Missing `<mainbooktitle>` in booktitle |
| DITA-STRUCT-008 | 4 | Info | `<topicref>` without target attribute |
| DITA-ID-001 | 4 | Error | Duplicate `id` attribute |
| DITA-ID-002 | 4 | Warning | Invalid ID format |
| DITA-SCH-001..046 | 5 | Various | DITA rules (35 codes) |
| DITA-SCH-050..059 | 5 | Various | DITA 2.0 removal rules (10 codes) |
| DITA-XREF-001..003 | 6a | Warning | Cross-reference target issues |
| DITA-KEY-001..003 | 6a | Warning | Key resolution issues |
| DITA-PROF-001 | 6b | Warning | Profiling value not allowed |

---

## 5. Error Reporting

### 5.1 Diagnostic Range Precision

Diagnostics use two range strategies:

1. **Full-line ranges** — `createRange(line, col)` returns `Range(line, col, line, col + 1000)`. VS Code clamps to end-of-line, producing a visible full-line underline.

2. **Exact match ranges** — `offsetToRange(text, start, end)` converts byte offsets to LSP positions with CRLF-aware line/column computation, producing precise underlines on the matched text.

### 5.2 Localization

All 70 diagnostic messages are localized via the `t()` function with parameterized message keys:

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

35 rules in TypeScript instead of XML Schematron format. No external processor needed. Version-filtered. Covers deprecated elements, accessibility, authoring best practices.

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
| Phase 4 | v0.6.1 | Layer 2+3: Catalog + RNG services, i18n, 35 rules, DITA 2.0 |
| Phase 5 | v0.6.2 | Validation dedup, bookmap/topicref checks, improved error ranges, single-quote IDs |

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
| V-10 | Custom validation rules | Planned |

---

## 9. Remaining Work

| Feature | Priority | Description |
|---------|----------|-------------|
| Batch validation | P2 | Validate entire workspace with progress reporting |
| DITA-OT validation option | P3 | "Piggy-back" approach for comprehensive pre-publish checks |
| External catalog configuration | P3 | Allow users to point to custom DTD catalogs |
| Custom validation rules | P3 | User-defined rules via configuration |
| DITA 1.2 / 2.0 DTDs | P3 | Additional bundled DTD versions |
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

*Last updated: March 2026 (v0.6.2 — 6-layer LSP validation pipeline fully implemented)*
