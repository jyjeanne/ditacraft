---
type: TypeScript Function
title: mapRowTarget
resource: src/shared/editor/maps.ts#L124-L139
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/shared/editor/maps/mapRowInfo
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/runMenuItem
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/rowContext
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/pickRowTarget
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

`function mapRowTarget(node: PMNode, es: EditorSchema): MapRowTarget | undefined`

# Called by

- [mapRowInfo](../../../../../functions/src/shared/editor/maps/mapRowInfo.md)
- [runMenuItem](../../../../../functions/webview/editor/runMenuItem.md)
- [rowContext](../../../../../functions/webview/editor/rowContext.md)
- [pickRowTarget](../../../../../functions/webview/editor/pickRowTarget.md)
- [mapPlugin](../../../../../functions/webview/editor/mapView/mapPlugin.md)
- [listen](../../../../../functions/webview/editor/mapView/MapRowView/listen.md)