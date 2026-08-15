---
type: TypeScript Method
title: clearOldLogs
resource: src/utils/logger.ts#L260-L299
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/logger/Logger/info
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/extension/activate
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`public async clearOldLogs(daysToKeep: number = 7): Promise<void>`

# Calls

- [info](../../../../../functions/src/utils/logger/Logger/info.md)

# Called by

- [activate](../../../../../functions/src/extension/activate.md)