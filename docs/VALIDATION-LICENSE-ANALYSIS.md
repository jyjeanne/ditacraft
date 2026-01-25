# DitaCraft Validation - License Analysis

**Date:** January 2025
**Purpose:** Analyze licensing implications of validation components in DitaCraft

---

## Executive Summary

| Component | License | Risk Level | Action Required |
|-----------|---------|------------|-----------------|
| Extension Code | MIT | None | None |
| `@xmldom/xmldom` | MIT | None | None |
| `fast-xml-parser` | MIT | None | None |
| `xmllint` (external) | MIT (libxml2) | None | User installs |
| **DITA 1.3 DTDs** | **OASIS IPR** | **Medium** | **Review required** |

---

## 1. Current Validation Components

### 1.1 Source Code Analysis

DitaCraft validation is implemented in:

```
src/providers/ditaValidator.ts    - Main validation engine
src/utils/dtdResolver.ts          - DTD catalog resolution
src/commands/validateCommand.ts   - Command handler
```

### 1.2 Validation Engines Used

| Engine | Type | Implementation |
|--------|------|----------------|
| **Built-in** | XML Parser | `fast-xml-parser` + `@xmldom/xmldom` |
| **xmllint** | External CLI | Spawns system binary |
| **DTD Validation** | Bundled DTDs | DITA 1.3 DTDs in `/dtds` folder |

---

## 2. NPM Dependencies - License Status

### 2.1 @xmldom/xmldom v0.8.11

**License:** MIT
**Repository:** https://github.com/xmldom/xmldom

```
MIT License

Copyright (c) 2019-present Christopher J. Brody and contributors
Copyright (c) 2012-2017 @jindw and contributors
```

**Status:** ✅ No license issues - MIT is compatible with DitaCraft's MIT license.

### 2.2 fast-xml-parser v5.3.3

**License:** MIT
**Repository:** https://github.com/NaturalIntelligence/fast-xml-parser

```
MIT License

Copyright (c) 2017 Amit Kumar Gupta
```

**Status:** ✅ No license issues - MIT is compatible with DitaCraft's MIT license.

### 2.3 xmllint (External Tool)

**License:** MIT (libxml2 project)
**Not bundled** - User must install separately

**Status:** ✅ No license issues - Not redistributed, user installs from system package manager.

---

## 3. Bundled DITA 1.3 DTDs - License Analysis

### 3.1 What's Bundled

The `/dtds` directory contains **100+ files** from the OASIS DITA 1.3 specification:

```
dtds/
├── base/           - Base topic and map DTDs
├── bookmap/        - BookMap DTD
├── ditaval/        - DITAVAL DTD
├── learning/       - Learning & Training DTDs
├── machineryIndustry/  - Machinery Task DTD
├── subjectScheme/  - Subject Scheme DTDs
└── technicalContent/   - Topic, Concept, Task, Reference DTDs
```

### 3.2 Copyright Notice in DTD Files

Each DTD file contains:

```xml
<!-- Copyright (c) OASIS Open 2015. All rights reserved. -->
<!-- (C) Copyright OASIS Open 2005, 2014. -->
<!-- (C) Copyright IBM Corporation 2001, 2004. -->
<!-- All Rights Reserved. -->
```

### 3.3 OASIS IPR Policy Analysis

The OASIS Intellectual Property Rights (IPR) Policy governs all OASIS standards:

**Key Points:**

1. **OASIS Standards are Royalty-Free:** DITA operates under "RF on Limited Terms Mode"

2. **Redistribution Permitted:** The OASIS IPR Policy states:
   > "derivative works that comment on or otherwise explain it or assist in its implementation may be prepared, copied, published, and distributed, in whole or in part, without restriction."

3. **Implementation Rights:** Tools that implement the standard (like DitaCraft) are explicitly permitted.

### 3.4 Precedent: DITA Open Toolkit

**DITA-OT** (the reference implementation) bundles the same DTDs and is licensed under **Apache 2.0**.

This establishes precedent that:
- Bundling DITA DTDs for implementation purposes is accepted
- OASIS has not challenged this practice
- Major vendors (IBM, Adobe, Oxygen) do the same

### 3.5 Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| OASIS challenges redistribution | Very Low | High | Add attribution, contact OASIS |
| Users question licensing | Low | Low | Add NOTICE file |
| Incompatibility with MIT | Low | Medium | Document third-party licenses |

