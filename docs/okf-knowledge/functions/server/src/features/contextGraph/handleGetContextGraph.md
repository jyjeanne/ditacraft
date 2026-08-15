---
type: TypeScript Function
title: handleGetContextGraph
resource: server/src/features/contextGraph.ts#L229-L263
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/utils/textUtils/uriToPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/effectiveWorkspaceFolders
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/getWorkspaceFolders
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/contextGraph/buildMapNode
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/mcp/src/tools/ditaMapStructure/handleDitaMapStructure
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/contextSnapshot/handleBuildContextSnapshot
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function handleGetContextGraph( params: GetContextGraphParams, keySpaceService?: IKeySpaceService ): ContextGraph`

# Calls

- [uriToPath](../../../../../functions/server/src/utils/textUtils/uriToPath.md)
- [effectiveWorkspaceFolders](../../../../../functions/server/src/utils/textUtils/effectiveWorkspaceFolders.md)
- [getWorkspaceFolders](../../../../../functions/server/src/services/keySpaceService/KeySpaceService/getWorkspaceFolders.md)
- [buildMapNode](../../../../../functions/server/src/features/contextGraph/buildMapNode.md)

# Called by

- [handleDitaMapStructure](../../../../../functions/mcp/src/tools/ditaMapStructure/handleDitaMapStructure.md)
- [handleBuildContextSnapshot](../../../../../functions/server/src/features/contextSnapshot/handleBuildContextSnapshot.md)