# DitaCraft Test Coverage

This document describes the comprehensive test suite for the DitaCraft DITA validator, covering all key features.

## Test Suites

### 1. DTD Validation Tests (`dtdValidation.test.ts`)

Tests DTD resolution and DTD-based validation functionality.

#### DTD Resolution Tests
- ✅ **Load bundled DTD files** - Verifies DTD files are available from extension
- ✅ **Resolve DITA 1.3 PUBLIC IDs** - Tests resolution for:
  - Concept: `-//OASIS//DTD DITA 1.3 Concept//EN`
  - Task: `-//OASIS//DTD DITA 1.3 Task//EN`
  - Topic: `-//OASIS//DTD DITA 1.3 Topic//EN`
  - Map: `-//OASIS//DTD DITA 1.3 Map//EN`
  - BookMap: `-//OASIS//DTD DITA 1.3 BookMap//EN`
- ✅ **Handle unknown PUBLIC IDs** - Returns null for unrecognized IDs
- ✅ **Get DTD content** - Retrieves DTD content from resolved paths

#### DTD-Based Validation Tests
- ✅ **Validate valid DITA concept** - Passes validation with proper DTD
- ✅ **Detect missing ID attribute** - Identifies missing required `id` on root element
- ✅ **Detect missing title element** - Identifies missing required `<title>` element

#### DTD Caching Tests
- ✅ **Cache DTD content** - Verifies DTD content is cached after first load

#### Error Reporting Tests
- ✅ **Include line and column numbers** - Errors contain accurate position info
- ✅ **Report accurate line numbers** - DTD errors point to correct lines

---

### 2. Real-time Validation Tests (`realtimeValidation.test.ts`)

Tests automatic validation on file open, save, and change events with debouncing.

#### Validation on File Open
- ✅ **Validate on opening valid file** - Auto-validates when DITA file is opened
- ✅ **Validate on opening invalid file** - Detects errors on file open

#### Validation on Save
- ✅ **Validate on save** - Triggers validation when file is saved
- ✅ **Detect errors introduced before save** - Identifies new errors before saving

#### Debouncing Tests
- ✅ **Debounce rapid changes** - Prevents excessive validation during typing
- Validates only after changes settle (500ms debounce)

#### Auto-Validation Toggle
- ✅ **Respect autoValidate setting** - Can disable auto-validation via settings

---

### 3. Command and Auto-Detection Tests (`commandAndDetection.test.ts`)

Tests manual validation command and DITA file auto-detection.

#### Manual Validation Command Tests
- ✅ **Execute validation command on valid file** - `ditacraft.validate` works on valid files
- ✅ **Execute validation command on invalid file** - Detects errors via command
- ✅ **Validate with URI parameter** - Command accepts file URI parameter
- ✅ **Handle non-DITA files gracefully** - Shows warning for non-DITA files

#### Auto-Detection Tests
- ✅ **Detect by .dita extension** - Recognizes `.dita` files
- ✅ **Detect by .ditamap extension** - Recognizes `.ditamap` files
- ✅ **Detect by .bookmap extension** - Recognizes `.bookmap` files
- ✅ **Detect by DOCTYPE in .xml file** - Recognizes DITA DOCTYPE declarations:
  - `<!DOCTYPE topic`
  - `<!DOCTYPE concept`
  - `<!DOCTYPE task`
  - `<!DOCTYPE map`
  - `<!DOCTYPE bookmap`
- ✅ **Validate XML file with DITA DOCTYPE** - Validates `.xml` files containing DITA DOCTYPE

#### Error Highlighting in Problems Panel
- ✅ **Show errors with correct severity** - Errors appear as errors, warnings as warnings
- ✅ **Show warnings with warning severity** - Warnings properly categorized
- ✅ **Accurate line and column information** - Errors point to exact positions
- ✅ **Source attribution** - Diagnostics include source (e.g., "dtd-validator", "xml-parser")

---

### 4. Existing Validator Tests (`ditaValidator.test.ts`)

Comprehensive unit tests for the DitaValidator class.

#### Valid DITA Files
- ✅ Valid DITA topic
- ✅ Valid DITA map
- ✅ Valid bookmap

