---
type: TypeScript Function
title: load
resource: src/editor/linkPicker.ts#L58-L79
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/workspaceText/readWorkspaceText
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function load(file: string, context: vscode.Uri): Promise<Document | null>`

# Calls

- [find](../../../../functions/webview/editor/mapView/RowDrag/find.md)
- [readWorkspaceText](../../../../functions/src/preview/workspaceText/readWorkspaceText.md)