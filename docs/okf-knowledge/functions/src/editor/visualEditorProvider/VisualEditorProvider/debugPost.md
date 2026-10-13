---
type: TypeScript Method
title: debugPost
resource: src/editor/visualEditorProvider.ts#L142-L144
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/postToPage
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/extension/registerCommands
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`public static debugPost(uri: string, message: HostToEditor): void`

# Calls

- [find](../../../../../functions/webview/editor/mapView/RowDrag/find.md)
- [postToPage](../../../../../functions/src/editor/visualEditorProvider/EditorSession/postToPage.md)

# Called by

- [registerCommands](../../../../../functions/src/extension/registerCommands.md)