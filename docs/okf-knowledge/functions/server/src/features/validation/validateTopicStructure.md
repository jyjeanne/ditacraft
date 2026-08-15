---
type: TypeScript Function
title: validateTopicStructure
resource: server/src/features/validation.ts#L301-L378
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/features/validation/createRange
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/i18n/t
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/offsetToRange
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/validation/validateDITAStructure
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function validateTopicStructure( text: string, diagnostics: Diagnostic[] ): void`

# Calls

- [createRange](../../../../../functions/server/src/features/validation/createRange.md)
- [t](../../../../../functions/server/src/utils/i18n/t.md)
- [offsetToRange](../../../../../functions/server/src/utils/textUtils/offsetToRange.md)

# Called by

- [validateDITAStructure](../../../../../functions/server/src/features/validation/validateDITAStructure.md)