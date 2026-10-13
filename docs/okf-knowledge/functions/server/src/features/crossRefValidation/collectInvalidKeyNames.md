---
type: TypeScript Function
title: collectInvalidKeyNames
resource: server/src/features/crossRefValidation.ts#L571-L582
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/server/src/features/crossRefValidation/isInvalidKeyName
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/crossRefValidation/getInvalidKeyNamesFromMap
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function collectInvalidKeyNames(text: string): string[]`

# Calls

- [isInvalidKeyName](../../../../../functions/server/src/features/crossRefValidation/isInvalidKeyName.md)

# Called by

- [getInvalidKeyNamesFromMap](../../../../../functions/server/src/features/crossRefValidation/getInvalidKeyNamesFromMap.md)