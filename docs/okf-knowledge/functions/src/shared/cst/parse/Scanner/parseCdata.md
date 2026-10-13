---
type: TypeScript Method
title: parseCdata
resource: src/shared/cst/parse.ts#L125-L130
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

`private parseCdata(parent: ElementNode | null): CstNode`

# Calls

- [consumeUntil](../../../../../../functions/src/shared/cst/parse/Scanner/consumeUntil.md)

# Called by

- [parseNode](../../../../../../functions/src/shared/cst/parse/Scanner/parseNode.md)