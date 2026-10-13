---
type: TypeScript Method
title: plainText
resource: src/preview/resolver.ts#L531-L533
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/html/decodeXmlText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/query/rawTextContent
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private plainText(el: ElementNode): string`

# Calls

- [decodeXmlText](../../../../../functions/src/shared/render/html/decodeXmlText.md)
- [rawTextContent](../../../../../functions/src/shared/cst/query/rawTextContent.md)