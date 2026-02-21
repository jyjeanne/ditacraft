# DitaCraft LSP Architecture

## Overview

DitaCraft is a VS Code extension providing a full-featured Language Server Protocol (LSP) implementation for DITA XML authoring. The server is written in TypeScript and runs as a Node.js process communicating with the VS Code client via IPC.

**Stack:** TypeScript · vscode-languageserver 9.x · Node.js IPC transport · Mocha (TDD)

---

## Folder Structure

```
server/
├── src/
│   ├── server.ts                        # LSP entry point and handler wiring
│   ├── settings.ts                      # Per-document configuration management
│   │
│   ├── features/                        # LSP feature handlers (one file per capability)
│   │   ├── validation.ts                #   XML well-formedness + DITA structure + ID checks
│   │   ├── completion.ts                #   Element, attribute, value, keyref, href completions
│   │   ├── hover.ts                     #   Element docs, key metadata, href resolution
│   │   ├── codeActions.ts               #   Quick fixes for diagnostics
│   │   ├── symbols.ts                   #   Document outline + workspace symbol search
│   │   ├── definition.ts                #   Go-to-definition for href/conref/keyref
│   │   ├── references.ts               #   Find all references to an ID
│   │   ├── rename.ts                    #   Workspace-wide ID rename
│   │   ├── formatting.ts               #   Context-aware XML pretty-printing
│   │   ├── folding.ts                   #   Code folding ranges
│   │   ├── linkedEditing.ts            #   Synchronized open/close tag editing
│   │   ├── documentLinks.ts            #   Clickable href/conref/keyref links
│   │   ├── crossRefValidation.ts       #   Cross-file reference validation
│   │   ├── ditaRulesValidator.ts       #   Schematron-equivalent DITA rules engine
│   │   └── profilingValidation.ts      #   Subject scheme controlled value validation
│   │
│   ├── services/                        # Domain services with caching
│   │   ├── keySpaceService.ts           #   DITA key space resolution (BFS map traversal)
│   │   └── subjectSchemeService.ts      #   Subject scheme parsing and value constraints
│   │
│   ├── utils/                           # Shared utilities
│   │   ├── xmlTokenizer.ts              #   Error-tolerant state-machine XML tokenizer
│   │   ├── referenceParser.ts           #   Parse and locate href/conref/keyref values
│   │   ├── workspaceScanner.ts          #   Collect DITA files, cross-file search
│   │   └── ditaVersionDetector.ts       #   Detect DITA version from content
│   │
│   └── data/                            # Static schema data
│       ├── ditaSchema.ts                #   Element hierarchy, attributes, documentation
│       └── ditaSpecialization.ts        #   DITA @class attribute matching
│
└── test/                                # Mocha TDD tests (398 tests)
    ├── helper.ts                        #   Test utilities (mock documents)
    ├── validation.test.ts
    ├── completion.test.ts
    ├── hover.test.ts
    ├── codeActions.test.ts
    ├── symbols.test.ts
    ├── linkedEditing.test.ts
    ├── formatting.test.ts
    ├── folding.test.ts
    ├── crossRefValidation.test.ts
    ├── ditaRulesValidator.test.ts
    ├── profilingValidation.test.ts
    ├── referenceParser.test.ts
    ├── subjectSchemeService.test.ts
    ├── ditaSpecialization.test.ts
    ├── ditaVersionDetector.test.ts
    ├── workspaceScanner.test.ts
    └── xmlTokenizer.test.ts
```

---

## Core Concepts

### LSP Server Lifecycle

`server.ts` is the entry point. It creates an IPC connection, initializes services, and registers all feature handlers:

```
Client (VS Code)  ──IPC──>  server.ts  ──delegates──>  features/*
                                │
                                ├── KeySpaceService    (key resolution, map traversal)
                                ├── SubjectSchemeService (controlled values)
                                └── TextDocuments       (open document cache)
```

On initialization, the server:
1. Detects client capabilities (`workspace.configuration`, `workspaceFolders`)
2. Creates the `KeySpaceService` with workspace folder paths
3. Creates the `SubjectSchemeService` singleton
4. Registers all LSP handlers

### Document Validation Pipeline

Diagnostics are pull-based (the client requests them). The pipeline runs in order:

