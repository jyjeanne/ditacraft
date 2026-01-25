# LibXML2 Binding Study for DitaCraft DTD Validation

**Date:** January 2025
**Purpose:** Evaluate libxml2 Node.js bindings for implementing proper DTD validation in DitaCraft
**Status:** Research Complete

---

## Executive Summary

| Package | DTD Support | XSD Support | Maintenance | Node.js Versions | Recommendation |
|---------|-------------|-------------|-------------|------------------|----------------|
| **node-libxml** | **Full** | Full | Active | 10-24 | **Best Choice** |
| libxmljs | Partial | Via plugin | Active | 14+ | Not recommended |
| libxmljs2 | Partial | Via plugin | Moderate | 14-20 | Alternative |
| libxmljs2-xsd | None | Full | Low | 14-16 | XSD only |

**Recommendation:** Use **[node-libxml](https://github.com/MatthD/node-libxml)** for DTD validation in DitaCraft.

> **Update (January 2025):** Due to native compilation requirements (Windows SDK needed on Windows), we implemented a pure JavaScript content model validator instead. This provides DTD-like validation without native dependencies. See "Implementation Status" section below.

---

## 1. Package Analysis

### 1.1 node-libxml (Recommended)

**Repository:** [github.com/MatthD/node-libxml](https://github.com/MatthD/node-libxml)
**npm:** [node-libxml](https://www.npmjs.com/package/node-libxml)

#### Features
- **Full DTD validation** with `loadDtds()` and `validateAgainstDtds()`
- **Full XSD validation** with `loadSchemas()` and `validateAgainstSchemas()`
- **Memory efficient**: Load DTD once, validate multiple documents
- **Error handling**: Returns errors in objects (doesn't throw)
- **XPath support**: Query XML documents

#### Platform Support
| OS | Architecture | Status |
|----|--------------|--------|
| Linux | x64, ARM | Supported |
| macOS | x64, ARM | Supported |
| **Windows** | **x64** | **Supported** |

#### Node.js Compatibility
- v5.0.0+: Node.js 10, 12, 14, 16, 18, 20, 22, 24 (N-API)
- v3.2.5: Node.js 4, 6, 8 (legacy)

#### API for DTD Validation
```typescript
const { Libxml } = require('node-libxml');

// Create instance
const libxml = new Libxml();

// Load XML (from file or string)
const isWellformed = libxml.loadXml('/path/to/file.dita');
// OR
const isWellformed = libxml.loadXmlFromString(xmlContent);

// Check well-formedness errors
if (!isWellformed) {
    console.log(libxml.wellformedErrors);
}

// Load DTDs (can load multiple)
libxml.loadDtds(['/path/to/concept.dtd', '/path/to/topic.dtd']);

// Check DTD loading errors
if (libxml.dtdsLoadedErrors.length > 0) {
    console.log(libxml.dtdsLoadedErrors);
}

// Validate against loaded DTDs
const validDtd = libxml.validateAgainstDtds();
// Returns: DTD name (string) if valid, false if invalid, null if no DTDs loaded

// Get validation errors
if (!validDtd) {
    console.log(libxml.validationDtdErrors);
}

// Memory cleanup
libxml.freeXml();
libxml.freeDtds();
```

#### Error Properties
| Property | Description |
|----------|-------------|
| `wellformedErrors` | Array of XML parsing errors |
| `dtdsLoadedErrors` | Array of DTD loading failures |
| `validationDtdErrors` | Array of DTD validation errors |
| `schemasLoadedErrors` | Array of XSD loading failures |
| `validationSchemaErrors` | Array of XSD validation errors |

#### Advantages
1. **Native DTD validation** - Uses libxml2's built-in DTD validator
2. **Performance** - DTDs loaded once, reused for multiple validations
3. **Windows support** - Pre-built binaries available
4. **Active maintenance** - Regular updates for new Node.js versions
5. **N-API based** - Binary compatibility across Node.js versions

#### Disadvantages
1. **Native dependency** - Requires node-gyp for building
2. **Package size** - Includes libxml2 (~5-10MB)
3. **Potential build issues** - May fail on some systems without proper build tools

---

### 1.2 libxmljs (Original)

**Repository:** [github.com/libxmljs/libxmljs](https://github.com/libxmljs/libxmljs)

#### Features
- XML parsing and DOM manipulation
- XPath queries
- TypeScript support
- **No native DTD validation API**

#### DTD Validation Status
The library **does NOT expose DTD validation** directly. It only provides:
- XML parsing
- XSD validation via separate plugins (libxml-xsd)

**Not recommended** for DTD validation because:
- Requires additional plugins
- DTD support is incomplete
- Each validation reloads DTD (inefficient)

---

### 1.3 libxmljs2 (Modern Fork)

**Repository:** github.com/marudor/libxmljs2

#### Features
- Modern fork of libxmljs
- Better Node.js version support
- XSD validation via [libxmljs2-xsd](https://www.npmjs.com/package/libxmljs2-xsd)

#### DTD Validation Status
- **No direct DTD validation API**
- Requires workarounds or external plugins
- XSD validation available via libxmljs2-xsd

**Not recommended** for DTD validation.

---

## 2. Implementation Plan for DitaCraft

### 2.1 Proposed Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DitaCraft Validation System                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Validation Engine Selection                   │  │
│  │                                                            │  │
│  │  ditacraft.validationEngine = "libxml" | "xmllint" | ...  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│              ┌───────────────┼───────────────┐                  │
│              ▼               ▼               ▼                  │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │   node-libxml   │ │    xmllint      │ │   built-in      │   │
│  │   (NEW)         │ │   (existing)    │ │   (existing)    │   │
│  │                 │ │                 │ │                 │   │
│  │ • DTD validation│ │ • Requires      │ │ • Well-formed   │   │
│  │ • XSD validation│ │   external tool │ │ • Basic DITA    │   │
│  │ • Fast, cached  │ │ • Full DTD      │ │   rules only    │   │
│  │ • Cross-platform│ │ • Platform-     │ │ • No DTD        │   │
│  └─────────────────┘ │   specific      │ └─────────────────┘   │
│                      └─────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Implementation Steps

#### Step 1: Add Dependency
```bash
npm install node-libxml --save
```

#### Step 2: Create LibxmlValidator Class
```typescript
// src/providers/libxmlValidator.ts
import { Libxml } from 'node-libxml';
import { ValidationResult, ValidationError } from './ditaValidator';
import { DtdResolver } from '../utils/dtdResolver';

export class LibxmlValidator {
    private libxml: Libxml;
    private dtdResolver: DtdResolver;
    private dtdsLoaded: boolean = false;

    constructor(extensionPath: string) {
        this.libxml = new Libxml();
        this.dtdResolver = new DtdResolver(extensionPath);
    }

    /**
     * Load all DITA DTDs once for reuse
     */
    public loadDitaDtds(): void {
        const dtdPaths = [
            this.dtdResolver.resolvePublicId('-//OASIS//DTD DITA 1.3 Topic//EN'),
            this.dtdResolver.resolvePublicId('-//OASIS//DTD DITA 1.3 Concept//EN'),
            this.dtdResolver.resolvePublicId('-//OASIS//DTD DITA 1.3 Task//EN'),
            this.dtdResolver.resolvePublicId('-//OASIS//DTD DITA 1.3 Reference//EN'),
            this.dtdResolver.resolvePublicId('-//OASIS//DTD DITA 1.3 Map//EN'),
            this.dtdResolver.resolvePublicId('-//OASIS//DTD DITA 1.3 BookMap//EN'),
        ].filter(Boolean) as string[];

        this.libxml.loadDtds(dtdPaths);
        this.dtdsLoaded = this.libxml.dtdsLoadedErrors.length === 0;
    }

    /**
     * Validate XML content against DITA DTDs
     */
    public async validate(content: string): Promise<ValidationResult> {
        const errors: ValidationError[] = [];
        const warnings: ValidationError[] = [];

        // Load DTDs if not already loaded
        if (!this.dtdsLoaded) {
            this.loadDitaDtds();
        }

        // Check well-formedness
        const isWellformed = this.libxml.loadXmlFromString(content);

        if (!isWellformed) {
            for (const err of this.libxml.wellformedErrors) {
                errors.push({
                    line: err.line || 0,
                    column: err.column || 0,
                    severity: 'error',
                    message: err.message || 'XML well-formedness error',
                    source: 'libxml'
                });
            }
            return { valid: false, errors, warnings };
        }

        // Validate against DTD
        const validDtd = this.libxml.validateAgainstDtds();

        if (!validDtd) {
            for (const err of this.libxml.validationDtdErrors) {
                errors.push({
                    line: err.line || 0,
                    column: err.column || 0,
                    severity: 'error',
                    message: err.message || 'DTD validation error',
                    source: 'libxml-dtd'
                });
            }
        }

        // Cleanup
        this.libxml.freeXml();

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    public dispose(): void {
        this.libxml.clearAll();
    }
}
```

#### Step 3: Update Configuration
```json
// package.json - contributes.configuration
{
    "ditacraft.validationEngine": {
        "type": "string",
        "default": "libxml",
        "enum": ["libxml", "xmllint", "built-in"],
        "enumDescriptions": [
            "Use bundled libxml2 for full DTD validation (recommended)",
            "Use external xmllint (requires installation)",
            "Use built-in parser (basic validation only)"
        ]
    }
}
```

#### Step 4: Integration with DitaValidator
```typescript
// In ditaValidator.ts - add libxml engine option
private async validateWithLibxml(content: string): Promise<ValidationResult> {
    if (!this.libxmlValidator) {
        this.libxmlValidator = new LibxmlValidator(this.extensionPath);
    }
    return this.libxmlValidator.validate(content);
}
```

---

## 3. Risk Assessment

### 3.1 Build/Installation Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| node-gyp build failure | Medium | High | Provide pre-built binaries, fallback to built-in |
| Windows build issues | Medium | Medium | Test on Windows CI, document requirements |
| ARM compatibility | Low | Low | Supported in node-libxml 5.0+ |

### 3.2 Runtime Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Memory leaks | Low | Medium | Proper cleanup with free*() methods |
| Crash on malformed XML | Low | High | Wrap in try-catch, test edge cases |
| Performance regression | Low | Low | DTD caching, async validation |

### 3.3 Maintenance Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Package abandonment | Low | High | Active maintainer, N-API ensures compatibility |
| Node.js version issues | Low | Medium | N-API provides ABI stability |
| Security vulnerabilities | Medium | High | Regular updates, monitor CVEs |

---

## 4. Testing Plan

### 4.1 Unit Tests
```typescript
describe('LibxmlValidator', () => {
    it('should detect invalid element in map', async () => {
        const content = `<?xml version="1.0"?>
<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA 1.3 Map//EN" "map.dtd">
<map>
    <title>Test Map</title>
    <p>Invalid element in map</p>
</map>`;

        const result = await validator.validate(content);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.message.includes('p'))).toBe(true);
    });

    it('should validate correct DITA map', async () => {
        const content = `<?xml version="1.0"?>
<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA 1.3 Map//EN" "map.dtd">
<map>
    <title>Valid Map</title>
    <topicref href="topic.dita"/>
</map>`;

        const result = await validator.validate(content);
        expect(result.valid).toBe(true);
    });
});
```

### 4.2 Integration Tests
- Test with real DITA files
- Test with all DITA document types (topic, concept, task, reference, map, bookmap)
- Test error line/column accuracy
- Test memory cleanup after validation

### 4.3 Platform Tests
- Windows x64
- macOS x64/ARM
- Linux x64/ARM

---

## 5. Alternatives Considered

### 5.1 Keep Current Approach (Rejected)
- **Reason:** Cannot detect invalid elements like `<p>` in `<map>`

### 5.2 Require External xmllint (Rejected)
- **Reason:** Poor user experience, installation barrier

### 5.3 Use libxmljs (Rejected)
- **Reason:** No direct DTD validation API

### 5.4 Custom DTD Parser (Rejected)
- **Reason:** Too complex, would duplicate libxml2 functionality

### 5.5 DITA-OT Validation Only (Deferred)
- **Reason:** Too slow for real-time validation, good for deep validation

---

## 6. Conclusion

**node-libxml** is the best choice for implementing proper DTD validation in DitaCraft because:

1. **Full DTD validation** - Uses libxml2's complete DTD validator
2. **Cross-platform** - Works on Windows, macOS, and Linux
3. **Performance** - Load DTDs once, validate many documents
4. **Active maintenance** - Regular updates, N-API for stability
5. **Error handling** - Returns structured errors with line/column info

### Recommended Next Steps

1. Add `node-libxml` as a dependency
2. Implement `LibxmlValidator` class
3. Add "libxml" as default validation engine
4. Update documentation
5. Add comprehensive tests
6. Release in v0.5.0

---

## References

- [node-libxml GitHub](https://github.com/MatthD/node-libxml)
- [node-libxml npm](https://www.npmjs.com/package/node-libxml)
- [libxmljs GitHub](https://github.com/libxmljs/libxmljs)
- [libxmljs2-xsd npm](https://www.npmjs.com/package/libxmljs2-xsd)
- [libxml2 Documentation](http://xmlsoft.org/)

---

---

## 7. Implementation Status

### What Was Implemented

Due to native compilation requirements (Windows SDK, Visual Studio) for libxml2 bindings, we implemented a **pure JavaScript content model validator** that provides DTD-like validation without native dependencies.

#### New Files Created

1. **`src/providers/ditaContentModelValidator.ts`** - Content model validation engine
   - Validates element nesting rules based on DITA 1.3 DTD specifications
   - Detects disallowed children (e.g., `<p>` in `<map>`)
   - Checks required attributes (e.g., `id` on topic elements)
   - Checks required children (e.g., `<title>` in topics)

2. **`src/test/suite/contentModelValidation.test.ts`** - Comprehensive test suite
   - 17 new unit tests for content model validation
   - Integration tests with DitaValidator

3. **`src/test/fixtures/invalid-p-in-map.ditamap`** - Test fixture

#### Configuration Changes

- Default validation engine changed from `xmllint` to `built-in`
- Built-in validation now includes content model checking

#### Coverage

The content model validator covers:

| Element Type | Validation |
|--------------|------------|
| `<map>`, `<bookmap>` | Disallows topic content (`<p>`, `<ul>`, `<section>`, etc.) |
| `<topicref>`, `<keydef>` | Disallows topic content |
| `<topic>`, `<concept>`, `<task>`, `<reference>` | Requires `id` attribute, `<title>` child |
| `<topicmeta>`, `<prolog>` | Disallows topic content |
| `<body>`, `<conbody>`, `<taskbody>`, `<refbody>` | Disallows map elements |

### Test Results

```
476 passing (25s)
4 pending
```

All content model validation tests pass, including:
- Detection of `<p>` in `<map>` (the original issue)
- Detection of invalid elements in various contexts
- Validation of required attributes and children

### Future Enhancements

For users who need full DTD validation:

1. **Install Windows SDK** and use `node-libxml` (optional dependency)
2. **Use external `xmllint`** with `ditacraft.validationEngine: "xmllint"`
3. **Use DITA-OT validation** (planned for v0.7.0)

---

*This study was prepared as part of DitaCraft validation improvements.*
