---
type: TypeScript Function
title: metaRows
resource: src/shared/render/toHtml.ts#L943-L961
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/query/childElements
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/html/decodeXmlText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/structId
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/html/escapeHtml
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function metaRows(r: Renderer, el: ElementNode): string`

# Calls

- [childElements](../../../../../functions/src/shared/cst/query/childElements.md)
- [decodeXmlText](../../../../../functions/src/shared/render/html/decodeXmlText.md)
- [structId](../../../../../functions/src/shared/render/toHtml/Renderer/structId.md)
- [escapeHtml](../../../../../functions/src/shared/render/html/escapeHtml.md)