```
Document change
  └─> validateDITADocument()          Phase 1: XML well-formedness (fast-xml-parser)
        │                             Phase 2: DITA structure (root, id, title)
        │                             Phase 3: ID validation (duplicates, format)
        └─> cap at maxNumberOfProblems
  └─> validateDitaRules()             Phase 4: Schematron-equivalent rules (18 rules)
  └─> validateCrossReferences()       Phase 5: href/conref/keyref target validation
  └─> validateProfilingAttributes()   Phase 6: Subject scheme controlled values
```

Each phase uses **comment/CDATA stripping** to avoid matching inside non-content regions. The stripping replaces non-newline characters with spaces to preserve offsets for accurate diagnostic positioning.

### Key Space Resolution

DITA keys are defined in `.ditamap` files and resolved transitively through map hierarchies. The `KeySpaceService` handles this:

1. **Root map discovery** — walks up from a file's directory looking for `.ditamap` files
2. **BFS map traversal** — reads the root map, follows `<mapref>` and `<topicref>` with href, collecting all `<keydef>` elements
3. **Key metadata extraction** — for each keydef, extracts `href`, `navtitle`, `keywords`, `shortdesc`, and inline content
4. **Subject scheme detection** — identifies `subjectScheme` maps during traversal and registers them

Results are cached per root map with a configurable TTL (default 5 minutes).

### Context Detection for Completions

The completion provider determines what to suggest based on cursor context:

| Context | Trigger | Source |
|---------|---------|--------|
| Element name | `<` inside a parent element | `DITA_ELEMENTS` schema (parent → children) |
| Attribute name | Space inside an opening tag | `COMMON_ATTRIBUTES` + element-specific attributes |
| Attribute value | Inside `"..."` of a known attribute | Static enums, keyref names, subject scheme values, file paths |

Context detection uses backward scanning from the cursor offset to find enclosing tags, quotes, and attribute names.

---

## LSP Capabilities

| Capability | Handler | Sync/Async |
|------------|---------|------------|
| Pull Diagnostics | `validateDITADocument` + async validators | Async |
| Completion | `handleCompletion` | Async |
| Hover | `handleHover` | Async |
| Document Symbols | `handleDocumentSymbol` | Sync |
| Workspace Symbols | `handleWorkspaceSymbol` | Sync |
| Go to Definition | `handleDefinition` | Async |
| Find References | `handleReferences` | Sync |
| Rename | `handleRename` / `handlePrepareRename` | Sync |
| Document Formatting | `handleFormatting` | Sync |
| Code Actions | `handleCodeActions` | Sync |
| Folding Ranges | `handleFoldingRanges` | Sync |
| Document Links | `handleDocumentLinks` / `handleDocumentLinkResolve` | Async |
| Linked Editing | `handleLinkedEditingRange` | Sync |

**Completion trigger characters:** `<`, ` `, `"`, `=`, `/`, `#`

---

## Patterns and Techniques

### Regex-Based Text Analysis

Most features operate on raw document text via regex rather than building a full AST. This is a deliberate choice:
- DITA documents are often malformed during editing — regex tolerates partial content
- Regex is fast for single-pass scanning
- Comment/CDATA regions are neutralized beforehand by replacing content with spaces (preserving offsets)

**Example pattern — attribute extraction:**
```
/\b(href|conref)\s*=\s*["']([^"']+)["']/g
```

### State Machine Tokenizer

`xmlTokenizer.ts` implements a full error-tolerant XML tokenizer using a state machine with 8 states:

```
CONTENT → START_ELEM → ATTRS → ATTR_VALUE
                     → END_ELEM
        → COMMENT
        → DOCTYPE
        → PI (Processing Instruction)
```

The tokenizer is a **generator function** (`function* tokenize()`) that yields typed `Token` objects with 0-based line/column tracking. It recovers from:
- Missing closing quotes on attributes
- Missing `>` at end of tags
- `<` inside attribute values
- Unclosed comments and processing instructions

Two helper functions build on the tokenizer:
- `findAttributeAtOffset()` — returns the attribute name/value at a cursor position
- `findContextAtOffset()` — returns the syntactic context (element-name, attribute-name, attribute-value, content, comment, cdata, pi)

### Stack-Based Tag Matching

Several features track XML nesting using a tag stack:

