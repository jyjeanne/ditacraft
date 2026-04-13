# Automated Test Strategy for DitaCraft

**Mapping the Manual Test Plan to Automated Coverage**

---

## Overview

This document maps the [Manual Test Plan](MANUAL_TEST_PLAN.md) (327 test cases) to the DitaCraft automated test infrastructure. It identifies which manual scenarios are already covered by server-side Mocha tests, which require VS Code E2E testing, and what gaps remain.

---

## Test Infrastructure

### Server Tests (Mocha TDD — No VS Code Required)

```bash
cd server && npm test    # 793 tests, ~450ms
```

Server tests exercise all LSP features, validation pipeline phases, and services directly by calling exported handler functions with mock `TextDocument` instances. They are fast, deterministic, and cover the bulk of DitaCraft logic.

**Test helper pattern:**
```ts
import { createDoc, createDocs } from './helper';
const doc = createDoc('<topic id="t1"><title>T</title></topic>');
const diags = await pipeline.validate(doc, settings, undefined, workspace);
```

### Client Tests (VS Code Electron Runner)

```bash
npm test    # Requires VS Code test electron harness
```

Client tests use `@vscode/test-electron` to launch a real VS Code instance. Required for testing UI elements (tree views, webview panels, command palette, keybindings). These run slower and require `xvfb-run` on headless Linux.

---

## Coverage Matrix

### Section 4: Validation Pipeline (115 manual tests)

| Phase | Manual Tests | Automated | Test Files | Coverage |
|-------|-------------|-----------|------------|----------|
| 4.1 XML & Structure | 23 | ✅ 100% | `validation.test.ts` | All DITA-XML, DITA-STRUCT codes |
| 4.2 DITAVAL | 11 | ✅ 100% | `validation.test.ts` | All 5 DITAVAL codes |
| 4.3 ID Validation | 8 | ✅ 100% | `validation.test.ts` | Dup, format, comment immunity |
| 4.4 DTD/Catalog | 6 | ✅ Partial | `catalogValidation.test.ts` | Availability, fallback |
| 4.5 Cross-references | 12 | ✅ 100% | `crossRefValidation.test.ts` | Href, conref, keyref, external |
| 4.6 Key Space | 11 | ✅ 100% | `keySpaceService.test.ts` | Keys, scopes, submaps, dedup |
| 4.7 Profiling | 6 | ✅ 100% | `profilingValidation.test.ts` | Controlled attrs, subject scheme |
| 4.8 Severity/Suppression | 10 | ✅ 100% | `validationPipeline.test.ts` | Overrides, comments, CRLF |
| 4.9 Custom Rules | 8 | ✅ 100% | `customRulesValidator.test.ts` | Patterns, filters, cache, errors |
| 4.10 Large File | 4 | ✅ 100% | `edgeCases.test.ts`, `validationPipeline.test.ts` | Phase skip, boundary |
| 4.11 DITA 2.0 Rules | 10 | ✅ 100% | `ditaRulesValidator.test.ts` | All SCH-050 through SCH-059 |
| 4.12 Content Model | 6 | ✅ 100% | `contentModelValidation.test.ts` | Map, topic, table elements |

### Section 5: LSP Features (46 manual tests)

| Feature | Manual Tests | Automated | Test Files |
|---------|-------------|-----------|------------|
| 5.1 Completion | 8 | ✅ 100% | `completion.test.ts` |
| 5.2 Hover | 6 | ✅ 100% | `hover.test.ts` |
| 5.3 Go to Definition | 6 | ✅ 100% | `definition.test.ts` |
| 5.4 Find References | 2 | ✅ 100% | `references.test.ts` |
| 5.5 Rename | 2 | ✅ 100% | `rename.test.ts` |
| 5.6 Document Symbols | 3 | ✅ 100% | `symbols.test.ts` |
| 5.7 Workspace Symbols | 2 | ✅ 100% | `symbols.test.ts` |
| 5.8 Formatting | 3 | ✅ 100% | `formatting.test.ts` |
| 5.9 Folding Ranges | 3 | ✅ 100% | `folding.test.ts` |
| 5.10 Linked Editing | 2 | ✅ 100% | `linkedEditing.test.ts` |
| 5.11 Document Links | 3 | ✅ 100% | `documentLinks.test.ts` |
| 5.12 Diagnostics | 4 | ⚠️ Partial | `validationPipeline.test.ts` | Debounce/cancellation needs E2E |
| 5.13 Localization | 2 | ✅ 100% | `i18n.test.ts` |

