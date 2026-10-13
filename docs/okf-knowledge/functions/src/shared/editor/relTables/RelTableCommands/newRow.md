---
type: TypeScript Method
title: newRow
resource: src/shared/editor/relTables.ts#L147-L151
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/relTables/RelTableCommands/typeOf
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/relTables/RelTableCommands/insertRelTable
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/relTables/RelTableCommands/addRow
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private newRow(cols: number): PMNode | undefined`

# Calls

- [typeOf](../../../../../../functions/src/shared/editor/relTables/RelTableCommands/typeOf.md)

# Called by

- [insertRelTable](../../../../../../functions/src/shared/editor/relTables/RelTableCommands/insertRelTable.md)
- [addRow](../../../../../../functions/src/shared/editor/relTables/RelTableCommands/addRow.md)