# TypesXML DTD Validation Study for DitaCraft

**Date:** January 2025
**Purpose:** Evaluate TypesXML for implementing DTD validation in DitaCraft
**Status:** Research Complete

---

## Executive Summary

| Criteria | TypesXML | node-libxml |
|----------|----------|-------------|
| **DTD Support** | Full | Full |
| **Native Dependencies** | **None (Pure TypeScript)** | Requires native compilation |
| **Windows SDK Required** | **No** | Yes (for compilation) |
| **W3C Conformance** | **100% test suite pass** | Based on libxml2 |
| **Catalog Support** | **OASIS XML Catalog** | Limited |
| **License** | EPL-1.0 | MIT |
| **Active Maintenance** | Yes (updated 2 weeks ago) | Last update 1 year ago |
| **Package Size** | 2.9 MB | 19.8 MB |
| **Dependencies** | **Zero** | 8 dependencies |

**Recommendation:** Use **TypesXML** for DTD validation in DitaCraft.

---

## 1. Package Information

### 1.1 npm Package

```bash
npm install typesxml --save
```

### 1.2 Package Details

| Property | Value |
|----------|-------|
| Package Name | `typesxml` |
| Version | 1.17.0 |
| License | EPL-1.0 (Eclipse Public License) |
| Author | rmraya (Maxprograms) |
| Repository | https://github.com/rmraya/TypesXML |
| Dependencies | **None** |
| Unpacked Size | 2.9 MB |
| Published | 2 weeks ago (actively maintained) |

### 1.3 Key Features

1. **Pure TypeScript** - No native bindings, no compilation required
2. **Full DTD Validation** - Passes 100% of W3C XML Conformance Test Suite
3. **OASIS XML Catalog** - Perfect for DITA with public identifiers
4. **SAX & DOM Parsing** - Flexible parsing approaches
5. **Default Attribute Extraction** - From DTD, RelaxNG, or XML Schema
6. **Streaming Support** - File, string, and Node.js stream parsing

---

## 2. Comparison with node-libxml

### 2.1 Why TypesXML is Better for DitaCraft

| Aspect | TypesXML | node-libxml |
|--------|----------|-------------|
| **Installation** | Simple `npm install` | Requires Windows SDK, Visual Studio |
| **Cross-platform** | Works everywhere Node.js runs | Prebuilt binaries may be incompatible |
| **Node.js Version** | Any modern version | Prebuilts may lag behind Node.js releases |
| **Bundle Size** | 2.9 MB | 19.8 MB |
| **Maintenance** | Very active | Stale (1 year since last update) |
| **DITA Catalog** | Native OASIS Catalog support | Manual DTD path resolution |

### 2.2 node-libxml Issues Encountered

During implementation attempts with node-libxml:

1. **Windows SDK Required** - Despite claims of prebuilt binaries, compilation was attempted
2. **Incompatible Prebuilts** - "not a valid Win32 application" error with Node.js 22
3. **Stale Package** - Last update was over a year ago
4. **8 Dependencies** - Including node-gyp which can cause build issues

---

## 3. TypesXML API Reference

### 3.1 Basic Usage

```typescript
import { SAXParser, DOMBuilder } from 'typesxml';

// Create handler and parser
const handler = new DOMBuilder();
const parser = new SAXParser();
parser.setContentHandler(handler);

// Parse file
parser.parseFile('/path/to/file.dita');

// Get result
const document = handler.getDocument();
const root = document.getRoot();
```

### 3.2 DTD Validation

```typescript
import { SAXParser, DOMBuilder, Catalog } from 'typesxml';

// Create catalog for DITA DTD resolution
const catalog = new Catalog('/path/to/catalog.xml');

// Create parser with validation
const handler = new DOMBuilder();
const parser = new SAXParser();
parser.setContentHandler(handler);
parser.setCatalog(catalog);
parser.setValidating(true);  // Enable DTD validation

try {
    parser.parseFile('/path/to/file.dita');
    // Validation passed
    const document = handler.getDocument();
} catch (error) {
    // Validation failed - error contains details
    console.error('Validation error:', error.message);
}
```

