---
type: TypeScript Method
title: updateResources
resource: src/preview/visualPreviewPanel.ts#L466-L488
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/pageHtml/buildPageHtml
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/constructor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/registerListeners
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/setDocument
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/onConfiguration
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private updateResources(force: boolean): void`

# Calls

- [buildPageHtml](../../../../../functions/src/preview/pageHtml/buildPageHtml.md)

# Called by

- [constructor](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/constructor.md)
- [registerListeners](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/registerListeners.md)
- [setDocument](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/setDocument.md)
- [onConfiguration](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/onConfiguration.md)