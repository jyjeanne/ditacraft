---
type: TypeScript Method
title: placements
resource: src/shared/editor/images.ts#L164-L176
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/images/ImageCommands/inlineOk
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/images/ImageCommands/breakPlan
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/images/ImageCommands/figure
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/images/ImageCommands/blockTarget
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/contextMenu/imageItems
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/contextMenu/contextMenu
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`placements(state: EditorState): ImagePlacement[]`

# Calls

- [inlineOk](../../../../../../functions/src/shared/editor/images/ImageCommands/inlineOk.md)
- [breakPlan](../../../../../../functions/src/shared/editor/images/ImageCommands/breakPlan.md)
- [figure](../../../../../../functions/src/shared/editor/images/ImageCommands/figure.md)
- [blockTarget](../../../../../../functions/src/shared/editor/images/ImageCommands/blockTarget.md)

# Called by

- [imageItems](../../../../../../functions/src/shared/editor/contextMenu/imageItems.md)
- [contextMenu](../../../../../../functions/src/shared/editor/contextMenu/contextMenu.md)