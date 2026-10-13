---
type: TypeScript Function
title: visibleRows
resource: webview/editor/mapView.ts#L159-L161
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/maps/mapRows
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/isFolded
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/mapView/mapPlugin
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function visibleRows(state: EditorState, es: EditorSchema): { pos: number; node: PMNode }[]`

# Calls

- [mapRows](../../../../functions/src/shared/editor/maps/mapRows.md)
- [isFolded](../../../../functions/webview/editor/mapView/isFolded.md)

# Called by

- [mapPlugin](../../../../functions/webview/editor/mapView/mapPlugin.md)