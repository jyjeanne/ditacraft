---
type: TypeScript Function
title: showContextMenu
resource: webview/editor/main.ts#L1544-L1554
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/menuContext
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/menu/showMenu
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/contextMenu/contextMenu
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function showContextMenu(at: { x: number; y: number }, keyboard: boolean): void`

# Calls

- [menuContext](../../../functions/webview/editor/menuContext.md)
- [showMenu](../../../functions/webview/editor/menu/showMenu.md)
- [contextMenu](../../../functions/src/shared/editor/contextMenu/contextMenu.md)