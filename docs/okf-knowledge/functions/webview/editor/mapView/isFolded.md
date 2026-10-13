---
type: TypeScript Function
title: isFolded
resource: webview/editor/mapView.ts#L63-L65
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/mapView/setFold
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/moveRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/visibleRows
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/mapPlugin
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/dropTarget
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function isFolded(state: EditorState, pos: number): boolean`

# Calls

- [find](../../../../functions/webview/editor/mapView/RowDrag/find.md)

# Called by

- [setFold](../../../../functions/webview/editor/mapView/setFold.md)
- [moveRow](../../../../functions/webview/editor/mapView/moveRow.md)
- [visibleRows](../../../../functions/webview/editor/mapView/visibleRows.md)
- [mapPlugin](../../../../functions/webview/editor/mapView/mapPlugin.md)
- [dropTarget](../../../../functions/webview/editor/mapView/dropTarget.md)