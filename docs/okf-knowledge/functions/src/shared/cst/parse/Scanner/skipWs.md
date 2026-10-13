---
type: TypeScript Method
title: skipWs
resource: src/shared/cst/parse.ts#L190-L194
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
  called_by:
  - target: functions/src/shared/cst/parse/Scanner/parseElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/parseAttr
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private skipWs(): void`

# Calls

- [eof](../../../../../../functions/src/shared/cst/parse/Scanner/eof.md)
- [isWs](../../../../../../functions/src/shared/cst/parse/isWs.md)

# Called by

- [parseElement](../../../../../../functions/src/shared/cst/parse/Scanner/parseElement.md)
- [parseAttr](../../../../../../functions/src/shared/cst/parse/Scanner/parseAttr.md)