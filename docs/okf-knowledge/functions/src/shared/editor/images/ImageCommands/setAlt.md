---
type: TypeScript Method
title: setAlt
resource: src/shared/editor/images.ts#L282-L304
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/images/ImageCommands/selectedImage
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/images/withAltText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/openTag/withAttribute
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/editAltText
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`setAlt(alt: string, raw: string | undefined): Command`

# Calls

- [selectedImage](../../../../../../functions/src/shared/editor/images/ImageCommands/selectedImage.md)
- [withAltText](../../../../../../functions/src/shared/editor/images/withAltText.md)
- [withAttribute](../../../../../../functions/src/shared/cst/openTag/withAttribute.md)

# Called by

- [editAltText](../../../../../../functions/webview/editor/editAltText.md)