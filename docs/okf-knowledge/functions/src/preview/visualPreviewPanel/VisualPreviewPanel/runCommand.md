---
type: TypeScript Method
title: runCommand
resource: src/preview/visualPreviewPanel.ts#L815-L851
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/renderNow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/errorUtils/fireAndForget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContexts/MapContexts/pick
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/toggleLock
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/onMessage
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private runCommand(command: ToolbarCommand): void`

# Calls

- [renderNow](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/renderNow.md)
- [fireAndForget](../../../../../functions/src/utils/errorUtils/fireAndForget.md)
- [pick](../../../../../functions/src/preview/mapContexts/MapContexts/pick.md)
- [toggleLock](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/toggleLock.md)

# Called by

- [onMessage](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/onMessage.md)