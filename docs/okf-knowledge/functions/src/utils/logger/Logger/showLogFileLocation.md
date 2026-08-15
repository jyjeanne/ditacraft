---
type: TypeScript Method
title: showLogFileLocation
resource: src/utils/logger.ts#L234-L258
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/errorUtils/fireAndForget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/openLogFile
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/extension/registerLoggerCommands
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`public showLogFileLocation(): void`

# Calls

- [fireAndForget](../../../../../functions/src/utils/errorUtils/fireAndForget.md)
- [openLogFile](../../../../../functions/src/utils/logger/Logger/openLogFile.md)

# Called by

- [registerLoggerCommands](../../../../../functions/src/extension/registerLoggerCommands.md)