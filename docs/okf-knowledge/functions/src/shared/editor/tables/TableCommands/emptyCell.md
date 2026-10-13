---
type: TypeScript Method
title: emptyCell
resource: src/shared/editor/tables.ts#L98-L102
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
  - target: functions/src/shared/editor/tables/TableCommands/simpleAddRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/simpleAddColumn
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private emptyCell(like: PMNode | undefined, element = 'entry'): PMNode`

# Called by

- [addRow](../../../../../../functions/src/shared/editor/tables/TableCommands/addRow.md)
- [addColumn](../../../../../../functions/src/shared/editor/tables/TableCommands/addColumn.md)
- [simpleAddRow](../../../../../../functions/src/shared/editor/tables/TableCommands/simpleAddRow.md)
- [simpleAddColumn](../../../../../../functions/src/shared/editor/tables/TableCommands/simpleAddColumn.md)