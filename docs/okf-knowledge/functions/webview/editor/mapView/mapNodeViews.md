---
type: TypeScript Function
title: mapNodeViews
resource: webview/editor/mapView.ts#L728-L749
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/maps/isMapRowElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/reused/isReuseNode
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/start
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function mapNodeViews(page: MapPage): Record<string, NodeViewConstructor>`

# Calls

- [isMapRowElement](../../../../functions/src/shared/editor/maps/isMapRowElement.md)
- [isReuseNode](../../../../functions/src/shared/editor/reused/isReuseNode.md)

# Called by

- [start](../../../../functions/webview/editor/start.md)