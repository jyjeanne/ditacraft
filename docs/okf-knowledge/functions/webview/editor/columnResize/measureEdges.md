---
type: TypeScript Function
title: measureEdges
resource: webview/editor/columnResize.ts#L67-L85
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/columnWidths/columnPixels
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/columnResize/columnResizing
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function measureEdges(table: HTMLElement, raws: (string | undefined)[]): number[]`

# Calls

- [columnPixels](../../../../functions/src/shared/editor/columnWidths/columnPixels.md)

# Called by

- [columnResizing](../../../../functions/webview/editor/columnResize/columnResizing.md)