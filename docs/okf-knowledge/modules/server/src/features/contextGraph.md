---
type: TypeScript Module
title: contextGraph
resource: server/src/features/contextGraph.ts#L1-L263
generated:
  by: okf-rs/0.4.0
relationships:
  imports:
  - target: external/fs
    resolved_by: tree-sitter
    confidence: exact
  - target: external/path
    resolved_by: tree-sitter
    confidence: exact
  - target: external/services-interfaces
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-textutils
    resolved_by: tree-sitter
    confidence: exact
  - target: external/vscode-uri
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/server
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [GetContextGraphParams](../../../../interfaces/server/src/features/contextGraph/GetContextGraphParams.md)
- [MapNode](../../../../interfaces/server/src/features/contextGraph/MapNode.md)
- [TopicRefNode](../../../../interfaces/server/src/features/contextGraph/TopicRefNode.md)
- [TopicNode](../../../../interfaces/server/src/features/contextGraph/TopicNode.md)
- [KeyDef](../../../../interfaces/server/src/features/contextGraph/KeyDef.md)
- [RelationNode](../../../../interfaces/server/src/features/contextGraph/RelationNode.md)
- [ContextGraph](../../../../interfaces/server/src/features/contextGraph/ContextGraph.md)
- [readTitle](../../../../functions/server/src/features/contextGraph/readTitle.md)
- [readTopicType](../../../../functions/server/src/features/contextGraph/readTopicType.md)
- [readShortDesc](../../../../functions/server/src/features/contextGraph/readShortDesc.md)
- [countElements](../../../../functions/server/src/features/contextGraph/countElements.md)
- [resolveHref](../../../../functions/server/src/features/contextGraph/resolveHref.md)
- [buildMapNode](../../../../functions/server/src/features/contextGraph/buildMapNode.md)
- [handleGetContextGraph](../../../../functions/server/src/features/contextGraph/handleGetContextGraph.md)

# Imports

- `fs`
- `path`
- `../services/interfaces`
- `../utils/textUtils`
- `vscode-uri`

# Member of

- [ditacraft-lsp-server](../../../../packages/server.md)