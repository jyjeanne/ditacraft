---
type: TypeScript Method
title: simpleAddRow
resource: src/shared/editor/tables.ts#L1033-L1049
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/tables/TableCommands/simpleWidth
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/emptyCell
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/simpleCommit
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/replaceRows
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/tables/TableCommands/addRow
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private simpleAddRow(state: EditorState, s: NonNullable<ReturnType<TableCommands['simpleAt']>>, where: 'before' | 'after', dispatch?: (tr: Transaction) => void): boolean`

# Calls

- [simpleWidth](../../../../../../functions/src/shared/editor/tables/TableCommands/simpleWidth.md)
- [emptyCell](../../../../../../functions/src/shared/editor/tables/TableCommands/emptyCell.md)
- [simpleCommit](../../../../../../functions/src/shared/editor/tables/TableCommands/simpleCommit.md)
- [replaceRows](../../../../../../functions/src/shared/editor/tables/TableCommands/replaceRows.md)

# Called by

- [addRow](../../../../../../functions/src/shared/editor/tables/TableCommands/addRow.md)