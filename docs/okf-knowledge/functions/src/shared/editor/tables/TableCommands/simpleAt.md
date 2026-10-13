---
type: TypeScript Method
title: simpleAt
resource: src/shared/editor/tables.ts#L952-L979
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/shared/editor/tables/TableCommands/addRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/addColumn
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private simpleAt(state: EditorState): { table: PMNode; pos: number; rows: PMNode[]; row: number; col: number; entry: PMNode } | undefined`

# Called by

- [addRow](../../../../../../functions/src/shared/editor/tables/TableCommands/addRow.md)
- [addColumn](../../../../../../functions/src/shared/editor/tables/TableCommands/addColumn.md)