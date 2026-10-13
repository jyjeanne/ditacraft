---
type: TypeScript Function
title: rowItems
resource: src/shared/editor/contextMenu.ts#L272-L289
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/contextMenu/ui
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/mapCommands/MapCommands/canTarget
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/contextMenu/contextMenu
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function rowItems(state: EditorState, ctx: MenuContext): MenuItem[]`

# Calls

- [ui](../../../../../functions/src/shared/editor/contextMenu/ui.md)
- [canTarget](../../../../../functions/src/shared/editor/mapCommands/MapCommands/canTarget.md)

# Called by

- [contextMenu](../../../../../functions/src/shared/editor/contextMenu/contextMenu.md)