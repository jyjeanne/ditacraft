---
type: TypeScript Method
title: commit
resource: src/shared/editor/tables.ts#L337-L351
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/tables/TableCommands/grid
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/tables/TableCommands/addRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/addColumn
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private commit(state: EditorState, grid: Grid, tgroup: PMNode, at: { section: 'thead' | 'tbody'; row: number; col: number } | undefined, dispatch: (tr: Transaction) => void): void`

# Calls

- [grid](../../../../../../functions/src/shared/editor/tables/TableCommands/grid.md)
- [find](../../../../../../functions/webview/editor/mapView/RowDrag/find.md)

# Called by

- [addRow](../../../../../../functions/src/shared/editor/tables/TableCommands/addRow.md)
- [addColumn](../../../../../../functions/src/shared/editor/tables/TableCommands/addColumn.md)