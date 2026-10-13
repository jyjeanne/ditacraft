---
type: TypeScript Function
title: isMapRowElement
resource: src/shared/editor/maps.ts#L74-L76
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/shared/editor/maps/isMapRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/schema/elementDom
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/schema/opaqueDom
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/mapNodeViews
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function isMapRowElement(fact: ElementFacts | undefined): boolean`

# Called by

- [isMapRow](../../../../../functions/src/shared/editor/maps/isMapRow.md)
- [elementDom](../../../../../functions/src/shared/editor/schema/elementDom.md)
- [opaqueDom](../../../../../functions/src/shared/editor/schema/opaqueDom.md)
- [mapNodeViews](../../../../../functions/webview/editor/mapView/mapNodeViews.md)