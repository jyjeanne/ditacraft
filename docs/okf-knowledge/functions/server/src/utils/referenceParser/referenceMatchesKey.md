---
type: TypeScript Function
title: referenceMatchesKey
resource: server/src/utils/referenceParser.ts#L427-L433
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/utils/referenceParser/extractKeyPart
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/utils/referenceParser/findReferencesToKey
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function referenceMatchesKey(attrType: RefAttrName, value: string, targetKey: string): boolean`

# Calls

- [extractKeyPart](../../../../../functions/server/src/utils/referenceParser/extractKeyPart.md)

# Called by

- [findReferencesToKey](../../../../../functions/server/src/utils/referenceParser/findReferencesToKey.md)