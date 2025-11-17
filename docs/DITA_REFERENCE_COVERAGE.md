# DITA Reference Type Coverage Analysis

This document analyzes DitaCraft's support for DITA reference types and their test coverage.

## Coverage Matrix

| Reference Type | Implemented | Test Coverage | Notes |
|---------------|-------------|---------------|-------|
| **@conref** | ✅ YES | ✅ YES | Content references with file#element format |
| **@conkeyref** | ✅ YES | ✅ YES | Key-based content references |
| **@keyref** | ✅ YES | ✅ YES | Key references with key space resolution |
| **@href** | ✅ YES | ✅ YES | Direct file references in maps |
| **&lt;topicref&gt;** | ✅ YES | ✅ YES | Topic references in maps |
| **@id** | ⚠️ PARTIAL | ✅ YES | Validated but not navigable |
| **@scope** | ❌ NO | ❌ NO | Not parsed for navigation |
| **@format** | ❌ NO | ❌ NO | Not used in link resolution |
| **@type** | ❌ NO | ❌ NO | Not considered in navigation |
| **@keys** | ✅ YES | ✅ YES | Key definitions in maps |
| **&lt;xref&gt;** | ✅ YES | ✅ YES | Cross-references (href and keyref) |
| **&lt;link&gt;** | ✅ YES | ✅ YES | Related link elements |
| **@anchor** | ⚠️ PARTIAL | ❌ NO | Fragment parsed but not scrolled to |
| **@rev** | ❌ NO | ❌ NO | Revision history not tracked |
| **@linktext** | ❌ NO | ❌ NO | Link text not extracted |

## Detailed Analysis

### 1. @conref (Content Reference) ✅ IMPLEMENTED

**Implementation**: `src/providers/ditaLinkProvider.ts` line 130-190
**Regex Pattern**: `/\bconref\s*=\s*["']([^"']+)["']/gi`

**Supported Formats**:
- ✅ `conref="file.dita#element_id"` - File with element
- ✅ `conref="file.dita#topic_id/element_id"` - File with path
- ✅ `conref="./file.dita#element"` - Relative path
- ⚠️ `conref="#element_id"` - Same file (not scrolled to)

**Test Coverage**:
- ✅ Should detect conref attributes in topic files
- ✅ Should handle conref with fragment identifiers
- ✅ Should handle conref with relative paths
- ✅ Conref tooltip should indicate content reference
- ✅ Should detect @conref with file.dita#element_id format
- ✅ Should handle @conref with file.dita#topic_id/element_id format
- ✅ Should detect @conref on different element types (p, note)
- ✅ Should handle @conref with relative paths (./file.dita)

### 2. @conkeyref (Content Key Reference) ✅ IMPLEMENTED

**Implementation**: `src/providers/ditaLinkProvider.ts` line 191-286
**Regex Pattern**: `/\bconkeyref\s*=\s*["']([^"']+)["']/gi`

**Supported Formats**:
- ✅ `conkeyref="keyname/element"` - Key with element path
- ✅ `conkeyref="keyname"` - Key only (navigates to source map)

**Test Coverage**:
- ✅ Should detect conkeyref attributes with filenames
- ✅ Should skip pure key conkeyref without filenames (NOW RESOLVED)
- ✅ Conkeyref tooltip should indicate content key reference
- ✅ Should detect conkeyref in user guide

### 3. @keyref (Key Reference) ✅ IMPLEMENTED

**Implementation**: `src/providers/ditaLinkProvider.ts` line 287-365
**Regex Pattern**: `/\bkeyref\s*=\s*["']([^"']+)["']/gi`

**Supported Formats**:
- ✅ `keyref="keyname"` - Pure key reference
- ✅ Keys with href targets (navigates to file)
- ✅ Keys with inline content (shows tooltip, navigates to map)
- ✅ Keys without targets (navigates to source map)

