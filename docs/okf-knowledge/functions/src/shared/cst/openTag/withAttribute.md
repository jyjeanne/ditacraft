---
type: TypeScript Function
title: withAttribute
resource: src/shared/cst/openTag.ts#L60-L65
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/properties/propertiesView/PropertiesViewProvider/set
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/images/ImageCommands/setSize
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/images/ImageCommands/setHref
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/images/ImageCommands/setAlt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/links/linkAttributes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/mapCommands/MapCommands/setTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/mapCommands/MapCommands/setLabel
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/withAttr
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/setColumnWidths
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function withAttribute(pairs: AttributePairs, name: string, value: string | null): AttributePairs`

# Called by

- [set](../../../../../functions/src/properties/propertiesView/PropertiesViewProvider/set.md)
- [setSize](../../../../../functions/src/shared/editor/images/ImageCommands/setSize.md)
- [setHref](../../../../../functions/src/shared/editor/images/ImageCommands/setHref.md)
- [setAlt](../../../../../functions/src/shared/editor/images/ImageCommands/setAlt.md)
- [linkAttributes](../../../../../functions/src/shared/editor/links/linkAttributes.md)
- [setTarget](../../../../../functions/src/shared/editor/mapCommands/MapCommands/setTarget.md)
- [setLabel](../../../../../functions/src/shared/editor/mapCommands/MapCommands/setLabel.md)
- [withAttr](../../../../../functions/src/shared/editor/tables/TableCommands/withAttr.md)
- [setColumnWidths](../../../../../functions/src/shared/editor/tables/TableCommands/setColumnWidths.md)