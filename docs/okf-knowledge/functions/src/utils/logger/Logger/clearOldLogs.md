---
type: TypeScript Method
title: clearOldLogs
resource: src/utils/logger.ts#L260-L299
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/parse/Scanner/startsWith
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

- [startsWith](../../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)

# Called by

- [activate](../../../../../functions/src/extension/activate.md)