**Test Coverage**:
- ✅ Should detect keyref attributes with filenames
- ✅ Should resolve pure key keyref via key space resolution
- ✅ Keyref tooltip should indicate key reference

### 4. @href (Hyperlink Reference) ✅ IMPLEMENTED

**Implementation**: `src/providers/ditaLinkProvider.ts` line 77-124
**Regex Pattern**: Limited to specific elements (topicref, chapter, appendix, etc.)

**Supported Formats**:
- ✅ `href="path/to/file.dita"` - Direct file path
- ✅ `href="file.dita#topic_id"` - File with fragment
- ✅ `href="./relative/file.dita"` - Relative paths
- ✅ Skips `http://` and `https://` URLs

**Test Coverage**:
- ✅ Should detect href attributes in topicref elements
- ✅ Should create links for local DITA files
- ✅ Should handle relative paths correctly
- ✅ Should skip external HTTP URLs
- ✅ Should handle href with fragment identifiers
- ✅ Should handle nested topicref elements
- ✅ Should have correct range for href value
- ✅ Should have tooltip with filename

### 5. &lt;topicref&gt; ✅ IMPLEMENTED

**Implementation**: Covered by href processing
**Elements Supported**: topicref, chapter, appendix, part, mapref, keydef, topicgroup, topichead

**Test Coverage**:
- ✅ Should detect href in chapter elements
- ✅ Should detect href in appendix elements
- ✅ Should detect href in part elements
- ✅ Should detect href in mapref elements
- ✅ Should detect href in keydef elements
- ✅ Should detect href in nested elements within topicgroup

### 6. @keys (Key Definitions) ✅ IMPLEMENTED

**Implementation**: `src/utils/keySpaceResolver.ts` line 292-379
**Regex Pattern**: `/<(\w+)[^>]*\bkeys\s*=\s*["']([^"']+)["'][^>]*>/gi`

**Supported Formats**:
- ✅ `<keydef keys="keyname" href="file.dita"/>`
- ✅ `<keydef keys="key1 key2">` - Multiple keys
- ✅ `<topicref keys="keyname">` - Keys on any element
- ✅ Inline content in topicmeta/keywords

**Test Coverage**:
- ✅ Key space building tests
- ✅ Key resolution tests
- ✅ Cache management tests
- ✅ Root map discovery tests

### 7. &lt;xref&gt; (Cross-Reference) ✅ IMPLEMENTED

**Implementation**: `src/providers/ditaLinkProvider.ts` line 391-523
**Regex Patterns**:
- `/<xref[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi`
- `/<xref[^>]*\bkeyref\s*=\s*["']([^"']+)["'][^>]*>/gi`

**Supported Formats**:
- ✅ `<xref href="file.dita">` - File reference
- ✅ `<xref href="file.dita#element">` - File with fragment
- ✅ `<xref href="#element">` - Same-file reference
- ✅ `<xref keyref="keyname">` - Key reference
- ✅ Skips `http://` and `https://` URLs

**Test Coverage**:
- ✅ Should detect xref elements with href attributes
- ✅ Should handle xref href with file references
- ✅ Should handle xref href with fragment identifiers
- ✅ Should handle xref with same-file fragment references
- ✅ Should skip xref with external HTTP URLs
- ✅ Xref tooltip should indicate cross-reference type

### 8. &lt;link&gt; (Related Links) ✅ IMPLEMENTED

**Implementation**: `src/providers/ditaLinkProvider.ts` line 525-590
**Regex Pattern**: `/<link[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi`

**Supported Formats**:
- ✅ `<link href="file.dita"/>` - File reference
- ✅ `<link href="file.dita#element"/>` - File with fragment
- ✅ `<link href="#element"/>` - Same-file reference
- ✅ Skips `http://` and `https://` URLs

**Test Coverage**:
- ✅ Should detect link elements with href attributes
- ✅ Should handle link element with file references
- ✅ Should handle link element with fragment identifiers
- ✅ Should handle link element with same-file fragment references
- ✅ Should skip link elements with external HTTP URLs
- ✅ Link tooltip should indicate related link type

