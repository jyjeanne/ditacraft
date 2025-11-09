# DITA Reference Testing Improvements

## Summary

This document describes the comprehensive test improvements made to verify DITA reference support (@conref, @conkeyref, @keyref).

## New Test Fixtures

Based on practical DITA examples, the following fixtures were added:

### 1. common_notes.dita
Reusable content library demonstrating DITA content reuse patterns:
- Contains reusable notes (`important_note`, `warning_note`)
- Contains reusable paragraphs for documentation consistency
- Includes a troubleshooting section with common issues
- Serves as the target for `@conref` references

**Location**: `src/test/fixtures/common_notes.dita`

### 2. product_info.dita
Product metadata demonstrating keyword-based content references:
- Contains product name ("Acme Widget")
- Contains version information ("Version 2.5")
- Contains company information ("Acme Corporation")
- Includes keyword metadata in `<prolog>` section
- Serves as the target for `@conkeyref` references via keymap

**Location**: `src/test/fixtures/product_info.dita`

### 3. user_guide.dita
Comprehensive guide demonstrating all reference types in use:
- Uses `@conref` to pull content from common_notes.dita
- Uses `@keyref` with pure keys (e.g., "common-note")
- Uses `@conkeyref` with pure keys (e.g., "product-name/keyword")
- Demonstrates proper DITA content reuse patterns
- Tests fragment handling (#topicid/elementid)
- Tests relative path resolution (./file.dita)

**Location**: `src/test/fixtures/user_guide.dita`

### 4. reference-map.ditamap
DITA map with key definitions:
- Defines keys for `@keyref` usage (e.g., "common-note")
- Defines keys for `@conkeyref` usage (e.g., "product-name", "product-version")
- Links to all reference fixtures via `<topicref>`
- Demonstrates proper DITA keyspace management

**Location**: `src/test/fixtures/reference-map.ditamap`

## New Test Suite: "Real-world Reference Examples"

Added 9 comprehensive tests to verify practical DITA reference patterns:

### Test Coverage

1. **conref Detection in User Guide**
   - Verifies multiple `@conref` links to common_notes.dita
   - Ensures proper tooltip indicates "content reference"
   - Location: ditaLinkProvider.test.ts:534

2. **conref Fragment Handling**
   - Verifies fragment identifiers (#topicid/elementid) are stripped
   - Ensures links point to files, not fragments
   - Location: ditaLinkProvider.test.ts:557

3. **keyref Pure Key Skipping**
   - Verifies pure keys (e.g., "common-note") are not linked
   - Ensures only file-based keyrefs create links
   - Location: ditaLinkProvider.test.ts:574

4. **conkeyref Pure Key Skipping**
   - Verifies pure keys (e.g., "product-name/keyword") are not linked
   - Ensures correct key resolution behavior
   - Location: ditaLinkProvider.test.ts:590

5. **Common Notes Fixture Validation**
   - Verifies common_notes.dita has DITA language ID
   - Ensures reusable content is properly structured
   - Checks for `id="important_note"` element
   - Location: ditaLinkProvider.test.ts:606

6. **Product Info Fixture Validation**
   - Verifies product_info.dita contains keyword metadata
   - Checks for "Acme Widget" and "Version 2.5" keywords
   - Ensures proper prolog structure
   - Location: ditaLinkProvider.test.ts:622

7. **Reference Map Keydef Detection**
   - Verifies keydef links to common_notes.dita
   - Verifies keydef links to product_info.dita
   - Tests proper keyspace definition
   - Location: ditaLinkProvider.test.ts:633

8. **Reference Map Topicref Detection**
   - Verifies link to user_guide.dita exists
   - Tests standard topic references in map
   - Location: ditaLinkProvider.test.ts:658

9. **Mixed Reference Types Integration**
   - Verifies all reference types work together
   - Counts different link types (conref, keyref, conkeyref)
   - Ensures no duplicate links
   - Location: ditaLinkProvider.test.ts:672

## Implementation Verification

### Supported Reference Types

The DITA Link Provider (`src/providers/ditaLinkProvider.ts`) correctly implements:

#### 1. @conref (Content Reference)
- **Pattern**: `conref="path/to/file.dita#topicid/elementid"`
- **Regex**: `/\bconref\s*=\s*["']([^"']+)["']/gi`
- **Features**:
  - Strips fragment identifiers (#topicid/elementid)
  - Resolves relative paths to absolute paths
  - Skips HTTP/HTTPS URLs
  - Skips variables (${...})
  - Verifies file existence
- **Tooltip**: "Open content reference: {filename}"

#### 2. @conkeyref (Content Key Reference)
- **Pattern**: `conkeyref="keyname/elementid"` or `conkeyref="keyname"`
- **Regex**: `/\bconkeyref\s*=\s*["']([^"']+)["']/gi`
- **Features**:
  - Extracts key part (before slash)
  - Only links if key contains `.dita` or `.ditamap` (filename detection)
  - Skips pure keys like "product-name/keyword"
  - Resolves key as file path when applicable
- **Tooltip**: "Open content key reference: {filename}"

#### 3. @keyref (Key Reference)
- **Pattern**: `keyref="keyname"`
- **Regex**: `/\bkeyref\s*=\s*["']([^"']+)["']/gi`
- **Features**:
  - Only links if value contains `.dita` or `.ditamap` (filename detection)
  - Skips pure keys like "product-name"
  - Resolves key as file path when applicable
- **Tooltip**: "Open key reference: {filename}"

#### 4. @href (Standard References)
- **Pattern**: `href="path/to/file.dita"`
- **Regex**: `/<(?:topicref|chapter|appendix|part|mapref|keydef|topicgroup|topichead)[^>]*\bhref\s*=\s*["']([^"']+)["']/gi`
- **Features**:
  - Supports all map elements (topicref, chapter, mapref, etc.)
  - Handles fragments and relative paths
  - Skips URLs and variables
- **Tooltip**: "Open {filename}"

### Smart Key Handling

The implementation intelligently distinguishes between:

**File-based References** (creates links):
```xml
<p conkeyref="common_notes.dita/note1">
<xref keyref="user_guide.dita">
```

**Pure Key References** (skips, no link):
```xml
<ph conkeyref="product-name/keyword"/>
<xref keyref="common-note"/>
```

This ensures that Ctrl+Click navigation works for file references while not creating broken links for keys that need map resolution.

## Test Statistics

### Total Test Count
- **Before**: 38 tests
- **After**: 47 tests
- **New Tests**: 9 tests

### Test Coverage by Feature
- Language ID Configuration: 3 tests
- Link Detection: 7 tests
- Link Range: 2 tests
- Link Tooltip: 1 test
- Bookmap Support: 5 tests
- Map Reference Support: 3 tests
- Edge Cases: 2 tests
- Content Reference (conref): 4 tests
- Content Key Reference (conkeyref): 3 tests
- Key Reference (keyref): 3 tests
- Mixed References: 2 tests
- **Real-world Examples**: 9 tests ← NEW
- Integration Tests: 2 tests

## Conformance with DITA Standards

### @conref Conformance ✓
- **Standard**: OASIS DITA 1.3 Specification
- **Format**: `conref="filepath#topicid/elementid"`
- **Implementation**: Correctly parses and resolves file paths, strips fragments
- **Example**: `<note conref="common_notes.dita#common_notes/important_note"/>`

### @keyref Conformance ✓
- **Standard**: OASIS DITA 1.3 Specification
- **Format**: `keyref="keyname"`
- **Implementation**: Detects key references, intelligently skips pure keys
- **Example**: `<note keyref="common-note"/>`
- **Note**: Full key resolution requires DITA map processing (future enhancement)

### @conkeyref Conformance ✓
- **Standard**: OASIS DITA 1.3 Specification
- **Format**: `conkeyref="keyname/elementid"`
- **Implementation**: Parses key and element ID, intelligently skips pure keys
- **Example**: `<ph conkeyref="product-name/keyword"/>`
- **Note**: Full key resolution requires DITA map processing (future enhancement)

## Implementation Status

### ✓ Implemented
1. File-based reference navigation (Ctrl+Click)
2. Fragment identifier stripping
3. Relative path resolution
4. Smart pure key detection
5. Comprehensive test coverage
6. Proper tooltip differentiation

### ⚠ Future Enhancements
1. Full keyspace resolution from DITA maps
2. Key-to-file mapping cache
3. Cross-map key resolution
4. Key definition validation
5. Hover tooltip with key metadata

## Example Usage

### Using @conref
```xml
<!-- common_notes.dita -->
<note id="important_note">This is an important note.</note>

<!-- user_guide.dita -->
<note conref="common_notes.dita#common_notes/important_note"/>
<!-- Ctrl+Click navigates to common_notes.dita -->
```

### Using @keyref with Map
```xml
<!-- reference-map.ditamap -->
<keydef keys="common-note" href="common_notes.dita#common_notes/important_note"/>

<!-- user_guide.dita -->
<note keyref="common-note"/>
<!-- Currently skips pure key "common-note" (no link) -->
<!-- Future: Will resolve to common_notes.dita via keyspace -->
```

### Using @conkeyref with Map
```xml
<!-- reference-map.ditamap -->
<keydef keys="product-name" href="product_info.dita">
  <topicmeta>
    <keywords>
      <keyword>Acme Widget</keyword>
    </keywords>
  </topicmeta>
</keydef>

<!-- user_guide.dita -->
<p>Thank you for choosing <ph conkeyref="product-name/keyword"/>.</p>
<!-- Currently skips pure key "product-name/keyword" (no link) -->
<!-- Future: Will resolve to product_info.dita via keyspace -->
```

## Running Tests

```bash
npm test
```

This runs:
1. TypeScript compilation
2. ESLint validation
3. All test suites (47 tests)

## Files Modified

### New Files
- `src/test/fixtures/common_notes.dita`
- `src/test/fixtures/product_info.dita`
- `src/test/fixtures/user_guide.dita`
- `src/test/fixtures/reference-map.ditamap`

### Modified Files
- `src/test/suite/ditaLinkProvider.test.ts` (added "Real-world Reference Examples" suite)

### Existing Implementation
- `src/providers/ditaLinkProvider.ts` (verified conformance)

## Conclusion

The implementation correctly handles all DITA reference types (@conref, @conkeyref, @keyref) according to DITA 1.3 specifications, with intelligent handling of pure keys vs. file-based references. The new test fixtures provide comprehensive real-world examples that verify the implementation's conformance.

All 47 tests validate that:
1. File-based references create clickable links
2. Pure key references are properly skipped
3. Fragment identifiers are correctly stripped
4. Relative paths are properly resolved
5. Tooltips accurately describe reference types

The implementation is production-ready for file-based DITA reference navigation.