### 3.3 String Parsing

```typescript
const handler = new DOMBuilder();
const parser = new SAXParser();
parser.setContentHandler(handler);
parser.setValidating(true);

// Parse XML string
parser.parseString(xmlContent);
```

### 3.4 Custom Error Handling

```typescript
import { ContentHandler, SAXParser } from 'typesxml';

class ValidationHandler implements ContentHandler {
    errors: Array<{line: number; message: string}> = [];

    // Implement ContentHandler interface
    error(exception: any): void {
        this.errors.push({
            line: exception.lineNumber || 0,
            message: exception.message
        });
    }

    fatalError(exception: any): void {
        this.errors.push({
            line: exception.lineNumber || 0,
            message: exception.message
        });
    }

    // ... other ContentHandler methods
}
```

---

## 4. Implementation Design for DitaCraft

### 4.1 Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DitaCraft Validation                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    ValidationEngineFactory                          │ │
│  │                                                                     │ │
│  │   ditacraft.validationEngine = "typesxml" | "built-in" | "xmllint" │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│              ┌─────────────────────┼─────────────────────┐              │
│              ▼                     ▼                     ▼              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │
│  │ TypesXMLValidator│  │  BuiltInValidator │  │  XmllintValidator│      │
│  │  (NEW - DEFAULT) │  │  (existing)       │  │  (existing)      │      │
│  │                  │  │                   │  │                  │      │
│  │ • Full DTD valid │  │ • Well-formed     │  │ • External tool  │      │
│  │ • Pure TypeScript│  │ • Content model   │  │ • Full DTD       │      │
│  │ • OASIS Catalog  │  │ • No native deps  │  │ • Requires       │      │
│  │ • W3C Conformant │  │                   │  │   installation   │      │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Proposed TypesXMLValidator Class

```typescript
// src/providers/typesxmlValidator.ts

import { SAXParser, DOMBuilder, Catalog } from 'typesxml';
import * as path from 'path';
import { ValidationError, ValidationResult } from './ditaValidator';

export class TypesXMLValidator {
    private catalog: Catalog | null = null;
    private catalogPath: string;

    constructor(extensionPath: string) {
        // DITA catalog is at dtds/catalog-dita.xml
        this.catalogPath = path.join(extensionPath, 'dtds', 'catalog-dita.xml');
        this.initializeCatalog();
    }

    private initializeCatalog(): void {
        try {
            this.catalog = new Catalog(this.catalogPath);
        } catch (error) {
            console.warn('Failed to load DITA catalog:', error);
        }
    }

    public validate(content: string): ValidationResult {
        const errors: ValidationError[] = [];
        const warnings: ValidationError[] = [];

        try {
            const handler = new DOMBuilder();
            const parser = new SAXParser();

            parser.setContentHandler(handler);

            if (this.catalog) {
                parser.setCatalog(this.catalog);
            }

            parser.setValidating(true);
            parser.parseString(content);

            // Validation passed
            return { valid: true, errors, warnings };

        } catch (error: any) {
            // Parse error details
            errors.push({
                line: error.lineNumber ? error.lineNumber - 1 : 0,
                column: error.columnNumber ? error.columnNumber - 1 : 0,
                severity: 'error',
                message: error.message || 'DTD validation error',
                source: 'typesxml-dtd'
            });

            return { valid: false, errors, warnings };
        }
    }

    public dispose(): void {
        this.catalog = null;
    }
}
```

### 4.3 OASIS Catalog Integration

TypesXML natively supports OASIS XML Catalogs, which is perfect for DITA:

