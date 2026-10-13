---
type: TypeScript Method
title: origin
resource: src/shared/editor/toSource.ts#L120-L122
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/shared/editor/toSource/Writer/node
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/changedElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/newElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/placed
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/outerStart
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/outerEnd
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/shareMark
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/inlineMiddle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/characterEdit
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/markOnlySources
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/blockMiddle
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private origin(node: PMNode): NodeOrigin | undefined`

# Called by

- [node](../../../../../../functions/src/shared/editor/toSource/Writer/node.md)
- [changedElement](../../../../../../functions/src/shared/editor/toSource/Writer/changedElement.md)
- [newElement](../../../../../../functions/src/shared/editor/toSource/Writer/newElement.md)
- [placed](../../../../../../functions/src/shared/editor/toSource/Writer/placed.md)
- [outerStart](../../../../../../functions/src/shared/editor/toSource/Writer/outerStart.md)
- [outerEnd](../../../../../../functions/src/shared/editor/toSource/Writer/outerEnd.md)
- [shareMark](../../../../../../functions/src/shared/editor/toSource/Writer/shareMark.md)
- [inlineMiddle](../../../../../../functions/src/shared/editor/toSource/Writer/inlineMiddle.md)
- [characterEdit](../../../../../../functions/src/shared/editor/toSource/Writer/characterEdit.md)
- [markOnlySources](../../../../../../functions/src/shared/editor/toSource/Writer/markOnlySources.md)
- [blockMiddle](../../../../../../functions/src/shared/editor/toSource/Writer/blockMiddle.md)