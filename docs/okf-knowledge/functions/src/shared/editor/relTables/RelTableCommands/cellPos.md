---
type: TypeScript Method
title: cellPos
resource: src/shared/editor/relTables.ts#L142-L145
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/relTables/childPos
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/relTables/RelTableCommands/selectCell
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

`cellPos(grid: RelGrid, row: number, col: number): number | undefined`

# Calls

- [childPos](../../../../../../functions/src/shared/editor/relTables/childPos.md)

# Called by

- [selectCell](../../../../../../functions/src/shared/editor/relTables/RelTableCommands/selectCell.md)
- [goToCell](../../../../../../functions/src/shared/editor/relTables/RelTableCommands/goToCell.md)
- [cellAt](../../../../../../functions/webview/editor/mapView/cellAt.md)