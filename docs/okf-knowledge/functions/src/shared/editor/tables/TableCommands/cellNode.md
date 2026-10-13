---
type: TypeScript Method
title: cellNode
resource: src/shared/editor/tables.ts#L832-L846
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/shared/editor/tables/TableCommands/goToCell
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/inTable
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private cellNode(state: EditorState): { pos: number; table: { node: PMNode; pos: number } } | undefined`

# Called by

- [goToCell](../../../../../../functions/src/shared/editor/tables/TableCommands/goToCell.md)
- [inTable](../../../../../../functions/src/shared/editor/tables/TableCommands/inTable.md)