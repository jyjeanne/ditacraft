---
type: TypeScript Function
title: validateAndPrepareForPublish
resource: src/commands/publishCommand.ts#L26-L68
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/ditaOtWrapper/DitaOtWrapper/verifyInstallation
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtWrapper/DitaOtWrapper/configureOtPath
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/publishCommand/publishCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/publishCommand/publishHTML5Command
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function validateAndPrepareForPublish(uri?: vscode.Uri): Promise<{ ditaOt: DitaOtWrapper; filePath: string } | null>`

# Calls

- [verifyInstallation](../../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/verifyInstallation.md)
- [configureOtPath](../../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/configureOtPath.md)

# Called by

- [publishCommand](../../../../functions/src/commands/publishCommand/publishCommand.md)
- [publishHTML5Command](../../../../functions/src/commands/publishCommand/publishHTML5Command.md)