---
type: TypeScript Method
title: parseName
resource: src/shared/cst/parse.ts#L179-L188
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/parse/Scanner/eof
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/isNameBoundary
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/cst/parse/Scanner/parseElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/parseAttr
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private parseName(): string`

# Calls

- [eof](../../../../../../functions/src/shared/cst/parse/Scanner/eof.md)
- [isNameBoundary](../../../../../../functions/src/shared/cst/parse/isNameBoundary.md)

# Called by

- [parseElement](../../../../../../functions/src/shared/cst/parse/Scanner/parseElement.md)
- [parseAttr](../../../../../../functions/src/shared/cst/parse/Scanner/parseAttr.md)