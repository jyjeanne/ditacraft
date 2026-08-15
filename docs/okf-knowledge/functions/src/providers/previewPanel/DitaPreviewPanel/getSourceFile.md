---
type: TypeScript Method
title: getSourceFile
resource: src/providers/previewPanel.ts#L204-L206
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/src/commands/previewCommand/pickPreviewFilterCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/registerPreviewAutoRefresh
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`public getSourceFile(): string | undefined`

# Called by

- [pickPreviewFilterCommand](../../../../../functions/src/commands/previewCommand/pickPreviewFilterCommand.md)
- [registerPreviewAutoRefresh](../../../../../functions/src/extension/registerPreviewAutoRefresh.md)