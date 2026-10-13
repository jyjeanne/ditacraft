---
type: TypeScript Function
title: flagLook
resource: src/preview/conditionMarks.ts#L137-L175
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/conditionMarks/cssColor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/conditionMarks/mix
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/conditionMarks/flagKey
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditavalDecorationProvider/flagDecorationType
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function flagLook(style: FlagStyle): FlagLook`

# Calls

- [cssColor](../../../../functions/src/preview/conditionMarks/cssColor.md)
- [mix](../../../../functions/src/preview/conditionMarks/mix.md)

# Called by

- [flagKey](../../../../functions/src/preview/conditionMarks/flagKey.md)
- [flagDecorationType](../../../../functions/src/providers/ditavalDecorationProvider/flagDecorationType.md)