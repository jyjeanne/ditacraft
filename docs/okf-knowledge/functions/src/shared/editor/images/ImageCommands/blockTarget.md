---
type: TypeScript Method
title: blockTarget
resource: src/shared/editor/images.ts#L120-L138
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/commands/DitaCommands/isTextrun
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/commands/DitaCommands/allowedIn
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/commands/DitaCommands/insertionPoint
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/images/ImageCommands/breakPlan
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/images/ImageCommands/placements
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/images/ImageCommands/insert
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private blockTarget(state: EditorState, element: string): BlockTarget | undefined`

# Calls

- [isTextrun](../../../../../../functions/src/shared/editor/commands/DitaCommands/isTextrun.md)
- [allowedIn](../../../../../../functions/src/shared/editor/commands/DitaCommands/allowedIn.md)
- [insertionPoint](../../../../../../functions/src/shared/editor/commands/DitaCommands/insertionPoint.md)

# Called by

- [breakPlan](../../../../../../functions/src/shared/editor/images/ImageCommands/breakPlan.md)
- [placements](../../../../../../functions/src/shared/editor/images/ImageCommands/placements.md)
- [insert](../../../../../../functions/src/shared/editor/images/ImageCommands/insert.md)