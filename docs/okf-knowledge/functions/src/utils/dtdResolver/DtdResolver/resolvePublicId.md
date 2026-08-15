---
type: TypeScript Method
title: resolvePublicId
resource: src/utils/dtdResolver.ts#L63-L65
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/utils/dtdResolver/DtdResolver/getDtdContent
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/dtdResolver/DtdResolver/resolveEntity
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`public resolvePublicId(publicId: string): string | null`

# Calls

- [get](../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)

# Called by

- [getDtdContent](../../../../../functions/src/utils/dtdResolver/DtdResolver/getDtdContent.md)
- [resolveEntity](../../../../../functions/src/utils/dtdResolver/DtdResolver/resolveEntity.md)