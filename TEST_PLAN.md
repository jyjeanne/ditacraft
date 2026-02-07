# DitaCraft LSP Server — Test Plan

**Version:** 0.5.0
**Date:** February 2026
**Scope:** Manual verification of all 14 LSP server features

This document provides step-by-step test procedures to verify every LSP feature in a running VS Code instance with the DitaCraft extension loaded.

---

## Prerequisites

1. VS Code 1.80+ with DitaCraft extension installed (or running in debug mode with F5)
2. A workspace containing DITA files (the `docs/user-guide/` directory works well)
3. At least one `.ditamap` or `.bookmap` file in the workspace
4. Server running (check Output panel > "DitaCraft LSP" for server startup messages)

### Sample Test File

Create `test-topic.dita` in your workspace for the tests below:

```xml
<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">
<topic id="test-topic">
  <title>Test Topic</title>
  <body>
    <p>This is a test paragraph with <b>bold</b> and <i>italic</i> text.</p>
    <section id="sec1">
      <title>Section One</title>
      <p>Section content here.</p>
    </section>
    <section id="sec2">
      <title>Section Two</title>
      <note type="tip">A helpful tip.</note>
    </section>
  </body>
</topic>
```

---

## 1. Diagnostics (Validation)

**Feature:** Real-time XML and DITA structure validation via `dita-lsp` source.

### 1.1 XML Well-Formedness

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| 1.1.1 | Malformed XML detected | Remove a closing tag (e.g., delete `</p>`) | Red squiggly on the malformed region, diagnostic with code `DITA-XML-001` in Problems panel |
| 1.1.2 | Mismatched tags detected | Change `</section>` to `</div>` | XML error diagnostic appears |
| 1.1.3 | Valid XML produces no XML errors | Undo changes, save valid file | No `DITA-XML-001` diagnostics |

### 1.2 DITA Structure

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| 1.2.1 | Missing DOCTYPE warning | Remove the `<!DOCTYPE ...>` line | Warning with code `DITA-STRUCT-001` |
| 1.2.2 | Missing root ID error | Remove `id="test-topic"` from `<topic>` | Error with code `DITA-STRUCT-003` |
| 1.2.3 | Missing title error | Remove the `<title>` element | Error with code `DITA-STRUCT-004` |
| 1.2.4 | Empty title warning | Change `<title>Test Topic</title>` to `<title></title>` | Warning with code `DITA-STRUCT-005` |
| 1.2.5 | Invalid root element | Change `<topic>` to `<div>` | Error with code `DITA-STRUCT-002` |

### 1.3 ID Validation

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| 1.3.1 | Duplicate IDs | Add `id="sec1"` to a `<p>` element | Error with code `DITA-ID-001` on both elements |
| 1.3.2 | Invalid ID format | Add `id="1bad"` to an element | Warning with code `DITA-ID-002` |
| 1.3.3 | IDs in comments ignored | Add `<!-- <p id="sec1"/> -->` | No duplicate ID error |

---

## 2. IntelliSense (Completion)

**Feature:** Context-aware completions triggered by typing or Ctrl+Space.

### 2.1 Element Completions

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| 2.1.1 | Child elements of body | Place cursor inside `<body>`, type `<` | Completion list shows `p`, `section`, `ul`, `ol`, `table`, `note`, etc. |
| 2.1.2 | Child elements of topic | Place cursor after `</body>` but before `</topic>`, type `<` | Completion list shows `title`, `body`, `related-links`, etc. |
| 2.1.3 | Snippet format | Select `section` from completion list | Inserts `section>...</ section>` with cursor positioned inside (snippet with tab stop) |
| 2.1.4 | Unknown parent | Type `<` inside `<unknownelement>` | No completions offered |

