---
type: TypeScript Function
title: validateCommand
resource: src/commands/validateCommand.ts#L83-L129
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/rateLimiter/RateLimiter/isAllowed
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/validateCommand/validateViaLsp
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/validateCommand/showValidationSummary
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/extension/registerCommands
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function validateCommand(uri?: vscode.Uri): Promise<void>`

# Calls

- [isAllowed](../../../../functions/src/utils/rateLimiter/RateLimiter/isAllowed.md)
- [validateViaLsp](../../../../functions/src/commands/validateCommand/validateViaLsp.md)
- [showValidationSummary](../../../../functions/src/commands/validateCommand/showValidationSummary.md)

# Called by

- [registerCommands](../../../../functions/src/extension/registerCommands.md)