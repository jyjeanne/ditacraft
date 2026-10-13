---
type: TypeScript Method
title: raw
resource: src/shared/editor/toSource.ts#L116-L118
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/shared/editor/toSource/Writer/node
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/openTag
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/changedElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/newElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/children
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/inlineMiddle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/markOnlySources
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/separator
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/blockMiddle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/markTags
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private raw(start: number, end: number): string`

# Called by

- [node](../../../../../../functions/src/shared/editor/toSource/Writer/node.md)
- [openTag](../../../../../../functions/src/shared/editor/toSource/Writer/openTag.md)
- [changedElement](../../../../../../functions/src/shared/editor/toSource/Writer/changedElement.md)
- [newElement](../../../../../../functions/src/shared/editor/toSource/Writer/newElement.md)
- [children](../../../../../../functions/src/shared/editor/toSource/Writer/children.md)
- [inlineMiddle](../../../../../../functions/src/shared/editor/toSource/Writer/inlineMiddle.md)
- [markOnlySources](../../../../../../functions/src/shared/editor/toSource/Writer/markOnlySources.md)
- [separator](../../../../../../functions/src/shared/editor/toSource/Writer/separator.md)
- [blockMiddle](../../../../../../functions/src/shared/editor/toSource/Writer/blockMiddle.md)
- [markTags](../../../../../../functions/src/shared/editor/toSource/Writer/markTags.md)