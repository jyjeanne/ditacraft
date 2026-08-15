---
type: TypeScript Function
title: requestPreviewRefresh
resource: src/commands/previewCommand.ts#L69-L84
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/commands/previewCommand/previewHTML5Command
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/errorUtils/fireAndForget
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/previewCommand/pickPreviewFilterCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/registerPreviewAutoRefresh
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function requestPreviewRefresh(uri: vscode.Uri, preserveFocus: boolean): Promise<void>`

# Calls

- [previewHTML5Command](../../../../functions/src/commands/previewCommand/previewHTML5Command.md)
- [fireAndForget](../../../../functions/src/utils/errorUtils/fireAndForget.md)

# Called by

- [pickPreviewFilterCommand](../../../../functions/src/commands/previewCommand/pickPreviewFilterCommand.md)
- [registerPreviewAutoRefresh](../../../../functions/src/extension/registerPreviewAutoRefresh.md)