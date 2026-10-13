---
type: TypeScript Function
title: renderMapToolbar
resource: webview/editor/main.ts#L949-L971
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/addReference
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/toggleToolbarMenu
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/editable
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/setAllFolds
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/updateUi
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/renderToolbar
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function renderMapToolbar(): void`

# Calls

- [addReference](../../../functions/webview/editor/addReference.md)
- [toggleToolbarMenu](../../../functions/webview/editor/toggleToolbarMenu.md)
- [editable](../../../functions/webview/editor/editable.md)
- [setAllFolds](../../../functions/webview/editor/mapView/setAllFolds.md)
- [updateUi](../../../functions/webview/editor/updateUi.md)

# Called by

- [renderToolbar](../../../functions/webview/editor/renderToolbar.md)