---
type: TypeScript Function
title: findReferenceAtOffset
resource: server/src/utils/referenceParser.ts#L60-L101
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/utils/referenceParser/isRefAttr
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/definition/handleDefinition
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/hover/handleHover
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function findReferenceAtOffset(text: string, offset: number): ReferenceAtOffset | null`

# Calls

- [isRefAttr](../../../../../functions/server/src/utils/referenceParser/isRefAttr.md)

# Called by

- [handleDefinition](../../../../../functions/server/src/features/definition/handleDefinition.md)
- [handleHover](../../../../../functions/server/src/features/hover/handleHover.md)