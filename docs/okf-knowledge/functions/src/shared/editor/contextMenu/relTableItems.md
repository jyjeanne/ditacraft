---
type: TypeScript Function
title: relTableItems
resource: src/shared/editor/contextMenu.ts#L150-L169
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/contextMenu/commandItem
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/relTables/RelTableCommands/insertRelTable
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/contextMenu/ui
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/contextMenu/contextMenu
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function relTableItems(state: EditorState, ctx: MenuContext): MenuItem[]`

# Calls

- [commandItem](../../../../../functions/src/shared/editor/contextMenu/commandItem.md)
- [insertRelTable](../../../../../functions/src/shared/editor/relTables/RelTableCommands/insertRelTable.md)
- [ui](../../../../../functions/src/shared/editor/contextMenu/ui.md)

# Called by

- [contextMenu](../../../../../functions/src/shared/editor/contextMenu/contextMenu.md)