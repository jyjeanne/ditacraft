---
type: TypeScript Method
title: openFileAt
resource: src/preview/visualPreviewPanel.ts#L983-L1014
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/query/rootElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/openSource
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/open
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async openFileAt(uri: vscode.Uri, offset?: number, fragment?: string): Promise<void>`

# Calls

- [rootElement](../../../../../functions/src/shared/cst/query/rootElement.md)
- [find](../../../../../functions/webview/editor/mapView/RowDrag/find.md)

# Called by

- [openSource](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/openSource.md)
- [open](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/open.md)