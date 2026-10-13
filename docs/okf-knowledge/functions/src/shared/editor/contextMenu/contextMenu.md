---
type: TypeScript Function
title: contextMenu
resource: src/shared/editor/contextMenu.ts#L185-L269
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/contextMenu/ui
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/contextMenu/rowItems
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/mapCommands/MapCommands/insertReference
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/contextMenu/insertable
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/contextMenu/insertItems
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/commands/DitaCommands/inlineInsertableAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/contextMenu/elementItems
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/commands/DitaCommands/insertInline
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/images/ImageCommands/placements
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/contextMenu/imageItems
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/links/LinkCommands/linkAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/links/LinkCommands/canInsert
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/links/LinkCommands/setLink
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/contextMenu/commandItem
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/commands/DitaCommands/blockTypesAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/commands/DitaCommands/setBlockType
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/relTables/RelTableCommands/inRelTable
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/contextMenu/relTableItems
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/inTable
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/contextMenu/tableItems
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/images/ImageCommands/selectedImage
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/relTables/RelTableCommands/isGridPart
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/commands/DitaCommands/moveElement
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/showContextMenu
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/debug
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function contextMenu(state: EditorState, ctx: MenuContext): MenuItem[]`

# Calls

- [ui](../../../../../functions/src/shared/editor/contextMenu/ui.md)
- [rowItems](../../../../../functions/src/shared/editor/contextMenu/rowItems.md)
- [insertReference](../../../../../functions/src/shared/editor/mapCommands/MapCommands/insertReference.md)
- [insertable](../../../../../functions/src/shared/editor/contextMenu/insertable.md)
- [insertItems](../../../../../functions/src/shared/editor/contextMenu/insertItems.md)
- [inlineInsertableAt](../../../../../functions/src/shared/editor/commands/DitaCommands/inlineInsertableAt.md)
- [elementItems](../../../../../functions/src/shared/editor/contextMenu/elementItems.md)
- [insertInline](../../../../../functions/src/shared/editor/commands/DitaCommands/insertInline.md)
- [placements](../../../../../functions/src/shared/editor/images/ImageCommands/placements.md)
- [imageItems](../../../../../functions/src/shared/editor/contextMenu/imageItems.md)
- [linkAt](../../../../../functions/src/shared/editor/links/LinkCommands/linkAt.md)
- [canInsert](../../../../../functions/src/shared/editor/links/LinkCommands/canInsert.md)
- [setLink](../../../../../functions/src/shared/editor/links/LinkCommands/setLink.md)
- [commandItem](../../../../../functions/src/shared/editor/contextMenu/commandItem.md)
- [blockTypesAt](../../../../../functions/src/shared/editor/commands/DitaCommands/blockTypesAt.md)
- [setBlockType](../../../../../functions/src/shared/editor/commands/DitaCommands/setBlockType.md)
- [inRelTable](../../../../../functions/src/shared/editor/relTables/RelTableCommands/inRelTable.md)
- [relTableItems](../../../../../functions/src/shared/editor/contextMenu/relTableItems.md)
- [inTable](../../../../../functions/src/shared/editor/tables/TableCommands/inTable.md)
- [tableItems](../../../../../functions/src/shared/editor/contextMenu/tableItems.md)
- [selectedImage](../../../../../functions/src/shared/editor/images/ImageCommands/selectedImage.md)
- [isGridPart](../../../../../functions/src/shared/editor/relTables/RelTableCommands/isGridPart.md)
- [moveElement](../../../../../functions/src/shared/editor/commands/DitaCommands/moveElement.md)

# Called by

- [showContextMenu](../../../../../functions/webview/editor/showContextMenu.md)
- [debug](../../../../../functions/webview/editor/debug.md)