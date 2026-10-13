---
type: TypeScript Function
title: mapRowInfo
resource: src/shared/editor/maps.ts#L142-L179
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/maps/isMapRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/maps/mapRowTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/maps/rowNavtitle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/maps/collapse
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/maps/rowKeyword
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContexts/MapContexts/pick
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/maps/mapRowDom
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/setAllFolds
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/restoreFolds
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/mapPlugin
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/MapRowView/editLabel
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/dropTarget
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function mapRowInfo(node: PMNode, es: EditorSchema, resolved?: RowResolution): MapRowInfo`

# Calls

- [isMapRow](../../../../../functions/src/shared/editor/maps/isMapRow.md)
- [mapRowTarget](../../../../../functions/src/shared/editor/maps/mapRowTarget.md)
- [rowNavtitle](../../../../../functions/src/shared/editor/maps/rowNavtitle.md)
- [collapse](../../../../../functions/src/shared/editor/maps/collapse.md)
- [rowKeyword](../../../../../functions/src/shared/editor/maps/rowKeyword.md)
- [pick](../../../../../functions/src/preview/mapContexts/MapContexts/pick.md)

# Called by

- [mapRowDom](../../../../../functions/src/shared/editor/maps/mapRowDom.md)
- [setAllFolds](../../../../../functions/webview/editor/mapView/setAllFolds.md)
- [restoreFolds](../../../../../functions/webview/editor/mapView/restoreFolds.md)
- [mapPlugin](../../../../../functions/webview/editor/mapView/mapPlugin.md)
- [editLabel](../../../../../functions/webview/editor/mapView/MapRowView/editLabel.md)
- [dropTarget](../../../../../functions/webview/editor/mapView/dropTarget.md)