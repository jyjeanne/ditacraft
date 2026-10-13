---
type: TypeScript Function
title: appendCopyToCollisionError
resource: server/src/features/crossRefValidation.ts#L697-L723
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/server/src/features/crossRefValidation/normalizeCopyToName
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/offsetToRange
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/crossRefValidation/validateCrossReferences
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function appendCopyToCollisionError( cleanText: string, text: string, diagnostics: Diagnostic[], maxProblems: number ): void`

# Calls

- [normalizeCopyToName](../../../../../functions/server/src/features/crossRefValidation/normalizeCopyToName.md)
- [offsetToRange](../../../../../functions/server/src/utils/textUtils/offsetToRange.md)

# Called by

- [validateCrossReferences](../../../../../functions/server/src/features/crossRefValidation/validateCrossReferences.md)