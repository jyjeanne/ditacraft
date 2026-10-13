---
type: TypeScript Method
title: hidden
resource: src/shared/render/toHtml.ts#L631-L637
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/query/rawTextContent
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/html/decodeXmlText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/wrap
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/html/escapeHtml
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`hidden(el: ElementNode, info: Info, label?: string): string`

# Calls

- [rawTextContent](../../../../../../functions/src/shared/cst/query/rawTextContent.md)
- [decodeXmlText](../../../../../../functions/src/shared/render/html/decodeXmlText.md)
- [wrap](../../../../../../functions/src/shared/render/toHtml/Renderer/wrap.md)
- [escapeHtml](../../../../../../functions/src/shared/render/html/escapeHtml.md)