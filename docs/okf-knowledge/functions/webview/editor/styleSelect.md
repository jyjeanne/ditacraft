---
type: TypeScript Function
title: styleSelect
resource: webview/editor/main.ts#L996-L1008
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/commands/DitaCommands/setBlockType
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/renderToolbar
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function styleSelect(): HTMLSelectElement`

# Calls

- [setBlockType](../../../functions/src/shared/editor/commands/DitaCommands/setBlockType.md)

# Called by

- [renderToolbar](../../../functions/webview/editor/renderToolbar.md)