---
type: TypeScript Method
title: imageNode
resource: src/shared/editor/images.ts#L106-L110
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/images/ImageCommands/imageSource
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/images/ImageCommands/figure
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/images/ImageCommands/insert
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private imageNode(type: NodeType, spec: ImageSpec, placement: ImagePlacement): PMNode`

# Calls

- [imageSource](../../../../../../functions/src/shared/editor/images/ImageCommands/imageSource.md)

# Called by

- [figure](../../../../../../functions/src/shared/editor/images/ImageCommands/figure.md)
- [insert](../../../../../../functions/src/shared/editor/images/ImageCommands/insert.md)