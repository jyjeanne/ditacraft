---
type: TypeScript Function
title: checkTopicrefsWithoutHref
resource: server/src/features/validation.ts#L581-L604
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
  called_by:
  - target: functions/server/src/features/validation/validateMapStructure
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/validation/validateBookmapStructure
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function checkTopicrefsWithoutHref(text: string, diagnostics: Diagnostic[]): void`

# Calls

- [createRange](../../../../../functions/server/src/features/validation/createRange.md)
- [t](../../../../../functions/server/src/utils/i18n/t.md)

# Called by

- [validateMapStructure](../../../../../functions/server/src/features/validation/validateMapStructure.md)
- [validateBookmapStructure](../../../../../functions/server/src/features/validation/validateBookmapStructure.md)