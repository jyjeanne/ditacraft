---
type: TypeScript Function
title: pickRowTarget
resource: webview/editor/main.ts#L1162-L1186
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/editable
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/maps/selectedRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/mapCommands/MapCommands/canTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/maps/mapRowTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/noteStatus
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/mapCommands/MapCommands/setTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/showRowTitle
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/start
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/runMenuItem
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function pickRowTarget(): Promise<void>`

# Calls

- [editable](../../../functions/webview/editor/editable.md)
- [selectedRow](../../../functions/src/shared/editor/maps/selectedRow.md)
- [canTarget](../../../functions/src/shared/editor/mapCommands/MapCommands/canTarget.md)
- [mapRowTarget](../../../functions/src/shared/editor/maps/mapRowTarget.md)
- [noteStatus](../../../functions/webview/editor/noteStatus.md)
- [setTarget](../../../functions/src/shared/editor/mapCommands/MapCommands/setTarget.md)
- [showRowTitle](../../../functions/webview/editor/showRowTitle.md)

# Called by

- [start](../../../functions/webview/editor/start.md)
- [runMenuItem](../../../functions/webview/editor/runMenuItem.md)