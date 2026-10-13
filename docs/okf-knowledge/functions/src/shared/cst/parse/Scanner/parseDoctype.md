---
type: TypeScript Method
title: parseDoctype
resource: src/shared/cst/parse.ts#L151-L177
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/parse/Scanner/eof
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/cst/parse/Scanner/parseNode
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private parseDoctype(parent: ElementNode | null): CstNode`

# Calls

- [eof](../../../../../../functions/src/shared/cst/parse/Scanner/eof.md)

# Called by

- [parseNode](../../../../../../functions/src/shared/cst/parse/Scanner/parseNode.md)