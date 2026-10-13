---
type: TypeScript Method
title: postInfoBanner
resource: src/preview/visualPreviewPanel.ts#L626-L640
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/contextExclusion
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/labels/format
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/renderNow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/onMessage
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private postInfoBanner(r: Rendered, undeclared: string[]): void`

# Calls

- [contextExclusion](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/contextExclusion.md)
- [format](../../../../../functions/src/shared/render/labels/format.md)

# Called by

- [renderNow](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/renderNow.md)
- [onMessage](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/onMessage.md)