---
type: TypeScript Method
title: openLogFile
resource: src/utils/logger.ts#L213-L232
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/errorUtils/fireAndForget
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/publishCommand/executePublish
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/registerLoggerCommands
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/showLogFileLocation
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`public openLogFile(): void`

# Calls

- [fireAndForget](../../../../../functions/src/utils/errorUtils/fireAndForget.md)

# Called by

- [executePublish](../../../../../functions/src/commands/publishCommand/executePublish.md)
- [registerLoggerCommands](../../../../../functions/src/extension/registerLoggerCommands.md)
- [showLogFileLocation](../../../../../functions/src/utils/logger/Logger/showLogFileLocation.md)