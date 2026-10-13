---
type: TypeScript Method
title: updateTitle
resource: src/preview/visualPreviewPanel.ts#L394-L397
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/basename
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/setDocument
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/toggleLock
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private updateTitle(): void`

# Calls

- [basename](../../../../../functions/src/shared/render/toHtml/basename.md)

# Called by

- [setDocument](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/setDocument.md)
- [toggleLock](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/toggleLock.md)