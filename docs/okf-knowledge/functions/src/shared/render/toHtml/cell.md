---
type: TypeScript Function
title: cell
resource: src/shared/render/toHtml.ts#L1173-L1231
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/tableGrid/gridCellFor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/attrText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/presEnum
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/wrap
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/kids
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/render/toHtml/rows
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function cell( r: Renderer, entry: ElementNode, info: Info, row: ElementNode, isHead: boolean, grid: TableGrid | null, headers: HeaderIds | null, pres: TablePresentation, lastBodyRow: boolean, indexInRow: number, rowheader: boolean, ): string`

# Calls

- [gridCellFor](../../../../../functions/src/shared/cst/tableGrid/gridCellFor.md)
- [attrText](../../../../../functions/src/shared/render/toHtml/Renderer/attrText.md)
- [presEnum](../../../../../functions/src/shared/render/toHtml/presEnum.md)
- [wrap](../../../../../functions/src/shared/render/toHtml/Renderer/wrap.md)
- [kids](../../../../../functions/src/shared/render/toHtml/Renderer/kids.md)

# Called by

- [rows](../../../../../functions/src/shared/render/toHtml/rows.md)