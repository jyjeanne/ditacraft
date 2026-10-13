---
type: TypeScript Function
title: dropRow
resource: webview/editor/mapView.ts#L541-L548
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/mapView/dropTarget
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/debug
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function dropRow(view: EditorView, page: MapPage, from: number, target: number, places: DropPlace[]): boolean`

# Calls

- [dropTarget](../../../../functions/webview/editor/mapView/dropTarget.md)

# Called by

- [debug](../../../../functions/webview/editor/debug.md)