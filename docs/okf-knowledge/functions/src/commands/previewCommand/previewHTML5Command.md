---
type: TypeScript Function
title: previewHTML5Command
resource: src/commands/previewCommand.ts#L145-L169
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/commands/previewCommand/getAndValidateFileUri
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/previewCommand/validateFilePath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/previewCommand/initializeAndValidateDitaOt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/previewCommand/generateHtml5OutputIfNeeded
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/previewCommand/displayPreview
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/previewCommand/handlePreviewError
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/previewCommand/requestPreviewRefresh
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function previewHTML5Command(uri?: vscode.Uri, preserveFocus = false): Promise<void>`

# Calls

- [getAndValidateFileUri](../../../../functions/src/commands/previewCommand/getAndValidateFileUri.md)
- [validateFilePath](../../../../functions/src/commands/previewCommand/validateFilePath.md)
- [initializeAndValidateDitaOt](../../../../functions/src/commands/previewCommand/initializeAndValidateDitaOt.md)
- [generateHtml5OutputIfNeeded](../../../../functions/src/commands/previewCommand/generateHtml5OutputIfNeeded.md)
- [displayPreview](../../../../functions/src/commands/previewCommand/displayPreview.md)
- [handlePreviewError](../../../../functions/src/commands/previewCommand/handlePreviewError.md)

# Called by

- [requestPreviewRefresh](../../../../functions/src/commands/previewCommand/requestPreviewRefresh.md)