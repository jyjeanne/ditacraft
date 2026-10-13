---
type: TypeScript Function
title: tableNode
resource: webview/editor/columnResize.ts#L47-L64
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/columnResize/isTable
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/columnResize/columnResizing
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function tableNode(view: EditorView, es: EditorSchema, el: HTMLElement): number | undefined`

# Calls

- [isTable](../../../../functions/webview/editor/columnResize/isTable.md)

# Called by

- [columnResizing](../../../../functions/webview/editor/columnResize/columnResizing.md)