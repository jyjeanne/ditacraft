---
type: TypeScript Function
title: insertable
resource: src/shared/editor/contextMenu.ts#L121-L125
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/commands/DitaCommands/insertableAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/relTables/RelTableCommands/isGridElement
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/contextMenu/insertItems
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/contextMenu/contextMenu
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function insertable(state: EditorState, ctx: MenuContext): string[]`

# Calls

- [insertableAt](../../../../../functions/src/shared/editor/commands/DitaCommands/insertableAt.md)
- [isGridElement](../../../../../functions/src/shared/editor/relTables/RelTableCommands/isGridElement.md)

# Called by

- [insertItems](../../../../../functions/src/shared/editor/contextMenu/insertItems.md)
- [contextMenu](../../../../../functions/src/shared/editor/contextMenu/contextMenu.md)