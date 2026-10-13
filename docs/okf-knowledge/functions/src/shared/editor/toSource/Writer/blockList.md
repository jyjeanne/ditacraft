---
type: TypeScript Method
title: blockList
resource: src/shared/editor/toSource.ts#L258-L276
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/toSource/Writer/placed
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/toSource/Writer/newElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/children
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/inlineMiddle
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private blockList(children: PMNode[], indent: string, sep: string): string`

# Calls

- [placed](../../../../../../functions/src/shared/editor/toSource/Writer/placed.md)

# Called by

- [newElement](../../../../../../functions/src/shared/editor/toSource/Writer/newElement.md)
- [children](../../../../../../functions/src/shared/editor/toSource/Writer/children.md)
- [inlineMiddle](../../../../../../functions/src/shared/editor/toSource/Writer/inlineMiddle.md)