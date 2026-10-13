---
type: TypeScript Method
title: referencePoint
resource: src/shared/editor/mapCommands.ts#L237-L243
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/commands/DitaCommands/insertionPointAt
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/mapCommands/MapCommands/referenceElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/mapCommands/MapCommands/insertReference
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`referencePoint(state: EditorState): { parent: PMNode; index: number; pos: number } | undefined`

# Calls

- [insertionPointAt](../../../../../../functions/src/shared/editor/commands/DitaCommands/insertionPointAt.md)

# Called by

- [referenceElement](../../../../../../functions/src/shared/editor/mapCommands/MapCommands/referenceElement.md)
- [insertReference](../../../../../../functions/src/shared/editor/mapCommands/MapCommands/insertReference.md)