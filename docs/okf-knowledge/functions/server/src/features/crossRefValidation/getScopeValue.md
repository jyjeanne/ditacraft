---
type: TypeScript Function
title: getScopeValue
resource: server/src/features/crossRefValidation.ts#L463-L468
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/server/src/features/crossRefValidation/getContainingTag
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/resources/query/OptionalQueryTemplate/match
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/crossRefValidation/validateCrossReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/isExternalScope
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function getScopeValue(text: string, refOffset: number): string | null`

# Calls

- [getContainingTag](../../../../../functions/server/src/features/crossRefValidation/getContainingTag.md)
- [match](../../../../../functions/mcp/src/resources/query/OptionalQueryTemplate/match.md)

# Called by

- [validateCrossReferences](../../../../../functions/server/src/features/crossRefValidation/validateCrossReferences.md)
- [isExternalScope](../../../../../functions/server/src/features/crossRefValidation/isExternalScope.md)