---
type: TypeScript Method
title: blockTypesAt
resource: src/shared/editor/commands.ts#L370-L385
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/commands/DitaCommands/isTextrun
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/commands/DitaCommands/textType
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/commands/DitaCommands/allowedIn
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/contextMenu/contextMenu
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/updateUi
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`blockTypesAt(state: EditorState): string[]`

# Calls

- [isTextrun](../../../../../../functions/src/shared/editor/commands/DitaCommands/isTextrun.md)
- [textType](../../../../../../functions/src/shared/editor/commands/DitaCommands/textType.md)
- [allowedIn](../../../../../../functions/src/shared/editor/commands/DitaCommands/allowedIn.md)

# Called by

- [contextMenu](../../../../../../functions/src/shared/editor/contextMenu/contextMenu.md)
- [updateUi](../../../../../../functions/webview/editor/updateUi.md)