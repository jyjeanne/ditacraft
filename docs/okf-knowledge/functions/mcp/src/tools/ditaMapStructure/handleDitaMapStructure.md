---
type: TypeScript Function
title: handleDitaMapStructure
resource: mcp/src/tools/ditaMapStructure.ts#L13-L41
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/mcp/src/workspace/resolvePath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/contextGraph/handleGetContextGraph
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/tools/ditaMapStructure/formatAsTree
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/tools/ditaMapStructure/formatAsCsv
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function handleDitaMapStructure( args: unknown, ctx: McpContext, ): ContextGraph | string`

# Calls

- [resolvePath](../../../../../functions/mcp/src/workspace/resolvePath.md)
- [handleGetContextGraph](../../../../../functions/server/src/features/contextGraph/handleGetContextGraph.md)
- [formatAsTree](../../../../../functions/mcp/src/tools/ditaMapStructure/formatAsTree.md)
- [formatAsCsv](../../../../../functions/mcp/src/tools/ditaMapStructure/formatAsCsv.md)