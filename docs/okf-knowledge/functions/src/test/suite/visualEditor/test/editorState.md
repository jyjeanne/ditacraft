---
type: TypeScript Function
title: editorState
resource: src/test/suite/visualEditor.test.ts#L34-L37
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/test/suite/visualEditor/test/open
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function editorState(uri: vscode.Uri): Promise<EditorState | undefined>`

# Calls

- [find](../../../../../../functions/webview/editor/mapView/RowDrag/find.md)

# Called by

- [open](../../../../../../functions/src/test/suite/visualEditor/test/open.md)