### 3.6 Recommended Actions

1. **Add NOTICE File:**
   ```
   This product includes DITA 1.3 grammar files from OASIS.
   Copyright (c) OASIS Open 2015. All rights reserved.
   https://www.oasis-open.org/committees/dita/
   ```

2. **Add Attribution in README:**
   ```markdown
   ## Third-Party Licenses

   This extension includes DITA 1.3 DTDs from the OASIS DITA Technical Committee.
   - Copyright: OASIS Open 2015
   - Source: https://docs.oasis-open.org/dita/dita/v1.3/
   - License: OASIS IPR Policy (RF on Limited Terms)
   ```

3. **Document in package.json:**
   ```json
   {
     "thirdPartyNotices": "THIRD-PARTY-NOTICES.md"
   }
   ```

---

## 4. Alternative Approaches (License-Clean)

If you want to avoid any potential DTD licensing concerns:

### 4.1 Option A: Remove Bundled DTDs

**Approach:** Don't bundle DTDs; use external resolution only.

**Pros:**
- Zero licensing concerns
- Smaller extension size

**Cons:**
- Users must configure XML catalogs
- Validation may fail without proper setup
- Poor user experience

### 4.2 Option B: Use DITA-OT DTDs

**Approach:** Require DITA-OT installation, use its bundled DTDs.

**Pros:**
- DITA-OT handles licensing
- DTDs always match DITA-OT version
- Consistent validation results

**Cons:**
- Requires DITA-OT installation
- More complex configuration

### 4.3 Option C: Generate DTDs from RNG

**Approach:** Generate DTDs from RelaxNG schemas (also from OASIS).

**Pros:**
- Same content, different form
- Can be automated

**Cons:**
- Same OASIS licensing applies
- Additional build complexity

### 4.4 Option D: Schema-less Validation (Current Built-in)

**Approach:** Validate XML well-formedness + DITA structural rules without DTDs.

**Pros:**
- No external files needed
- No licensing concerns
- Fast validation

**Cons:**
- Less accurate validation
- Misses DTD-level constraints
- Stan Doherty's complaint about current validation

---

## 5. Comparison with Other DITA Tools

| Tool | DTDs Bundled | License | Approach |
|------|--------------|---------|----------|
| **DITA-OT** | Yes | Apache 2.0 | Full DTD bundle |
| **Oxygen XML** | Yes | Commercial | Licensed from OASIS |
| **XMLMind** | Yes | Personal/Commercial | Licensed from OASIS |
| **VS Code XML Extension** | No | MIT | External catalog |
| **DitaCraft** | Yes | MIT | Same as DITA-OT |

---

## 6. Recommendations

### 6.1 Immediate Actions

1. **Add THIRD-PARTY-NOTICES.md** documenting OASIS DTD copyright
2. **Update README.md** with third-party attribution
3. **Keep bundled DTDs** - Precedent from DITA-OT establishes this is acceptable

### 6.2 Future Improvements

1. **Add DITA-OT validation option** ("piggy-back" approach from Stan's email)
2. **Allow external catalog configuration** for users with custom DTDs
3. **Document validation architecture** for transparency

### 6.3 Response to Stan Doherty

Stan's concerns about validation can be addressed by:

1. **Improving built-in validation** - Better error messages, more DITA rules
2. **Adding DITA-OT validation** - "piggy-back" approach for comprehensive validation
3. **Documenting validation options** - Help users understand available engines

---

## 7. Conclusion

**The current approach of bundling DITA DTDs is acceptable** based on:

1. OASIS IPR Policy permits implementation use
2. DITA-OT (Apache 2.0) sets precedent
3. Other commercial tools do the same
4. DTDs are necessary for proper validation

**Recommended action:** Add proper attribution and NOTICE file, then continue with current approach.

---

## References

- [OASIS DITA Technical Committee](https://www.oasis-open.org/committees/tc_home.php?wg_abbrev=dita)
- [OASIS IPR Policy](https://www.oasis-open.org/policies-guidelines/ipr/)
- [DITA 1.3 Specification](https://docs.oasis-open.org/dita/dita/v1.3/dita-v1.3-part3-all-inclusive.html)
- [DITA Open Toolkit](https://www.dita-ot.org/)
- [OASIS DITA GitHub Repository](https://github.com/oasis-tcs/dita)
