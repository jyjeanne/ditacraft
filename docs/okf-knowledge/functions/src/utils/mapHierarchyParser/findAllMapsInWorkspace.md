---
type: TypeScript Function
title: findAllMapsInWorkspace
resource: src/utils/mapHierarchyParser.ts#L160-L168
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/src/providers/ditaExplorerProvider/DitaExplorerProvider/getChildren
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/keySpaceViewProvider/KeySpaceViewProvider/_buildTree
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function findAllMapsInWorkspace(): Promise<string[]>`

# Called by

- [getChildren](../../../../functions/src/providers/ditaExplorerProvider/DitaExplorerProvider/getChildren.md)
- [_buildTree](../../../../functions/src/providers/keySpaceViewProvider/KeySpaceViewProvider/_buildTree.md)