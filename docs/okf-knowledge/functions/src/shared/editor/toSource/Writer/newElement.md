---
type: TypeScript Method
title: newElement
resource: src/shared/editor/toSource.ts#L228-L252
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/toSource/Writer/origin
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/rawWithAttributes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/raw
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/childrenOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/blockList
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/toSource/Writer/node
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private newElement(node: PMNode, name: string, indent: string, copyOf: string | null): string`

# Calls

- [origin](../../../../../../functions/src/shared/editor/toSource/Writer/origin.md)
- [rawWithAttributes](../../../../../../functions/src/shared/editor/toSource/rawWithAttributes.md)
- [raw](../../../../../../functions/src/shared/editor/toSource/Writer/raw.md)
- [childrenOf](../../../../../../functions/src/shared/editor/toSource/Writer/childrenOf.md)
- [blockList](../../../../../../functions/src/shared/editor/toSource/Writer/blockList.md)

# Called by

- [node](../../../../../../functions/src/shared/editor/toSource/Writer/node.md)