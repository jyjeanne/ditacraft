---
type: TypeScript Method
title: canInsert
resource: src/shared/editor/links.ts#L82-L85
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/commands/DitaCommands/inlineContext
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/contextMenu/contextMenu
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/links/LinkCommands/setLink
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`canInsert(state: EditorState): boolean`

# Calls

- [inlineContext](../../../../../../functions/src/shared/editor/commands/DitaCommands/inlineContext.md)

# Called by

- [contextMenu](../../../../../../functions/src/shared/editor/contextMenu/contextMenu.md)
- [setLink](../../../../../../functions/src/shared/editor/links/LinkCommands/setLink.md)