---
type: TypeScript Function
title: isMapRow
resource: src/shared/editor/maps.ts#L79-L82
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/maps/isMapRowElement
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/mapCommands/MapCommands/movable
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/mapCommands/MapCommands/dropPosition
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/mapCommands/MapCommands/canTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/mapCommands/MapCommands/setLabel
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/maps/mapRowInfo
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/maps/selectedRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/maps/hiddenMetadataSelection
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/maps/mapRows
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/maps/rowAtPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/reused/resolvedTargets
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/reveal
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/nextProblem
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/moveRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/mapPlugin
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/dropTarget
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function isMapRow(node: PMNode, es: EditorSchema): boolean`

# Calls

- [isMapRowElement](../../../../../functions/src/shared/editor/maps/isMapRowElement.md)

# Called by

- [movable](../../../../../functions/src/shared/editor/mapCommands/MapCommands/movable.md)
- [dropPosition](../../../../../functions/src/shared/editor/mapCommands/MapCommands/dropPosition.md)
- [canTarget](../../../../../functions/src/shared/editor/mapCommands/MapCommands/canTarget.md)
- [setLabel](../../../../../functions/src/shared/editor/mapCommands/MapCommands/setLabel.md)
- [mapRowInfo](../../../../../functions/src/shared/editor/maps/mapRowInfo.md)
- [selectedRow](../../../../../functions/src/shared/editor/maps/selectedRow.md)
- [hiddenMetadataSelection](../../../../../functions/src/shared/editor/maps/hiddenMetadataSelection.md)
- [mapRows](../../../../../functions/src/shared/editor/maps/mapRows.md)
- [rowAtPath](../../../../../functions/src/shared/editor/maps/rowAtPath.md)
- [resolvedTargets](../../../../../functions/src/shared/editor/reused/resolvedTargets.md)
- [reveal](../../../../../functions/webview/editor/reveal.md)
- [nextProblem](../../../../../functions/webview/editor/nextProblem.md)
- [moveRow](../../../../../functions/webview/editor/mapView/moveRow.md)
- [mapPlugin](../../../../../functions/webview/editor/mapView/mapPlugin.md)
- [dropTarget](../../../../../functions/webview/editor/mapView/dropTarget.md)