---
type: TypeScript Function
title: toggleToolbarMenu
resource: webview/editor/main.ts#L1515-L1528
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/menu/openMenu
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/menu/closeMenu
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/menuContext
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/menu/showMenu
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/renderToolbar
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/renderMapToolbar
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function toggleToolbarMenu(anchor: string, items: (state: EditorState, ctx: MenuContext) => MenuItem[]): void`

# Calls

- [openMenu](../../../functions/webview/editor/menu/openMenu.md)
- [closeMenu](../../../functions/webview/editor/menu/closeMenu.md)
- [menuContext](../../../functions/webview/editor/menuContext.md)
- [showMenu](../../../functions/webview/editor/menu/showMenu.md)

# Called by

- [renderToolbar](../../../functions/webview/editor/renderToolbar.md)
- [renderMapToolbar](../../../functions/webview/editor/renderMapToolbar.md)