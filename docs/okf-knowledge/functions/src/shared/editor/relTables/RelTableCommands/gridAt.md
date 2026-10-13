---
type: TypeScript Method
title: gridAt
resource: src/shared/editor/relTables.ts#L90-L118
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/relTables/RelTableCommands/gridOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/relTables/RelTableCommands/inRelTable
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/relTables/RelTableCommands/addRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/relTables/RelTableCommands/moveRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/relTables/RelTableCommands/addColumn
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/relTables/RelTableCommands/goToCell
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/cellAt
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`gridAt(state: EditorState): RelGrid | undefined`

# Calls

- [gridOf](../../../../../../functions/src/shared/editor/relTables/RelTableCommands/gridOf.md)
- [find](../../../../../../functions/webview/editor/mapView/RowDrag/find.md)

# Called by

- [inRelTable](../../../../../../functions/src/shared/editor/relTables/RelTableCommands/inRelTable.md)
- [addRow](../../../../../../functions/src/shared/editor/relTables/RelTableCommands/addRow.md)
- [moveRow](../../../../../../functions/src/shared/editor/relTables/RelTableCommands/moveRow.md)
- [addColumn](../../../../../../functions/src/shared/editor/relTables/RelTableCommands/addColumn.md)
- [goToCell](../../../../../../functions/src/shared/editor/relTables/RelTableCommands/goToCell.md)
- [cellAt](../../../../../../functions/webview/editor/mapView/cellAt.md)