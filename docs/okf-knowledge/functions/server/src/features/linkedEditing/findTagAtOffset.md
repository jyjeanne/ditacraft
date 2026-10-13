---
type: TypeScript Function
title: findTagAtOffset
resource: server/src/features/linkedEditing.ts#L68-L125
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/resources/query/OptionalQueryTemplate/match
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/linkedEditing/handleLinkedEditingRange
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function findTagAtOffset(text: string, offset: number): TagAtOffset | null`

# Calls

- [startsWith](../../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)
- [match](../../../../../functions/mcp/src/resources/query/OptionalQueryTemplate/match.md)

# Called by

- [handleLinkedEditingRange](../../../../../functions/server/src/features/linkedEditing/handleLinkedEditingRange.md)