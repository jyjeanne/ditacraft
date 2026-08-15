---
type: TypeScript Function
title: validateViaLsp
resource: src/commands/validateCommand.ts#L135-L198
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/languageClient/getLanguageClient
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/validateCommand/validateCommand
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function validateViaLsp( fileUri: vscode.Uri, cancellationToken: vscode.CancellationToken, ): Promise<ValidateFileResult | null>`

# Calls

- [getLanguageClient](../../../../functions/src/languageClient/getLanguageClient.md)

# Called by

- [validateCommand](../../../../functions/src/commands/validateCommand/validateCommand.md)