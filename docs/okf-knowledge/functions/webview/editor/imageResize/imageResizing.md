---
type: TypeScript Function
title: imageResizing
resource: webview/editor/imageResize.ts#L35-L149
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/editable
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/imageResize/selectedImg
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/images/ImageCommands/selectedImage
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/images/resizedImageSize
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/images/ImageCommands/setSize
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/menu/ContextMenu/place
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/RowDrag/end
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/plugins
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function imageResizing(ctx: () => ImageResizeContext | undefined): Plugin`

# Calls

- [editable](../../../../functions/webview/editor/editable.md)
- [selectedImg](../../../../functions/webview/editor/imageResize/selectedImg.md)
- [selectedImage](../../../../functions/src/shared/editor/images/ImageCommands/selectedImage.md)
- [find](../../../../functions/webview/editor/mapView/RowDrag/find.md)
- [resizedImageSize](../../../../functions/src/shared/editor/images/resizedImageSize.md)
- [setSize](../../../../functions/src/shared/editor/images/ImageCommands/setSize.md)
- [place](../../../../functions/webview/editor/menu/ContextMenu/place.md)
- [end](../../../../functions/webview/editor/mapView/RowDrag/end.md)

# Called by

- [plugins](../../../../functions/webview/editor/plugins.md)