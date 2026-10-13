---
type: TypeScript Method
title: simpleAddColumn
resource: src/shared/editor/tables.ts#L1091-L1121
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/tables/TableCommands/emptyCell
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/relcol
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/simpleCommit
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/replaceRows
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/tables/TableCommands/addColumn
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private simpleAddColumn(state: EditorState, s: NonNullable<ReturnType<TableCommands['simpleAt']>>, where: 'before' | 'after', dispatch?: (tr: Transaction) => void): boolean`

# Calls

- [emptyCell](../../../../../../functions/src/shared/editor/tables/TableCommands/emptyCell.md)
- [relcol](../../../../../../functions/src/shared/editor/tables/TableCommands/relcol.md)
- [simpleCommit](../../../../../../functions/src/shared/editor/tables/TableCommands/simpleCommit.md)
- [replaceRows](../../../../../../functions/src/shared/editor/tables/TableCommands/replaceRows.md)

# Called by

- [addColumn](../../../../../../functions/src/shared/editor/tables/TableCommands/addColumn.md)