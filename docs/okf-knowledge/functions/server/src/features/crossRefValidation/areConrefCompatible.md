---
type: TypeScript Function
title: areConrefCompatible
resource: server/src/features/crossRefValidation.ts#L444-L450
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/server/src/features/crossRefValidation/validateCrossReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/validateConrefCompatibility
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function areConrefCompatible(sourceElement: string, targetElement: string): boolean`

# Called by

- [validateCrossReferences](../../../../../functions/server/src/features/crossRefValidation/validateCrossReferences.md)
- [validateConrefCompatibility](../../../../../functions/server/src/features/crossRefValidation/validateConrefCompatibility.md)