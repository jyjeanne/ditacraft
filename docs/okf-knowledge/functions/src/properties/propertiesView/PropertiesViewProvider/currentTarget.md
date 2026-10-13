---
type: TypeScript Method
title: currentTarget
resource: src/properties/propertiesView.ts#L158-L166
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/properties/propertiesView/PropertiesViewProvider/visualTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/properties/propertiesView/isDitaDocument
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/properties/propertiesView/PropertiesViewProvider/textTarget
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/properties/propertiesView/PropertiesViewProvider/refresh
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/properties/propertiesView/PropertiesViewProvider/set
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private currentTarget(): Target | undefined`

# Calls

- [visualTarget](../../../../../functions/src/properties/propertiesView/PropertiesViewProvider/visualTarget.md)
- [isDitaDocument](../../../../../functions/src/properties/propertiesView/isDitaDocument.md)
- [textTarget](../../../../../functions/src/properties/propertiesView/PropertiesViewProvider/textTarget.md)

# Called by

- [refresh](../../../../../functions/src/properties/propertiesView/PropertiesViewProvider/refresh.md)
- [set](../../../../../functions/src/properties/propertiesView/PropertiesViewProvider/set.md)