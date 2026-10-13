---
type: TypeScript Method
title: debugMessage
resource: src/editor/visualEditorProvider.ts#L136-L139
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/extension/registerCommands
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`public static async debugMessage(uri: string, message: EditorToHost): Promise<void>`

# Calls

- [find](../../../../../functions/webview/editor/mapView/RowDrag/find.md)

# Called by

- [registerCommands](../../../../../functions/src/extension/registerCommands.md)