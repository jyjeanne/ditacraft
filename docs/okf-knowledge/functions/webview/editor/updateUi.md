---
type: TypeScript Function
title: updateUi
resource: webview/editor/main.ts#L1848-L1889
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
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/markActive
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/currentElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/commands/DitaCommands/blockTypesAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/updateReuseBar
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/updateStatus
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/start
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/rebuild
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/renderToolbar
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/renderMapToolbar
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/scheduleUi
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function updateUi(): void`

# Calls

- [editable](../../../functions/webview/editor/editable.md)
- [insertReference](../../../functions/src/shared/editor/mapCommands/MapCommands/insertReference.md)
- [startsWith](../../../functions/src/shared/cst/parse/Scanner/startsWith.md)
- [markActive](../../../functions/webview/editor/markActive.md)
- [currentElement](../../../functions/webview/editor/currentElement.md)
- [blockTypesAt](../../../functions/src/shared/editor/commands/DitaCommands/blockTypesAt.md)
- [updateReuseBar](../../../functions/webview/editor/updateReuseBar.md)
- [updateStatus](../../../functions/webview/editor/updateStatus.md)

# Called by

- [start](../../../functions/webview/editor/start.md)
- [rebuild](../../../functions/webview/editor/rebuild.md)
- [renderToolbar](../../../functions/webview/editor/renderToolbar.md)
- [renderMapToolbar](../../../functions/webview/editor/renderMapToolbar.md)
- [scheduleUi](../../../functions/webview/editor/scheduleUi.md)