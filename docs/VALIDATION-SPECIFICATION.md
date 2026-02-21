# DitaCraft Validation Specification

**Version:** 1.0
**Date:** January 2025
**Status:** Draft
**Author:** Jeremy Jeanne

---

## Executive Summary

This document explores different approaches to validating DITA files within the DitaCraft VS Code extension. The goal is to provide robust, accurate, and user-friendly validation that helps technical writers catch errors early in their authoring workflow.

The document was prompted by feedback from Stan Doherty (OASIS DITA TC member, ACM SIGDOC) who noted that the current "built-in" validation engine may not be meeting all user needs and suggested exploring DITA-OT-based validation as an alternative.

---

## Table of Contents

1. [Current State](#1-current-state)
2. [Validation Requirements](#2-validation-requirements)
3. [Validation Approaches](#3-validation-approaches)
   - [3.1 Built-in XML Parser](#31-built-in-xml-parser)
   - [3.2 xmllint (libxml2)](#32-xmllint-libxml2)
   - [3.3 DITA-OT Validation](#33-dita-ot-validation-piggy-back-approach)
   - [3.4 DTD/Schema Validation](#34-dtdschema-validation)
   - [3.5 Schematron Rules](#35-schematron-rules)
   - [3.6 Language Server Protocol (LSP)](#36-language-server-protocol-lsp)
4. [Comparison Matrix](#4-comparison-matrix)
5. [Recommended Architecture](#5-recommended-architecture)
6. [Implementation Roadmap](#6-implementation-roadmap)
7. [Open Questions](#7-open-questions)

---

## 1. Current State

### 1.1 Existing Validation Engines

DitaCraft currently supports two validation engines configured via `ditacraft.validationEngine`:

| Engine | Description | Status |
|--------|-------------|--------|
| `xmllint` | External xmllint binary (libxml2) | Requires installation |
| `built-in` | JavaScript-based XML parser | Always available |

### 1.2 Current Capabilities

**Built-in Validator:**
- Well-formedness checking (XML syntax)
- Basic structure validation
- Element nesting validation
- Attribute presence checking
- No DTD/Schema validation
- No DITA-specific semantic validation

**xmllint Validator:**
- Well-formedness checking
- DTD validation (if DTD is accessible)
- XSD Schema validation
- Better error messages with line/column numbers
- Requires external binary installation

### 1.3 Known Limitations

1. **DTD Resolution:** DTDs referenced in DITA files often use public identifiers that require catalog resolution
2. **DITA-Specific Rules:** Neither engine validates DITA-specific constraints (e.g., required elements, valid attribute values)
3. **Cross-File Validation:** No validation of references (conrefs, keyrefs, topicrefs)
4. **Specialization Support:** No validation of specialized DITA types
5. **Installation Barrier:** xmllint requires users to install external tools

---

## 2. Validation Requirements

### 2.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| V-01 | Validate XML well-formedness | P0 (Critical) |
| V-02 | Validate against DITA DTDs | P0 (Critical) |
| V-03 | Report errors with accurate line/column | P0 (Critical) |
| V-04 | Work without external dependencies | P1 (High) |
| V-05 | Validate DITA-specific constraints | P1 (High) |
| V-06 | Validate cross-file references | P2 (Medium) |
| V-07 | Support DITA specializations | P2 (Medium) |
| V-08 | Real-time validation (as-you-type) | P1 (High) |
| V-09 | Batch validation (entire project) | P2 (Medium) |
| V-10 | Custom validation rules | P3 (Low) |

### 2.2 Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NF-01 | Validation latency | < 500ms for single file |
| NF-02 | Memory usage | < 100MB additional |
| NF-03 | Cross-platform support | Windows, macOS, Linux |
| NF-04 | Offline capability | Full functionality offline |
| NF-05 | Error message clarity | Actionable, user-friendly |

---

## 3. Validation Approaches

### 3.1 Built-in XML Parser

**Description:**
Use a JavaScript/TypeScript XML parser library to validate XML well-formedness and basic structure.

**Current Implementation:**
DitaCraft uses a custom XML parser based on `fast-xml-parser` or similar libraries.

**Libraries Available:**
- `fast-xml-parser` - Fast, configurable XML parser
- `xml2js` - XML to JavaScript object converter
- `saxes` - SAX parser (streaming, low memory)
- `@rgrove/parse-xml` - Lightweight DOM parser

**Capabilities:**
```
? Well-formedness checking
? Element structure validation
? Attribute parsing
? No external dependencies
? Cross-platform
? No DTD validation
? No schema validation
? Limited error details
```

**Pros:**
- Zero external dependencies
- Works offline
- Fast for simple checks
- Cross-platform by default

**Cons:**
- Cannot validate against DTD/XSD
- Limited DITA-specific validation
- May miss semantic errors
- Error messages less detailed

**Use Case:**
Quick well-formedness checks during typing.

---

### 3.2 xmllint (libxml2)

**Description:**
Use the `xmllint` command-line tool from the libxml2 library for comprehensive XML validation.

**Current Implementation:**
DitaCraft spawns `xmllint` as a child process when the `validationEngine` is set to `xmllint`.

**Command Examples:**
```bash
# Well-formedness check
xmllint --noout file.dita

# DTD validation
xmllint --valid --noout file.dita

# With XML catalog for DTD resolution
xmllint --valid --noout --catalogs file.dita
```

**Capabilities:**
```
? Well-formedness checking
? DTD validation
? XSD Schema validation
? XML Catalog support
? Detailed error messages
? Line/column information
? Requires installation
? Catalog configuration needed
? Platform-specific binaries
```

**Pros:**
- Industry-standard validation
- Full DTD/XSD support
- Excellent error messages
- Widely documented

**Cons:**
- Requires external installation
- Catalog setup is complex
- Platform-specific (need different binaries)
- May not be available in all environments

**Installation:**
```bash
# macOS
brew install libxml2

# Ubuntu/Debian
sudo apt-get install libxml2-utils

# Windows
# Download from https://www.zlatkovic.com/libxml.en.html
# Or use WSL
```

**Catalog Configuration:**
```xml
<!-- catalog.xml -->
<?xml version="1.0"?>
<!DOCTYPE catalog PUBLIC "-//OASIS//DTD XML Catalogs V1.1//EN"
  "http://www.oasis-open.org/committees/entity/release/1.1/catalog.dtd">
<catalog xmlns="urn:oasis:names:tc:entity:xmlns:xml:catalog">
  <delegatePublic publicIdStartString="-//OASIS//DTD DITA"
    catalog="file:///path/to/dita-ot/catalog-dita.xml"/>
</catalog>
```

---

### 3.3 DITA-OT Validation (Piggy-back Approach)

**Description:**
Leverage the DITA Open Toolkit's built-in validation capabilities by running a validation-only transformation.

**How It Works:**
1. DITA-OT performs comprehensive validation during preprocessing
2. Use a minimal transtype or custom plugin that only validates
3. Parse DITA-OT output for errors and warnings
4. Map errors back to source files

**Command Examples:**
```bash
# Basic validation using preprocess
dita --input=file.dita --format=preprocess --output=/dev/null

# Using the validate transtype (if available)
dita --input=file.dita --format=validate

# With verbose output for error capture
dita -v --input=file.dita --format=html5 2>&1 | grep -E "(ERROR|WARN)"
```

**Capabilities:**
```
? Full DITA validation
? DTD validation with bundled DTDs
? Conref resolution validation
? Keyref validation
? Cross-file reference checking
? Specialization support
? DITA-OT error codes (DOTXxxxE)
? Requires DITA-OT installation
? Slower than other methods
? Output parsing complexity
? Not suitable for real-time validation
```

**Pros:**
- Most comprehensive DITA validation
- Validates relationships between files
- Uses official DITA DTDs
- Catches semantic errors
- Same validation as publishing

**Cons:**
- Requires DITA-OT (external dependency)
- Slower (2-10 seconds per validation)
- Complex output parsing
- Not suitable for as-you-type validation

**DITA-OT Error Format:**
```
[DOTX001E][ERROR] File not found: missing-topic.dita
[DOTX012W][WARN] No navtitle attribute on topicref
[DOTJ003E][ERROR] Invalid element "bogus" in "task/taskbody"
```

**Potential Custom Plugin:**
```xml
<!-- org.ditacraft.validate/plugin.xml -->
<plugin id="org.ditacraft.validate">
  <feature extension="dita.conductor.transtype.check" value="validate"/>
  <transtype name="validate" desc="Validation only (no output)">
    <param name="validate.mode" default="strict"/>
  </transtype>
</plugin>
```

**Implementation Approach:**
```typescript
async function validateWithDitaOT(filePath: string): Promise<ValidationResult[]> {
  const ditaOtPath = config.get('ditaOtPath');
  const tempDir = os.tmpdir();

  const result = await execAsync(
    `"${ditaOtPath}/bin/dita" --input="${filePath}" --format=preprocess --output="${tempDir}" -v`,
    { timeout: 30000 }
  );

  return parseDitaOtOutput(result.stderr);
}
```

---

### 3.4 DTD/Schema Validation

**Description:**
Direct validation against DITA DTDs or RelaxNG/XSD schemas without DITA-OT.

**DTD Sources:**
1. **DITA-OT Bundle:** DTDs included in DITA-OT distribution
2. **OASIS DITA:** Official DTDs from OASIS (dita.xml.org)
3. **Custom DTDs:** Organization-specific specializations

**Approaches:**

#### 3.4.1 Bundled DTDs

Bundle DITA DTDs directly with the extension:

```
ditacraft/
+-- resources/
¦   +-- dtd/
¦       +-- base/
¦       ¦   +-- dtd/
¦       ¦   +-- rng/
¦       +-- technicalContent/
¦       +-- catalog-dita.xml
```

**Pros:**
- Works offline
- No external dependencies
- Consistent behavior

**Cons:**
- Increases extension size (~5-10MB)
- Version management complexity
- May miss custom specializations

#### 3.4.2 RelaxNG Schemas

Use RelaxNG (RNG/RNC) schemas instead of DTDs:

```bash
# Using jing (RelaxNG validator)
java -jar jing.jar dita-topic.rng file.dita
```

**Pros:**
- More expressive than DTDs
- Better error messages
- Supports DITA 1.3 fully

**Cons:**
- Requires Java runtime
- Additional dependency

#### 3.4.3 XSD Schemas

Use W3C XML Schema (XSD) for validation:

```bash
# Using xmllint with XSD
xmllint --schema dita-topic.xsd file.dita
```

**Pros:**
- Wide tool support
- No XML catalog needed

**Cons:**
- DITA XSD support is limited
- Some DITA features not expressible in XSD

---

### 3.5 Schematron Rules

**Description:**
Use Schematron rules for DITA-specific semantic validation beyond what DTDs can express.

**What Schematron Can Validate:**
- Required child elements
- Attribute value constraints
- Cross-reference integrity
- Content model constraints
- Business rules

**Example Schematron Rules:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<schema xmlns="http://purl.oclc.org/dml/schematron">
  <title>DITA Validation Rules</title>

  <!-- Task must have steps or steps-unordered -->
  <pattern>
    <rule context="taskbody">
      <assert test="steps or steps-unordered or steps-informal">
        A task body must contain steps, steps-unordered, or steps-informal.
      </assert>
    </rule>
  </pattern>

  <!-- Conref must point to existing ID -->
  <pattern>
    <rule context="*[@conref]">
      <let name="target" value="substring-after(@conref, '#')"/>
      <assert test="document(substring-before(@conref, '#'))//*[@id = $target]">
        Conref target "<value-of select="@conref"/>" not found.
      </assert>
    </rule>
  </pattern>

  <!-- Image must have alt text -->
  <pattern>
    <rule context="image">
      <assert test="alt or @alt">
        Images should have alternative text for accessibility.
      </assert>
    </rule>
  </pattern>
</schema>
```

**Capabilities:**
```
? Custom validation rules
? Semantic validation
? Cross-reference checking
? Business rule enforcement
? Accessibility checks
? Requires Schematron processor
? Additional dependency
? Rule authoring complexity
```

**Tools:**
- **SchXslt:** XSLT-based Schematron implementation
- **Jing:** Java-based (supports Schematron via ISO)
- **node-schematron:** Node.js implementation

---

### 3.6 Language Server Protocol (LSP)

**Description:**
Implement or integrate a DITA-aware Language Server that provides validation as part of broader language intelligence.

**Existing XML/DITA LSPs:**
- **LemMinX (Eclipse):** XML Language Server with DTD/XSD support
- **xml-language-server:** Generic XML LSP
- **No dedicated DITA LSP exists currently**

**LemMinX Integration:**
```json
{
  "xml.catalogs": [
    "/path/to/dita-ot/catalog-dita.xml"
  ],
  "xml.validation.enabled": true,
  "xml.validation.schema.enabled": "always"
}
```

**Custom DITA LSP Features:**
- Real-time validation
- DTD-based validation
- Conref/keyref resolution
- Completion suggestions
- Hover documentation
- Go to definition

**Capabilities:**
```
? Real-time validation
? Rich editor integration
? Completion/hover/go-to
? Standardized protocol
? Reusable across editors
? Complex to implement
? No existing DITA LSP
? Performance overhead
```

**Implementation Effort:**
Creating a full DITA LSP would be a significant project (estimated 3-6 months for a basic implementation).

---

## 4. Comparison Matrix

| Approach | Well-formed | DTD Valid | DITA Semantic | Cross-file | Real-time | Dependencies | Effort |
|----------|-------------|-----------|---------------|------------|-----------|--------------|--------|
| Built-in Parser | ? | ? | ? | ? | ? | None | Low |
| xmllint | ? | ? | ? | ? | ? | External | Low |
| DITA-OT | ? | ? | ? | ? | ? | External | Medium |
| Bundled DTDs | ? | ? | ? | ? | ? | Bundled | Medium |
| Schematron | Partial | ? | ? | ? | ?? | External | High |
| Custom LSP | ? | ? | ? | ? | ? | Bundled | Very High |

### Legend:
- ? Full support
- ?? Partial/conditional support
- ? Not supported

---

## 5. Recommended Architecture

Based on the analysis, we recommend a **layered validation architecture** that combines multiple approaches:

```
+---------------------------------------------------------------------+
¦                     DitaCraft Validation System                     ¦
+---------------------------------------------------------------------¦
¦                                                                     ¦
¦  +-------------------------------------------------------------+   ¦
¦  ¦                    Layer 1: Real-time                        ¦   ¦
¦  ¦              (As-you-type, < 100ms latency)                  ¦   ¦
¦  ¦                                                               ¦   ¦
¦  ¦  +-----------------+    +-----------------+                  ¦   ¦
¦  ¦  ¦ Built-in Parser ¦    ¦  Basic DITA     ¦                  ¦   ¦
¦  ¦  ¦ (Well-formed)   ¦    ¦  Rules Engine   ¦                  ¦   ¦
¦  ¦  +-----------------+    +-----------------+                  ¦   ¦
¦  +-------------------------------------------------------------+   ¦
¦                              ¦                                      ¦
¦                              ?                                      ¦
¦  +-------------------------------------------------------------+   ¦
¦  ¦                    Layer 2: On-Save                          ¦   ¦
¦  ¦              (Triggered on file save, < 2s)                  ¦   ¦
¦  ¦                                                               ¦   ¦
¦  ¦  +-----------------+    +-----------------+                  ¦   ¦
¦  ¦  ¦ xmllint + DTD   ¦ OR ¦ Bundled DTD     ¦                  ¦   ¦
¦  ¦  ¦ (if available)  ¦    ¦ Validator       ¦                  ¦   ¦
¦  ¦  +-----------------+    +-----------------+                  ¦   ¦
¦  +-------------------------------------------------------------+   ¦
¦                              ¦                                      ¦
¦                              ?                                      ¦
¦  +-------------------------------------------------------------+   ¦
¦  ¦                   Layer 3: Deep Validation                   ¦   ¦
¦  ¦           (On-demand or pre-publish, < 30s)                  ¦   ¦
¦  ¦                                                               ¦   ¦
¦  ¦  +-----------------+    +-----------------+                  ¦   ¦
¦  ¦  ¦   DITA-OT       ¦    ¦  Schematron     ¦                  ¦   ¦
¦  ¦  ¦   Validation    ¦    ¦  Rules          ¦                  ¦   ¦
¦  ¦  +-----------------+    +-----------------+                  ¦   ¦
¦  +-------------------------------------------------------------+   ¦
¦                                                                     ¦
+---------------------------------------------------------------------+
```

### 5.1 Layer 1: Real-time Validation

**Trigger:** As user types (debounced)
**Latency Target:** < 100ms
**Purpose:** Catch obvious errors immediately

**Features:**
- XML well-formedness
- Basic element structure
- Required attribute checks
- Common DITA patterns

**Implementation:**
```typescript
// Lightweight real-time validation
function validateRealtime(content: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  // 1. Well-formedness check
  const parseResult = parseXML(content);
  if (parseResult.errors) {
    diagnostics.push(...parseResult.errors);
  }

  // 2. Basic DITA rules (fast checks only)
  if (parseResult.root) {
    diagnostics.push(...checkBasicDitaRules(parseResult.root));
  }

  return diagnostics;
}
```

### 5.2 Layer 2: On-Save Validation

**Trigger:** File save
**Latency Target:** < 2 seconds
**Purpose:** Full DTD validation

**Features:**
- DTD validation
- Element content models
- Attribute value validation
- ID/IDREF checking

**Implementation:**
```typescript
// DTD validation on save
async function validateOnSave(filePath: string): Promise<Diagnostic[]> {
  // Try xmllint first (if available)
  if (await isXmllintAvailable()) {
    return await validateWithXmllint(filePath);
  }

  // Fall back to bundled DTD validator
  return await validateWithBundledDTD(filePath);
}
```

### 5.3 Layer 3: Deep Validation

**Trigger:** Manual command or pre-publish
**Latency Target:** < 30 seconds
**Purpose:** Comprehensive DITA validation

**Features:**
- Full DITA-OT validation
- Conref resolution
- Keyref resolution
- Cross-file references
- Map structure validation

**Implementation:**
```typescript
// Deep validation with DITA-OT
async function validateDeep(filePath: string): Promise<Diagnostic[]> {
  const ditaOtPath = config.get('ditaOtPath');

  if (!ditaOtPath) {
    return [createWarning('DITA-OT not configured for deep validation')];
  }

  return await validateWithDitaOT(filePath);
}
```

### 5.4 Configuration

```json
{
  // Validation engine for on-save validation
  "ditacraft.validationEngine": "auto",  // "auto" | "xmllint" | "built-in" | "dita-ot"

  // Enable/disable validation layers
  "ditacraft.validation.realtime": true,
  "ditacraft.validation.onSave": true,
  "ditacraft.validation.deep": false,     // Manual trigger only

  // Deep validation settings
  "ditacraft.validation.deepOnPublish": true,
  "ditacraft.validation.ditaOtTimeout": 30000
}
```

---

## 6. Implementation Roadmap

> **Note:** This validation-specific roadmap aligns with Milestone 5 (v0.7.0) in the main project `ROADMAP.md`. The phases below describe incremental validation improvements that may be delivered across multiple minor releases.

### Phase 1: Improve Existing (v0.5.0)

**Timeline:** 2-3 weeks
**Goal:** Make current validation reliable

| Task | Description | Effort |
|------|-------------|--------|
| Fix built-in parser | Improve error messages and accuracy | 3 days |
| xmllint detection | Auto-detect xmllint availability | 1 day |
| Catalog support | Configure XML catalogs for DTD resolution | 3 days |
| Error mapping | Better line/column mapping | 2 days |
| Documentation | User guide for validation setup | 1 day |

### Phase 2: DITA-OT Integration (v0.6.0)

**Timeline:** 3-4 weeks
**Goal:** Add DITA-OT-based validation option

| Task | Description | Effort |
|------|-------------|--------|
| DITA-OT command | Implement validation command execution | 3 days |
| Output parsing | Parse DITA-OT error output | 4 days |
| Error mapping | Map errors to source locations | 3 days |
| UI integration | Add "Validate with DITA-OT" command | 2 days |
| Progress reporting | Show validation progress | 1 day |
| Testing | Comprehensive test suite | 3 days |

### Phase 3: Bundled DTDs (v0.7.0)

**Timeline:** 2-3 weeks
**Goal:** Zero-configuration DTD validation

| Task | Description | Effort |
|------|-------------|--------|
| DTD bundling | Bundle DITA 1.3 DTDs with extension | 2 days |
| Catalog generation | Auto-generate XML catalog | 2 days |
| DTD validator | Implement DTD validation without xmllint | 5 days |
| Specialization | Support for common specializations | 3 days |
| Testing | Validation accuracy tests | 3 days |

### Phase 4: Advanced Features (v0.8.0+)

**Timeline:** 4-6 weeks
**Goal:** Semantic validation and custom rules

| Task | Description | Effort |
|------|-------------|--------|
| Schematron support | Basic Schematron rule evaluation | 2 weeks |
| Built-in rules | Common DITA validation rules | 1 week |
| Custom rules | User-defined validation rules | 1 week |
| LSP exploration | Evaluate LSP architecture | 2 weeks |

---

## 7. Open Questions

### 7.1 Technical Questions

1. **DTD Licensing:** ? RESOLVED - See `docs/VALIDATION-LICENSE-ANALYSIS.md`. OASIS IPR Policy permits bundling DTDs for implementation purposes. Precedent set by DITA-OT (Apache 2.0).
2. **Specialization Support:** How to handle custom specializations users may have?
3. **Performance:** Can DITA-OT validation be fast enough for on-save triggers?
4. **Catalog Resolution:** How to handle DTD resolution across different OS platforms?

### 7.2 User Experience Questions

1. **Default Engine:** What should be the default validation engine?
2. **Error Severity:** How to classify DITA-OT warnings vs errors?
3. **Partial Validation:** Should we validate incomplete/draft content?
4. **Caching:** Can we cache validation results for unchanged files?

### 7.3 Scope Questions

1. **Map Validation:** Should single-file validation include referenced files?
2. **Specialization Detection:** Should we auto-detect specialized DITA types?
3. **LightweightDITA:** Should we support LwDITA (MDITA, HDITA)?

---

## Appendix A: DITA-OT Error Codes

Common DITA-OT error codes for reference:

| Code | Type | Description |
|------|------|-------------|
| DOTX001E | Error | File not found |
| DOTX002E | Error | Parse error in file |
| DOTX003E | Error | Invalid element in context |
| DOTX012W | Warning | Missing navtitle |
| DOTX013W | Warning | Missing short description |
| DOTJ003E | Error | Java processing error |
| DOTJ007I | Info | Processing file |

---

## Appendix B: XML Catalog Example

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE catalog PUBLIC "-//OASIS//DTD XML Catalogs V1.1//EN"
  "http://www.oasis-open.org/committees/entity/release/1.1/catalog.dtd">
<catalog xmlns="urn:oasis:names:tc:entity:xmlns:xml:catalog"
         prefer="public">

  <!-- DITA 1.3 DTDs -->
  <delegatePublic publicIdStartString="-//OASIS//DTD DITA"
    catalog="file:///path/to/dita-1.3/catalog-dita.xml"/>

  <!-- DITA 1.2 DTDs (fallback) -->
  <delegatePublic publicIdStartString="-//OASIS//DTD DITA 1.2"
    catalog="file:///path/to/dita-1.2/catalog-dita.xml"/>

</catalog>
```

---

## Appendix C: References

- [DITA Open Toolkit](https://www.dita-ot.org/)
- [OASIS DITA TC](https://www.oasis-open.org/committees/dita/)
- [libxml2 / xmllint](http://xmlsoft.org/)
- [LemMinX XML Language Server](https://github.com/eclipse/lemminx)
- [Schematron](http://schematron.com/)
- [ACM SIGDOC Structured Content](https://acm-sigdoc-structured.org/)

---

*This specification is a living document and will be updated as implementation progresses.*
