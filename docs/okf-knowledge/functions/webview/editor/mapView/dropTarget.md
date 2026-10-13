---
type: TypeScript Function
title: dropTarget
resource: webview/editor/mapView.ts#L514-L538
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/test/shared/editor/test/nodeAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/maps/mapRowInfo
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/isFolded
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/maps/isMapRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/mapCommands/MapCommands/dropPosition
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/mapView/dropRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function dropTarget(view: EditorView, page: MapPage, from: number, target: number, places: DropPlace[]): { place: DropPlace; to: number } | undefined`

# Calls

- [nodeAt](../../../../functions/src/test/shared/editor/test/nodeAt.md)
- [mapRowInfo](../../../../functions/src/shared/editor/maps/mapRowInfo.md)
- [isFolded](../../../../functions/webview/editor/mapView/isFolded.md)
- [isMapRow](../../../../functions/src/shared/editor/maps/isMapRow.md)
- [dropPosition](../../../../functions/src/shared/editor/mapCommands/MapCommands/dropPosition.md)

# Called by

- [dropRow](../../../../functions/webview/editor/mapView/dropRow.md)
- [find](../../../../functions/webview/editor/mapView/RowDrag/find.md)