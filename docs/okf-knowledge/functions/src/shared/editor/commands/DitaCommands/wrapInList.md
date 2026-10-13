---
type: TypeScript Method
title: wrapInList
resource: src/shared/editor/commands.ts#L211-L246
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
  called_by:
  - target: functions/webview/editor/listToggle
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`wrapInList(listElement: string): Command`

# Calls

- [textType](../../../../../../functions/src/shared/editor/commands/DitaCommands/textType.md)
- [isTextrun](../../../../../../functions/src/shared/editor/commands/DitaCommands/isTextrun.md)

# Called by

- [listToggle](../../../../../../functions/webview/editor/listToggle.md)