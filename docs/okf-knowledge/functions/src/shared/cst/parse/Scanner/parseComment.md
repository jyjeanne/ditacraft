---
type: TypeScript Method
title: parseComment
resource: src/shared/cst/parse.ts#L118-L123
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/parse/Scanner/consumeUntil
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/cst/parse/Scanner/parseNode
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private parseComment(parent: ElementNode | null): CstNode`

# Calls

- [consumeUntil](../../../../../../functions/src/shared/cst/parse/Scanner/consumeUntil.md)

# Called by

- [parseNode](../../../../../../functions/src/shared/cst/parse/Scanner/parseNode.md)