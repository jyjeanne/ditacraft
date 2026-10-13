---
type: TypeScript Function
title: selectedRow
resource: src/shared/editor/maps.ts#L247-L250
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/maps/isMapRow
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/mapCommands/MapCommands/setTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/mapCommands/MapCommands/referenceElement
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
  - target: functions/webview/editor/addReference
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/moveRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/mapPlugin
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function selectedRow(state: EditorState, es: EditorSchema): { pos: number; node: PMNode } | undefined`

# Calls

- [isMapRow](../../../../../functions/src/shared/editor/maps/isMapRow.md)

# Called by

- [setTarget](../../../../../functions/src/shared/editor/mapCommands/MapCommands/setTarget.md)
- [referenceElement](../../../../../functions/src/shared/editor/mapCommands/MapCommands/referenceElement.md)
- [runMenuItem](../../../../../functions/webview/editor/runMenuItem.md)
- [rowContext](../../../../../functions/webview/editor/rowContext.md)
- [pickRowTarget](../../../../../functions/webview/editor/pickRowTarget.md)
- [addReference](../../../../../functions/webview/editor/addReference.md)
- [moveRow](../../../../../functions/webview/editor/mapView/moveRow.md)
- [mapPlugin](../../../../../functions/webview/editor/mapView/mapPlugin.md)