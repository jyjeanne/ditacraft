---
type: TypeScript Method
title: parsePi
resource: src/shared/cst/parse.ts#L132-L142
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/parse/Scanner/eof
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/isWs
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/consumeUntil
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/cst/parse/Scanner/parseNode
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private parsePi(parent: ElementNode | null): CstNode`

# Calls

- [eof](../../../../../../functions/src/shared/cst/parse/Scanner/eof.md)
- [isWs](../../../../../../functions/src/shared/cst/parse/isWs.md)
- [startsWith](../../../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)
- [consumeUntil](../../../../../../functions/src/shared/cst/parse/Scanner/consumeUntil.md)

# Called by

- [parseNode](../../../../../../functions/src/shared/cst/parse/Scanner/parseNode.md)