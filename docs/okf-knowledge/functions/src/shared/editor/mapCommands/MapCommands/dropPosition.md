---
type: TypeScript Method
title: dropPosition
resource: src/shared/editor/mapCommands.ts#L141-L151
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/test/shared/editor/test/nodeAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/maps/isMapRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/mapCommands/MapCommands/movable
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/mapView/dropTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`dropPosition(doc: PMNode, from: number, target: number, place: DropPlace): number | undefined`

# Calls

- [nodeAt](../../../../../../functions/src/test/shared/editor/test/nodeAt.md)
- [isMapRow](../../../../../../functions/src/shared/editor/maps/isMapRow.md)
- [movable](../../../../../../functions/src/shared/editor/mapCommands/MapCommands/movable.md)

# Called by

- [dropTarget](../../../../../../functions/webview/editor/mapView/dropTarget.md)
- [find](../../../../../../functions/webview/editor/mapView/RowDrag/find.md)