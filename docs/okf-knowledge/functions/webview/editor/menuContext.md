---
type: TypeScript Function
title: menuContext
resource: webview/editor/main.ts#L1019-L1027
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/editable
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/selectedReuse
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/problemHere
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/rowContext
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/toggleToolbarMenu
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/showContextMenu
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/debug
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function menuContext(): MenuContext | undefined`

# Calls

- [editable](../../../functions/webview/editor/editable.md)
- [selectedReuse](../../../functions/webview/editor/selectedReuse.md)
- [problemHere](../../../functions/webview/editor/problemHere.md)
- [rowContext](../../../functions/webview/editor/rowContext.md)

# Called by

- [toggleToolbarMenu](../../../functions/webview/editor/toggleToolbarMenu.md)
- [showContextMenu](../../../functions/webview/editor/showContextMenu.md)
- [debug](../../../functions/webview/editor/debug.md)