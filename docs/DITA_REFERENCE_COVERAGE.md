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
| **&lt;xref&gt;** | ❌ NO | ❌ NO | Cross-references not supported |
| **&lt;link&gt;** | ❌ NO | ❌ NO | Link elements not supported |
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

---

## Missing Reference Types (NOT IMPLEMENTED)

### 1. &lt;xref&gt; (Cross-Reference) ❌ NOT IMPLEMENTED

**Use Case**: Inline cross-references within topic content

**Example**:
```xml
<xref href="topics/mycontent.dita#section2">See the referenced section</xref>
<xref keyref="mykey">See details</xref>
```

**Required Implementation**:
- Add xref pattern: `/<xref[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi`
- Support keyref within xref
- Extract and display link text

**Priority**: HIGH - Common DITA usage pattern

### 2. &lt;link&gt; (Related Links) ❌ NOT IMPLEMENTED

**Use Case**: Related links section in topics

**Example**:
```xml
<link href="topics/mycontent.dita" linktext="Click here"/>
<link href="https://www.example.com">External site</link>
```

**Required Implementation**:
- Add link pattern
- Extract linktext attribute
- Handle external links differently

**Priority**: MEDIUM

### 3. @scope Attribute ❌ NOT PARSED

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

### 4. @format Attribute ❌ NOT PARSED

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

### 5. @type Attribute ❌ NOT PARSED

**Use Case**: Specifies topic type of target

**Example**:
```xml
<topicref href="concepts/intro.dita" type="concept"/>
```

**Priority**: LOW

### 6. @rev (Revision) ❌ NOT IMPLEMENTED

**Use Case**: Version/revision tracking

**Example**:
```xml
<topicref href="topics/mycontent.dita" rev="2.0"/>
```

**Priority**: LOW - Typically handled by DITA-OT

### 7. Same-file Navigation ⚠️ PARTIAL

**Issue**: When conref="#element_id", we open the current file but don't scroll to element

**Required Implementation**:
- Use VS Code's `vscode.commands.executeCommand('editor.action.goToLocations')`
- Parse file to find element by @id
- Position cursor at that location

**Priority**: HIGH - Improves user experience

---

## Recommendations

### High Priority (Should Implement)

1. **Add xref support** - Very common in DITA content
   - Inline cross-references
   - Support both href and keyref
   - Display link text

2. **Same-file element navigation** - Improve conref="#id" handling
   - Scroll to specific element
   - Highlight target element

3. **Better error reporting** - When keys aren't found
   - Show diagnostic warning
   - Suggest similar keys

### Medium Priority

4. **Add link element support** - Related links sections
5. **Parse @scope attribute** - Better external link handling
6. **Parse @format attribute** - Icon/tooltip improvements

### Low Priority

7. **@type validation** - Verify topic types match
8. **@rev support** - Version tracking
9. **@linktext extraction** - Display custom link text

---

## Test Coverage Summary

**Implemented and Tested**: 4/11 (36%)
- @conref ✅
- @conkeyref ✅
- @keyref ✅
- @href ✅

**Partially Implemented**: 2/11 (18%)
- @id (validation only)
- @anchor (parsing only)

**Not Implemented**: 5/11 (45%)
- xref
- link
- @scope
- @format
- @type

## Files Needing Updates

1. `src/providers/ditaLinkProvider.ts` - Add xref and link patterns
2. `src/test/suite/ditaLinkProvider.test.ts` - Add xref/link tests
3. `src/test/fixtures/` - Add test fixtures for xref and link
4. `src/providers/ditaValidator.ts` - Validate scope/format attributes

---

*Generated: 2025-11-17*
*DitaCraft Version: 0.2.1*
