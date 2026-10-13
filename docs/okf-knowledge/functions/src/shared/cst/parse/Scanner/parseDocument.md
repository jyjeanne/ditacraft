---
type: TypeScript Method
title: parseDocument
resource: src/shared/cst/parse.ts#L59-L65
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/parse/Scanner/eof
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/parseNode
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/cst/parse/parse
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`parseDocument(): CstNode[]`

# Calls

- [eof](../../../../../../functions/src/shared/cst/parse/Scanner/eof.md)
- [parseNode](../../../../../../functions/src/shared/cst/parse/Scanner/parseNode.md)

# Called by

- [parse](../../../../../../functions/src/shared/cst/parse/parse.md)