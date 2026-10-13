---
type: TypeScript Function
title: rawWithAttributes
resource: src/shared/editor/toSource.ts#L74-L93
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/query/rootElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/html/decodeXmlText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/sameXml
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/openTag/rewriteOpenTag
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/toSource/Writer/newElement
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function rawWithAttributes(node: PMNode, name: string, xml: Pairs): string`

# Calls

- [rootElement](../../../../../functions/src/shared/cst/query/rootElement.md)
- [decodeXmlText](../../../../../functions/src/shared/render/html/decodeXmlText.md)
- [sameXml](../../../../../functions/src/shared/editor/toSource/sameXml.md)
- [rewriteOpenTag](../../../../../functions/src/shared/cst/openTag/rewriteOpenTag.md)

# Called by

- [newElement](../../../../../functions/src/shared/editor/toSource/Writer/newElement.md)