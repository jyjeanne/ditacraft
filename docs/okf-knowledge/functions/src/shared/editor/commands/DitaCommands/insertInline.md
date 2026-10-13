---
type: TypeScript Method
title: insertInline
resource: src/shared/editor/commands.ts#L594-L629
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/commands/DitaCommands/inlineInsertableAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/commands/commonMarks
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/commands/withoutMarks
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/contextMenu/contextMenu
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`insertInline(element: string): Command`

# Calls

- [inlineInsertableAt](../../../../../../functions/src/shared/editor/commands/DitaCommands/inlineInsertableAt.md)
- [commonMarks](../../../../../../functions/src/shared/editor/commands/commonMarks.md)
- [withoutMarks](../../../../../../functions/src/shared/editor/commands/withoutMarks.md)

# Called by

- [contextMenu](../../../../../../functions/src/shared/editor/contextMenu/contextMenu.md)