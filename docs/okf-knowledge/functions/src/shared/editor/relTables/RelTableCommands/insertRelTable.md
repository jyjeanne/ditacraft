---
type: TypeScript Method
title: insertRelTable
resource: src/shared/editor/relTables.ts#L172-L206
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/relTables/RelTableCommands/typeOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/relTables/RelTableCommands/newRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/commands/DitaCommands/allowedIn
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/commands/DitaCommands/insertionPointAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/images/ImageCommands/insert
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/relTables/RelTableCommands/selectCell
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/contextMenu/insertItems
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/contextMenu/relTableItems
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`insertRelTable(cols: number, rows: number): Command`

# Calls

- [typeOf](../../../../../../functions/src/shared/editor/relTables/RelTableCommands/typeOf.md)
- [newRow](../../../../../../functions/src/shared/editor/relTables/RelTableCommands/newRow.md)
- [allowedIn](../../../../../../functions/src/shared/editor/commands/DitaCommands/allowedIn.md)
- [insertionPointAt](../../../../../../functions/src/shared/editor/commands/DitaCommands/insertionPointAt.md)
- [insert](../../../../../../functions/src/shared/editor/images/ImageCommands/insert.md)
- [selectCell](../../../../../../functions/src/shared/editor/relTables/RelTableCommands/selectCell.md)

# Called by

- [insertItems](../../../../../../functions/src/shared/editor/contextMenu/insertItems.md)
- [relTableItems](../../../../../../functions/src/shared/editor/contextMenu/relTableItems.md)