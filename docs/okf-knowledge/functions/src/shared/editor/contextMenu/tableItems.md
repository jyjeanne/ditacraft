---
type: TypeScript Function
title: tableItems
resource: src/shared/editor/contextMenu.ts#L128-L147
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/contextMenu/commandItem
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/commands/DitaCommands/insertTable
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

`function tableItems(state: EditorState, ctx: MenuContext): MenuItem[]`

# Calls

- [commandItem](../../../../../functions/src/shared/editor/contextMenu/commandItem.md)
- [insertTable](../../../../../functions/src/shared/editor/commands/DitaCommands/insertTable.md)
- [ui](../../../../../functions/src/shared/editor/contextMenu/ui.md)

# Called by

- [contextMenu](../../../../../functions/src/shared/editor/contextMenu/contextMenu.md)