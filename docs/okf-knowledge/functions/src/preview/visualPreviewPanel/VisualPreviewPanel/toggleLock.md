---
type: TypeScript Method
title: toggleLock
resource: src/preview/visualPreviewPanel.ts#L861-L871
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/updateTitle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/isPreviewableTopic
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/setDocument
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/extension/registerCommands
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/runCommand
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`public toggleLock(): void`

# Calls

- [updateTitle](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/updateTitle.md)
- [isPreviewableTopic](../../../../../functions/src/preview/visualPreviewPanel/isPreviewableTopic.md)
- [setDocument](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/setDocument.md)

# Called by

- [registerCommands](../../../../../functions/src/extension/registerCommands.md)
- [runCommand](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/runCommand.md)