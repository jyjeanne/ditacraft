---
type: TypeScript Function
title: buildMapNode
resource: server/src/features/contextGraph.ts#L131-L225
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/features/contextGraph/readTitle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/contextGraph/resolveHref
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/contextGraph/readTopicType
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/contextGraph/readShortDesc
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/contextGraph/countElements
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/contextGraph/handleGetContextGraph
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function buildMapNode( mapPath: string, _baseDir: string, depth: number, maxDepth: number, visited: Set<string>, topics: Map<string, TopicNode>, relations: RelationNode[], keyDefs: Map<string, KeyDef>, workspaceFolders: readonly string[] ): MapNode`

# Calls

- [readTitle](../../../../../functions/server/src/features/contextGraph/readTitle.md)
- [resolveHref](../../../../../functions/server/src/features/contextGraph/resolveHref.md)
- [readTopicType](../../../../../functions/server/src/features/contextGraph/readTopicType.md)
- [readShortDesc](../../../../../functions/server/src/features/contextGraph/readShortDesc.md)
- [countElements](../../../../../functions/server/src/features/contextGraph/countElements.md)

# Called by

- [handleGetContextGraph](../../../../../functions/server/src/features/contextGraph/handleGetContextGraph.md)