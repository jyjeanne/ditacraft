---
type: TypeScript Method
title: textType
resource: src/shared/editor/commands.ts#L58-L60
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/shared/editor/commands/DitaCommands/insertAfter
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/commands/DitaCommands/wrapInList
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/commands/DitaCommands/blockTypesAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/commands/DitaCommands/setBlockType
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/commands/DitaCommands/insertableAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/commands/DitaCommands/insertBlock
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`textType(element: string): NodeType | undefined`

# Called by

- [insertAfter](../../../../../../functions/src/shared/editor/commands/DitaCommands/insertAfter.md)
- [wrapInList](../../../../../../functions/src/shared/editor/commands/DitaCommands/wrapInList.md)
- [blockTypesAt](../../../../../../functions/src/shared/editor/commands/DitaCommands/blockTypesAt.md)
- [setBlockType](../../../../../../functions/src/shared/editor/commands/DitaCommands/setBlockType.md)
- [insertableAt](../../../../../../functions/src/shared/editor/commands/DitaCommands/insertableAt.md)
- [insertBlock](../../../../../../functions/src/shared/editor/commands/DitaCommands/insertBlock.md)