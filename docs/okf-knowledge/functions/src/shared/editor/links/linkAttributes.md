---
type: TypeScript Function
title: linkAttributes
resource: src/shared/editor/links.ts#L39-L45
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/openTag/withAttribute
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/links/LinkCommands/setLink
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/mapCommands/MapCommands/setTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/mapCommands/MapCommands/insertReference
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function linkAttributes(xml: AttributePairs, target: LinkTarget): AttributePairs`

# Calls

- [withAttribute](../../../../../functions/src/shared/cst/openTag/withAttribute.md)

# Called by

- [setLink](../../../../../functions/src/shared/editor/links/LinkCommands/setLink.md)
- [setTarget](../../../../../functions/src/shared/editor/mapCommands/MapCommands/setTarget.md)
- [insertReference](../../../../../functions/src/shared/editor/mapCommands/MapCommands/insertReference.md)