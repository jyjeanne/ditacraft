---
type: TypeScript Function
title: shouldAutoRefreshPreview
resource: src/commands/previewCommand.ts#L180-L189
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/commands/previewCommand/pathsEqual
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/extension/registerPreviewAutoRefresh
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function shouldAutoRefreshPreview( savedFilePath: string, autoRefreshEnabled: boolean, previewedSourceFile: string | undefined ): boolean`

# Calls

- [pathsEqual](../../../../functions/src/commands/previewCommand/pathsEqual.md)

# Called by

- [registerPreviewAutoRefresh](../../../../functions/src/extension/registerPreviewAutoRefresh.md)