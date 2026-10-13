---
type: TypeScript Function
title: appendNestedNavigationMapLoadError
resource: server/src/features/crossRefValidation.ts#L730-L746
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/server/src/utils/textUtils/offsetToRange
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/crossRefValidation/validateCrossReferences
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function appendNestedNavigationMapLoadError( cleanText: string, text: string, diagnostics: Diagnostic[], maxProblems: number ): void`

# Calls

- [offsetToRange](../../../../../functions/server/src/utils/textUtils/offsetToRange.md)

# Called by

- [validateCrossReferences](../../../../../functions/server/src/features/crossRefValidation/validateCrossReferences.md)