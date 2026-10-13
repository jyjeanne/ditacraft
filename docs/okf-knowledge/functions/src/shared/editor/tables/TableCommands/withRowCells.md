---
type: TypeScript Method
title: withRowCells
resource: src/shared/editor/tables.ts#L424-L436
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/tables/TableCommands/addRow
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private withRowCells(row: Row, map: (cell: Cell) => PMNode | null): PMNode`

# Calls

- [find](../../../../../../functions/webview/editor/mapView/RowDrag/find.md)

# Called by

- [addRow](../../../../../../functions/src/shared/editor/tables/TableCommands/addRow.md)