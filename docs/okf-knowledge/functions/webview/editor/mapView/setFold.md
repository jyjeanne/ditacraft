---
type: TypeScript Function
title: setFold
resource: webview/editor/mapView.ts#L68-L89
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/test/shared/editor/test/nodeAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/isFolded
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/foldDecoration
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/debug
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/moveRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/mapPlugin
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/MapRowView/listen
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function setFold(view: EditorView, pos: number, fold?: boolean): void`

# Calls

- [nodeAt](../../../../functions/src/test/shared/editor/test/nodeAt.md)
- [isFolded](../../../../functions/webview/editor/mapView/isFolded.md)
- [foldDecoration](../../../../functions/webview/editor/mapView/foldDecoration.md)
- [find](../../../../functions/webview/editor/mapView/RowDrag/find.md)

# Called by

- [debug](../../../../functions/webview/editor/debug.md)
- [moveRow](../../../../functions/webview/editor/mapView/moveRow.md)
- [mapPlugin](../../../../functions/webview/editor/mapView/mapPlugin.md)
- [listen](../../../../functions/webview/editor/mapView/MapRowView/listen.md)