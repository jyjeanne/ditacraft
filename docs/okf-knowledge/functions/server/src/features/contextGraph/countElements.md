---
type: TypeScript Function
title: countElements
resource: server/src/features/contextGraph.ts#L99-L106
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/mcp/src/resources/query/OptionalQueryTemplate/match
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/contextGraph/buildMapNode
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function countElements(filePath: string): number`

# Calls

- [match](../../../../../functions/mcp/src/resources/query/OptionalQueryTemplate/match.md)

# Called by

- [buildMapNode](../../../../../functions/server/src/features/contextGraph/buildMapNode.md)