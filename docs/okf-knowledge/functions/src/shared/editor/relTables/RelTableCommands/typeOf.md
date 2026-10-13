---
type: TypeScript Method
title: typeOf
resource: src/shared/editor/relTables.ts#L76-L87
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/shared/editor/relTables/RelTableCommands/newRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/relTables/RelTableCommands/insertRelTable
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/relTables/RelTableCommands/addColumn
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private typeOf(token: string): NodeType | undefined`

# Called by

- [newRow](../../../../../../functions/src/shared/editor/relTables/RelTableCommands/newRow.md)
- [insertRelTable](../../../../../../functions/src/shared/editor/relTables/RelTableCommands/insertRelTable.md)
- [addColumn](../../../../../../functions/src/shared/editor/relTables/RelTableCommands/addColumn.md)