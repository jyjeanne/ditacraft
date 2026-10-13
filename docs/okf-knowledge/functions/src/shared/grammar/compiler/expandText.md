---
type: TypeScript Function
title: expandText
resource: src/shared/grammar/compiler.ts#L331-L355
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/compiler/safeFromCodePoint
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/grammar/compiler/expandEntities
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/compiler/expandAttrDefaults
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function expandText(text: string, lookup: (name: string) => string | null): string | null`

# Calls

- [startsWith](../../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)
- [safeFromCodePoint](../../../../../functions/src/shared/grammar/compiler/safeFromCodePoint.md)

# Called by

- [expandEntities](../../../../../functions/src/shared/grammar/compiler/expandEntities.md)
- [expandAttrDefaults](../../../../../functions/src/shared/grammar/compiler/expandAttrDefaults.md)