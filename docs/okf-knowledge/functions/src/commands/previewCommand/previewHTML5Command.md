---
type: TypeScript Function
title: previewHTML5Command
resource: src/commands/previewCommand.ts#L165-L186
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/commands/previewCommand/previewDitaOtCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/previewCommand/handlePreviewError
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function previewHTML5Command(uri?: vscode.Uri, preserveFocus = false): Promise<void>`

# Calls

- [previewDitaOtCommand](../../../../functions/src/commands/previewCommand/previewDitaOtCommand.md)
- [handlePreviewError](../../../../functions/src/commands/previewCommand/handlePreviewError.md)