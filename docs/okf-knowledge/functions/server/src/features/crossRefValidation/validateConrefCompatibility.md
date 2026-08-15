---
type: TypeScript Function
title: validateConrefCompatibility
resource: server/src/features/crossRefValidation.ts#L452-L471
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/features/crossRefValidation/findTargetElementName
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/areConrefCompatible
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/i18n/t
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/crossRefValidation/validateCrossReferences
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function validateConrefCompatibility( sourceElement: string, fragment: string, targetContent: string, range: Range, diagnostics: Diagnostic[] ): void`

# Calls

- [findTargetElementName](../../../../../functions/server/src/features/crossRefValidation/findTargetElementName.md)
- [areConrefCompatible](../../../../../functions/server/src/features/crossRefValidation/areConrefCompatible.md)
- [t](../../../../../functions/server/src/utils/i18n/t.md)

# Called by

- [validateCrossReferences](../../../../../functions/server/src/features/crossRefValidation/validateCrossReferences.md)