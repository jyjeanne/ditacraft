---
type: TypeScript Function
title: getScopeValue
resource: server/src/features/crossRefValidation.ts#L302-L310
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/server/src/features/crossRefValidation/validateCrossReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/isExternalScope
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function getScopeValue(text: string, refOffset: number): string | null`

# Called by

- [validateCrossReferences](../../../../../functions/server/src/features/crossRefValidation/validateCrossReferences.md)
- [isExternalScope](../../../../../functions/server/src/features/crossRefValidation/isExternalScope.md)