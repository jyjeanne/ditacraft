---
type: TypeScript Function
title: readShortDesc
resource: server/src/features/contextGraph.ts#L87-L97
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

`function readShortDesc(filePath: string): string | undefined`

# Calls

- [match](../../../../../functions/mcp/src/resources/query/OptionalQueryTemplate/match.md)

# Called by

- [buildMapNode](../../../../../functions/server/src/features/contextGraph/buildMapNode.md)