#### Invalid XML
- ✅ Detect XML syntax errors
- ✅ Report non-existent files

#### DITA-Specific Validation
- ✅ Warn about missing DOCTYPE
- ✅ Warn about empty elements

#### Diagnostic Collection
- ✅ Update diagnostics for errors
- ✅ Clear diagnostics for valid files
- ✅ Clear diagnostics manually

#### Validation Error Structure
- ✅ Required fields present (line, column, severity, message, source)
- ✅ Warnings have correct severity

#### DITA Topic Validation
- ✅ Accept valid topic root elements

#### DITA Map Validation
- ✅ Validate map structure

#### DITA Bookmap Validation
- ✅ Validate bookmap structure

#### Performance
- ✅ Validate within reasonable time (<1 second)

#### Multiple Validations
- ✅ Handle multiple validations in sequence

---

## Test Fixtures

### Existing Fixtures
- `valid-topic.dita` - Valid DITA topic for testing
- `valid-map.ditamap` - Valid DITA map
- `valid-bookmap.bookmap` - Valid bookmap
- `invalid-xml.dita` - File with XML syntax errors
- `no-doctype.dita` - Valid XML but missing DOCTYPE
- `empty-elements.dita` - File with empty elements

### New DTD Test Fixtures
- `dtd-valid-concept.dita` - Valid concept with proper DOCTYPE
- `dtd-invalid-missing-id.dita` - Concept missing required `id` attribute
- `dtd-invalid-missing-title.dita` - Task missing required `<title>` element
- `auto-detect-by-doctype.xml` - XML file with DITA DOCTYPE for auto-detection

---

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run watch
```

### Run Tests in CI
Tests are automatically run in GitHub Actions CI pipeline on:
- Push to main branch
- Pull requests
- Tag pushes (for releases)

---

## Test Configuration

### VS Code Test Configuration
- Test runner: `@vscode/test-electron`
- Test framework: Mocha with TDD interface
- Timeout: 10 seconds (configurable per test)

### Validation Engine for Tests
Tests use the `built-in` validation engine to ensure consistency across environments:
```typescript
const config = vscode.workspace.getConfiguration('ditacraft');
await config.update('validationEngine', 'built-in', vscode.ConfigurationTarget.Global);
```

---

## Coverage Summary

### Key Features Tested

| Feature | Test Suite | Status |
|---------|------------|--------|
| **Real-time validation on file open** | realtimeValidation.test.ts | ✅ Complete |
| **Real-time validation on save** | realtimeValidation.test.ts | ✅ Complete |
| **Real-time validation on change with debouncing** | realtimeValidation.test.ts | ✅ Complete |
| **DTD resolution** | dtdValidation.test.ts | ✅ Complete |
| **DTD-based validation** | dtdValidation.test.ts | ✅ Complete |
| **Error highlighting in Problems panel** | commandAndDetection.test.ts | ✅ Complete |
| **Line/column accuracy** | dtdValidation.test.ts, commandAndDetection.test.ts | ✅ Complete |
| **Manual validation command** | commandAndDetection.test.ts | ✅ Complete |
| **Auto-detection by extension (.dita, .ditamap, .bookmap)** | commandAndDetection.test.ts | ✅ Complete |
| **Auto-detection by DOCTYPE** | commandAndDetection.test.ts | ✅ Complete |

### Test Statistics
- **Total Test Suites**: 4
- **Total Test Cases**: 50+
- **Coverage**: All key features tested
- **CI Integration**: ✅ Enabled

---

## Future Test Enhancements

Potential areas for additional testing:
1. **Performance tests** - Large file validation benchmarks
2. **Concurrent validation** - Multiple files validated simultaneously
3. **DTD entity resolution** - Complex entity reference scenarios
4. **Custom DTD catalogs** - User-provided DTD catalogs
5. **Error recovery** - Validation after fixing errors
6. **Integration with DITA-OT** - End-to-end publishing tests

---

## Contributing Tests

When adding new features, please:
1. Add test fixtures to `src/test/fixtures/`
2. Create test suite in `src/test/suite/`
3. Update this documentation
4. Ensure tests pass locally before committing
5. Verify CI tests pass after push
