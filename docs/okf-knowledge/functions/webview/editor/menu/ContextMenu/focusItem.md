---
type: TypeScript Method
title: focusItem
resource: webview/editor/menu.ts#L234-L241
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/menu/ContextMenu/itemsOf
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/menu/ContextMenu/constructor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/menu/ContextMenu/openSub
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/menu/ContextMenu/onKey
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private focusItem(menu: HTMLElement, index: number): void`

# Calls

- [itemsOf](../../../../../functions/webview/editor/menu/ContextMenu/itemsOf.md)

# Called by

- [constructor](../../../../../functions/webview/editor/menu/ContextMenu/constructor.md)
- [openSub](../../../../../functions/webview/editor/menu/ContextMenu/openSub.md)
- [onKey](../../../../../functions/webview/editor/menu/ContextMenu/onKey.md)