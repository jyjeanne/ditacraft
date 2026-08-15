---
type: TypeScript Method
title: invalidateCacheForFile
resource: src/utils/keySpaceResolver.ts#L315-L331
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/test/suite/keySpaceResolver/test/normalize
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/debug
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/queueInvalidation
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private invalidateCacheForFile(changedFile: string): void`

# Calls

- [normalize](../../../../../functions/src/test/suite/keySpaceResolver/test/normalize.md)
- [debug](../../../../../functions/src/utils/logger/Logger/debug.md)

# Called by

- [queueInvalidation](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/queueInvalidation.md)