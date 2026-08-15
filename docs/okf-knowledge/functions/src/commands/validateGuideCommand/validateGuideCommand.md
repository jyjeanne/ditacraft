---
type: TypeScript Function
title: validateGuideCommand
resource: src/commands/validateGuideCommand.ts#L31-L47
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/commands/validateGuideCommand/executeValidation
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/extension/registerCommands
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function validateGuideCommand(context: vscode.ExtensionContext): Promise<void>`

# Calls

- [executeValidation](../../../../functions/src/commands/validateGuideCommand/executeValidation.md)

# Called by

- [registerCommands](../../../../functions/src/extension/registerCommands.md)