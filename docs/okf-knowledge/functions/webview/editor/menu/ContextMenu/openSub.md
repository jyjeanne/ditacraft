---
type: TypeScript Method
title: openSub
resource: webview/editor/menu.ts#L197-L218
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/menu/ContextMenu/focusItem
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/menu/ContextMenu/closeFrom
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/menu/ContextMenu/place
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/menu/ContextMenu/renderItem
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private openSub(owner: HTMLButtonElement, items: MenuItem[], depth: number, focusFirst: boolean): void`

# Calls

- [focusItem](../../../../../functions/webview/editor/menu/ContextMenu/focusItem.md)
- [closeFrom](../../../../../functions/webview/editor/menu/ContextMenu/closeFrom.md)
- [place](../../../../../functions/webview/editor/menu/ContextMenu/place.md)

# Called by

- [renderItem](../../../../../functions/webview/editor/menu/ContextMenu/renderItem.md)