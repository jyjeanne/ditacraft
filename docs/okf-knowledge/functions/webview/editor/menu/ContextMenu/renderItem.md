---
type: TypeScript Method
title: renderItem
resource: webview/editor/menu.ts#L133-L174
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/menu/ContextMenu/openSub
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/menu/ContextMenu/closeFrom
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/menu/ContextMenu/render
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private renderItem(item: MenuItem, depth: number): HTMLElement`

# Calls

- [openSub](../../../../../functions/webview/editor/menu/ContextMenu/openSub.md)
- [closeFrom](../../../../../functions/webview/editor/menu/ContextMenu/closeFrom.md)

# Called by

- [render](../../../../../functions/webview/editor/menu/ContextMenu/render.md)