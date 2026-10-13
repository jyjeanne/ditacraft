---
type: TypeScript Method
title: handoff
resource: src/editor/visualEditorProvider.ts#L156-L161
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/revealCursor
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/extension/registerCommands
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`public static handoff(uri: vscode.Uri, offset: number): void`

# Calls

- [find](../../../../../functions/webview/editor/mapView/RowDrag/find.md)
- [revealCursor](../../../../../functions/src/editor/visualEditorProvider/EditorSession/revealCursor.md)

# Called by

- [registerCommands](../../../../../functions/src/extension/registerCommands.md)