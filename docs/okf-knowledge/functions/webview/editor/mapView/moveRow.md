---
type: TypeScript Function
title: moveRow
resource: webview/editor/mapView.ts#L133-L153
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/maps/selectedRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/isFolded
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/maps/isMapRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/setFold
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function moveRow(view: EditorView, es: EditorSchema, command: Command): boolean`

# Calls

- [selectedRow](../../../../functions/src/shared/editor/maps/selectedRow.md)
- [isFolded](../../../../functions/webview/editor/mapView/isFolded.md)
- [isMapRow](../../../../functions/src/shared/editor/maps/isMapRow.md)
- [setFold](../../../../functions/webview/editor/mapView/setFold.md)