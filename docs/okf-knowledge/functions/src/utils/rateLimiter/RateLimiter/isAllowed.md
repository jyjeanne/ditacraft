---
type: TypeScript Method
title: isAllowed
resource: src/utils/rateLimiter.ts#L80-L113
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/commands/validateCommand/validateCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/rateLimiter/RateLimiter/tryExecute
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`public isAllowed(key: string): boolean`

# Called by

- [validateCommand](../../../../../functions/src/commands/validateCommand/validateCommand.md)
- [tryExecute](../../../../../functions/src/utils/rateLimiter/RateLimiter/tryExecute.md)