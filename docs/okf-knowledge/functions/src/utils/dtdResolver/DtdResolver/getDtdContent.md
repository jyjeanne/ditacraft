---
type: TypeScript Method
title: getDtdContent
resource: src/utils/dtdResolver.ts#L70-L91
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/dtdResolver/DtdResolver/resolvePublicId
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`public getDtdContent(publicId: string): string | null`

# Calls

- [get](../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)
- [resolvePublicId](../../../../../functions/src/utils/dtdResolver/DtdResolver/resolvePublicId.md)