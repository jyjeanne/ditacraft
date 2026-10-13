---
type: TypeScript Method
title: parseNode
resource: src/shared/cst/parse.ts#L67-L92
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/isXmlDeclHere
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/parseXmlDecl
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/parseComment
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/parseCdata
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/parseDoctype
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/parsePi
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/parseElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/parseText
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/cst/parse/Scanner/parseDocument
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/parseElement
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private parseNode(parent: ElementNode | null): CstNode`

# Calls

- [startsWith](../../../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)
- [isXmlDeclHere](../../../../../../functions/src/shared/cst/parse/Scanner/isXmlDeclHere.md)
- [parseXmlDecl](../../../../../../functions/src/shared/cst/parse/Scanner/parseXmlDecl.md)
- [parseComment](../../../../../../functions/src/shared/cst/parse/Scanner/parseComment.md)
- [parseCdata](../../../../../../functions/src/shared/cst/parse/Scanner/parseCdata.md)
- [parseDoctype](../../../../../../functions/src/shared/cst/parse/Scanner/parseDoctype.md)
- [parsePi](../../../../../../functions/src/shared/cst/parse/Scanner/parsePi.md)
- [parseElement](../../../../../../functions/src/shared/cst/parse/Scanner/parseElement.md)
- [parseText](../../../../../../functions/src/shared/cst/parse/Scanner/parseText.md)

# Called by

- [parseDocument](../../../../../../functions/src/shared/cst/parse/Scanner/parseDocument.md)
- [parseElement](../../../../../../functions/src/shared/cst/parse/Scanner/parseElement.md)