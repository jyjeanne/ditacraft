---
type: TypeScript Method
title: revealInEditor
resource: src/preview/visualPreviewPanel.ts#L925-L944
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/elementIndex/ElementIndex/openingTagOffset
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/onMessage
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private revealInEditor(id: string, select: boolean): void`

# Calls

- [openingTagOffset](../../../../../functions/src/shared/cst/elementIndex/ElementIndex/openingTagOffset.md)
- [find](../../../../../functions/webview/editor/mapView/RowDrag/find.md)

# Called by

- [onMessage](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/onMessage.md)