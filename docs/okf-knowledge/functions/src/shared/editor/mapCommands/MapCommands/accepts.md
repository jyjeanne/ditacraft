---
type: TypeScript Method
title: accepts
resource: src/shared/editor/mapCommands.ts#L59-L72
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/commands/DitaCommands/allowedIn
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/mapCommands/MapCommands/valid
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/mapCommands/MapCommands/movable
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/mapCommands/MapCommands/referenceElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/mapCommands/MapCommands/newNavtitle
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private accepts(parent: PMNode, index: number, node: PMNode, without?: number): boolean`

# Calls

- [allowedIn](../../../../../../functions/src/shared/editor/commands/DitaCommands/allowedIn.md)
- [valid](../../../../../../functions/src/shared/editor/mapCommands/MapCommands/valid.md)

# Called by

- [movable](../../../../../../functions/src/shared/editor/mapCommands/MapCommands/movable.md)
- [referenceElement](../../../../../../functions/src/shared/editor/mapCommands/MapCommands/referenceElement.md)
- [newNavtitle](../../../../../../functions/src/shared/editor/mapCommands/MapCommands/newNavtitle.md)