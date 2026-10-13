---
type: TypeScript Method
title: setHref
resource: src/shared/editor/images.ts#L263-L276
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
  - target: functions/webview/editor/replaceImage
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`setHref(href: string): Command`

# Calls

- [selectedImage](../../../../../../functions/src/shared/editor/images/ImageCommands/selectedImage.md)
- [withAttribute](../../../../../../functions/src/shared/cst/openTag/withAttribute.md)

# Called by

- [replaceImage](../../../../../../functions/webview/editor/replaceImage.md)