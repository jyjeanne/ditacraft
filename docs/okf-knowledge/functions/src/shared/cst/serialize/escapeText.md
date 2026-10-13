---
type: TypeScript Function
title: escapeText
resource: src/shared/cst/serialize.ts#L21-L26
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/shared/cst/serialize/serializeNode
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/images/ImageCommands/imageSource
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/images/withAltText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/projectText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/newText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/characterEdit
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function escapeText(text: string): string`

# Called by

- [serializeNode](../../../../../functions/src/shared/cst/serialize/serializeNode.md)
- [imageSource](../../../../../functions/src/shared/editor/images/ImageCommands/imageSource.md)
- [withAltText](../../../../../functions/src/shared/editor/images/withAltText.md)
- [projectText](../../../../../functions/src/shared/editor/toSource/projectText.md)
- [newText](../../../../../functions/src/shared/editor/toSource/Writer/newText.md)
- [characterEdit](../../../../../functions/src/shared/editor/toSource/Writer/characterEdit.md)