---
type: TypeScript Method
title: set
resource: src/properties/propertiesView.ts#L358-L391
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/properties/propertiesView/PropertiesViewProvider/currentTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/properties/propertiesView/PropertiesViewProvider/schedule
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/properties/propertiesOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/properties/checkValue
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/openTag/withAttribute
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async set(index: number, element: string, name: string, value: string | null): Promise<string | undefined>`

# Calls

- [currentTarget](../../../../../functions/src/properties/propertiesView/PropertiesViewProvider/currentTarget.md)
- [schedule](../../../../../functions/src/properties/propertiesView/PropertiesViewProvider/schedule.md)
- [propertiesOf](../../../../../functions/src/shared/editor/properties/propertiesOf.md)
- [find](../../../../../functions/webview/editor/mapView/RowDrag/find.md)
- [checkValue](../../../../../functions/src/shared/editor/properties/checkValue.md)
- [withAttribute](../../../../../functions/src/shared/cst/openTag/withAttribute.md)