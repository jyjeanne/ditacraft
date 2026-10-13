---
type: TypeScript Function
title: checkValue
resource: src/shared/editor/properties.ts#L181-L194
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/properties/checkType
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/properties/propertiesView/PropertiesViewProvider/set
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function checkValue(field: PropertyField, value: string, idInUse?: (id: string) => boolean): string | undefined`

# Calls

- [checkType](../../../../../functions/src/shared/editor/properties/checkType.md)

# Called by

- [set](../../../../../functions/src/properties/propertiesView/PropertiesViewProvider/set.md)