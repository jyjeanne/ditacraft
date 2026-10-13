---
type: TypeScript Function
title: renderForeign
resource: src/shared/render/foreign.ts#L82-L107
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/html/escapeHtml
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/html/decodeXmlText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/foreign/localName
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/foreign/safeAttribute
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function renderForeign(node: CstNode, doc: Document, lookup?: EntityLookup): string`

# Calls

- [escapeHtml](../../../../../functions/src/shared/render/html/escapeHtml.md)
- [decodeXmlText](../../../../../functions/src/shared/render/html/decodeXmlText.md)
- [localName](../../../../../functions/src/shared/render/foreign/localName.md)
- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)
- [safeAttribute](../../../../../functions/src/shared/render/foreign/safeAttribute.md)