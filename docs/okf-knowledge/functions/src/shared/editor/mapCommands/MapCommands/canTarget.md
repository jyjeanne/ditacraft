---
type: TypeScript Method
title: canTarget
resource: src/shared/editor/mapCommands.ts#L204-L210
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/maps/isMapRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/mapCommands/MapCommands/declares
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/contextMenu/rowItems
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/mapCommands/MapCommands/setTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/pickRowTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/mapPlugin
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`canTarget(node: PMNode): boolean`

# Calls

- [isMapRow](../../../../../../functions/src/shared/editor/maps/isMapRow.md)
- [declares](../../../../../../functions/src/shared/editor/mapCommands/MapCommands/declares.md)

# Called by

- [rowItems](../../../../../../functions/src/shared/editor/contextMenu/rowItems.md)
- [setTarget](../../../../../../functions/src/shared/editor/mapCommands/MapCommands/setTarget.md)
- [pickRowTarget](../../../../../../functions/webview/editor/pickRowTarget.md)
- [mapPlugin](../../../../../../functions/webview/editor/mapView/mapPlugin.md)