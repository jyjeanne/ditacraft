---
type: TypeScript Function
title: mapRowDom
resource: src/shared/editor/maps.ts#L208-L244
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/maps/mapRowInfo
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/maps/rowStyle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/contextMenu/ui
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/schema/elementDom
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/schema/opaqueDom
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/MapRowView/spec
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function mapRowDom(fact: ElementFacts, node: PMNode, es: EditorSchema, labels: Labels, resolved?: RowResolution): DOMOutputSpec`

# Calls

- [mapRowInfo](../../../../../functions/src/shared/editor/maps/mapRowInfo.md)
- [rowStyle](../../../../../functions/src/shared/editor/maps/rowStyle.md)
- [ui](../../../../../functions/src/shared/editor/contextMenu/ui.md)
- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)

# Called by

- [elementDom](../../../../../functions/src/shared/editor/schema/elementDom.md)
- [opaqueDom](../../../../../functions/src/shared/editor/schema/opaqueDom.md)
- [spec](../../../../../functions/webview/editor/mapView/MapRowView/spec.md)