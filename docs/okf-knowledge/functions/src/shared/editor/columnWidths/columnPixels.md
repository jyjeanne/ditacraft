---
type: TypeScript Function
title: columnPixels
resource: src/shared/editor/columnWidths.ts#L77-L82
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/shared/editor/columnWidths/resizedColumnWidths
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/columnResize/measureEdges
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function columnPixels(widths: ColumnWidth[], tableWidth: number): number[]`

# Called by

- [resizedColumnWidths](../../../../../functions/src/shared/editor/columnWidths/resizedColumnWidths.md)
- [measureEdges](../../../../../functions/webview/editor/columnResize/measureEdges.md)