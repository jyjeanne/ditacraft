---
type: TypeScript Method
title: log
resource: src/utils/logger.ts#L165-L183
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/logger/Logger/formatMessage
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/warn
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/writeToFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/writeToConsole
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private log(level: LogLevel, message: string, data?: unknown): void`

# Calls

- [formatMessage](../../../../../functions/src/utils/logger/Logger/formatMessage.md)
- [warn](../../../../../functions/src/utils/logger/Logger/warn.md)
- [writeToFile](../../../../../functions/src/utils/logger/Logger/writeToFile.md)
- [writeToConsole](../../../../../functions/src/utils/logger/Logger/writeToConsole.md)