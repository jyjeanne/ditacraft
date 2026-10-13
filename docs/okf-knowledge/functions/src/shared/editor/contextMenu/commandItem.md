---
type: TypeScript Function
title: commandItem
resource: src/shared/editor/contextMenu.ts#L109-L111
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/contextMenu/ui
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/contextMenu/tableItems
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/contextMenu/relTableItems
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/contextMenu/contextMenu
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function commandItem(ctx: MenuContext, state: EditorState, id: string, key: string, command: Command): MenuItem`

# Calls

- [ui](../../../../../functions/src/shared/editor/contextMenu/ui.md)

# Called by

- [tableItems](../../../../../functions/src/shared/editor/contextMenu/tableItems.md)
- [relTableItems](../../../../../functions/src/shared/editor/contextMenu/relTableItems.md)
- [contextMenu](../../../../../functions/src/shared/editor/contextMenu/contextMenu.md)