---
type: TypeScript Method
title: imageSource
resource: src/shared/editor/images.ts#L93-L104
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/serialize/escapeText
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/images/ImageCommands/imageNode
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`imageSource(spec: ImageSpec, placement: ImagePlacement): { raw: string; xml: AttributePairs }`

# Calls

- [escapeText](../../../../../../functions/src/shared/cst/serialize/escapeText.md)

# Called by

- [imageNode](../../../../../../functions/src/shared/editor/images/ImageCommands/imageNode.md)