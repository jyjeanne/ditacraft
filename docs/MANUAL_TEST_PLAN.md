# DitaCraft Manual Test Plan

**Version:** 0.7.2
**Date:** March 2026
**Status:** Active

This document provides a comprehensive manual test plan covering all validation functions, LSP features, and palette commands of the DitaCraft VS Code extension.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Test Environment Setup](#2-test-environment-setup)
3. [Command Palette Commands](#3-command-palette-commands)
4. [Validation Pipeline (12 Phases)](#4-validation-pipeline-12-phases) — Phases 1-12, DITAVAL, 43 DITA rules, table/attr rules, key scopes, custom rules
5. [LSP Server Features](#5-lsp-server-features) — Completion, hover, definition, references, rename, symbols, formatting, folding, linked editing, links, localization
6. [Code Actions (12 Quick Fixes)](#6-code-actions-12-quick-fixes)
7. [Activity Bar Views](#7-activity-bar-views) — DITA Explorer, Key Space, Diagnostics
8. [Live Preview & Publishing](#8-live-preview--publishing) — Preview, publishing, map visualizer, guide validation
9. [Settings & Configuration](#9-settings--configuration) — Dynamic config, root map, severity overrides
10. [Code Snippets](#10-code-snippets) — 21 DITA snippets
11. [Context Menus & Keybindings](#11-context-menus--keybindings)
12. [Performance & Edge Cases](#12-performance--edge-cases) — Performance, specialization, stale diagnostics, error recovery, security
13. [Regression Checklist](#13-regression-checklist)

---

## 1. Prerequisites

### Required Software
- [ ] VS Code 1.80+
- [ ] Node.js 18.x or 20.x
- [ ] DITA-OT 4.2.1+ (for publishing tests)
- [ ] xmllint (optional, for xmllint engine tests)

### Test Fixtures
Prepare the following test files in a workspace folder:

- `test-topic.dita` — valid DITA topic with sections, IDs, images
- `test-concept.dita` — valid concept topic
- `test-task.dita` — valid task topic with steps
- `test-reference.dita` — valid reference topic
- `test-map.ditamap` — map referencing the above topics
- `test-bookmap.bookmap` — bookmap with chapters, booktitle
- `test.ditaval` — DITAVAL filter file
- `test-invalid.dita` — intentionally malformed XML
- `test-large.dita` — file >500 KB for large file tests
- `test-glossentry.dita` — valid glossentry topic with `<glossterm>` and `<glossdef>`
- `test-troubleshooting.dita` — valid troubleshooting topic
- `test-table.dita` — topic containing CALS `<table>` and `<simpletable>` elements
- `test-specialization.dita` — topic with `@class` attributes for specialization matching
- `test-keyscope.ditamap` — map with `@keyscope` attributes on submaps
- `subject-scheme.ditamap` — subject scheme map with controlled values
- `custom-rules.json` — custom regex rules file
- `test-crlf.dita` — topic with Windows `\r\n` line endings
- `test-mixed-endings.dita` — topic with mixed `\r\n`, `\n`, and `\r` line endings

---

## 2. Test Environment Setup

| # | Step | Expected | Pass |
|---|------|----------|------|
| 2.1 | Install DitaCraft extension (F5 debug or VSIX) | Extension activates, DitaCraft sidebar appears | [ ] |
| 2.2 | Open a workspace containing DITA files | DITA Explorer populates with maps | [ ] |
| 2.3 | Verify status bar shows root map indicator | Root map status bar item visible | [ ] |
| 2.4 | Open Output panel → DitaCraft | Log output channel available | [ ] |

---

## 3. Command Palette Commands

Open Command Palette (`Ctrl+Shift+P`) and test each command.

### 3.1 File Creation

| # | Command | Steps | Expected | Pass |
|---|---------|-------|----------|------|
| 3.1.1 | `DITA: Create New Topic` | Run command, select "concept", enter filename | New `.dita` file created with DOCTYPE, root element, id, title | [ ] |
| 3.1.2 | `DITA: Create New Topic` | Select "task" type | Task topic with `<taskbody>` structure | [ ] |
| 3.1.3 | `DITA: Create New Topic` | Select "reference" type | Reference topic with `<refbody>` | [ ] |
| 3.1.4 | `DITA: Create New Map` | Run command, enter filename | New `.ditamap` with proper structure | [ ] |
| 3.1.5 | `DITA: Create New Bookmap` | Run command, enter filename | New `.bookmap` with booktitle structure | [ ] |

### 3.2 Validation Commands

| # | Command | Steps | Expected | Pass |
|---|---------|-------|----------|------|
| 3.2.1 | `DITA: Validate Current File` | Open valid `.dita` file, press `Ctrl+Shift+V` | No errors or only expected warnings in Problems panel | [ ] |
| 3.2.2 | `DITA: Validate Current File` | Open malformed XML file | XML well-formedness errors reported | [ ] |
| 3.2.3 | `DITA: Validate Workspace` | Run command with multiple DITA files | Progress notification, all files validated, cross-file issues found | [ ] |
| 3.2.4 | `DITA: Validate Entire Guide Using DITA-OT` | Run with DITA-OT configured and a root map set | WebView report opens with severity filtering, search, grouping, JSON export | [ ] |

### 3.3 Publishing Commands

| # | Command | Steps | Expected | Pass |
|---|---------|-------|----------|------|
| 3.3.1 | `DITA: Publish (Select Format)` | Open a `.ditamap`, press `Ctrl+Shift+B` | Format picker appears, publishing starts with progress | [ ] |
| 3.3.2 | `DITA: Publish to HTML5` | Open a `.dita` or `.ditamap` file | HTML5 output generated in output directory | [ ] |
| 3.3.3 | `DITA: Preview HTML5` | Open a `.dita` file, press `Ctrl+Shift+H` | WebView panel opens with rendered HTML5 content | [ ] |

### 3.4 Configuration Commands

| # | Command | Steps | Expected | Pass |
|---|---------|-------|----------|------|
| 3.4.1 | `DITA: Configure DITA-OT Path` | Run command | Folder picker dialog, path saved to settings | [ ] |
| 3.4.2 | `DITA: Set Root Map` | Run command with multiple maps in workspace | Map picker, root map set, status bar updates | [ ] |
| 3.4.3 | `DITA: Clear Root Map (Auto-Discover)` | Run after setting root map | Root map cleared, reverts to auto-discover mode | [ ] |
| 3.4.4 | `DITA: Setup cSpell Configuration` | Run command | `.cspellrc.json` created in workspace root with DITA vocabulary | [ ] |

### 3.5 UI Commands

| # | Command | Steps | Expected | Pass |
|---|---------|-------|----------|------|
| 3.5.1 | `DITA: Show Map Visualizer` | Open a `.ditamap` or `.bookmap` | WebView panel with interactive tree hierarchy | [ ] |
| 3.5.2 | `DITA: Show Output Channel` | Run command | DitaCraft output channel shows in Output panel | [ ] |
| 3.5.3 | `DITA: Clear Output Channel` | Run after some output | Output channel cleared | [ ] |

---

## 4. Validation Pipeline (12 Phases)

### Phase 1-3: XML Well-formedness + Structure + IDs

| # | Test | Steps | Expected Diagnostic | Pass |
|---|------|-------|---------------------|------|
| 4.1.1 | Missing closing tag | Create `<topic><title>Test</topic>` (missing `</title>`) | `DITA-XML-001` Error | [ ] |
| 4.1.2 | Mismatched tags | Create `<p>text</div>` | `DITA-XML-001` Error | [ ] |
| 4.1.3 | Missing DOCTYPE | Remove DOCTYPE from `.dita` file | `DITA-STRUCT-001` Warning | [ ] |
| 4.1.4 | Invalid root element | Use `<div>` as root in `.dita` file | `DITA-STRUCT-002` Error | [ ] |
| 4.1.5 | Missing root ID | Remove `id` from `<topic>` | `DITA-STRUCT-003` Error | [ ] |
| 4.1.6 | Missing title | Remove `<title>` from topic | `DITA-STRUCT-004` Error | [ ] |
| 4.1.7 | Empty elements | Add `<p></p>` to body | `DITA-STRUCT-005` Warning | [ ] |
| 4.1.8 | Missing booktitle | Create bookmap without `<booktitle>` | `DITA-STRUCT-006` Warning | [ ] |
| 4.1.9 | Missing mainbooktitle | Add `<booktitle>` without `<mainbooktitle>` | `DITA-STRUCT-007` Warning | [ ] |
| 4.1.10 | Topicref without target | Add `<topicref>` with no href/keyref/keys | `DITA-STRUCT-008` Info | [ ] |
| 4.1.11 | Duplicate IDs | Two elements with same `id` value | `DITA-ID-001` Error | [ ] |
| 4.1.12 | Invalid ID format | Use `id="123-bad"` (starts with digit) | `DITA-ID-002` Warning | [ ] |
| 4.1.13 | Single-quote IDs | Use `id='value'` with single quotes | IDs correctly parsed, no false errors | [ ] |
| 4.1.14 | Glossentry root element | Open valid `<glossentry>` topic | No `DITA-STRUCT-002` error; `<glossterm>` accepted as first child instead of `<title>` | [ ] |
| 4.1.15 | Troubleshooting root element | Open valid `<troubleshooting>` topic | No `DITA-STRUCT-002` error; recognized as valid root element | [ ] |
| 4.1.16 | Bookmap in `.ditamap` extension | Open bookmap that uses `.ditamap` extension | No false `DITA-STRUCT-002` error for `<bookmap>` root | [ ] |
| 4.1.17 | DOCTYPE-based file detection | Open `.xml` file with DITA DOCTYPE declaration | File detected as DITA, validation runs | [ ] |

### Phase 1-3 (continued): DITAVAL Validation

| # | Test | Steps | Expected Diagnostic | Pass |
|---|------|-------|---------------------|------|
| 4.1.18 | Missing att on prop | Add `<prop action="include"/>` without `att` attribute | `DITA-DITAVAL-001` | [ ] |
| 4.1.19 | Invalid action value | Add `<prop att="audience" action="invalid"/>` | `DITA-DITAVAL-002` | [ ] |
| 4.1.20 | Missing val on revprop | Add `<revprop>` without `val` attribute | `DITA-DITAVAL-003` | [ ] |
| 4.1.21 | Duplicate prop | Add two `<prop att="audience" val="admin">` | `DITA-DITAVAL-004` | [ ] |
| 4.1.22 | Missing flag imageref | Add `<startflag>` without `imageref` or `<alt-text>` | `DITA-DITAVAL-005` | [ ] |
| 4.1.23 | Valid DITAVAL file | Open well-formed `.ditaval` with proper structure | No errors | [ ] |

### Phase 4: Schema Validation (DTD / RNG)

| # | Test | Steps | Expected Diagnostic | Pass |
|---|------|-------|---------------------|------|
| 4.2.1 | DTD validation (typesxml) | Set engine to `typesxml`, add disallowed child element | `DITA-DTD-001` Error | [ ] |
| 4.2.2 | DTD validation (built-in) | Set engine to `built-in`, check content model | Content model errors reported | [ ] |
| 4.2.3 | RNG validation | Set `schemaFormat: "rng"` with schema path | `DITA-RNG-001` for violations | [ ] |
| 4.2.4 | DITA version auto-detect | Add `DITAArchVersion="2.0"` to root element | DITA 2.0 rules activated | [ ] |
| 4.2.5 | External XML catalog | Set `xmlCatalogPath` to custom catalog | Custom DTD resolved correctly | [ ] |

### Phase 5: Cross-Reference Validation

| # | Test | Steps | Expected Diagnostic | Pass |
|---|------|-------|---------------------|------|
| 4.3.1 | Missing target file | Add `href="nonexistent.dita"` | `DITA-XREF-001` Warning | [ ] |
| 4.3.2 | Missing topic ID | Add `href="valid.dita#bad_id"` | `DITA-XREF-002` Warning | [ ] |
| 4.3.3 | Missing element ID | Add `href="valid.dita#topic/bad_elem"` | `DITA-XREF-003` Warning | [ ] |
| 4.3.4 | Undefined key | Add `keyref="undefined_key"` | `DITA-KEY-001` Warning | [ ] |
| 4.3.5 | Key with no target | Define key without href | `DITA-KEY-002` Warning | [ ] |
| 4.3.6 | Scope mismatch (external) | Set `scope="external"` on relative href | `DITA-SCOPE-001` Warning | [ ] |
| 4.3.7 | Scope mismatch (local) | Set `scope="local"` on `http://` href | `DITA-SCOPE-002` Warning | [ ] |
| 4.3.8 | Missing scope on URL | Use `href="http://example.com"` without `scope` attribute | `DITA-SCOPE-003` Warning | [ ] |

### Phase 5 (continued): Key Scope Resolution

| # | Test | Steps | Expected | Pass |
|---|------|-------|----------|------|
| 4.3.9 | Keyscope on submap | Create map with `<mapref keyscope="scope1">`, define key in submap | `keyref="scope1.keyname"` resolves correctly | [ ] |
| 4.3.10 | Nested keyscopes | Nest submaps with keyscope A containing keyscope B | Keys resolve with combined prefix `A.B.keyname` | [ ] |
| 4.3.11 | Unscoped key fallback | Reference key without scope prefix | Key resolves to root-level definition | [ ] |

### Phase 6-7: Subject Scheme + Profiling

| # | Test | Steps | Expected Diagnostic | Pass |
|---|------|-------|---------------------|------|
| 4.4.1 | Valid profiling value | Use `audience="admin"` matching subject scheme | No diagnostic | [ ] |
| 4.4.2 | Invalid profiling value | Use `audience="invalid_value"` | `DITA-PROF-001` Warning | [ ] |
| 4.4.3 | Subject scheme discovery | Add subject scheme map to workspace | Scheme registered automatically | [ ] |

### Phase 8: DITA Rules (35 Schematron-equivalent)

#### Mandatory Rules

| # | Test | Code | Steps | Pass |
|---|------|------|-------|------|
| 4.5.1 | role="other" missing otherrole | `DITA-SCH-001` | Add `<link role="other">` without `otherrole` | [ ] |
| 4.5.2 | type="other" missing othertype | `DITA-SCH-002` | Add `<note type="other">` without `othertype` | [ ] |
| 4.5.3 | Deprecated indextermref | `DITA-SCH-003` | Add `<indextermref>` element | [ ] |
| 4.5.4 | collection-type on reltable | `DITA-SCH-004` | Add `collection-type` attr on `<reltable>` | [ ] |

#### Recommendation Rules

| # | Test | Code | Steps | Pass |
|---|------|------|-------|------|
| 4.5.5 | Deprecated boolean element | `DITA-SCH-010` | Add `<boolean>` element (DITA 1.x) | [ ] |
| 4.5.6 | Deprecated alt attribute | `DITA-SCH-011` | Use `<image alt="text">` instead of `<alt>` | [ ] |
| 4.5.7 | Deprecated longdescref attr | `DITA-SCH-012` | Use `longdescref` attribute on element | [ ] |
| 4.5.8 | Deprecated query attribute | `DITA-SCH-013` | Use `query` attribute on element | [ ] |
| 4.5.9 | Deprecated navtitle attribute | `DITA-SCH-014` | Use `navtitle` attribute instead of `<navtitle>` | [ ] |
| 4.5.10 | Deprecated title on map | `DITA-SCH-015` | Use `title` attribute on `<map>` | [ ] |
| 4.5.11 | Long shortdesc | `DITA-SCH-016` | Add `<shortdesc>` with >50 words | [ ] |
| 4.5.12 | topichead missing navtitle | `DITA-SCH-017` | Add `<topichead>` without `navtitle` | [ ] |

#### Authoring Rules

| # | Test | Code | Steps | Pass |
|---|------|------|-------|------|
| 4.5.13 | xref inside title | `DITA-SCH-020` | Add `<xref>` inside `<title>` | [ ] |
| 4.5.14 | required-cleanup present | `DITA-SCH-021` | Add `<required-cleanup>` element | [ ] |
| 4.5.15 | Trademark characters | `DITA-SCH-022` | Use `™` or `®` as plain text instead of `<tm>` | [ ] |
| 4.5.16 | Multiple section titles | `DITA-SCH-023` | Add two `<title>` elements inside one `<section>` | [ ] |
| 4.5.17 | Nested xref | `DITA-SCH-040` | Add `<xref>` inside another `<xref>` | [ ] |
| 4.5.18 | Forbidden element in pre | `DITA-SCH-041` | Add forbidden element inside `<pre>` | [ ] |
| 4.5.19 | Abstract without shortdesc | `DITA-SCH-042` | Add `<abstract>` without `<shortdesc>` child | [ ] |
| 4.5.20 | no-topic-nesting element | `DITA-SCH-043` | Add `<no-topic-nesting>` element | [ ] |
| 4.5.21 | Deprecated role values | `DITA-SCH-044` | Use `role="sample"` or `role="external"` | [ ] |
| 4.5.22 | Single paragraph body | `DITA-SCH-045` | Topic body with only one `<p>` element | [ ] |
| 4.5.23 | ID-less titled element | `DITA-SCH-046` | `<section>` with `<title>` but no `id` attribute | [ ] |

#### Accessibility Rules

| # | Test | Code | Steps | Pass |
|---|------|------|-------|------|
| 4.5.24 | Image missing alt | `DITA-SCH-030` | Add `<image href="img.png">` without `<alt>` | [ ] |
| 4.5.25 | Object missing desc | `DITA-SCH-031` | Add `<object>` without `<desc>` element | [ ] |

#### Attribute Value Rules

| # | Test | Code | Steps | Pass |
|---|------|------|-------|------|
| 4.5.26 | Invalid note type | `DITA-ATTR-001` | Use `<note type="invalid">` | [ ] |
| 4.5.27 | Invalid importance value | `DITA-ATTR-002` | Use `importance="invalid"` | [ ] |
| 4.5.28 | Invalid status value | `DITA-ATTR-003` | Use `status="invalid"` | [ ] |
| 4.5.29 | Invalid translate value | `DITA-ATTR-004` | Use `translate="invalid"` | [ ] |

#### Table Validation Rules

| # | Test | Code | Steps | Pass |
|---|------|------|-------|------|
| 4.5.30 | CALS cols mismatch | `DITA-TABLE-001` | `<tgroup cols="3">` with rows having 2 entries | [ ] |
| 4.5.31 | Invalid colspec ref | `DITA-TABLE-002` | `namest="invalid"` referencing nonexistent colspec | [ ] |
| 4.5.32 | Simpletable entry mismatch | `DITA-TABLE-003` | `<strow>` with fewer `<stentry>` than header row | [ ] |
| 4.5.33 | Empty table | `DITA-TABLE-004` | `<table>` with `<tgroup>` but no data rows | [ ] |

#### DITA 2.0 Rules (version-gated)

| # | Test | Code | Steps | Pass |
|---|------|------|-------|------|
| 4.5.34 | Boolean removed (2.0) | `DITA-SCH-050` | Add `<boolean>` in DITA 2.0 doc | [ ] |
| 4.5.35 | Indextermref removed (2.0) | `DITA-SCH-051` | Add `<indextermref>` in DITA 2.0 doc | [ ] |
| 4.5.36 | Object removed (2.0) | `DITA-SCH-052` | Add `<object>` in DITA 2.0 doc | [ ] |
| 4.5.37 | Learning removed (2.0) | `DITA-SCH-053` | Add `<learningContent>` in DITA 2.0 doc | [ ] |
| 4.5.38 | Audio without fallback | `DITA-SCH-054` | Add `<audio>` without `<fallback>` in DITA 2.0 | [ ] |
| 4.5.39 | Video without fallback | `DITA-SCH-055` | Add `<video>` without `<fallback>` in DITA 2.0 | [ ] |
| 4.5.40 | Self-closing audio | `DITA-SCH-054` | Add `<audio src="file.mp3"/>` in DITA 2.0 | [ ] |
| 4.5.41 | Self-closing video | `DITA-SCH-055` | Add `<video src="file.mp4"/>` in DITA 2.0 | [ ] |
| 4.5.42 | @print removed | `DITA-SCH-056` | Add `print="yes"` in DITA 2.0 doc | [ ] |
| 4.5.43 | @copy-to removed | `DITA-SCH-057` | Add `copy-to="file.dita"` in DITA 2.0 | [ ] |
| 4.5.44 | @navtitle removed | `DITA-SCH-058` | Add `navtitle="Title"` in DITA 2.0 | [ ] |
| 4.5.45 | @query removed | `DITA-SCH-059` | Add `query="q"` in DITA 2.0 | [ ] |
| 4.5.46 | DITA 1.3 no 2.0 rules | — | Same elements in DITA 1.3 doc | No SCH-050..059 diagnostics | [ ] |

### Phase 9: Circular Reference Detection

| # | Test | Steps | Expected Diagnostic | Pass |
|---|------|-------|---------------------|------|
| 4.6.1 | Direct cycle | Map A refs Map B, Map B refs Map A | `DITA-CYCLE-001` Warning with cycle path | [ ] |
| 4.6.2 | Indirect cycle | Map A→B→C→A via topicref | `DITA-CYCLE-001` Warning | [ ] |
| 4.6.3 | No cycle | Linear map chain | No `DITA-CYCLE-001` | [ ] |

### Phase 10: Workspace-Level Checks

| # | Test | Steps | Expected Diagnostic | Pass |
|---|------|-------|---------------------|------|
| 4.7.1 | Duplicate root ID | Two topics with same root `id` | `DITA-ID-003` Warning | [ ] |
| 4.7.2 | Unused topic | Create `.dita` file not referenced by any map | `DITA-ORPHAN-001` Info | [ ] |

### Phase 11: Severity Overrides + Comment Suppression

#### Per-Rule Severity Overrides

| # | Test | Steps | Expected | Pass |
|---|------|-------|----------|------|
| 4.8.1 | Override to hint | Set `"DITA-SCH-001": "hint"` in `validationSeverityOverrides` | SCH-001 reported as Hint (not Error) | [ ] |
| 4.8.2 | Override to error | Set `"DITA-STRUCT-005": "error"` | Empty element reported as Error (not Warning) | [ ] |
| 4.8.3 | Suppress with off | Set `"DITA-ID-002": "off"` | Invalid ID format not reported at all | [ ] |
| 4.8.4 | Non-matching override | Set `"DITA-FAKE-999": "hint"` | No effect, other diagnostics unaffected | [ ] |

#### Comment-Based Suppression

| # | Test | Steps | Expected | Pass |
|---|------|-------|----------|------|
| 4.8.5 | Disable/enable range | Add `<!-- ditacraft-disable DITA-STRUCT-005 -->` before empty `<p>`, then `<!-- ditacraft-enable DITA-STRUCT-005 -->` after | Empty `<p>` between comments not reported; `<p>` outside range still reported | [ ] |
| 4.8.6 | File-level suppression | Add `<!-- ditacraft-disable-file DITA-SCH-021 -->` at top | All `DITA-SCH-021` diagnostics in file suppressed | [ ] |
| 4.8.7 | Multiple codes | Add `<!-- ditacraft-disable DITA-SCH-001 DITA-ID-002 -->` | Both codes suppressed in range | [ ] |
| 4.8.8 | Exclusive endLine | Place `<!-- ditacraft-enable CODE -->` on same line as violation | Violation on `enable` line is NOT suppressed | [ ] |
| 4.8.9 | CRLF file | Use Windows line endings (`\r\n`) with suppression comments | Suppression ranges aligned correctly | [ ] |
| 4.8.10 | No enable (open range) | Add `<!-- ditacraft-disable CODE -->` with no matching enable | Suppressed from that line to end of file | [ ] |

### Phase 12: Custom Regex Rules

| # | Test | Steps | Expected | Pass |
|---|------|-------|----------|------|
| 4.9.1 | Basic pattern match | Create JSON rules file with pattern matching `<draft-comment`, set `customRulesFile` | Custom diagnostic reported on matching lines | [ ] |
| 4.9.2 | FileType filtering | Set `fileTypes: ["task"]` on a rule | Rule triggers in task topics, not in concepts | [ ] |
| 4.9.3 | Severity mapping | Set rule severity to `"error"` | Diagnostic reported as Error | [ ] |
| 4.9.4 | Invalid regex | Put invalid regex in pattern | Rule silently skipped, other rules still work | [ ] |
| 4.9.5 | Missing rules file | Set `customRulesFile` to nonexistent path | No crash, no custom diagnostics | [ ] |
| 4.9.6 | Empty path | Leave `customRulesFile` as `""` | No custom rules phase executed | [ ] |
| 4.9.7 | Cache invalidation | Modify rules JSON file while extension running | New rules applied on next validation | [ ] |
| 4.9.8 | Comment immunity | Pattern targets content inside `<!-- comment -->` | No match (comments stripped before matching) | [ ] |

### Large File Optimization

| # | Test | Steps | Expected | Pass |
|---|------|-------|----------|------|
| 4.10.1 | Large file skips phases | Open file >500 KB | `DITA-PERF-001` Info; phases 6-12 skipped; basic XML/structure/DTD still checked | [ ] |
| 4.10.2 | Custom threshold | Set `largeFileThresholdKB: 100` | File >100 KB triggers optimization | [ ] |
| 4.10.3 | Disabled optimization | Set `largeFileThresholdKB: 0` | All phases run regardless of file size | [ ] |
| 4.10.4 | Boundary file | File exactly at threshold size | Optimization triggered (uses `>=`) | [ ] |

---

## 5. LSP Server Features

### 5.1 IntelliSense (Completion)

| # | Test | Steps | Expected | Pass |
|---|------|-------|----------|------|
| 5.1.1 | Element completion | Type `<` inside `<body>` | Context-aware child elements listed (p, section, ul, ol, etc.) | [ ] |
| 5.1.2 | Attribute completion | Type space inside an opening tag | Valid attributes for that element listed | [ ] |
| 5.1.3 | Attribute value completion | Type `"` after `type=` on `<note>` | Enumerated values (note, tip, warning, etc.) | [ ] |
| 5.1.4 | Key completion | Type `keyref="` | Available keys from key space listed | [ ] |
| 5.1.5 | Href completion | Type `href="` | Files in workspace listed | [ ] |
| 5.1.6 | Subject scheme grouping | With subject scheme active, complete profiling attr | Values grouped by hierarchy (e.g., Platform > Linux > Ubuntu) | [ ] |
| 5.1.7 | DITAVAL completion | Open `.ditaval` file, type `<` | DITAVAL elements listed (val, prop, revprop, etc.) | [ ] |
| 5.1.8 | Snippet insertion | Type a snippet prefix (e.g., `dita-topic`) | Snippet expanded with tab stops | [ ] |

### 5.2 Hover

| # | Test | Steps | Expected | Pass |
|---|------|-------|----------|------|
| 5.2.1 | Element hover | Hover over `<section>` tag name | Documentation tooltip with element description | [ ] |
| 5.2.2 | Children fallback | Hover over element without full docs | Shows allowed children list | [ ] |
| 5.2.3 | Conref preview | Hover over `conref="file.dita#id"` | Inline preview of referenced content | [ ] |
| 5.2.4 | Keyref preview | Hover over `keyref="key-name"` | Shows resolved target, navtitle, shortdesc | [ ] |
| 5.2.5 | DITAVAL hover | Hover over DITAVAL element | DITAVAL element documentation | [ ] |
| 5.2.6 | Non-tag text | Hover over plain text content | No tooltip | [ ] |

### 5.3 Go to Definition

| # | Test | Steps | Expected | Pass |
|---|------|-------|----------|------|
| 5.3.1 | href file | Ctrl+Click on `href="topic.dita"` | Opens topic.dita | [ ] |
| 5.3.2 | href with fragment | Ctrl+Click on `href="file.dita#id"` | Opens file, navigates to element | [ ] |
| 5.3.3 | conref | Ctrl+Click on `conref="file.dita#topic/elem"` | Opens file at referenced element | [ ] |
| 5.3.4 | keyref | Ctrl+Click on `keyref="key-name"` | Opens key target file | [ ] |
| 5.3.5 | conkeyref | Ctrl+Click on `conkeyref="key/elem"` | Resolves key then navigates to element | [ ] |
| 5.3.6 | External URL | Ctrl+Click on `href="http://example.com"` | No navigation (external URLs skipped) | [ ] |

### 5.4 Find References

| # | Test | Steps | Expected | Pass |
|---|------|-------|----------|------|
| 5.4.1 | Find all references | Right-click element ID → Find All References | All files referencing this ID listed | [ ] |
| 5.4.2 | No references | Find references on unused ID | Empty results | [ ] |

### 5.5 Rename

| # | Test | Steps | Expected | Pass |
|---|------|-------|----------|------|
| 5.5.1 | Rename ID | F2 on an element `id`, type new name | ID renamed in current file and all references across workspace | [ ] |
| 5.5.2 | Rename preparation | Press F2 | ID text pre-selected for editing | [ ] |

### 5.6 Document Symbols

| # | Test | Steps | Expected | Pass |
|---|------|-------|----------|------|
| 5.6.1 | Outline view | Press `Ctrl+Shift+O` | Hierarchical outline showing elements with titles | [ ] |
| 5.6.2 | Map symbols | Open `.ditamap`, press `Ctrl+Shift+O` | Map hierarchy with topicref labels | [ ] |
| 5.6.3 | Self-closing elements | File with `<image/>` elements | Self-closing elements appear in outline | [ ] |

### 5.7 Workspace Symbols

| # | Test | Steps | Expected | Pass |
|---|------|-------|----------|------|
| 5.7.1 | Cross-file search | Press `Ctrl+T`, type element name | Matches from all DITA files in workspace | [ ] |
| 5.7.2 | Query filtering | Search with partial name | Fuzzy-matched results | [ ] |

### 5.8 Formatting

| # | Test | Steps | Expected | Pass |
|---|------|-------|----------|------|
| 5.8.1 | Full document format | `Shift+Alt+F` on unformatted DITA file | Proper indentation, inline elements preserved | [ ] |
| 5.8.2 | Preformatted elements | Format file with `<codeblock>` content | Content inside `<codeblock>`, `<pre>`, `<screen>` unchanged | [ ] |
| 5.8.3 | Range formatting | Select a region, format selection | Only selected region reformatted | [ ] |

### 5.9 Folding Ranges

| # | Test | Steps | Expected | Pass |
|---|------|-------|----------|------|
| 5.9.1 | Element folding | Click fold gutter on `<section>` | Section content collapses | [ ] |
| 5.9.2 | Comment folding | Multi-line `<!-- comment -->` | Comment region foldable | [ ] |
| 5.9.3 | CDATA folding | `<![CDATA[...]]>` block | CDATA block foldable | [ ] |

### 5.10 Linked Editing

| # | Test | Steps | Expected | Pass |
|---|------|-------|----------|------|
| 5.10.1 | Tag sync | Edit opening tag name `<section>` → `<div>` | Closing tag `</section>` updates to `</div>` simultaneously | [ ] |
| 5.10.2 | Nested tags | Edit inner tag name | Only matching pair updated, outer tags unaffected | [ ] |

### 5.11 Document Links

| # | Test | Steps | Expected | Pass |
|---|------|-------|----------|------|
| 5.11.1 | href links | `href` values appear underlined/clickable | Links highlighted with tooltips | [ ] |
| 5.11.2 | conref links | `conref` values appear as links | Clickable navigation to target | [ ] |
| 5.11.3 | keyref links | `keyref` values appear as links | Resolved to key target | [ ] |

### 5.12 Diagnostics (Real-time)

| # | Test | Steps | Expected | Pass |
|---|------|-------|----------|------|
| 5.12.1 | As-you-type | Type invalid XML, wait 300ms | Errors appear in Problems panel without saving | [ ] |
| 5.12.2 | Map debounce | Edit `.ditamap`, wait 1000ms | Diagnostics update (longer delay for maps) | [ ] |
| 5.12.3 | Cancellation | Type rapidly, then pause | Only final state validated (intermediate cancelled) | [ ] |
| 5.12.4 | Source label | Check diagnostic source in Problems panel | Source shows `dita-lsp` (or `dita-rules` for DITA rules) | [ ] |

### 5.13 Localization

| # | Test | Steps | Expected | Pass |
|---|------|-------|----------|------|
| 5.13.1 | English messages | Set VS Code locale to `en` | All diagnostic messages in English | [ ] |
| 5.13.2 | French messages | Set VS Code locale to `fr` | All diagnostic messages in French | [ ] |

---

## 6. Code Actions (12 Quick Fixes)

For each test: trigger the diagnostic, then press `Ctrl+.` (lightbulb) to apply the quick fix.

| # | Diagnostic Code | Quick Fix | Steps | Expected Result | Pass |
|---|----------------|-----------|-------|-----------------|------|
| 6.1 | `DITA-STRUCT-001` | Add DOCTYPE | Remove DOCTYPE from topic | Correct DOCTYPE declaration inserted based on root element | [ ] |
| 6.2 | `DITA-STRUCT-003` | Add ID | Remove `id` from root element | `id` attribute added, derived from filename | [ ] |
| 6.3 | `DITA-STRUCT-004` | Add title | Remove `<title>` element | `<title>Title</title>` inserted after root tag | [ ] |
| 6.4 | `DITA-STRUCT-005` | Remove empty element | Create `<p></p>` | Empty element removed entirely | [ ] |
| 6.5 | `DITA-STRUCT-006` | Insert booktitle | Remove `<booktitle>` from bookmap | `<booktitle><mainbooktitle>Title</mainbooktitle></booktitle>` inserted after `<bookmap>` tag | [ ] |
| 6.6 | `DITA-STRUCT-007` | Insert mainbooktitle | Have `<booktitle>` without `<mainbooktitle>` | `<mainbooktitle>Title</mainbooktitle>` inserted inside `<booktitle>` | [ ] |
| 6.7 | `DITA-ID-001` | Rename duplicate | Two elements with same ID | Second ID gets unique suffix (e.g., `_2`) | [ ] |
| 6.8 | `DITA-ID-002` | Sanitize ID | Use `id="123 bad!"` | ID sanitized: illegal chars replaced with `-`, leading digit prefixed with `_`, leading/trailing hyphens stripped | [ ] |
| 6.9 | `DITA-SCH-001` | Add otherrole | `<link role="other">` without `otherrole` | `otherrole=""` attribute inserted with cursor positioned | [ ] |
| 6.10 | `DITA-SCH-003` | Remove indextermref | `<indextermref>` present | Element removed entirely | [ ] |
| 6.11 | `DITA-SCH-011` | Convert alt attr | `<image alt="text">` | `alt` attribute removed, `<alt>text</alt>` element added as child | [ ] |
| 6.12 | `DITA-SCH-030` | Add alt element | `<image href="img.png">` without `<alt>` | `<alt></alt>` element inserted as child of `<image>` | [ ] |

---

## 7. Activity Bar Views

### 7.1 DITA Explorer

| # | Test | Steps | Expected | Pass |
|---|------|-------|----------|------|
| 7.1.1 | Map listing | Open workspace with DITA maps | All `.ditamap` and `.bookmap` files listed as tree roots | [ ] |
| 7.1.2 | Hierarchy expand | Expand a map node | Topicref children shown with correct types and icons | [ ] |
| 7.1.3 | Click navigation | Click on a topic in the tree | Topic file opens in editor | [ ] |
| 7.1.4 | Context menu | Right-click on a map | Options: Validate, Publish, Show Visualizer | [ ] |
| 7.1.5 | Auto-refresh | Add a new topicref to a map and save | Explorer updates within ~500ms | [ ] |
| 7.1.6 | File decorations | Files with validation errors | Error/warning badges appear on tree items | [ ] |
| 7.1.7 | Welcome content | Empty workspace (no DITA files) | Welcome message with "Open a folder" action | [ ] |

### 7.2 Key Space View

| # | Test | Steps | Expected | Pass |
|---|------|-------|----------|------|
| 7.2.1 | Defined keys | Workspace with key definitions | Keys listed with target files | [ ] |
| 7.2.2 | Undefined keys | Keyref pointing to undefined key | Key shown in "Undefined" group | [ ] |
| 7.2.3 | Unused keys | Key defined but never referenced | Key shown in "Unused" group | [ ] |
| 7.2.4 | Usage navigation | Click on a key usage | Navigates to usage location | [ ] |
| 7.2.5 | Refresh | Click refresh button | Key space re-scanned | [ ] |

### 7.3 Diagnostics View

| # | Test | Steps | Expected | Pass |
|---|------|-------|----------|------|
| 7.3.1 | Issue listing | Files with validation issues | All DITA diagnostics aggregated | [ ] |
| 7.3.2 | Group by file | Click "Group by File" button | Issues grouped under file names | [ ] |
| 7.3.3 | Group by severity | Click "Group by Severity" button | Issues grouped as Errors / Warnings / Info | [ ] |
| 7.3.4 | Click navigation | Click on a diagnostic | Editor opens at diagnostic location | [ ] |
| 7.3.5 | Auto-refresh | Fix an issue and save | Diagnostic removed from view within ~300ms | [ ] |
| 7.3.6 | Deduplication | Same diagnostic from multiple sources | Only one entry shown (dedup by file:line:col:severity:message) | [ ] |

---

## 8. Live Preview & Publishing

### 8.1 Live Preview

| # | Test | Steps | Expected | Pass |
|---|------|-------|----------|------|
| 8.1.1 | Open preview | `Ctrl+Shift+H` on a `.dita` file | WebView panel opens with HTML5 rendering | [ ] |
| 8.1.2 | Auto-refresh | Edit content, save | Preview updates automatically | [ ] |
| 8.1.3 | Scroll sync | Scroll in editor | Preview scrolls to matching position (and vice versa) | [ ] |
| 8.1.4 | Theme: auto | Set `previewTheme: "auto"` | Preview follows VS Code theme | [ ] |
| 8.1.5 | Theme: dark | Set `previewTheme: "dark"` | Dark theme applied | [ ] |
| 8.1.6 | Custom CSS | Set `previewCustomCss` to a CSS file | Custom styles applied to preview | [ ] |
| 8.1.7 | Print mode | Click print button in preview | Print-optimized view displayed | [ ] |

### 8.2 Publishing

| # | Test | Steps | Expected | Pass |
|---|------|-------|----------|------|
| 8.2.1 | HTML5 output | Publish `.ditamap` to HTML5 | HTML5 files generated in output directory | [ ] |
| 8.2.2 | PDF output | Publish to PDF (requires FOP) | PDF file generated | [ ] |
| 8.2.3 | Progress tracking | Publish large map | Progress notification with percentage | [ ] |
| 8.2.4 | Build output | Check Output panel during publish | Syntax-highlighted DITA-OT output with log levels | [ ] |
| 8.2.5 | Error diagnostics | Publish with errors in content | Errors parsed and shown in Problems panel | [ ] |
| 8.2.6 | Custom arguments | Set `ditaOtArgs: ["--verbose"]` | Additional arguments passed to DITA-OT | [ ] |

### 8.3 Map Visualizer

| # | Test | Steps | Expected | Pass |
|---|------|-------|----------|------|
| 8.3.1 | Open visualizer | Run `DITA: Show Map Visualizer` on a map | WebView with interactive tree hierarchy | [ ] |
| 8.3.2 | Element type icons | Inspect tree nodes | Correct icons for map, chapter, appendix, part, topic, key, glossref | [ ] |
| 8.3.3 | Missing file detection | Reference nonexistent file | Missing file shown with strikethrough | [ ] |
| 8.3.4 | Circular reference | Map with circular ref | Cycle marked with warning indicator | [ ] |
| 8.3.5 | Navigation | Double-click a topic node | Topic file opens in editor | [ ] |
| 8.3.6 | Expand/collapse | Click expand/collapse all | All nodes expand or collapse | [ ] |

### 8.4 Guide Validation

| # | Test | Steps | Expected | Pass |
|---|------|-------|----------|------|
| 8.4.1 | Run guide validation | Set root map, run `DITA: Validate Entire Guide` | DITA-OT processes the map, WebView report opens | [ ] |
| 8.4.2 | Severity filtering | Click severity filters in report | Issues filtered by error/warning/info | [ ] |
| 8.4.3 | Search | Type in search box | Issues filtered by search term | [ ] |
| 8.4.4 | Group by file | Select "Group by File" | Issues grouped under filenames | [ ] |
| 8.4.5 | Group by severity | Select "Group by Severity" | Issues grouped by error level | [ ] |
| 8.4.6 | Group by module | Select "Group by Module" | Issues grouped by DITA-OT module | [ ] |
| 8.4.7 | JSON export | Click export button | JSON file downloaded with all results | [ ] |
| 8.4.8 | Error code tooltips | Hover over DITA-OT error code | Description from 160+ error code catalog shown | [ ] |

---

## 9. Settings & Configuration

### 9.1 Dynamic Configuration

| # | Test | Steps | Expected | Pass |
|---|------|-------|----------|------|
| 9.1.1 | Hot reload | Change `ditaRulesEnabled` to `false` | DITA rules diagnostics disappear without extension reload | [ ] |
| 9.1.2 | Debounce setting | Change `validationDebounceMs` to `2000` | Validation delay increases noticeably | [ ] |
| 9.1.3 | Max problems | Set `maxNumberOfProblems: 5` | At most 5 diagnostics per file | [ ] |
| 9.1.4 | Rule categories | Set `ditaRulesCategories: ["mandatory"]` | Only mandatory rule violations reported | [ ] |
| 9.1.5 | Cross-ref toggle | Set `crossRefValidationEnabled: false` | No DITA-XREF/KEY diagnostics | [ ] |
| 9.1.6 | Subject scheme toggle | Set `subjectSchemeValidationEnabled: false` | No DITA-PROF diagnostics | [ ] |
| 9.1.7 | DITA version override | Set `ditaVersion: "2.0"` | DITA 2.0 rules active for all files | [ ] |

### 9.2 Root Map Management

| # | Test | Steps | Expected | Pass |
|---|------|-------|----------|------|
| 9.2.1 | Auto-discover mode | Remove `rootMap` setting, have multiple maps in workspace | Root map auto-discovered from nearest map to current file | [ ] |
| 9.2.2 | Explicit root map | Set `rootMap` to specific map path via command | Status bar shows selected root map; key resolution uses it | [ ] |
| 9.2.3 | Clear root map | Run `DITA: Clear Root Map` | Reverts to auto-discover; status bar updates | [ ] |
| 9.2.4 | Status bar click | Click root map indicator in status bar | Picker appears to select or clear root map | [ ] |
| 9.2.5 | Workspace persistence | Set root map, close and reopen VS Code | Root map setting persists across sessions | [ ] |

### 9.3 Severity Overrides Setting

| # | Test | Steps | Expected | Pass |
|---|------|-------|----------|------|
| 9.2.1 | Object format | Set `validationSeverityOverrides: { "DITA-STRUCT-005": "error" }` | Empty element now Error severity | [ ] |
| 9.2.2 | Multiple overrides | Override 3+ codes simultaneously | All overrides applied correctly | [ ] |
| 9.2.3 | Invalid value | Set override to `"invalid"` | Gracefully ignored, no crash | [ ] |

---

## 10. Code Snippets

| # | Snippet Prefix | Steps | Expected | Pass |
|---|---------------|-------|----------|------|
| 10.1 | `dita-topic` | Type prefix in new file, Tab | Full topic structure with DOCTYPE, root, title, body | [ ] |
| 10.2 | `dita-concept` | Type prefix, Tab | Concept structure | [ ] |
| 10.3 | `dita-task` | Type prefix, Tab | Task with taskbody and steps | [ ] |
| 10.4 | `dita-reference` | Type prefix, Tab | Reference with refbody | [ ] |
| 10.5 | `dita-map` | Type prefix, Tab | Map structure | [ ] |
| 10.6 | `dita-bookmap` | Type prefix, Tab | Bookmap with booktitle | [ ] |
| 10.7 | `table` | Type prefix inside body | Simple table with header | [ ] |
| 10.8 | `ul` / `ol` | Type prefix inside body | List with list items | [ ] |
| 10.9 | `codeblock` | Type prefix | Code block element | [ ] |
| 10.10 | `xref` | Type prefix | Cross-reference with href tab stop | [ ] |
| 10.11 | `image` | Type prefix | Image with href and alt | [ ] |
| 10.12 | `conref` | Type prefix | Element with conref attribute | [ ] |
| 10.13 | `topicref` | Type prefix inside map | Topicref with href | [ ] |
| 10.14 | Snippet disabled | Set `enableSnippets: false` | No snippet completions offered | [ ] |

---

## 11. Context Menus & Keybindings

### 11.1 Keybindings

| # | Shortcut | Context | Expected | Pass |
|---|----------|---------|----------|------|
| 11.1.1 | `Ctrl+Shift+V` | DITA file open | Validates current file | [ ] |
| 11.1.2 | `Ctrl+Shift+H` | DITA file open | Opens HTML5 preview | [ ] |
| 11.1.3 | `Ctrl+Shift+B` | DITA file open | Opens publish format picker | [ ] |
| 11.1.4 | `Ctrl+Shift+O` | DITA file open | Shows document outline (symbols) | [ ] |
| 11.1.5 | `Ctrl+T` | Any file | Shows workspace symbol search | [ ] |
| 11.1.6 | `Ctrl+.` | On diagnostic squiggle | Shows quick fix actions | [ ] |
| 11.1.7 | `Shift+Alt+F` | DITA file open | Formats document | [ ] |
| 11.1.8 | `F2` | On element ID | Initiates rename | [ ] |

### 11.2 Editor Context Menu

| # | Test | Steps | Expected | Pass |
|---|------|-------|----------|------|
| 11.2.1 | Right-click in DITA file | Right-click in editor | "Validate" and "Publish" options present | [ ] |
| 11.2.2 | Right-click in non-DITA | Right-click in `.json` file | DitaCraft options not present | [ ] |

### 11.3 Editor Title Bar

| # | Test | Steps | Expected | Pass |
|---|------|-------|----------|------|
| 11.3.1 | Title bar buttons | Open `.dita` file | Validate and Preview buttons visible in title bar | [ ] |
| 11.3.2 | Map visualizer button | Open `.ditamap` | Map Visualizer button visible | [ ] |

---

## 12. Performance & Edge Cases

### 12.1 Performance

| # | Test | Steps | Expected | Pass |
|---|------|-------|----------|------|
| 12.1.1 | Rapid typing | Type quickly for 10 seconds in a large file | No UI freeze; diagnostics update after pause | [ ] |
| 12.1.2 | Large workspace | Open workspace with 100+ DITA files | Extension activates within 5s, explorer populated | [ ] |
| 12.1.3 | Rate limiting | Trigger >10 validations/sec on same file | Excess silently skipped, no crash | [ ] |
| 12.1.4 | Large file threshold | Open 600 KB DITA file | DITA-PERF-001 shown, no performance degradation | [ ] |
| 12.1.5 | Concurrent validation | Open 5+ DITA files simultaneously | All files validated without errors | [ ] |

### 12.2 DITA Specialization & @class Matching

| # | Test | Steps | Expected | Pass |
|---|------|-------|----------|------|
| 12.2.0a | @class attribute matching | Use specialized element with `class="- topic/p mySpecialization/myP "` | Element correctly recognized as `<p>` equivalent | [ ] |
| 12.2.0b | Specialized topic type | Open topic with custom specialization DOCTYPE and `@class` attributes | Validation recognizes elements via @class matching, not just element names | [ ] |

### 12.3 Stale Diagnostics & Deduplication

| # | Test | Steps | Expected | Pass |
|---|------|-------|----------|------|
| 12.3.1 | Stale cleanup on save | Run manual validation (`Ctrl+Shift+V`), then save file | Client-side `dita` diagnostics cleared; only `dita-lsp` diagnostics remain | [ ] |
| 12.3.2 | Source deduplication | Check Problems panel after validation | No duplicate entries from `dita` and `dita-lsp` sources for same issue | [ ] |
| 12.3.3 | Diagnostics view dedup | Check Activity Bar Diagnostics view | Identical diagnostics from multiple sources merged by file:line:col:severity:message | [ ] |

### 12.4 Error-Tolerant Tokenizer

| # | Test | Steps | Expected | Pass |
|---|------|-------|----------|------|
| 12.4.1 | Unclosed tag recovery | File with `<p>text` (no closing tag) | Completion and hover still work for valid parts of the file | [ ] |
| 12.4.2 | Unquoted attribute | File with `<p class=foo>` | Tokenizer recovers, IntelliSense available | [ ] |
| 12.4.3 | Malformed attribute | File with `<p attr=>text</p>` | Folding, symbols, and formatting still work on valid portions | [ ] |

### 12.5 Edge Cases

| # | Test | Steps | Expected | Pass |
|---|------|-------|----------|------|
| 12.2.1 | Empty file | Open empty `.dita` file | Graceful handling, appropriate diagnostics | [ ] |
| 12.2.2 | Binary file with `.dita` ext | Rename a PNG to `.dita` | XML parse error, no crash | [ ] |
| 12.2.3 | Very long lines | File with 10,000+ char line | Diagnostics render correctly | [ ] |
| 12.2.4 | Unicode content | DITA file with CJK, Arabic, emoji | Validation works, positions correct | [ ] |
| 12.2.5 | Path with spaces | Workspace path containing spaces | All features work (navigation, publishing, validation) | [ ] |
| 12.2.6 | Deeply nested elements | 50+ levels of nesting | No stack overflow, validation completes | [ ] |
| 12.2.7 | CRLF line endings | Windows-style `\r\n` file | Line numbers in diagnostics match editor | [ ] |
| 12.2.8 | Mixed line endings | File with `\r\n`, `\n`, and `\r` | Diagnostics positioned correctly | [ ] |
| 12.2.9 | No workspace | Open single file (no folder) | Extension works in single-file mode, workspace features gracefully disabled | [ ] |

### 12.6 Security

| # | Test | Steps | Expected | Pass |
|---|------|-------|----------|------|
| 12.3.1 | XXE protection | Add `<!ENTITY xxe SYSTEM "file:///etc/passwd">` | Entity neutralized, no file read | [ ] |
| 12.3.2 | Path traversal | Use `href="../../etc/passwd"` | Path resolved within workspace bounds only | [ ] |
| 12.3.3 | Command injection | Use special chars in DITA-OT args | Arguments escaped, no injection | [ ] |

---

## 13. Regression Checklist

Quick pass/fail checklist for smoke testing after any code change.

| # | Area | Quick Test | Pass |
|---|------|-----------|------|
| 13.1 | Extension activation | Open DITA file, sidebar appears | [ ] |
| 13.2 | Real-time validation | Type invalid XML, see error squiggle | [ ] |
| 13.3 | DTD validation | Add disallowed child, see DTD error | [ ] |
| 13.4 | DITA rules | Add deprecated element, see warning | [ ] |
| 13.5 | Cross-references | Add broken href, see warning | [ ] |
| 13.6 | Quick fix | Click lightbulb on missing ID, apply fix | [ ] |
| 13.7 | Completion | Type `<` in body, see element list | [ ] |
| 13.8 | Hover | Hover element tag, see documentation | [ ] |
| 13.9 | Go to Definition | Ctrl+Click on href value | [ ] |
| 13.10 | Formatting | Shift+Alt+F on unformatted file | [ ] |
| 13.11 | Preview | Ctrl+Shift+H, preview renders | [ ] |
| 13.12 | Explorer | DITA Explorer shows maps with hierarchy | [ ] |
| 13.13 | Severity override | Set `"DITA-STRUCT-005": "off"`, verify suppressed | [ ] |
| 13.14 | Comment suppression | Add disable comment, verify suppressed | [ ] |
| 13.15 | Custom rules | Set customRulesFile, verify diagnostics | [ ] |
| 13.16 | Large file | Open >500KB file, verify DITA-PERF-001 | [ ] |
| 13.17 | Publishing | Publish to HTML5, output generated | [ ] |
| 13.18 | Server tests | `cd server && npm test` → 793 passing | [ ] |
| 13.19 | Client tests | `npm test` → 678 passing, 10 pending | [ ] |
| 13.20 | No regressions | No new errors in Problems panel for valid files | [ ] |

---

## Test Results Summary

| Section | Total Tests | Passed | Failed | Blocked |
|---------|------------|--------|--------|---------|
| 2. Environment Setup | 4 | | | |
| 3. Commands | 19 | | | |
| 4. Validation Pipeline | 115 | | | |
| 5. LSP Features | 46 | | | |
| 6. Code Actions | 12 | | | |
| 7. Activity Bar | 18 | | | |
| 8. Preview & Publishing | 27 | | | |
| 9. Settings & Config | 15 | | | |
| 10. Snippets | 14 | | | |
| 11. Context Menus & Keys | 12 | | | |
| 12. Perf, Edge Cases & Security | 25 | | | |
| 13. Regression | 20 | | | |
| **Total** | **327** | | | |

---

**Tester:** _______________
**Date:** _______________
**Build:** v0.7.2
**Environment:** VS Code ___.__ / Node ___.__ / Windows / macOS / Linux

---

*Last updated: March 2026 (v0.7.2)*
