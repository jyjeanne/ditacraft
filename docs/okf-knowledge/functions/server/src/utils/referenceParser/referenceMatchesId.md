---
type: TypeScript Function
title: referenceMatchesId
resource: server/src/utils/referenceParser.ts#L389-L410
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/utils/referenceParser/parseReference
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/referenceParser/getTargetId
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/utils/referenceParser/findReferencesToId
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function referenceMatchesId(attrType: RefAttrName, value: string, targetId: string): boolean`

# Calls

- [parseReference](../../../../../functions/server/src/utils/referenceParser/parseReference.md)
- [getTargetId](../../../../../functions/server/src/utils/referenceParser/getTargetId.md)

# Called by

- [findReferencesToId](../../../../../functions/server/src/utils/referenceParser/findReferencesToId.md)