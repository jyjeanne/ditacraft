---
type: TypeScript Method
title: figure
resource: src/shared/editor/images.ts#L152-L161
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/images/ImageCommands/imageNode
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

`private figure(): PMNode | undefined`

# Calls

- [imageNode](../../../../../../functions/src/shared/editor/images/ImageCommands/imageNode.md)

# Called by

- [placements](../../../../../../functions/src/shared/editor/images/ImageCommands/placements.md)
- [insert](../../../../../../functions/src/shared/editor/images/ImageCommands/insert.md)