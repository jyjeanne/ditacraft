---
type: TypeScript Function
title: getAndValidateFileUri
resource: src/commands/previewCommand.ts#L208-L232
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/logger/Logger/debug
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/previewCommand/previewHTML5Command
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function getAndValidateFileUri(uri?: vscode.Uri): Promise<vscode.Uri>`

# Calls

- [debug](../../../../functions/src/utils/logger/Logger/debug.md)

# Called by

- [previewHTML5Command](../../../../functions/src/commands/previewCommand/previewHTML5Command.md)