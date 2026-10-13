---
type: TypeScript Method
title: insertTable
resource: src/shared/editor/commands.ts#L521-L547
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/commands/DitaCommands/insertionPointAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/commands/DitaCommands/allowedIn
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/images/ImageCommands/insert
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/contextMenu/insertItems
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/contextMenu/tableItems
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`insertTable(rows: number, cols: number): Command`

# Calls

- [insertionPointAt](../../../../../../functions/src/shared/editor/commands/DitaCommands/insertionPointAt.md)
- [allowedIn](../../../../../../functions/src/shared/editor/commands/DitaCommands/allowedIn.md)
- [insert](../../../../../../functions/src/shared/editor/images/ImageCommands/insert.md)

# Called by

- [insertItems](../../../../../../functions/src/shared/editor/contextMenu/insertItems.md)
- [tableItems](../../../../../../functions/src/shared/editor/contextMenu/tableItems.md)