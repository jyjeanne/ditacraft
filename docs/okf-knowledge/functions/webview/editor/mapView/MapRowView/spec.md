---
type: TypeScript Method
title: spec
resource: webview/editor/mapView.ts#L354-L362
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/reusedView/resolvedItemOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/maps/mapRowDom
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/mapView/MapRowView/constructor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/MapRowView/update
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private spec(node: PMNode, decorations: readonly Decoration[])`

# Calls

- [resolvedItemOf](../../../../../functions/webview/editor/reusedView/resolvedItemOf.md)
- [mapRowDom](../../../../../functions/src/shared/editor/maps/mapRowDom.md)

# Called by

- [constructor](../../../../../functions/webview/editor/mapView/MapRowView/constructor.md)
- [update](../../../../../functions/webview/editor/mapView/MapRowView/update.md)