---
type: TypeScript Function
title: pickAndInsertImage
resource: webview/editor/main.ts#L1410-L1419
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/editable
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/labels/format
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/insertImages
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/runMenuItem
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function pickAndInsertImage(placement: ImagePlacement): Promise<void>`

# Calls

- [editable](../../../functions/webview/editor/editable.md)
- [format](../../../functions/src/shared/render/labels/format.md)
- [insertImages](../../../functions/webview/editor/insertImages.md)

# Called by

- [runMenuItem](../../../functions/webview/editor/runMenuItem.md)