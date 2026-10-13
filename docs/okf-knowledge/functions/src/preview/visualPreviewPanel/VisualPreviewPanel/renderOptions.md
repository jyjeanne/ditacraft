---
type: TypeScript Method
title: renderOptions
resource: src/preview/visualPreviewPanel.ts#L542-L555
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/labels/labelsFor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/contentLanguage
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/renderNow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/resolveReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/onMessage
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private renderOptions(r: Rendered): RenderOptions`

# Calls

- [labelsFor](../../../../../functions/src/shared/render/labels/labelsFor.md)
- [contentLanguage](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/contentLanguage.md)

# Called by

- [renderNow](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/renderNow.md)
- [resolveReferences](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/resolveReferences.md)
- [onMessage](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/onMessage.md)