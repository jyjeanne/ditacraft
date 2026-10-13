---
type: TypeScript Function
title: dropImages
resource: webview/editor/main.ts#L1485-L1512
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/editable
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/images/droppedUris
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/images/isImagePath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/insertImages
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/start
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function dropImages(v: EditorView, event: DragEvent, moved: boolean): boolean`

# Calls

- [editable](../../../functions/webview/editor/editable.md)
- [droppedUris](../../../functions/src/shared/editor/images/droppedUris.md)
- [isImagePath](../../../functions/src/shared/editor/images/isImagePath.md)
- [startsWith](../../../functions/src/shared/cst/parse/Scanner/startsWith.md)
- [insertImages](../../../functions/webview/editor/insertImages.md)

# Called by

- [start](../../../functions/webview/editor/start.md)