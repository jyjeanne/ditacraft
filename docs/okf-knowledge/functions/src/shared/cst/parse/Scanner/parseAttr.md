---
type: TypeScript Method
title: parseAttr
resource: src/shared/cst/parse.ts#L266-L294
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/parse/Scanner/parseName
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/skipWs
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/cst/parse/Scanner/parseElement
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private parseAttr(): Attr`

# Calls

- [parseName](../../../../../../functions/src/shared/cst/parse/Scanner/parseName.md)
- [skipWs](../../../../../../functions/src/shared/cst/parse/Scanner/skipWs.md)

# Called by

- [parseElement](../../../../../../functions/src/shared/cst/parse/Scanner/parseElement.md)