```xml
<!-- dtds/catalog-dita.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE catalog PUBLIC "-//OASIS//DTD XML Catalogs V1.1//EN"
  "http://www.oasis-open.org/committees/entity/release/1.1/catalog.dtd">
<catalog xmlns="urn:oasis:names:tc:entity:xmlns:xml:catalog">

    <!-- DITA 1.3 Topic Types -->
    <public publicId="-//OASIS//DTD DITA 1.3 Topic//EN"
            uri="technicalContent/dtd/topic.dtd"/>
    <public publicId="-//OASIS//DTD DITA 1.3 Concept//EN"
            uri="technicalContent/dtd/concept.dtd"/>
    <public publicId="-//OASIS//DTD DITA 1.3 Task//EN"
            uri="technicalContent/dtd/task.dtd"/>
    <public publicId="-//OASIS//DTD DITA 1.3 Reference//EN"
            uri="technicalContent/dtd/reference.dtd"/>

    <!-- DITA 1.3 Map Types -->
    <public publicId="-//OASIS//DTD DITA 1.3 Map//EN"
            uri="technicalContent/dtd/map.dtd"/>
    <public publicId="-//OASIS//DTD DITA 1.3 BookMap//EN"
            uri="bookmap/dtd/bookmap.dtd"/>

</catalog>
```

---

## 5. Configuration

### 5.1 VS Code Settings

```json
{
    "ditacraft.validationEngine": {
        "type": "string",
        "default": "typesxml",
        "enum": ["typesxml", "built-in", "xmllint"],
        "enumDescriptions": [
            "Full DTD validation using TypesXML (recommended)",
            "Built-in validation with content model checking (no DTD)",
            "External xmllint for DTD validation (requires installation)"
        ],
        "description": "XML validation engine for DITA files."
    }
}
```

---

## 6. Implementation Checklist

### Phase 1: Core Implementation ✅

- [x] Add `typesxml` as dependency in `package.json`
- [x] Create `src/providers/typesxmlValidator.ts`
- [x] Uses existing OASIS Catalog file (`dtds/catalog.xml`)
- [x] Implement basic validation methods
- [x] Add error mapping to ValidationError format

### Phase 2: Integration ✅

- [x] Update `DitaValidator` to use `TypesXMLValidator`
- [x] Update configuration schema in `package.json`
- [x] Add "typesxml" as default validation engine
- [x] Update `VALIDATION_ENGINES` constant

### Phase 3: Testing ✅

- [x] Create unit tests for `TypesXMLValidator` (`src/test/suite/typesxmlValidation.test.ts`)
- [x] Test with various DITA document types (concept, topic, map, task, reference)
- [x] Test error detection (invalid elements, missing attributes, malformed XML)
- [x] All 491 tests passing

### Phase 4: Documentation

- [ ] Update README.md
- [ ] Update CHANGELOG.md
- [x] Created this study document

---

## 7. Benefits Summary

### Why TypesXML is the Right Choice

1. **Zero Native Dependencies** - No Windows SDK, Visual Studio, or compilation
2. **100% W3C Conformance** - Tested against official XML test suite
3. **Active Maintenance** - Updated within last 2 weeks
4. **OASIS Catalog** - Native support for DITA public identifiers
5. **Small Footprint** - Only 2.9 MB unpacked
6. **Pure TypeScript** - Works everywhere Node.js runs
7. **Modern API** - Clean SAX/DOM interfaces with TypeScript types

### Comparison with Alternatives

| Solution | Pros | Cons |
|----------|------|------|
| **TypesXML** | Pure TS, OASIS Catalog, W3C compliant | EPL license (permissive) |
| node-libxml | Based on libxml2 | Requires compilation, stale |
| xmllint | External tool, proven | Requires system installation |
| Built-in | No deps | Limited validation |

---

## 8. References

- [TypesXML GitHub](https://github.com/rmraya/TypesXML)
- [TypesXML npm](https://www.npmjs.com/package/typesxml)
- [OASIS XML Catalogs](https://www.oasis-open.org/committees/entity/)
- [W3C XML Conformance Test Suite](https://www.w3.org/XML/Test/)
- [DITA 1.3 DTD Specifications](https://docs.oasis-open.org/dita/dita/v1.3/)

---

*This study recommends TypesXML for DTD validation in DitaCraft v0.5.0*
