---
type: TypeScript Method
title: insertionPointAt
resource: src/shared/editor/commands.ts#L444-L457
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/commands/DitaCommands/isTextrun
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/commands/DitaCommands/insertionPoint
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/commands/DitaCommands/insertableAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/commands/DitaCommands/insertBlock
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/commands/DitaCommands/insertTable
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/mapCommands/MapCommands/referencePoint
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/relTables/RelTableCommands/insertRelTable
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`insertionPointAt(state: EditorState): { parent: PMNode; index: number; pos: number } | undefined`

# Calls

- [isTextrun](../../../../../../functions/src/shared/editor/commands/DitaCommands/isTextrun.md)
- [insertionPoint](../../../../../../functions/src/shared/editor/commands/DitaCommands/insertionPoint.md)

# Called by

- [insertableAt](../../../../../../functions/src/shared/editor/commands/DitaCommands/insertableAt.md)
- [insertBlock](../../../../../../functions/src/shared/editor/commands/DitaCommands/insertBlock.md)
- [insertTable](../../../../../../functions/src/shared/editor/commands/DitaCommands/insertTable.md)
- [referencePoint](../../../../../../functions/src/shared/editor/mapCommands/MapCommands/referencePoint.md)
- [insertRelTable](../../../../../../functions/src/shared/editor/relTables/RelTableCommands/insertRelTable.md)