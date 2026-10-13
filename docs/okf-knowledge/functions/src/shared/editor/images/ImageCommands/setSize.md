---
type: TypeScript Method
title: setSize
resource: src/shared/editor/images.ts#L242-L260
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/images/ImageCommands/selectedImage
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/openTag/withAttribute
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/imageResize/imageResizing
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`setSize(size: ImageSize): Command`

# Calls

- [selectedImage](../../../../../../functions/src/shared/editor/images/ImageCommands/selectedImage.md)
- [withAttribute](../../../../../../functions/src/shared/cst/openTag/withAttribute.md)

# Called by

- [imageResizing](../../../../../../functions/webview/editor/imageResize/imageResizing.md)