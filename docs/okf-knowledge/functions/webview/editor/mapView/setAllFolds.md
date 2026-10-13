---
type: TypeScript Function
title: setAllFolds
resource: webview/editor/mapView.ts#L92-L107
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/maps/mapRows
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/maps/mapRowInfo
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/foldDecoration
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/renderMapToolbar
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function setAllFolds(view: EditorView, es: EditorSchema, fold: boolean): void`

# Calls

- [mapRows](../../../../functions/src/shared/editor/maps/mapRows.md)
- [mapRowInfo](../../../../functions/src/shared/editor/maps/mapRowInfo.md)
- [foldDecoration](../../../../functions/webview/editor/mapView/foldDecoration.md)
- [find](../../../../functions/webview/editor/mapView/RowDrag/find.md)

# Called by

- [renderMapToolbar](../../../../functions/webview/editor/renderMapToolbar.md)