### 2.2 Attribute Completions

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| 2.2.1 | Common attributes | Inside `<topic `, press Ctrl+Space | Shows `id`, `conref`, `outputclass`, etc. |
| 2.2.2 | Element-specific attributes | Inside `<topicref `, press Ctrl+Space | Shows `href`, `keys`, `format`, `scope` before common attributes |
| 2.2.3 | Snippet format | Select `id` attribute | Inserts `id=""` with cursor between quotes |

### 2.3 Attribute Value Completions

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| 2.3.1 | Note type values | Inside `<note type="">`, place cursor between quotes | Shows `note`, `tip`, `important`, `warning`, `caution`, `danger`, etc. |
| 2.3.2 | Scope values | Inside `<xref scope="">`, place cursor between quotes | Shows `local`, `peer`, `external` |
| 2.3.3 | Unknown attribute | Inside `<topic foo="">`, place cursor between quotes | No completions |

---

## 3. Hover Documentation

**Feature:** Element documentation shown on mouse hover over tag names.

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| 3.1 | Known element hover | Hover over `<topic>` tag name | Markdown popup with element description and children list |
| 3.2 | Section hover | Hover over `<section>` tag name | Shows section documentation |
| 3.3 | Note hover | Hover over `<note>` tag name | Shows note documentation with type list |
| 3.4 | Closing tag hover | Hover over `</topic>` tag name | Same documentation as opening tag |
| 3.5 | Text content — no hover | Hover over text "test paragraph" | No hover popup |
| 3.6 | Attribute value — no hover | Hover over `"test-topic"` in `id="test-topic"` | No hover popup |
| 3.7 | Unknown element | Hover over a tag name not in DITA schema | No hover popup |

---

## 4. Document Symbols (Outline)

**Feature:** Hierarchical document outline via Ctrl+Shift+O or the Outline panel.

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| 4.1 | Topic outline | Open test file, press Ctrl+Shift+O | Shows topic, body, section, section hierarchy |
| 4.2 | Title text in names | Check outline entries | Topic shows "Test Topic", sections show "Section One" and "Section Two" |
| 4.3 | ID in detail | Check section entries | Sections show `sec1` and `sec2` as detail |
| 4.4 | Symbol kinds | Check icons in outline | Topic uses class icon, body uses struct, sections use method |
| 4.5 | Navigate from outline | Click an outline entry | Editor scrolls to that element |
| 4.6 | Self-closing elements | Add `<topicref href="x.dita"/>` in a map file | Topicref appears in outline |

---

## 5. Workspace Symbols

**Feature:** Cross-file symbol search via Ctrl+T.

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| 5.1 | Search by title | Press Ctrl+T, type "Test Topic" | Shows the topic from test-topic.dita |
| 5.2 | Search by element name | Press Ctrl+T, type "section" | Shows all section elements across workspace files |
| 5.3 | Search by ID | Press Ctrl+T, type "sec1" | Shows the section with id="sec1" |
| 5.4 | Navigate to result | Select a result from the list | File opens and cursor moves to the element |
| 5.5 | Empty query | Press Ctrl+T, leave query empty | No results (requires a query) |
| 5.6 | Case insensitive | Press Ctrl+T, type "test topic" (lowercase) | Still finds "Test Topic" |

---

## 6. Go to Definition

**Feature:** Navigate to definition targets via F12 or Ctrl+Click.

### 6.1 Same-File Navigation

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| 6.1.1 | Conref to same file | Add `<p conref="#test-topic/sec1"/>`, F12 on the value | Cursor jumps to the element with id="sec1" |

### 6.2 Cross-File Navigation

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| 6.2.1 | Href to another file | On `<topicref href="other.dita"/>`, F12 on href value | Opens other.dita |
| 6.2.2 | Href with fragment | On `href="other.dita#topic/elem"`, F12 | Opens other.dita and navigates to element |
| 6.2.3 | Conref cross-file | On `conref="other.dita#topic/para1"`, F12 | Opens other.dita at the referenced element |

