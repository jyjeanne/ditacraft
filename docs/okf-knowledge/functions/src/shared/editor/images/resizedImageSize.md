---
type: TypeScript Function
title: resizedImageSize
resource: src/shared/editor/images.ts#L320-L338
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/columnWidths/parseLength
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/columnWidths/formatLength
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/imageResize/imageResizing
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function resizedImageSize(attrs: { width?: string; height?: string; scale?: string }, shown: { width: number; height: number }, width: number): ImageSize`

# Calls

- [parseLength](../../../../../functions/src/shared/editor/columnWidths/parseLength.md)
- [formatLength](../../../../../functions/src/shared/editor/columnWidths/formatLength.md)

# Called by

- [imageResizing](../../../../../functions/webview/editor/imageResize/imageResizing.md)