1. **Completion** — `findParentElement()` scans backward to determine the enclosing element
2. **Document Symbols** — builds a hierarchical outline by pushing/popping elements
3. **Linked Editing** — uses a depth counter to match nested same-name tags
4. **Folding** — pairs opening and closing tags via a stack

### BFS Map Traversal

`KeySpaceService.doBuildKeySpace()` performs breadth-first traversal of DITA map hierarchies:

```
Root map
  ├─ keydef (keys="k1" href="topic.dita")        → collected
  ├─ mapref (href="submap.ditamap")               → enqueued
  │   ├─ keydef (keys="k2" href="concept.dita")   → collected
  │   └─ topicref (href="ref.dita")               → skipped (no keys)
  └─ mapref (href="scheme.subjectscheme.ditamap") → detected as subject scheme
```

### Binary Search for Line Lookup

`folding.ts` pre-computes line start offsets and uses binary search (`lineAtOffset()`) to convert byte offsets to line numbers in O(log n).

### Service Pattern with Caching

Both `KeySpaceService` and `SubjectSchemeService` follow the same pattern:
- **Parse on demand** with per-file caching and TTL
- **Invalidate** on file watcher events (debounced 300ms)
- **Merge** results from multiple sources (multiple maps, multiple schemes)
- **Promise deduplication** — concurrent requests for the same build share one Promise

---

## Validation Rules

### Structural Rules (validation.ts)

| Code | Severity | Description |
|------|----------|-------------|
| DITA-XML-001 | Error | XML well-formedness violation |
| DITA-STRUCT-001 | Warning | Missing DOCTYPE declaration |
| DITA-STRUCT-002 | Error | Invalid root element for file type |
| DITA-STRUCT-003 | Error | Missing `id` on root element |
| DITA-STRUCT-004 | Error/Warning | Missing `<title>` element |
| DITA-STRUCT-005 | Warning | Empty element (`<p></p>`, `<title></title>`) |
| DITA-ID-001 | Error | Duplicate `id` attribute value |
| DITA-ID-002 | Warning | Invalid ID format (XML ID or NMTOKEN) |

### Schematron-Equivalent Rules (ditaRulesValidator.ts)

18 rules organized into 4 categories, filtered by DITA version:

| Category | Rules | Severity |
|----------|-------|----------|
| **mandatory** | `role="other"` requires `otherrole`, `note type="other"` requires `othertype`, deprecated `<indextermref>`, `collection-type` not on `reltable` | Error |
| **recommendation** | Deprecated elements (`<boolean>`), deprecated attributes (`alt`, `longdescref`, `query`, `navtitle`, `title` on `<map>`), long `<shortdesc>`, `<topichead>` missing navtitle | Warning |
| **authoring** | `<xref>` inside `<title>`, `<required-cleanup>` present, trademark characters as plain text, multiple `<title>` in `<section>` | Warning |
| **accessibility** | `<image>` missing alt text, `<object>` missing `<desc>` | Warning |

### Cross-Reference Rules (crossRefValidation.ts)

| Code | Description |
|------|-------------|
| DITA-XREF-001 | Target file not found |
| DITA-XREF-002 | Topic ID not found in target |
| DITA-XREF-003 | Element ID not found in target |
| DITA-KEY-001 | Key not defined in any map |
| DITA-KEY-002 | Key has no target (no href on keydef) |
| DITA-KEY-003 | Element ID not found in key's target |

### Profiling Rules (profilingValidation.ts)

| Code | Description |
|------|-------------|
| DITA-PROF-001 | Attribute value not allowed by subject scheme |

---

## Quick Fixes (Code Actions)

| Diagnostic | Action |
|------------|--------|
| DITA-STRUCT-001 | Insert DOCTYPE declaration matching root element |
| DITA-STRUCT-003 | Add `id` attribute derived from filename |
| DITA-STRUCT-004 | Insert `<title></title>` after root opening tag |
| DITA-STRUCT-005 | Remove empty element and surrounding whitespace |
| DITA-ID-001 | Rename duplicate ID with random suffix |
| DITA-SCH-001 | Add `otherrole=""` attribute |
| DITA-SCH-003 | Remove deprecated `<indextermref>` element |
| DITA-SCH-011 | Convert `alt` attribute to `<alt>` child element |
| DITA-SCH-030 | Add empty `<alt></alt>` to `<image>` |

