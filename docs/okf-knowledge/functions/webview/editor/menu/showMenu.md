---
type: TypeScript Function
title: showMenu
resource: webview/editor/menu.ts#L42-L46
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/webview/editor/showQuickFixes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/toggleToolbarMenu
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/showContextMenu
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function showMenu(items: MenuItem[], options: MenuOptions): ContextMenu`

# Called by

- [showQuickFixes](../../../../functions/webview/editor/showQuickFixes.md)
- [toggleToolbarMenu](../../../../functions/webview/editor/toggleToolbarMenu.md)
- [showContextMenu](../../../../functions/webview/editor/showContextMenu.md)