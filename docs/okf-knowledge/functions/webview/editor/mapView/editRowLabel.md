---
type: TypeScript Function
title: editRowLabel
resource: webview/editor/mapView.ts#L322-L327
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/mapView/MapRowView/editLabel
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/runMenuItem
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/mapPlugin
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function editRowLabel(view: EditorView, pos: number): void`

# Calls

- [editLabel](../../../../functions/webview/editor/mapView/MapRowView/editLabel.md)

# Called by

- [runMenuItem](../../../../functions/webview/editor/runMenuItem.md)
- [mapPlugin](../../../../functions/webview/editor/mapView/mapPlugin.md)