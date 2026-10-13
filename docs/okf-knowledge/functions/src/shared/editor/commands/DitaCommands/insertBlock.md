---
type: TypeScript Method
title: insertBlock
resource: src/shared/editor/commands.ts#L496-L518
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/commands/DitaCommands/textType
    resolved_by: tree-sitter
    confidence: exact
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
---

# Signature

`insertBlock(element: string, attrs: [string, string][] = []): Command`

# Calls

- [textType](../../../../../../functions/src/shared/editor/commands/DitaCommands/textType.md)
- [insertionPointAt](../../../../../../functions/src/shared/editor/commands/DitaCommands/insertionPointAt.md)
- [allowedIn](../../../../../../functions/src/shared/editor/commands/DitaCommands/allowedIn.md)
- [insert](../../../../../../functions/src/shared/editor/images/ImageCommands/insert.md)

# Called by

- [insertItems](../../../../../../functions/src/shared/editor/contextMenu/insertItems.md)