---

## Missing Reference Types (NOT IMPLEMENTED)

### 1. @scope Attribute ❌ NOT PARSED

**Use Case**: Determines if reference is local, peer, or external

**Example**:
```xml
<xref href="topics/other.dita" scope="peer">Peer topic</xref>
<xref href="http://example.com" scope="external">External</xref>
```

**Required Implementation**:
- Parse scope attribute
- Different handling for external vs local
- Validate scope consistency

**Priority**: MEDIUM

### 2. @format Attribute ❌ NOT PARSED

**Use Case**: Specifies format of target (dita, html, pdf, etc.)

**Example**:
```xml
<topicref href="resources/guide.pdf" format="pdf"/>
```

**Required Implementation**:
- Parse format attribute
- Different icons/tooltips based on format
- Warn if format doesn't match file extension

**Priority**: LOW

### 3. @type Attribute ❌ NOT PARSED

**Use Case**: Specifies topic type of target

**Example**:
```xml
<topicref href="concepts/intro.dita" type="concept"/>
```

**Priority**: LOW

### 4. @rev (Revision) ❌ NOT IMPLEMENTED

**Use Case**: Version/revision tracking

**Example**:
```xml
<topicref href="topics/mycontent.dita" rev="2.0"/>
```

**Priority**: LOW - Typically handled by DITA-OT

### 5. Same-file Navigation ⚠️ PARTIAL

**Issue**: When conref="#element_id", we open the current file but don't scroll to element

**Required Implementation**:
- Use VS Code's `vscode.commands.executeCommand('editor.action.goToLocations')`
- Parse file to find element by @id
- Position cursor at that location

**Priority**: HIGH - Improves user experience

---

## Recommendations

### High Priority (Should Implement)

1. **Same-file element navigation** - Improve conref="#id" and xref="#id" handling
   - Scroll to specific element
   - Highlight target element
   - Use VS Code's `vscode.commands.executeCommand('editor.action.goToLocations')`

2. **Better error reporting** - When keys aren't found
   - Show diagnostic warning
   - Suggest similar keys
   - Inline validation for missing references

### Medium Priority

3. **Parse @scope attribute** - Better external link handling
   - Different handling for external vs local
   - Validate scope consistency

4. **Parse @format attribute** - Icon/tooltip improvements
   - Different icons based on format (pdf, html, etc.)
   - Warn if format doesn't match file extension

### Low Priority

5. **@type validation** - Verify topic types match
6. **@rev support** - Version tracking
7. **@linktext extraction** - Display custom link text in tooltips

---

## Test Coverage Summary

**Implemented and Tested**: 6/11 (55%)
- @conref ✅
- @conkeyref ✅
- @keyref ✅
- @href ✅
- &lt;xref&gt; ✅
- &lt;link&gt; ✅

**Partially Implemented**: 2/11 (18%)
- @id (validation only)
- @anchor (parsing only)

**Not Implemented**: 3/11 (27%)
- @scope
- @format
- @type

## Recent Changes (2025-11-17)

**Added xref and link support**:
1. `src/providers/ditaLinkProvider.ts` - Added xref and link pattern matching
   - `processXrefAttributes()` - for `<xref href="...">`
   - `processXrefKeyrefAttributes()` - for `<xref keyref="...">`
   - `processLinkAttributes()` - for `<link href="...">`
2. `src/test/suite/ditaLinkProvider.test.ts` - Added 21 new test cases
3. `src/test/fixtures/topic-with-xref-links.dita` - New comprehensive test fixture

## Files Needing Updates

1. `src/providers/ditaValidator.ts` - Validate scope/format attributes
2. `src/providers/ditaLinkProvider.ts` - Add same-file element scrolling

---

*Generated: 2025-11-17*
*DitaCraft Version: 0.2.2*