### 6.3 Key-Based Navigation

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| 6.3.1 | Keyref resolution | On `<xref keyref="mykey"/>`, F12 | Navigates to the file defined by the key in the map |
| 6.3.2 | Conkeyref resolution | On `<p conkeyref="mykey/elem"/>`, F12 | Navigates to the element in the key-resolved file |

---

## 7. Find References

**Feature:** Find all references to an element ID via Shift+F12.

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| 7.1 | Same-file references | Place cursor on `id="sec1"`, press Shift+F12 | Shows all conref/href pointing to sec1 in the current file |
| 7.2 | Cross-file references | Create another file referencing `#test-topic/sec1`, press Shift+F12 on the ID | Shows references from both files |
| 7.3 | No references | Place cursor on an ID with no references | Shows "No references found" or empty list |

---

## 8. Rename

**Feature:** Rename element IDs with automatic reference updates via F2.

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| 8.1 | Rename ID | Place cursor on `id="sec1"`, press F2, type `section-one` | ID changes to `section-one`, all conref/href references in the file update |
| 8.2 | Cross-file rename | With references in other files, rename an ID | References in other open files also update |
| 8.3 | Non-ID position | Place cursor on text content, press F2 | No rename offered (or rename rejected) |

---

## 9. Formatting

**Feature:** XML document formatting via Shift+Alt+F.

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| 9.1 | Flatten and reformat | Put all content on one line, press Shift+Alt+F | Content properly indented with 2-space indentation |
| 9.2 | Inline elements preserved | Format a file with `<b>`, `<i>`, `<ph>` elements | Inline elements stay on the same line as surrounding text |
| 9.3 | Preformatted preserved | Format a file with `<codeblock>` content | Content inside codeblock is NOT reformatted |
| 9.4 | DOCTYPE preserved | Format a file with DOCTYPE declaration | DOCTYPE stays at the top, unmodified |
| 9.5 | Idempotent | Format the file again | No changes (already formatted) |
| 9.6 | Comments preserved | Format a file with XML comments | Comments appear correctly indented |

---

## 10. Code Actions (Quick Fixes)

**Feature:** Quick fixes offered via the lightbulb icon or Ctrl+.

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| 10.1 | Add missing DOCTYPE | Remove DOCTYPE, click lightbulb on the warning | Offers "Add DOCTYPE for topic" — applying inserts correct DOCTYPE |
| 10.2 | Add missing ID | Remove ID from root, click lightbulb on the error | Offers "Add id=..." — applying inserts ID derived from filename |
| 10.3 | Add missing title | Remove `<title>`, click lightbulb | Offers "Add `<title>` element" — applying inserts title after root tag |
| 10.4 | Remove empty element | Create `<p></p>`, click lightbulb on the warning | Offers "Remove empty `<p>`" — applying deletes the element |
| 10.5 | Fix duplicate ID | Create duplicate IDs, click lightbulb on the error | Offers "Rename to ... to make unique" — applying adds a random suffix |
| 10.6 | No fixes for unknown codes | Diagnostics from other sources | No code actions offered |

---

## 11. Linked Editing

**Feature:** Simultaneous editing of matching open/close XML tag names.

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| 11.1 | Rename opening tag | Place cursor on `topic` in `<topic>`, type to change the name | Closing `</topic>` updates simultaneously |
| 11.2 | Rename closing tag | Place cursor on `section` in `</section>`, type to change | Opening `<section>` updates simultaneously |
| 11.3 | Self-closing tag | Place cursor on a self-closing tag name | No linked editing (single tag, nothing to pair) |
| 11.4 | Nested same-name tags | With `<div><div>...</div></div>`, edit inner `<div>` | Only inner pair changes, outer pair unaffected |

> **Note:** Linked editing requires VS Code's `editor.linkedEditing` setting to be `true`.

---

## 12. Folding Ranges

