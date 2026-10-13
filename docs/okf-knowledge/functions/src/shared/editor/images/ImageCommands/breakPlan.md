---
type: TypeScript Method
title: breakPlan
resource: src/shared/editor/images.ts#L141-L150
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/images/ImageCommands/blockTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/images/ImageCommands/inlineOk
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/images/ImageCommands/placements
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/images/ImageCommands/insert
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private breakPlan(state: EditorState): { inline: true } | (BlockTarget & { inline: false }) | undefined`

# Calls

- [blockTarget](../../../../../../functions/src/shared/editor/images/ImageCommands/blockTarget.md)
- [inlineOk](../../../../../../functions/src/shared/editor/images/ImageCommands/inlineOk.md)

# Called by

- [placements](../../../../../../functions/src/shared/editor/images/ImageCommands/placements.md)
- [insert](../../../../../../functions/src/shared/editor/images/ImageCommands/insert.md)