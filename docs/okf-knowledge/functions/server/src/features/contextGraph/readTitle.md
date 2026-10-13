---
type: TypeScript Function
title: readTitle
resource: server/src/features/contextGraph.ts#L63-L71
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/mcp/src/resources/query/OptionalQueryTemplate/match
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/basename
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/contextGraph/buildMapNode
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function readTitle(filePath: string): string`

# Calls

- [match](../../../../../functions/mcp/src/resources/query/OptionalQueryTemplate/match.md)
- [basename](../../../../../functions/src/shared/render/toHtml/basename.md)

# Called by

- [buildMapNode](../../../../../functions/server/src/features/contextGraph/buildMapNode.md)