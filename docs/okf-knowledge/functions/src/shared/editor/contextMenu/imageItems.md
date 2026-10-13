---
type: TypeScript Function
title: imageItems
resource: src/shared/editor/contextMenu.ts#L172-L182
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/images/ImageCommands/placements
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

`function imageItems(state: EditorState, ctx: MenuContext): MenuItem[]`

# Calls

- [placements](../../../../../functions/src/shared/editor/images/ImageCommands/placements.md)
- [ui](../../../../../functions/src/shared/editor/contextMenu/ui.md)

# Called by

- [contextMenu](../../../../../functions/src/shared/editor/contextMenu/contextMenu.md)