---
type: TypeScript Method
title: listen
resource: webview/editor/mapView.ts#L368-L404
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/mapView/setFold
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/maps/mapRowTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/editable
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/mapView/MapRowView/constructor
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private listen(): void`

# Calls

- [setFold](../../../../../functions/webview/editor/mapView/setFold.md)
- [mapRowTarget](../../../../../functions/src/shared/editor/maps/mapRowTarget.md)
- [editable](../../../../../functions/webview/editor/editable.md)

# Called by

- [constructor](../../../../../functions/webview/editor/mapView/MapRowView/constructor.md)