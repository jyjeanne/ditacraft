---
type: TypeScript Function
title: isNameBoundary
resource: src/shared/cst/parse.ts#L41-L43
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/parse/isWs
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/cst/parse/Scanner/parseName
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function isNameBoundary(ch: string): boolean`

# Calls

- [isWs](../../../../../functions/src/shared/cst/parse/isWs.md)

# Called by

- [parseName](../../../../../functions/src/shared/cst/parse/Scanner/parseName.md)