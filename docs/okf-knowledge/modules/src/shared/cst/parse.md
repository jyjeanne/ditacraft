---
type: TypeScript Module
title: parse
resource: src/shared/cst/parse.ts#L1-L302
generated:
  by: okf-rs/0.7.0
relationships:
  imports:
  - target: external/types
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/ditacraft
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [ParseError](../../../../classes/src/shared/cst/parse/ParseError.md)
- [constructor](../../../../functions/src/shared/cst/parse/ParseError/constructor.md)
- [reason](../../../../functions/src/shared/cst/parse/ParseError/reason.md)
- [isWs](../../../../functions/src/shared/cst/parse/isWs.md)
- [isNameBoundary](../../../../functions/src/shared/cst/parse/isNameBoundary.md)
- [Scanner](../../../../classes/src/shared/cst/parse/Scanner.md)
- [constructor](../../../../functions/src/shared/cst/parse/Scanner/constructor.md)
- [eof](../../../../functions/src/shared/cst/parse/Scanner/eof.md)
- [startsWith](../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)
- [parseDocument](../../../../functions/src/shared/cst/parse/Scanner/parseDocument.md)
- [parseNode](../../../../functions/src/shared/cst/parse/Scanner/parseNode.md)
- [isXmlDeclHere](../../../../functions/src/shared/cst/parse/Scanner/isXmlDeclHere.md)
- [parseText](../../../../functions/src/shared/cst/parse/Scanner/parseText.md)
- [consumeUntil](../../../../functions/src/shared/cst/parse/Scanner/consumeUntil.md)
- [parseComment](../../../../functions/src/shared/cst/parse/Scanner/parseComment.md)
- [parseCdata](../../../../functions/src/shared/cst/parse/Scanner/parseCdata.md)
- [parsePi](../../../../functions/src/shared/cst/parse/Scanner/parsePi.md)
- [parseXmlDecl](../../../../functions/src/shared/cst/parse/Scanner/parseXmlDecl.md)
- [parseDoctype](../../../../functions/src/shared/cst/parse/Scanner/parseDoctype.md)
- [parseName](../../../../functions/src/shared/cst/parse/Scanner/parseName.md)
- [skipWs](../../../../functions/src/shared/cst/parse/Scanner/skipWs.md)
- [parseElement](../../../../functions/src/shared/cst/parse/Scanner/parseElement.md)
- [parseAttr](../../../../functions/src/shared/cst/parse/Scanner/parseAttr.md)
- [parse](../../../../functions/src/shared/cst/parse/parse.md)

# Imports

- `./types`

# Member of

- [ditacraft](../../../../packages/ditacraft.md)