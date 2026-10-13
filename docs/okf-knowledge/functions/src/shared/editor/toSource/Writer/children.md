---
type: TypeScript Method
title: children
resource: src/shared/editor/toSource.ts#L325-L352
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/toSource/Writer/childrenOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/raw
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/blockList
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/separator
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/inlineMiddle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/blockMiddle
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private children(oldNode: PMNode, node: PMNode, cStart: number, cEnd: number, indent: string): string`

# Calls

- [childrenOf](../../../../../../functions/src/shared/editor/toSource/Writer/childrenOf.md)
- [raw](../../../../../../functions/src/shared/editor/toSource/Writer/raw.md)
- [blockList](../../../../../../functions/src/shared/editor/toSource/Writer/blockList.md)
- [separator](../../../../../../functions/src/shared/editor/toSource/Writer/separator.md)
- [inlineMiddle](../../../../../../functions/src/shared/editor/toSource/Writer/inlineMiddle.md)
- [blockMiddle](../../../../../../functions/src/shared/editor/toSource/Writer/blockMiddle.md)