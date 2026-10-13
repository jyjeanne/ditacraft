---
type: TypeScript Function
title: ui
resource: src/shared/editor/contextMenu.ts#L105-L107
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/shared/editor/contextMenu/commandItem
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/contextMenu/tableItems
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/contextMenu/relTableItems
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/contextMenu/imageItems
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/contextMenu/contextMenu
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/contextMenu/rowItems
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/maps/mapRowDom
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function ui(ctx: MenuContext, key: string): string`

# Called by

- [commandItem](../../../../../functions/src/shared/editor/contextMenu/commandItem.md)
- [tableItems](../../../../../functions/src/shared/editor/contextMenu/tableItems.md)
- [relTableItems](../../../../../functions/src/shared/editor/contextMenu/relTableItems.md)
- [imageItems](../../../../../functions/src/shared/editor/contextMenu/imageItems.md)
- [contextMenu](../../../../../functions/src/shared/editor/contextMenu/contextMenu.md)
- [rowItems](../../../../../functions/src/shared/editor/contextMenu/rowItems.md)
- [mapRowDom](../../../../../functions/src/shared/editor/maps/mapRowDom.md)