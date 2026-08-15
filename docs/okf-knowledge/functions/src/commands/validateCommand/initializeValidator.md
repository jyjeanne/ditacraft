---
type: TypeScript Function
title: initializeValidator
resource: src/commands/validateCommand.ts#L49-L77
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/rateLimiter/createRateLimiter
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/extension/activate
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function initializeValidator(context: vscode.ExtensionContext): void`

# Calls

- [createRateLimiter](../../../../functions/src/utils/rateLimiter/createRateLimiter.md)

# Called by

- [activate](../../../../functions/src/extension/activate.md)