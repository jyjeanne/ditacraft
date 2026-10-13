---
type: TypeScript Method
title: inlineOk
resource: src/shared/editor/images.ts#L114-L117
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/commands/DitaCommands/inlineContext
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

`private inlineOk(state: EditorState): boolean`

# Calls

- [inlineContext](../../../../../../functions/src/shared/editor/commands/DitaCommands/inlineContext.md)

# Called by

- [breakPlan](../../../../../../functions/src/shared/editor/images/ImageCommands/breakPlan.md)
- [placements](../../../../../../functions/src/shared/editor/images/ImageCommands/placements.md)
- [insert](../../../../../../functions/src/shared/editor/images/ImageCommands/insert.md)