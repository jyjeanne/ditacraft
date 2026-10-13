---
type: TypeScript Function
title: selectedImg
resource: webview/editor/imageResize.ts#L25-L33
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/images/ImageCommands/selectedImage
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/imageResize/imageResizing
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function selectedImg(view: EditorView, images: ImageCommands): { pos: number; img: HTMLImageElement; xml: [string, string][] } | undefined`

# Calls

- [selectedImage](../../../../functions/src/shared/editor/images/ImageCommands/selectedImage.md)

# Called by

- [imageResizing](../../../../functions/webview/editor/imageResize/imageResizing.md)