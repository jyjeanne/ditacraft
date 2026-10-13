---
type: TypeScript Method
title: eof
resource: src/shared/cst/parse.ts#L50-L52
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/shared/cst/parse/Scanner/parseDocument
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/parsePi
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/parseDoctype
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/parseName
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/skipWs
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/parseElement
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`eof(): boolean`

# Called by

- [parseDocument](../../../../../../functions/src/shared/cst/parse/Scanner/parseDocument.md)
- [parsePi](../../../../../../functions/src/shared/cst/parse/Scanner/parsePi.md)
- [parseDoctype](../../../../../../functions/src/shared/cst/parse/Scanner/parseDoctype.md)
- [parseName](../../../../../../functions/src/shared/cst/parse/Scanner/parseName.md)
- [skipWs](../../../../../../functions/src/shared/cst/parse/Scanner/skipWs.md)
- [parseElement](../../../../../../functions/src/shared/cst/parse/Scanner/parseElement.md)