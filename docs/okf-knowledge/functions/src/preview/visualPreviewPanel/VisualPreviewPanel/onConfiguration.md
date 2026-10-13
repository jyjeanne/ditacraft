---
type: TypeScript Method
title: onConfiguration
resource: src/preview/visualPreviewPanel.ts#L1018-L1042
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/updateResources
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/renderNow
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/registerListeners
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private onConfiguration(e: vscode.ConfigurationChangeEvent): void`

# Calls

- [updateResources](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/updateResources.md)
- [renderNow](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/renderNow.md)

# Called by

- [registerListeners](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/registerListeners.md)