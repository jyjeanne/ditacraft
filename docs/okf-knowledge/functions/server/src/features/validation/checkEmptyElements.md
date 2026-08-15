---
type: TypeScript Function
title: checkEmptyElements
resource: server/src/features/validation.ts#L606-L632
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/utils/i18n/t
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/validation/validateDITAStructure
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function checkEmptyElements(text: string, diagnostics: Diagnostic[]): void`

# Calls

- [t](../../../../../functions/server/src/utils/i18n/t.md)

# Called by

- [validateDITAStructure](../../../../../functions/server/src/features/validation/validateDITAStructure.md)