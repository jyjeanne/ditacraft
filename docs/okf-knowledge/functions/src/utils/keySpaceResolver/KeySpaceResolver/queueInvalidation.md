---
type: TypeScript Method
title: queueInvalidation
resource: src/utils/keySpaceResolver.ts#L289-L310
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/logger/Logger/debug
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/invalidateCacheForFile
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/setupFileWatcher
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private queueInvalidation(filePath: string): void`

# Calls

- [debug](../../../../../functions/src/utils/logger/Logger/debug.md)
- [invalidateCacheForFile](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/invalidateCacheForFile.md)

# Called by

- [setupFileWatcher](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/setupFileWatcher.md)