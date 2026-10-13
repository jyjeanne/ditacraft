---
type: TypeScript Function
title: gridCellFor
resource: src/shared/cst/tableGrid.ts#L106-L108
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/render/toHtml/cell
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function gridCellFor(grid: TableGrid, entry: ElementNode): GridCell | undefined`

# Calls

- [find](../../../../../functions/webview/editor/mapView/RowDrag/find.md)

# Called by

- [cell](../../../../../functions/src/shared/render/toHtml/cell.md)