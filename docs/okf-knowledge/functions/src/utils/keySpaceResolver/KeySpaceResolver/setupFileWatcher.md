---
type: TypeScript Method
title: setupFileWatcher
resource: src/utils/keySpaceResolver.ts#L248-L283
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/logger/Logger/debug
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/queueInvalidation
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/constructor
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private setupFileWatcher(): void`

# Calls

- [debug](../../../../../functions/src/utils/logger/Logger/debug.md)
- [queueInvalidation](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/queueInvalidation.md)

# Called by

- [constructor](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/constructor.md)