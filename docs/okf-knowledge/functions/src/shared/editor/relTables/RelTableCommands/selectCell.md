---
type: TypeScript Method
title: selectCell
resource: src/shared/editor/relTables.ts#L154-L163
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/test/shared/editor/test/nodeAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/relTables/RelTableCommands/gridOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/relTables/RelTableCommands/cellPos
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/relTables/RelTableCommands/insertRelTable
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
---

# Signature

`private selectCell(tr: Transaction, tablePos: number, row: number, col: number): Transaction`

# Calls

- [nodeAt](../../../../../../functions/src/test/shared/editor/test/nodeAt.md)
- [gridOf](../../../../../../functions/src/shared/editor/relTables/RelTableCommands/gridOf.md)
- [cellPos](../../../../../../functions/src/shared/editor/relTables/RelTableCommands/cellPos.md)

# Called by

- [insertRelTable](../../../../../../functions/src/shared/editor/relTables/RelTableCommands/insertRelTable.md)
- [addRow](../../../../../../functions/src/shared/editor/relTables/RelTableCommands/addRow.md)
- [moveRow](../../../../../../functions/src/shared/editor/relTables/RelTableCommands/moveRow.md)
- [addColumn](../../../../../../functions/src/shared/editor/relTables/RelTableCommands/addColumn.md)
- [goToCell](../../../../../../functions/src/shared/editor/relTables/RelTableCommands/goToCell.md)