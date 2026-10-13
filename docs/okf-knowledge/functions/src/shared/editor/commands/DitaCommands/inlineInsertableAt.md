---
type: TypeScript Method
title: inlineInsertableAt
resource: src/shared/editor/commands.ts#L571-L587
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/commands/DitaCommands/inlineContext
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/entries
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/commands/DitaCommands/insertInline
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/contextMenu/contextMenu
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`inlineInsertableAt(state: EditorState): string[]`

# Calls

- [inlineContext](../../../../../../functions/src/shared/editor/commands/DitaCommands/inlineContext.md)
- [entries](../../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/entries.md)

# Called by

- [insertInline](../../../../../../functions/src/shared/editor/commands/DitaCommands/insertInline.md)
- [contextMenu](../../../../../../functions/src/shared/editor/contextMenu/contextMenu.md)