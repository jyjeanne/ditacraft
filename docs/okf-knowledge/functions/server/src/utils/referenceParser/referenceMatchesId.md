---
type: TypeScript Function
title: referenceMatchesId
resource: server/src/utils/referenceParser.ts#L434-L452
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/server/src/utils/referenceParser/getTargetId
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/utils/referenceParser/findReferencesToId
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function referenceMatchesId(attrType: RefAttrName, value: string, targetId: string, isTopicId = false): boolean`

# Calls

- [getTargetId](../../../../../functions/server/src/utils/referenceParser/getTargetId.md)

# Called by

- [findReferencesToId](../../../../../functions/server/src/utils/referenceParser/findReferencesToId.md)