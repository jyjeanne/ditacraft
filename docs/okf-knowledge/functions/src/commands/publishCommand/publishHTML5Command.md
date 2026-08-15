---
type: TypeScript Function
title: publishHTML5Command
resource: src/commands/publishCommand.ts#L168-L184
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/commands/publishCommand/validateAndPrepareForPublish
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/publishCommand/executePublish
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function publishHTML5Command(uri?: vscode.Uri): Promise<void>`

# Calls

- [validateAndPrepareForPublish](../../../../functions/src/commands/publishCommand/validateAndPrepareForPublish.md)
- [executePublish](../../../../functions/src/commands/publishCommand/executePublish.md)