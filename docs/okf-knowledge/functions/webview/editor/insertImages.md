---
type: TypeScript Function
title: insertImages
resource: webview/editor/main.ts#L1391-L1408
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/images/ImageCommands/insert
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/editable
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/pickAndInsertImage
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/insertImageData
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/dropImages
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function insertImages(placement: ImagePlacement, hrefs: string[], alt?: string): void`

# Calls

- [insert](../../../functions/src/shared/editor/images/ImageCommands/insert.md)
- [editable](../../../functions/webview/editor/editable.md)

# Called by

- [pickAndInsertImage](../../../functions/webview/editor/pickAndInsertImage.md)
- [insertImageData](../../../functions/webview/editor/insertImageData.md)
- [dropImages](../../../functions/webview/editor/dropImages.md)