### Section 6: Code Actions (12 manual tests)

| Manual Tests | Automated | Test File | Coverage |
|-------------|-----------|-----------|----------|
| 12 | ✅ 100% | `codeActions.test.ts` | All 12 quick fix codes |

### Sections 7–8: UI Features (45 manual tests — Require VS Code E2E)

| Feature | Manual Tests | Automated | Notes |
|---------|-------------|-----------|-------|
| 7.1 DITA Explorer | 7 | ❌ | Tree view provider — needs VS Code instance |
| 7.2 Key Space View | 5 | ❌ | Tree view provider |
| 7.3 Diagnostics View | 6 | ❌ | Tree view provider |
| 8.1 Live Preview | 7 | ❌ | WebView panel |
| 8.2 Publishing | 6 | ❌ | DITA-OT integration + Output panel |
| 8.3 Map Visualizer | 6 | ❌ | WebView panel |
| 8.4 Guide Validation | 8 | ❌ | WebView panel + DITA-OT |

### Section 9: Settings (15 manual tests)

| Manual Tests | Automated | Test Files | Notes |
|-------------|-----------|------------|-------|
| 15 | ⚠️ Partial | `settings.test.ts`, `validationPipeline.test.ts` | Hot-reload needs VS Code E2E |

### Section 12: Edge Cases (25 manual tests)

| Category | Manual Tests | Automated | Test File |
|----------|-------------|-----------|-----------|
| 12.1 Performance | 5 | ✅ 80% | `edgeCases.test.ts`, `validationPipeline.test.ts` |
| 12.2 Specialization | 2 | ⚠️ | Partial via ditaRulesValidator.test.ts |
| 12.3 Stale diagnostics | 3 | ❌ | Requires VS Code E2E |
| 12.4 Error-tolerant tokenizer | 3 | ✅ 100% | `xmlTokenizer.test.ts` |
| 12.5 Edge cases | 8 | ✅ 100% | `edgeCases.test.ts` |
| 12.6 Security | 3 | ⚠️ | XXE neutralized in tokenizer |

---

## Automated Coverage Summary

| Category | Manual Tests | Automated | Gap |
|----------|-------------|-----------|-----|
| Validation Pipeline (§4) | 115 | ~110 | ~5 (DTD catalog specifics) |
| LSP Features (§5) | 46 | ~42 | 4 (debounce/cancellation) |
| Code Actions (§6) | 12 | 12 | 0 |
| UI Features (§7-8) | 45 | 0 | 45 (VS Code E2E required) |
| Settings (§9) | 15 | ~8 | 7 (hot-reload) |
| Snippets (§10) | 14 | 0 | 14 (VS Code E2E required) |
| Context Menus (§11) | 12 | 0 | 12 (VS Code E2E required) |
| Edge Cases (§12) | 25 | ~20 | 5 (stale diag, security) |
| Regression (§13) | 20 | ~10 | 10 (UI smoke tests) |
| **Total** | **327** | **~202** | **~125** |

**Server-side automated coverage: ~62% of manual test scenarios**
**Remaining gaps: UI/E2E tests requiring VS Code instance**

---

## Future: VS Code E2E Tests

For the ~125 manual tests that require a VS Code instance (Sections 7, 8, 10, 11, parts of 12-13), a future E2E framework should use:

1. **@vscode/test-electron** — Launch VS Code with the DitaCraft extension loaded
2. **VS Code API** — Execute commands, inspect tree views, read diagnostics via the extension API
3. **Test workspace** — A `test-workspace/` directory with pre-built DITA content for predictable scenarios

**Priority E2E tests to implement first:**
- DITA Explorer tree view (§7.1) — most visible UI feature
- Live Preview (§8.1) — core user journey
- Publishing (§8.2) — end-to-end DITA-OT integration
- Regression smoke tests (§13) — post-release confidence

---

## Running Tests

```bash
# Server tests (fast, no VS Code needed)
cd server && npm test

# Type-check (server only — reliable)
cd server && npx tsc --noEmit

# Full build (type-check + esbuild bundle)
npm run compile

# Client tests (requires VS Code electron)
npm test

# Coverage report
npm run coverage
```

---

*Last updated: July 2025 (v0.7.2)*

