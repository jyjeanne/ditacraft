---
type: TypeScript Method
title: selectedImage
resource: src/shared/editor/images.ts#L232-L239
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/shared/editor/contextMenu/contextMenu
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/images/ImageCommands/setSize
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/images/ImageCommands/setHref
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/images/ImageCommands/setAlt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/imageResize/selectedImg
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/imageResize/imageResizing
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/replaceImage
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/editAltText
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`selectedImage(state: EditorState): { node: PMNode; pos: number } | undefined`

# Called by

- [contextMenu](../../../../../../functions/src/shared/editor/contextMenu/contextMenu.md)
- [setSize](../../../../../../functions/src/shared/editor/images/ImageCommands/setSize.md)
- [setHref](../../../../../../functions/src/shared/editor/images/ImageCommands/setHref.md)
- [setAlt](../../../../../../functions/src/shared/editor/images/ImageCommands/setAlt.md)
- [selectedImg](../../../../../../functions/webview/editor/imageResize/selectedImg.md)
- [imageResizing](../../../../../../functions/webview/editor/imageResize/imageResizing.md)
- [replaceImage](../../../../../../functions/webview/editor/replaceImage.md)
- [editAltText](../../../../../../functions/webview/editor/editAltText.md)