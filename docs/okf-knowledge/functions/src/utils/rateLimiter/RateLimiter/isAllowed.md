---
type: TypeScript Method
title: isAllowed
resource: src/utils/rateLimiter.ts#L80-L113
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/debug
    resolved_by: tree-sitter
    confidence: exact
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

# Calls

- [get](../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)
- [debug](../../../../../functions/src/utils/logger/Logger/debug.md)

# Called by

- [validateCommand](../../../../../functions/src/commands/validateCommand/validateCommand.md)
- [tryExecute](../../../../../functions/src/utils/rateLimiter/RateLimiter/tryExecute.md)