---
type: TypeScript Function
title: isInvalidKeyName
resource: server/src/features/crossRefValidation.ts#L559-L564
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/server/src/features/crossRefValidation/validateCrossReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/collectInvalidKeyNames
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function isInvalidKeyName(keyName: string): boolean`

# Called by

- [validateCrossReferences](../../../../../functions/server/src/features/crossRefValidation/validateCrossReferences.md)
- [collectInvalidKeyNames](../../../../../functions/server/src/features/crossRefValidation/collectInvalidKeyNames.md)