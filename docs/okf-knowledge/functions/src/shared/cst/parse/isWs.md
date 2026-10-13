---
type: TypeScript Function
title: isWs
resource: src/shared/cst/parse.ts#L36-L38
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/cst/parse/isNameBoundary
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/isXmlDeclHere
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/parsePi
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/skipWs
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function isWs(ch: string): boolean`

# Calls

- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)

# Called by

- [isNameBoundary](../../../../../functions/src/shared/cst/parse/isNameBoundary.md)
- [isXmlDeclHere](../../../../../functions/src/shared/cst/parse/Scanner/isXmlDeclHere.md)
- [parsePi](../../../../../functions/src/shared/cst/parse/Scanner/parsePi.md)
- [skipWs](../../../../../functions/src/shared/cst/parse/Scanner/skipWs.md)