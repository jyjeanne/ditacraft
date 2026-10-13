---
type: TypeScript Method
title: onKey
resource: webview/editor/menu.ts#L243-L301
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/menu/ContextMenu/itemsOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/menu/ContextMenu/focusItem
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/scripts/screenshots/click
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/menu/ContextMenu/closeFrom
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/menu/ContextMenu/typeAhead
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/menu/ContextMenu/render
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private onKey(e: KeyboardEvent, depth: number): void`

# Calls

- [itemsOf](../../../../../functions/webview/editor/menu/ContextMenu/itemsOf.md)
- [focusItem](../../../../../functions/webview/editor/menu/ContextMenu/focusItem.md)
- [click](../../../../../functions/scripts/screenshots/click.md)
- [closeFrom](../../../../../functions/webview/editor/menu/ContextMenu/closeFrom.md)
- [typeAhead](../../../../../functions/webview/editor/menu/ContextMenu/typeAhead.md)

# Called by

- [render](../../../../../functions/webview/editor/menu/ContextMenu/render.md)