---

## Data Layer

### ditaSchema.ts

Static schema data providing the DITA content model:

- **`DITA_ELEMENTS`** — Maps parent element names to allowed children (~200 elements)
- **`ELEMENT_ATTRIBUTES`** — Maps element names to their specific attributes
- **`COMMON_ATTRIBUTES`** — Attributes shared by all DITA elements (id, class, outputclass, etc.)
- **`ATTRIBUTE_VALUES`** — Enumerated value lists for known attributes
- **`ELEMENT_DOCS`** — Markdown documentation strings for hover

### ditaSpecialization.ts

DITA specialization matching using the `@class` attribute:

- **`DitaClassMatcher`** — Pairs a class token (e.g., `" topic/topic "`) with its local name
- **`matchesDitaClass()`** — Checks if an element matches via `@class` substring or falls back to element name
- **Pre-built matchers** — Constants for common DITA elements (TOPIC_TOPIC, TOPIC_TITLE, MAP_TOPICREF, etc.)

---

## Configuration

User-facing settings under `ditacraft.*`:

| Setting | Type | Default | Purpose |
|---------|------|---------|---------|
| `maxNumberOfProblems` | number | 100 | Maximum diagnostics per file |
| `ditaRulesEnabled` | boolean | true | Enable Schematron-equivalent rules |
| `ditaRulesCategories` | string[] | all | Rule categories to activate |
| `crossRefValidationEnabled` | boolean | true | Validate cross-references |
| `subjectSchemeValidationEnabled` | boolean | true | Validate against subject schemes |

Settings are cached per document URI and cleared on configuration change events.

---

## Dependency Graph

```
server.ts
│
├── settings.ts
│
├── features/
│   ├── validation.ts ─────────── fast-xml-parser
│   ├── completion.ts ─────────── ditaSchema, keySpaceService, subjectSchemeService
│   ├── hover.ts ──────────────── ditaSchema, referenceParser, keySpaceService
│   ├── definition.ts ─────────── referenceParser, keySpaceService
│   ├── references.ts ─────────── referenceParser, workspaceScanner
│   ├── rename.ts ─────────────── referenceParser, workspaceScanner
│   ├── symbols.ts ────────────── workspaceScanner
│   ├── documentLinks.ts ──────── keySpaceService
│   ├── crossRefValidation.ts ─── referenceParser, keySpaceService
│   ├── ditaRulesValidator.ts ─── ditaVersionDetector
│   ├── profilingValidation.ts ── subjectSchemeService
│   ├── formatting.ts ─────────── (no dependencies)
│   ├── folding.ts ────────────── (no dependencies)
│   ├── linkedEditing.ts ──────── (no dependencies)
│   └── codeActions.ts ────────── (no dependencies)
│
├── services/
│   ├── keySpaceService.ts ────── (no service dependencies)
│   └── subjectSchemeService.ts ── (no service dependencies)
│
├── utils/
│   ├── xmlTokenizer.ts ───────── (no dependencies)
│   ├── referenceParser.ts ────── (no dependencies)
│   ├── workspaceScanner.ts ───── referenceParser
│   └── ditaVersionDetector.ts ── (no dependencies)
│
└── data/
    ├── ditaSchema.ts ─────────── (no dependencies)
    └── ditaSpecialization.ts ─── (no dependencies)
```

Leaf modules (`formatting`, `folding`, `linkedEditing`, `codeActions`, `xmlTokenizer`, `referenceParser`, `ditaVersionDetector`, and both `data/` files) have zero internal dependencies, making them independently testable.

---

## Test Strategy

**Framework:** Mocha with TDD interface (`suite` / `test`)
**Total:** 398 tests, all passing

Tests use a `helper.ts` module providing:
- `createDoc(content, uri?)` — creates a mock `TextDocument`
- `createDocs(doc?)` — creates a mock `TextDocuments` collection
- `TEST_URI` — default file URI for tests

Each feature has a dedicated test file exercising:
- Happy paths with typical DITA content
- Edge cases (empty documents, malformed XML, missing attributes)
- Boundary conditions (cursor at tag boundaries, EOF offsets)
- Cross-feature integration (e.g., code actions consuming diagnostic codes)
