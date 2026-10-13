---
type: TypeScript Function
title: findCurrentElement
resource: server/src/features/completion.ts#L250-L257
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/mcp/src/resources/query/OptionalQueryTemplate/match
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/completion/findAttributeValueContext
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function findCurrentElement(text: string, beforePos: number): string`

# Calls

- [match](../../../../../functions/mcp/src/resources/query/OptionalQueryTemplate/match.md)

# Called by

- [findAttributeValueContext](../../../../../functions/server/src/features/completion/findAttributeValueContext.md)