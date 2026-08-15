---
type: TypeScript Function
title: findTargetElementByIdOnly
resource: server/src/features/crossRefValidation.ts#L444-L449
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/utils/textUtils/escapeRegex
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/crossRefValidation/validateCrossReferences
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function findTargetElementByIdOnly(elementId: string, content: string): string | null`

# Calls

- [escapeRegex](../../../../../functions/server/src/utils/textUtils/escapeRegex.md)

# Called by

- [validateCrossReferences](../../../../../functions/server/src/features/crossRefValidation/validateCrossReferences.md)