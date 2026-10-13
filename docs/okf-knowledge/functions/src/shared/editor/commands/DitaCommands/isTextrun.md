---
type: TypeScript Method
title: isTextrun
resource: src/shared/editor/commands.ts#L48-L50
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/shared/editor/commands/DitaCommands/wrapInList
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/commands/DitaCommands/blockTypesAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/commands/DitaCommands/setBlockType
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/commands/DitaCommands/insertionPointAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/commands/DitaCommands/insertionPoint
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/commands/DitaCommands/inlineContext
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/commands/DitaCommands/normalize
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/images/ImageCommands/blockTarget
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`isTextrun(node: PMNode): boolean`

# Called by

- [wrapInList](../../../../../../functions/src/shared/editor/commands/DitaCommands/wrapInList.md)
- [blockTypesAt](../../../../../../functions/src/shared/editor/commands/DitaCommands/blockTypesAt.md)
- [setBlockType](../../../../../../functions/src/shared/editor/commands/DitaCommands/setBlockType.md)
- [insertionPointAt](../../../../../../functions/src/shared/editor/commands/DitaCommands/insertionPointAt.md)
- [insertionPoint](../../../../../../functions/src/shared/editor/commands/DitaCommands/insertionPoint.md)
- [inlineContext](../../../../../../functions/src/shared/editor/commands/DitaCommands/inlineContext.md)
- [normalize](../../../../../../functions/src/shared/editor/commands/DitaCommands/normalize.md)
- [blockTarget](../../../../../../functions/src/shared/editor/images/ImageCommands/blockTarget.md)