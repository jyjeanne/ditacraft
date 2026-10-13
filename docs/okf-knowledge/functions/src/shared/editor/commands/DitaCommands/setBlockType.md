---
type: TypeScript Method
title: setBlockType
resource: src/shared/editor/commands.ts#L394-L410
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/commands/DitaCommands/textType
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/commands/DitaCommands/isTextrun
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/commands/DitaCommands/allowedIn
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/contextMenu/contextMenu
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/styleSelect
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`setBlockType(element: string): Command`

# Calls

- [textType](../../../../../../functions/src/shared/editor/commands/DitaCommands/textType.md)
- [isTextrun](../../../../../../functions/src/shared/editor/commands/DitaCommands/isTextrun.md)
- [allowedIn](../../../../../../functions/src/shared/editor/commands/DitaCommands/allowedIn.md)

# Called by

- [contextMenu](../../../../../../functions/src/shared/editor/contextMenu/contextMenu.md)
- [styleSelect](../../../../../../functions/webview/editor/styleSelect.md)