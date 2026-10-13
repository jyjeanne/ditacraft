---
type: TypeScript Method
title: inTable
resource: src/shared/editor/tables.ts#L849-L851
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/tables/TableCommands/cellNode
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/contextMenu/contextMenu
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`inTable(state: EditorState): boolean`

# Calls

- [cellNode](../../../../../../functions/src/shared/editor/tables/TableCommands/cellNode.md)

# Called by

- [contextMenu](../../../../../../functions/src/shared/editor/contextMenu/contextMenu.md)