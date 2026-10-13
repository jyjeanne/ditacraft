---
type: TypeScript Function
title: listToggle
resource: webview/editor/main.ts#L980-L994
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/commands/DitaCommands/itemAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/commands/DitaCommands/wrapInList
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/renderToolbar
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function listToggle(list: string): Command`

# Calls

- [itemAt](../../../functions/src/shared/editor/commands/DitaCommands/itemAt.md)
- [wrapInList](../../../functions/src/shared/editor/commands/DitaCommands/wrapInList.md)

# Called by

- [renderToolbar](../../../functions/webview/editor/renderToolbar.md)