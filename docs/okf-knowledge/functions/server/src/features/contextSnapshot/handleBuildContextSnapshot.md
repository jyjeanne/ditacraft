---
type: TypeScript Function
title: handleBuildContextSnapshot
resource: server/src/features/contextSnapshot.ts#L200-L230
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/features/contextGraph/handleGetContextGraph
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/contextSnapshot/buildLevel1
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/contextSnapshot/estimateTokens
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/contextSnapshot/buildLevel2
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/contextSnapshot/buildLevel3
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/mcp/src/tools/ditaContextSnapshot/handleDitaContextSnapshot
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/test/contextSnapshot/test/snap
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function handleBuildContextSnapshot( params: BuildContextSnapshotParams, keySpaceService?: IKeySpaceService ): ContextSnapshotResult`

# Calls

- [handleGetContextGraph](../../../../../functions/server/src/features/contextGraph/handleGetContextGraph.md)
- [buildLevel1](../../../../../functions/server/src/features/contextSnapshot/buildLevel1.md)
- [estimateTokens](../../../../../functions/server/src/features/contextSnapshot/estimateTokens.md)
- [buildLevel2](../../../../../functions/server/src/features/contextSnapshot/buildLevel2.md)
- [buildLevel3](../../../../../functions/server/src/features/contextSnapshot/buildLevel3.md)

# Called by

- [handleDitaContextSnapshot](../../../../../functions/mcp/src/tools/ditaContextSnapshot/handleDitaContextSnapshot.md)
- [snap](../../../../../functions/server/test/contextSnapshot/test/snap.md)