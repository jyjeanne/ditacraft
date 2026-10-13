---
type: TypeScript Function
title: checkType
resource: src/shared/editor/properties.ts#L196-L215
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/properties/isName
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/properties/isNmtoken
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/properties/checkValue
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function checkType(field: PropertyField, value: string): string | undefined`

# Calls

- [isName](../../../../../functions/src/shared/editor/properties/isName.md)
- [isNmtoken](../../../../../functions/src/shared/editor/properties/isNmtoken.md)

# Called by

- [checkValue](../../../../../functions/src/shared/editor/properties/checkValue.md)