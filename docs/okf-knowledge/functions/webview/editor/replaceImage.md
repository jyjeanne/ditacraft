---
type: TypeScript Function
title: replaceImage
resource: webview/editor/main.ts#L1421-L1432
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/images/ImageCommands/selectedImage
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editor/test/nodeAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/images/ImageCommands/setHref
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/runMenuItem
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function replaceImage(): Promise<void>`

# Calls

- [selectedImage](../../../functions/src/shared/editor/images/ImageCommands/selectedImage.md)
- [find](../../../functions/webview/editor/mapView/RowDrag/find.md)
- [nodeAt](../../../functions/src/test/shared/editor/test/nodeAt.md)
- [setHref](../../../functions/src/shared/editor/images/ImageCommands/setHref.md)

# Called by

- [runMenuItem](../../../functions/webview/editor/runMenuItem.md)