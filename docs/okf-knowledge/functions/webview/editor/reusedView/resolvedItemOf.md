---
type: TypeScript Function
title: resolvedItemOf
resource: webview/editor/reusedView.ts#L20-L28
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/webview/editor/mapView/MapRowView/spec
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/MapRowView/editLabel
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/reusedView/KeptView/constructor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/reusedView/KeptView/update
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/reusedView/ReusedView/render
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function resolvedItemOf(decorations: readonly Decoration[]): ResolvedItem | undefined`

# Called by

- [spec](../../../../functions/webview/editor/mapView/MapRowView/spec.md)
- [editLabel](../../../../functions/webview/editor/mapView/MapRowView/editLabel.md)
- [constructor](../../../../functions/webview/editor/reusedView/KeptView/constructor.md)
- [update](../../../../functions/webview/editor/reusedView/KeptView/update.md)
- [render](../../../../functions/webview/editor/reusedView/ReusedView/render.md)