---
type: TypeScript Method
title: queueInvalidation
resource: src/utils/keySpaceResolver.ts#L305-L326
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
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

- [invalidateCacheForFile](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/invalidateCacheForFile.md)

# Called by

- [setupFileWatcher](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/setupFileWatcher.md)