**Feature:** Collapse/expand XML elements, comments, and CDATA blocks.

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| 12.1 | Element folding | Click fold icon next to `<body>` | Body content collapses, showing `<body>...` |
| 12.2 | Nested folding | Fold a `<section>` inside `<body>` | Section collapses independently |
| 12.3 | Comment folding | Add a multi-line `<!-- ... -->` comment | Fold icon appears, comment can be collapsed |
| 12.4 | Single-line elements | A `<p>` element on one line | No fold icon (single-line elements don't fold) |
| 12.5 | CDATA folding | Add a multi-line `<![CDATA[...]]>` block | Fold icon appears for the CDATA block |

---

## 13. Document Links

**Feature:** Clickable links for href, conref, keyref, and conkeyref attribute values.

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| 13.1 | Href link | Hover over `href="other.dita"` value | Value is underlined, Ctrl+Click opens the file |
| 13.2 | Conref link | Hover over `conref="file.dita#topic/elem"` value | Value is underlined as a link |
| 13.3 | Keyref link | Hover over `keyref="mykey"` value | Value is underlined, Ctrl+Click navigates to key target |
| 13.4 | External URL ignored | On `href="https://example.com"` | Not shown as a document link (external URLs skipped) |
| 13.5 | Missing file | On `href="nonexistent.dita"` | Link shown but navigation shows file not found |

---

## 14. Key Space Resolution (Server-Side)

**Feature:** Server-side key space building from map hierarchies for definition/links.

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| 14.1 | Key resolved | Define `<keydef keys="mykey" href="target.dita"/>` in a map, use `keyref="mykey"` in a topic | Go to Definition on keyref navigates to target.dita |
| 14.2 | Nested map keys | Define keys in a submap referenced from root map | Keys from submap are resolved |
| 14.3 | Key invalidation | Modify the map file (add/remove a keydef) | After save, key space is refreshed and new key is resolvable |
| 14.4 | Cache performance | Navigate to the same key multiple times | Second navigation is noticeably faster (cached) |

---

## Automated Test Summary

In addition to this manual test plan, the following automated tests verify LSP features:

| Test File | Tests | Features Covered |
|-----------|-------|-----------------|
| `server/test/referenceParser.test.ts` | 30 | Reference parsing, ID lookup, cross-ref matching |
| `server/test/formatting.test.ts` | 20 | XML formatting (indent, inline, preformatted, edge cases) |
| `server/test/folding.test.ts` | 10 | Folding ranges (elements, comments, CDATA) |
| `server/test/workspaceScanner.test.ts` | 8 | Offset-to-position conversion |
| `server/test/validation.test.ts` | 22 | XML, DITA structure, ID, map/bookmap validation |
| `server/test/completion.test.ts` | 14 | Element, attribute, value completions |
| `server/test/hover.test.ts` | 12 | Hover docs, fallback, non-tag positions |
| `server/test/symbols.test.ts` | 13 | Document symbols, title extraction, maps |
| `server/test/codeActions.test.ts` | 14 | All 5 quick fixes + edge cases |
| `server/test/linkedEditing.test.ts` | 15 | Tag pairing, nesting, boundaries |
| **Total** | **162** | |

**Running automated tests:**
```bash
cd server && npm test
```

---

## Test Execution Checklist

Use this checklist to track manual test execution:

- [ ] 1. Diagnostics (1.1-1.3) — 11 tests
- [ ] 2. IntelliSense (2.1-2.3) — 10 tests
- [ ] 3. Hover Documentation — 7 tests
- [ ] 4. Document Symbols — 6 tests
- [ ] 5. Workspace Symbols — 6 tests
- [ ] 6. Go to Definition (6.1-6.3) — 5 tests
- [ ] 7. Find References — 3 tests
- [ ] 8. Rename — 3 tests
- [ ] 9. Formatting — 6 tests
- [ ] 10. Code Actions — 6 tests
- [ ] 11. Linked Editing — 4 tests
- [ ] 12. Folding Ranges — 5 tests
- [ ] 13. Document Links — 5 tests
- [ ] 14. Key Space Resolution — 4 tests

**Total manual tests: 81**
**Total automated tests: 162**
