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
| **@id** | ✅ YES | ✅ YES | Navigable via element navigator |
| **@scope** | ✅ YES | ✅ YES | Shown in tooltip (local/peer/external) |
| **@format** | ✅ YES | ✅ YES | Shown in tooltip (dita/pdf/html) |
| **@type** | ✅ YES | ✅ YES | Shown in tooltip for link elements |
| **@keys** | ✅ YES | ✅ YES | Key definitions in maps |
| **&lt;xref&gt;** | ✅ YES | ✅ YES | Cross-references (href and keyref) |
| **&lt;link&gt;** | ✅ YES | ✅ YES | Related link elements |
| **#fragment** | ✅ YES | ✅ YES | Same-file navigation with scroll |
| **@linktext** | ✅ YES | ✅ YES | Link text extracted and shown in tooltip |
| **@rev** | ✅ YES | ✅ YES | Revision tracking shown in tooltip |

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

## Recently Implemented Reference Types

### 1. @scope Attribute ✅ IMPLEMENTED

**Implementation**: `src/providers/ditaLinkProvider.ts`
**Pattern**: `/\bscope\s*=\s*["']([^"']+)["']/i`

**Features**:
- ✅ Extracted from xref and link elements
- ✅ Displayed in tooltip as `[scope: local/peer/external]`
- ✅ Supports local, peer, and external values

**Test Coverage**:
- ✅ Should extract @scope attribute in xref tooltip
- ✅ Should handle peer scope in tooltip
- ✅ Should show multiple attributes in tooltip

### 2. @format Attribute ✅ IMPLEMENTED

**Implementation**: `src/providers/ditaLinkProvider.ts`
**Pattern**: `/\bformat\s*=\s*["']([^"']+)["']/i`

**Features**:
- ✅ Extracted from xref and link elements
- ✅ Displayed in tooltip as `[format: dita/pdf/html]`
- ✅ Shows target file format type

**Test Coverage**:
- ✅ Should extract @format attribute in xref tooltip
- ✅ Should find link with PDF format

### 3. @type Attribute ✅ IMPLEMENTED

**Implementation**: `src/providers/ditaLinkProvider.ts`
**Pattern**: `/\btype\s*=\s*["']([^"']+)["']/i`

**Features**:
- ✅ Extracted from link elements
- ✅ Displayed in tooltip as `[type: concept/task/reference]`
- ✅ Shows topic type of target

**Test Coverage**:
- ✅ Should extract @type attribute in link element tooltip

### 4. @linktext Attribute ✅ IMPLEMENTED

**Implementation**: `src/providers/ditaLinkProvider.ts`
**Pattern**: `/\blinktext\s*=\s*["']([^"']+)["']/i`

**Features**:
- ✅ Extracted from xref and link elements
- ✅ Displayed in tooltip as `Link text: "custom text"`
- ✅ Shows custom link text on new line

**Test Coverage**:
- ✅ Should extract @linktext attribute in xref tooltip
- ✅ Should find link with "Click here for more" linktext

### 5. Same-file Navigation ✅ IMPLEMENTED

**Implementation**: `src/utils/elementNavigator.ts`
**Command**: `ditacraft.navigateToElement`

**Supported Formats**:
- ✅ `#element_id` - Direct element reference
- ✅ `#topic_id/element_id` - Nested path format
- ✅ Automatic element finding by @id attribute
- ✅ Visual highlight with 2-second fade
- ✅ Cursor positioned at element

**Test Coverage**:
- ✅ Should find element with simple id
- ✅ Should find root element id
- ✅ Should return -1 for non-existent id
- ✅ Should handle id with underscores
- ✅ Should handle id with hyphens
- ✅ Should create valid command URIs for same-file references
- ✅ Conref, xref, and link same-file references use command URIs

### 6. Key Reference Diagnostics ✅ IMPLEMENTED

**Implementation**: `src/providers/keyDiagnostics.ts`

**Features**:
- ✅ Automatic detection of undefined keyref and conkeyref
- ✅ Warning markers in VS Code Problems panel
- ✅ Debounced validation (1s delay)
- ✅ Integration with KeySpaceResolver
- ✅ Helpful error messages for missing keys

### 7. @rev Attribute ✅ IMPLEMENTED

**Implementation**: `src/providers/ditaLinkProvider.ts`
**Pattern**: `/\brev\s*=\s*["']([^"']+)["']/i`

**Features**:
- ✅ Extracted from xref and link elements
- ✅ Displayed in tooltip as `[rev: 2.0]`
- ✅ Shows revision/version information
- ✅ Supports any revision identifier (e.g., '2.0', '1.5', 'draft')

**Test Coverage**:
- ✅ Should extract @rev attribute in xref tooltip
- ✅ Should extract @rev attribute in link element tooltip
- ✅ Should show rev attribute alongside other attributes

---

## Recommendations

### Low Priority (Future Enhancements)

1. **Advanced scope handling** - External link behavior
   - Open external links in browser
   - Different warning for peer scope files not found
   - Visual differentiation by scope type

3. **Format validation** - Verify format matches file
   - Warn if format="pdf" but file is .dita
   - Show different icons based on format

---

## Test Coverage Summary

**Implemented and Tested**: 13/13 (100%)
- @conref ✅
- @conkeyref ✅
- @keyref ✅
- @href ✅
- &lt;xref&gt; ✅
- &lt;link&gt; ✅
- #fragment (same-file navigation) ✅
- @id (element navigator) ✅
- @scope ✅
- @format ✅
- @type ✅
- @linktext ✅
- @rev ✅

**Not Implemented**: 0/13 (0%)
- None - Full coverage achieved!

## Recent Changes (2025-11-17)

**Added enhanced attribute parsing**:
1. `src/providers/ditaLinkProvider.ts` - Enhanced tooltips with attribute information
   - `extractScope()` - Extract @scope attribute (local/peer/external)
   - `extractFormat()` - Extract @format attribute (dita/pdf/html)
   - `extractType()` - Extract @type attribute (concept/task/reference)
   - `extractLinktext()` - Extract @linktext attribute for custom text
   - `extractRev()` - Extract @rev attribute for revision tracking
   - `buildEnhancedTooltip()` - Combine base tooltip with attribute info (including @rev)
2. `src/test/suite/ditaLinkProvider.test.ts` - Added 10 new attribute parsing tests (including 3 for @rev)
3. `src/test/fixtures/topic-with-attributes.dita` - Test fixture with enhanced attributes including @rev

**Added same-file element navigation**:
1. `src/utils/elementNavigator.ts` - Element finding and scrolling utility
   - `findElementById()` - Find element by @id attribute
   - `navigateToElement()` - Navigate with visual highlight
   - Command URI handling for same-file references
2. `src/test/suite/elementNavigator.test.ts` - 214+ lines of navigation tests
3. `src/providers/keyDiagnostics.ts` - Missing key warning provider

**Added xref and link support**:
1. `src/providers/ditaLinkProvider.ts` - Added xref and link pattern matching
   - `processXrefAttributes()` - for `<xref href="...">`
   - `processXrefKeyrefAttributes()` - for `<xref keyref="...">`
   - `processLinkAttributes()` - for `<link href="...">`
2. `src/test/suite/ditaLinkProvider.test.ts` - Added 21 new test cases
3. `src/test/fixtures/topic-with-xref-links.dita` - New comprehensive test fixture

## Files Needing Updates

1. `src/providers/ditaValidator.ts` - Add @rev validation if needed
2. Future: Open external links in browser based on scope="external"

---

*Generated: 2025-11-17*
*DitaCraft Version: 0.2.2*
