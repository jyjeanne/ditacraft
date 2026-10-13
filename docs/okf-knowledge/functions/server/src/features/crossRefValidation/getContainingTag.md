---
type: TypeScript Function
title: getContainingTag
resource: server/src/features/crossRefValidation.ts#L478-L484
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/server/src/features/crossRefValidation/getScopeValue
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/getAttributeValue
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function getContainingTag(text: string, refOffset: number): string | null`

# Called by

- [getScopeValue](../../../../../functions/server/src/features/crossRefValidation/getScopeValue.md)
- [getAttributeValue](../../../../../functions/server/src/features/crossRefValidation/getAttributeValue.md)