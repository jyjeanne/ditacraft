---
type: TypeScript Module
title: contextSnapshot
resource: server/src/features/contextSnapshot.ts#L1-L230
generated:
  by: okf-rs/0.4.0
relationships:
  imports:
  - target: external/contextgraph
    resolved_by: tree-sitter
    confidence: exact
  - target: external/services-interfaces
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/server
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [BuildContextSnapshotParams](../../../../interfaces/server/src/features/contextSnapshot/BuildContextSnapshotParams.md)
- [ContextSnapshotResult](../../../../interfaces/server/src/features/contextSnapshot/ContextSnapshotResult.md)
- [estimateTokens](../../../../functions/server/src/features/contextSnapshot/estimateTokens.md)
- [isTopicRefNode](../../../../functions/server/src/features/contextSnapshot/isTopicRefNode.md)
- [renderMapNodeXml](../../../../functions/server/src/features/contextSnapshot/renderMapNodeXml.md)
- [countTopicRefs](../../../../functions/server/src/features/contextSnapshot/countTopicRefs.md)
- [escapeXml](../../../../functions/server/src/features/contextSnapshot/escapeXml.md)
- [buildLevel1](../../../../functions/server/src/features/contextSnapshot/buildLevel1.md)
- [renderMapNodeText](../../../../functions/server/src/features/contextSnapshot/renderMapNodeText.md)
- [buildLevel2](../../../../functions/server/src/features/contextSnapshot/buildLevel2.md)
- [buildLevel3](../../../../functions/server/src/features/contextSnapshot/buildLevel3.md)
- [collectRefs](../../../../functions/server/src/features/contextSnapshot/collectRefs.md)
- [handleBuildContextSnapshot](../../../../functions/server/src/features/contextSnapshot/handleBuildContextSnapshot.md)

# Imports

- `./contextGraph`
- `../services/interfaces`

# Member of

- [ditacraft-lsp-server](../../../../packages/server.md)