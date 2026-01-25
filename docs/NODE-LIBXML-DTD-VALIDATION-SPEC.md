# Node-LibXML DTD Validation Specification

**Version:** 1.0
**Date:** January 2025
**Status:** Approved for Implementation
**Target Release:** v0.5.0

---

## 1. Executive Summary

This specification defines the integration of [node-libxml](https://github.com/MatthD/node-libxml) into DitaCraft to provide full DTD validation for DITA documents. Unlike previous attempts with other libxml2 bindings, **node-libxml ships with prebuilt binaries** via `prebuildify`, eliminating the need for Windows SDK or native compilation.

### Key Benefits

| Benefit | Description |
|---------|-------------|
| **No Compilation Required** | Prebuilt binaries for Windows, macOS, Linux (64-bit) |
| **Full DTD Validation** | Validates against DITA 1.3 DTDs |
| **Performance** | Load DTDs once, validate multiple documents |
| **Memory Efficient** | Explicit memory management functions |
| **N-API Based** | Binary compatibility across Node.js versions |

---

## 2. Package Information

### 2.1 npm Package

```bash
npm install node-libxml --save
```

### 2.2 Version Requirements

| Node.js Version | node-libxml Version |
|-----------------|---------------------|
| 10, 12, 14, 16, 18, 20, 22, 24 | 5.0.0+ (N-API) |
| 4, 6, 8 | 3.2.5 or earlier |

### 2.3 Platform Support

| Platform | Architecture | Status |
|----------|--------------|--------|
| Windows | x64 | ✅ Prebuilt |
| Windows | arm64 | ✅ Prebuilt |
| macOS | x64 | ✅ Prebuilt |
| macOS | arm64 (M1/M2) | ✅ Prebuilt |
| Linux | x64 | ✅ Prebuilt |
| Linux | arm64 | ✅ Prebuilt |

### 2.4 Why No Compilation Needed

node-libxml uses:
- **prebuildify** - Packages prebuilt binaries in the npm package
- **node-gyp-build** - Loads the correct prebuilt binary at runtime
- **N-API** - Provides ABI stability across Node.js versions

The prebuilt binaries are stored in the `prebuilds/` directory within the package.

---

## 3. API Reference

### 3.1 Import

```typescript
import { Libxml } from 'node-libxml';
// or
const { Libxml } = require('node-libxml');
```

### 3.2 Constructor

```typescript
const libxml = new Libxml();
```

### 3.3 Loading Methods

#### loadXml(path: string): boolean

Loads XML from a file path.

```typescript
const isWellformed = libxml.loadXml('/path/to/file.dita');
if (!isWellformed) {
    console.log(libxml.wellformedErrors);
}
```

**Returns:** `true` if well-formed, `false` otherwise
**Side Effect:** Populates `wellformedErrors` array on failure

#### loadXmlFromString(xml: string): boolean

Loads XML from a string.

```typescript
const content = fs.readFileSync('/path/to/file.dita', 'utf8');
const isWellformed = libxml.loadXmlFromString(content);
```

**Returns:** `true` if well-formed, `false` otherwise
**Side Effect:** Populates `wellformedErrors` array on failure

#### loadDtds(paths: string[]): void

Loads one or more DTD files into memory.

```typescript
libxml.loadDtds([
    '/path/to/concept.dtd',
    '/path/to/topic.dtd',
    '/path/to/map.dtd'
]);

if (libxml.dtdsLoadedErrors.length > 0) {
    console.log('DTD loading errors:', libxml.dtdsLoadedErrors);
}
```

**Side Effect:** Populates `dtdsLoadedErrors` array on failure

### 3.4 Validation Methods

#### validateAgainstDtds(): string | false | null

Validates the loaded XML against all loaded DTDs.

```typescript
const result = libxml.validateAgainstDtds();

if (result === null) {
    console.log('No DTDs were loaded correctly');
} else if (result === false) {
    console.log('Validation failed:', libxml.validationDtdErrors);
} else {
    console.log('Valid against DTD:', result);
}
```

**Returns:**
- `string` - Name of the first DTD that validated successfully
- `false` - No DTD validated the XML
- `null` - No DTDs were loaded correctly

**Side Effect:** Populates `validationDtdErrors` array on validation failure

### 3.5 Information Methods

#### getDtd(): { name: string; externalId: string; systemId: string }

Gets DOCTYPE information from the loaded XML.

```typescript
const dtdInfo = libxml.getDtd();
console.log(dtdInfo);
// { name: 'concept', externalId: '-//OASIS//DTD DITA 1.3 Concept//EN', systemId: 'concept.dtd' }
```

#### xpathSelect(expression: string): any

Evaluates an XPath expression on the loaded XML.

```typescript
const count = libxml.xpathSelect('count(//p)');
const hasTitle = libxml.xpathSelect('boolean(//title)');
const firstTitle = libxml.xpathSelect('string(//title[1])');
```

**Returns:** Result of XPath evaluation, or `null` if no match

### 3.6 Memory Management

#### freeXml(): void

Releases the loaded XML from memory.

```typescript
libxml.freeXml();
// Also clears: wellformedErrors
```

#### freeDtds(): void

Releases all loaded DTDs from memory.

```typescript
libxml.freeDtds();
// Also clears: dtdsLoadedErrors, validationDtdErrors
```

#### clearAll(): void

Releases all libxml2 memory across all instances.

```typescript
libxml.clearAll();
```

### 3.7 Error Properties

| Property | Type | Description |
|----------|------|-------------|
| `wellformedErrors` | `Array<object>` | XML parsing errors |
| `dtdsLoadedErrors` | `Array<object>` | DTD loading errors |
| `validationDtdErrors` | `Array<object>` | DTD validation errors |
| `schemasLoadedErrors` | `Array<object>` | XSD loading errors |
| `validationSchemaErrors` | `Array<object>` | XSD validation errors |

---

## 4. Implementation Design

### 4.1 Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DitaCraft Validation                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    ValidationEngineFactory                          │ │
│  │                                                                     │ │
│  │   ditacraft.validationEngine = "libxml" | "built-in" | "xmllint"   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│              ┌─────────────────────┼─────────────────────┐              │
│              ▼                     ▼                     ▼              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │
│  │  LibxmlValidator │  │  BuiltInValidator │  │  XmllintValidator│      │
│  │  (NEW - DEFAULT) │  │  (existing)       │  │  (existing)      │      │
│  │                  │  │                   │  │                  │      │
│  │ • Full DTD       │  │ • Well-formed     │  │ • External tool  │      │
│  │ • Prebuilt bins  │  │ • Content model   │  │ • Full DTD       │      │
│  │ • Fast, cached   │  │ • No native deps  │  │ • Requires       │      │
│  │ • XPath support  │  │                   │  │   installation   │      │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Class Design

```typescript
// src/providers/libxmlValidator.ts

import { Libxml } from 'node-libxml';
import * as path from 'path';
import { ValidationError, ValidationResult } from './ditaValidator';

interface LibxmlError {
    message?: string;
    line?: number;
    column?: number;
    level?: number;
}

export class LibxmlValidator {
    private libxml: Libxml;
    private dtdBasePath: string;
    private dtdsLoaded: boolean = false;
    private loadedDtdPaths: string[] = [];

    constructor(extensionPath: string) {
        this.libxml = new Libxml();
        this.dtdBasePath = path.join(extensionPath, 'dtds');
    }

    /**
     * Get all DITA DTD paths from the bundled DTDs
     */
    private getDitaDtdPaths(): string[] {
        return [
            // Base types
            path.join(this.dtdBasePath, 'base', 'dtd', 'basetopic.dtd'),
            path.join(this.dtdBasePath, 'base', 'dtd', 'basemap.dtd'),
            // Technical content
            path.join(this.dtdBasePath, 'technicalContent', 'dtd', 'topic.dtd'),
            path.join(this.dtdBasePath, 'technicalContent', 'dtd', 'concept.dtd'),
            path.join(this.dtdBasePath, 'technicalContent', 'dtd', 'task.dtd'),
            path.join(this.dtdBasePath, 'technicalContent', 'dtd', 'reference.dtd'),
            path.join(this.dtdBasePath, 'technicalContent', 'dtd', 'glossentry.dtd'),
            path.join(this.dtdBasePath, 'technicalContent', 'dtd', 'troubleshooting.dtd'),
            path.join(this.dtdBasePath, 'technicalContent', 'dtd', 'map.dtd'),
            // Bookmap
            path.join(this.dtdBasePath, 'bookmap', 'dtd', 'bookmap.dtd'),
        ];
    }

    /**
     * Load all DITA DTDs (called once, reused for all validations)
     */
    public loadDtds(): boolean {
        if (this.dtdsLoaded) {
            return true;
        }

        const dtdPaths = this.getDitaDtdPaths().filter(p => {
            try {
                require('fs').accessSync(p);
                return true;
            } catch {
                return false;
            }
        });

        if (dtdPaths.length === 0) {
            return false;
        }

        this.libxml.loadDtds(dtdPaths);

        if (this.libxml.dtdsLoadedErrors && this.libxml.dtdsLoadedErrors.length > 0) {
            console.warn('Some DTDs failed to load:', this.libxml.dtdsLoadedErrors);
        }

        this.loadedDtdPaths = dtdPaths;
        this.dtdsLoaded = true;
        return true;
    }

    /**
     * Validate XML content against DITA DTDs
     */
    public validate(content: string): ValidationResult {
        const errors: ValidationError[] = [];
        const warnings: ValidationError[] = [];

        // Ensure DTDs are loaded
        if (!this.loadDtds()) {
            warnings.push({
                line: 0,
                column: 0,
                severity: 'warning',
                message: 'DTD files not found. DTD validation skipped.',
                source: 'libxml'
            });
            return { valid: true, errors, warnings };
        }

        // Check well-formedness
        const isWellformed = this.libxml.loadXmlFromString(content);

        if (!isWellformed) {
            // Convert wellformed errors to ValidationError format
            for (const err of (this.libxml.wellformedErrors || [])) {
                const libxmlErr = err as LibxmlError;
                errors.push({
                    line: (libxmlErr.line || 1) - 1, // Convert to 0-based
                    column: (libxmlErr.column || 1) - 1,
                    severity: 'error',
                    message: libxmlErr.message || 'XML is not well-formed',
                    source: 'libxml'
                });
            }
            this.libxml.freeXml();
            return { valid: false, errors, warnings };
        }

        // Validate against DTDs
        const validDtd = this.libxml.validateAgainstDtds();

        if (validDtd === null) {
            // No DTDs loaded correctly
            warnings.push({
                line: 0,
                column: 0,
                severity: 'warning',
                message: 'No DTDs loaded correctly. DTD validation skipped.',
                source: 'libxml'
            });
        } else if (validDtd === false) {
            // Validation failed - convert errors
            for (const err of (this.libxml.validationDtdErrors || [])) {
                const libxmlErr = err as LibxmlError;
                errors.push({
                    line: (libxmlErr.line || 1) - 1,
                    column: (libxmlErr.column || 1) - 1,
                    severity: 'error',
                    message: libxmlErr.message || 'DTD validation error',
                    source: 'libxml-dtd'
                });
            }
        }
        // else: validDtd is a string (DTD name) - validation passed

        // Free XML memory (keep DTDs loaded for reuse)
        this.libxml.freeXml();

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Validate a file by path
     */
    public validateFile(filePath: string): ValidationResult {
        const errors: ValidationError[] = [];
        const warnings: ValidationError[] = [];

        // Ensure DTDs are loaded
        if (!this.loadDtds()) {
            warnings.push({
                line: 0,
                column: 0,
                severity: 'warning',
                message: 'DTD files not found. DTD validation skipped.',
                source: 'libxml'
            });
            return { valid: true, errors, warnings };
        }

        // Load and check well-formedness
        const isWellformed = this.libxml.loadXml(filePath);

        if (!isWellformed) {
            for (const err of (this.libxml.wellformedErrors || [])) {
                const libxmlErr = err as LibxmlError;
                errors.push({
                    line: (libxmlErr.line || 1) - 1,
                    column: (libxmlErr.column || 1) - 1,
                    severity: 'error',
                    message: libxmlErr.message || 'XML is not well-formed',
                    source: 'libxml'
                });
            }
            this.libxml.freeXml();
            return { valid: false, errors, warnings };
        }

        // Validate against DTDs
        const validDtd = this.libxml.validateAgainstDtds();

        if (validDtd === false) {
            for (const err of (this.libxml.validationDtdErrors || [])) {
                const libxmlErr = err as LibxmlError;
                errors.push({
                    line: (libxmlErr.line || 1) - 1,
                    column: (libxmlErr.column || 1) - 1,
                    severity: 'error',
                    message: libxmlErr.message || 'DTD validation error',
                    source: 'libxml-dtd'
                });
            }
        }

        this.libxml.freeXml();

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Get DOCTYPE information from XML content
     */
    public getDoctype(content: string): { name: string; externalId: string; systemId: string } | null {
        const isWellformed = this.libxml.loadXmlFromString(content);
        if (!isWellformed) {
            this.libxml.freeXml();
            return null;
        }

        const dtdInfo = this.libxml.getDtd();
        this.libxml.freeXml();
        return dtdInfo;
    }

    /**
     * Execute XPath query on XML content
     */
    public xpathSelect(content: string, expression: string): any {
        const isWellformed = this.libxml.loadXmlFromString(content);
        if (!isWellformed) {
            this.libxml.freeXml();
            return null;
        }

        const result = this.libxml.xpathSelect(expression);
        this.libxml.freeXml();
        return result;
    }

    /**
     * Dispose and free all resources
     */
    public dispose(): void {
        this.libxml.freeDtds();
        this.libxml.clearAll();
        this.dtdsLoaded = false;
    }
}
```

### 4.3 Integration with DitaValidator

```typescript
// In src/providers/ditaValidator.ts

import { LibxmlValidator } from './libxmlValidator';

export class DitaValidator {
    private libxmlValidator: LibxmlValidator | null = null;
    private validationEngine: 'libxml' | 'xmllint' | 'built-in';

    constructor(extensionContext?: vscode.ExtensionContext) {
        // ... existing code ...

        // Initialize libxml validator if engine is 'libxml'
        if (this.validationEngine === 'libxml' && extensionContext) {
            try {
                this.libxmlValidator = new LibxmlValidator(extensionContext.extensionPath);
            } catch (error) {
                console.warn('Failed to initialize libxml validator:', error);
                // Fall back to built-in
                this.validationEngine = 'built-in';
            }
        }
    }

    private async validateWithLibxml(filePath: string, content: string): Promise<ValidationResult> {
        if (!this.libxmlValidator) {
            // Fall back to built-in if libxml not available
            return this.validateWithBuiltIn(filePath, content);
        }

        return this.libxmlValidator.validate(content);
    }
}
```

---

## 5. Configuration

### 5.1 VS Code Settings

```json
{
    "ditacraft.validationEngine": {
        "type": "string",
        "default": "libxml",
        "enum": ["libxml", "built-in", "xmllint"],
        "enumDescriptions": [
            "Full DTD validation using bundled libxml2 (recommended)",
            "Built-in validation with content model checking (no native deps)",
            "External xmllint for DTD validation (requires installation)"
        ],
        "description": "Validation engine for DITA files."
    }
}
```

### 5.2 Fallback Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    Validation Engine Selection                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User selects: "libxml"                                         │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────────────────────────────┐                    │
│  │ Can load node-libxml?                   │                    │
│  └─────────────────────────────────────────┘                    │
│       │                                                          │
│       ├── YES ──► Use LibxmlValidator                           │
│       │                                                          │
│       └── NO ───► Fall back to BuiltInValidator                 │
│                   (show warning to user)                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Error Handling

### 6.1 Error Types

| Error Type | Source | Description |
|------------|--------|-------------|
| Well-formedness | `libxml` | XML parsing errors (missing tags, invalid chars) |
| DTD Validation | `libxml-dtd` | DTD constraint violations |
| DTD Loading | `libxml` | Failed to load DTD files |

### 6.2 Error Format

```typescript
interface LibxmlError {
    message: string;    // Error description
    line: number;       // 1-based line number
    column: number;     // 1-based column number
    level?: number;     // Severity level (1=warning, 2=error, 3=fatal)
}
```

### 6.3 Error Mapping

```typescript
function mapLibxmlError(err: LibxmlError): ValidationError {
    return {
        line: (err.line || 1) - 1,      // Convert to 0-based for VS Code
        column: (err.column || 1) - 1,
        severity: err.level === 1 ? 'warning' : 'error',
        message: err.message || 'Unknown validation error',
        source: 'libxml-dtd'
    };
}
```

---

## 7. Performance Considerations

### 7.1 DTD Caching

DTDs are loaded once and reused for all subsequent validations:

```typescript
// First validation: Load DTDs (~100ms)
validator.validate(content1);  // Loads DTDs, validates

// Subsequent validations: Reuse DTDs (~10ms)
validator.validate(content2);  // Uses cached DTDs
validator.validate(content3);  // Uses cached DTDs
```

### 7.2 Memory Management

```typescript
// After each validation
libxml.freeXml();  // Free XML, keep DTDs

// On extension deactivation
libxml.freeDtds();  // Free DTDs
libxml.clearAll();  // Free all libxml2 memory
```

### 7.3 Expected Performance

| Operation | Time |
|-----------|------|
| Initial DTD loading | ~100-200ms |
| XML validation (small file) | ~5-20ms |
| XML validation (large file) | ~50-200ms |
| Memory per DTD | ~1-5MB |

---

## 8. Testing Plan

### 8.1 Unit Tests

```typescript
describe('LibxmlValidator', () => {
    let validator: LibxmlValidator;

    beforeAll(() => {
        validator = new LibxmlValidator(extensionPath);
    });

    afterAll(() => {
        validator.dispose();
    });

    test('should validate well-formed XML', () => {
        const result = validator.validate('<root><child/></root>');
        expect(result.valid).toBe(true);
    });

    test('should detect malformed XML', () => {
        const result = validator.validate('<root><child></root>');
        expect(result.valid).toBe(false);
        expect(result.errors[0].message).toContain('closing tag');
    });

    test('should detect invalid element in map', () => {
        const content = `<?xml version="1.0"?>
<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA 1.3 Map//EN" "map.dtd">
<map><title>Test</title><p>Invalid</p></map>`;

        const result = validator.validate(content);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.message.includes('p'))).toBe(true);
    });

    test('should validate correct DITA topic', () => {
        const content = `<?xml version="1.0"?>
<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA 1.3 Topic//EN" "topic.dtd">
<topic id="test"><title>Test</title><body><p>Content</p></body></topic>`;

        const result = validator.validate(content);
        expect(result.valid).toBe(true);
    });
});
```

### 8.2 Integration Tests

- Test with VS Code extension host
- Test fallback to built-in validator
- Test configuration changes
- Test memory cleanup on deactivation

---

## 9. Implementation Checklist

### Phase 1: Core Implementation

- [ ] Add `node-libxml` as dependency in `package.json`
- [ ] Create `src/providers/libxmlValidator.ts`
- [ ] Add TypeScript types for node-libxml
- [ ] Implement basic validation methods
- [ ] Add error mapping to ValidationError format

### Phase 2: Integration

- [ ] Update `DitaValidator` to use `LibxmlValidator`
- [ ] Update configuration schema in `package.json`
- [ ] Add "libxml" as default validation engine
- [ ] Implement fallback strategy
- [ ] Update `VALIDATION_ENGINES` constant

### Phase 3: Testing

- [ ] Create unit tests for `LibxmlValidator`
- [ ] Create integration tests
- [ ] Test on Windows, macOS, Linux
- [ ] Test with various DITA document types
- [ ] Performance benchmarks

### Phase 4: Documentation

- [ ] Update README.md
- [ ] Update CHANGELOG.md
- [ ] Update user documentation
- [ ] Add troubleshooting guide

---

## 10. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Prebuilt binary missing for platform | Low | High | Fall back to built-in validator |
| node-libxml package unmaintained | Low | Medium | Monitor package, have fallback ready |
| Memory leaks | Medium | Medium | Proper dispose() implementation, testing |
| DTD path resolution issues | Medium | Low | Use path.join(), test on all platforms |
| Large file performance | Low | Low | Async validation, progress reporting |

---

## 11. References

- [node-libxml GitHub](https://github.com/MatthD/node-libxml)
- [node-libxml npm](https://www.npmjs.com/package/node-libxml)
- [prebuildify](https://github.com/prebuild/prebuildify)
- [N-API Documentation](https://nodejs.org/api/n-api.html)
- [DITA 1.3 DTD Specifications](https://docs.oasis-open.org/dita/dita/v1.3/)

---

*This specification is approved for implementation in DitaCraft v0.5.0*
