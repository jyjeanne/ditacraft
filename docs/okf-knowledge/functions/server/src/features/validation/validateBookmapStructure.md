---
type: TypeScript Function
title: validateBookmapStructure
resource: server/src/features/validation.ts#L421-L458
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
  - target: functions/server/src/features/validation/checkTopicrefsWithoutHref
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/validation/validateDITAStructure
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/validation/validateMapStructure
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function validateBookmapStructure( text: string, diagnostics: Diagnostic[] ): void`

# Calls

- [createRange](../../../../../functions/server/src/features/validation/createRange.md)
- [t](../../../../../functions/server/src/utils/i18n/t.md)
- [checkTopicrefsWithoutHref](../../../../../functions/server/src/features/validation/checkTopicrefsWithoutHref.md)

# Called by

- [validateDITAStructure](../../../../../functions/server/src/features/validation/validateDITAStructure.md)
- [validateMapStructure](../../../../../functions/server/src/features/validation/validateMapStructure.md)