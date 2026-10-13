---
type: TypeScript Method
title: inlineContext
resource: src/shared/editor/commands.ts#L552-L564
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/commands/DitaCommands/isTextrun
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/commands/DitaCommands/inlineInsertableAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/images/ImageCommands/inlineOk
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/links/LinkCommands/canInsert
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`inlineContext(state: EditorState): string[] | undefined`

# Calls

- [isTextrun](../../../../../../functions/src/shared/editor/commands/DitaCommands/isTextrun.md)

# Called by

- [inlineInsertableAt](../../../../../../functions/src/shared/editor/commands/DitaCommands/inlineInsertableAt.md)
- [inlineOk](../../../../../../functions/src/shared/editor/images/ImageCommands/inlineOk.md)
- [canInsert](../../../../../../functions/src/shared/editor/links/LinkCommands/canInsert.md)