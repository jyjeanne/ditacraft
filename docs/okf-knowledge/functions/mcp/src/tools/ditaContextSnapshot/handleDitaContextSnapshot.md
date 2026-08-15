---
type: TypeScript Function
title: handleDitaContextSnapshot
resource: mcp/src/tools/ditaContextSnapshot.ts#L12-L31
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/mcp/src/workspace/resolvePath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/contextSnapshot/handleBuildContextSnapshot
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function handleDitaContextSnapshot( args: unknown, ctx: McpContext, ): ContextSnapshotResult`

# Calls

- [resolvePath](../../../../../functions/mcp/src/workspace/resolvePath.md)
- [handleBuildContextSnapshot](../../../../../functions/server/src/features/contextSnapshot/handleBuildContextSnapshot.md)