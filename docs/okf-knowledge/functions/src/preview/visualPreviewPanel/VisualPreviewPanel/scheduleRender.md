---
type: TypeScript Method
title: scheduleRender
resource: src/preview/visualPreviewPanel.ts#L519-L527
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/renderNow
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/registerListeners
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private scheduleRender(delay: number): void`

# Calls

- [renderNow](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/renderNow.md)

# Called by

- [registerListeners](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/registerListeners.md)