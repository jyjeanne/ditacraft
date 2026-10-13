---
type: TypeScript Function
title: resizedColumnWidths
resource: src/shared/editor/columnWidths.ts#L138-L181
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/columnWidths/columnPixels
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/columnWidths/percentages
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/columnWidths/num
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/columnResize/columnResizing
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function resizedColumnWidths(raws: (string | undefined)[], left: number, delta: number, tableWidth: number, minPx = 24): (string | undefined)[] | undefined`

# Calls

- [columnPixels](../../../../../functions/src/shared/editor/columnWidths/columnPixels.md)
- [percentages](../../../../../functions/src/shared/editor/columnWidths/percentages.md)
- [num](../../../../../functions/src/shared/editor/columnWidths/num.md)

# Called by

- [columnResizing](../../../../../functions/webview/editor/columnResize/columnResizing.md)