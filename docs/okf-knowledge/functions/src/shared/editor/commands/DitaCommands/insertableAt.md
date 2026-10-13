---
type: TypeScript Method
title: insertableAt
resource: src/shared/editor/commands.ts#L416-L438
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/commands/DitaCommands/insertionPointAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/commands/DitaCommands/textType
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/commands/DitaCommands/allowedIn
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/contextMenu/insertable
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`insertableAt(state: EditorState): string[]`

# Calls

- [insertionPointAt](../../../../../../functions/src/shared/editor/commands/DitaCommands/insertionPointAt.md)
- [textType](../../../../../../functions/src/shared/editor/commands/DitaCommands/textType.md)
- [allowedIn](../../../../../../functions/src/shared/editor/commands/DitaCommands/allowedIn.md)

# Called by

- [insertable](../../../../../../functions/src/shared/editor/contextMenu/insertable.md)