---
type: TypeScript Method
title: place
resource: webview/editor/menu.ts#L185-L193
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/webview/editor/columnResize/columnResizing
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/imageResize/imageResizing
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/menu/ContextMenu/constructor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/menu/ContextMenu/openSub
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private place(menu: HTMLElement, x: number, y: number, altX: number): void`

# Called by

- [columnResizing](../../../../../functions/webview/editor/columnResize/columnResizing.md)
- [imageResizing](../../../../../functions/webview/editor/imageResize/imageResizing.md)
- [constructor](../../../../../functions/webview/editor/menu/ContextMenu/constructor.md)
- [openSub](../../../../../functions/webview/editor/menu/ContextMenu/openSub.md)