---
type: TypeScript Function
title: showQuickFixes
resource: webview/editor/main.ts#L1274-L1297
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/editable
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/listQuickFixes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/labels/format
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/menu/showMenu
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/makeQuickFix
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/plugins
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/runMenuItem
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/updateStatus
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function showQuickFixes(at: MenuOptions['at'], keyboard: boolean): Promise<void>`

# Calls

- [editable](../../../functions/webview/editor/editable.md)
- [listQuickFixes](../../../functions/webview/editor/listQuickFixes.md)
- [format](../../../functions/src/shared/render/labels/format.md)
- [showMenu](../../../functions/webview/editor/menu/showMenu.md)
- [makeQuickFix](../../../functions/webview/editor/makeQuickFix.md)

# Called by

- [plugins](../../../functions/webview/editor/plugins.md)
- [runMenuItem](../../../functions/webview/editor/runMenuItem.md)
- [updateStatus](../../../functions/webview/editor/updateStatus.md)