---
type: TypeScript Function
title: addReference
resource: webview/editor/main.ts#L1189-L1216
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/editable
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/mapCommands/MapCommands/insertReference
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/noteStatus
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/maps/selectedRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/showRowTitle
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/start
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/renderMapToolbar
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/runMenuItem
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/mapPlugin
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function addReference(): Promise<void>`

# Calls

- [editable](../../../functions/webview/editor/editable.md)
- [insertReference](../../../functions/src/shared/editor/mapCommands/MapCommands/insertReference.md)
- [noteStatus](../../../functions/webview/editor/noteStatus.md)
- [selectedRow](../../../functions/src/shared/editor/maps/selectedRow.md)
- [showRowTitle](../../../functions/webview/editor/showRowTitle.md)

# Called by

- [start](../../../functions/webview/editor/start.md)
- [renderMapToolbar](../../../functions/webview/editor/renderMapToolbar.md)
- [runMenuItem](../../../functions/webview/editor/runMenuItem.md)
- [mapPlugin](../../../functions/webview/editor/mapView/mapPlugin.md)