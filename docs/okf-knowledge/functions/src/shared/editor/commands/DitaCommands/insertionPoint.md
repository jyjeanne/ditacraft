---
type: TypeScript Method
title: insertionPoint
resource: src/shared/editor/commands.ts#L460-L471
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/commands/DitaCommands/isTextrun
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/commands/DitaCommands/insertionPointAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/images/ImageCommands/blockTarget
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`insertionPoint($pos: ResolvedPos): { parent: PMNode; index: number; pos: number } | undefined`

# Calls

- [isTextrun](../../../../../../functions/src/shared/editor/commands/DitaCommands/isTextrun.md)

# Called by

- [insertionPointAt](../../../../../../functions/src/shared/editor/commands/DitaCommands/insertionPointAt.md)
- [blockTarget](../../../../../../functions/src/shared/editor/images/ImageCommands/blockTarget.md)