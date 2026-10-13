---
type: TypeScript Method
title: consumeUntil
resource: src/shared/cst/parse.ts#L108-L116
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/shared/cst/parse/Scanner/parseComment
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/parseCdata
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/parsePi
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/parseXmlDecl
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private consumeUntil(marker: string, what: string): number`

# Called by

- [parseComment](../../../../../../functions/src/shared/cst/parse/Scanner/parseComment.md)
- [parseCdata](../../../../../../functions/src/shared/cst/parse/Scanner/parseCdata.md)
- [parsePi](../../../../../../functions/src/shared/cst/parse/Scanner/parsePi.md)
- [parseXmlDecl](../../../../../../functions/src/shared/cst/parse/Scanner/parseXmlDecl.md)