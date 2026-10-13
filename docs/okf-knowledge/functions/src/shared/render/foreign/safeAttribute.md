---
type: TypeScript Function
title: safeAttribute
resource: src/shared/render/foreign.ts#L59-L79
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/foreign/localName
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/html/decodeXmlText
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/render/foreign/renderForeign
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function safeAttribute(name: string, rawValue: string, lookup?: EntityLookup): string | undefined`

# Calls

- [startsWith](../../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)
- [localName](../../../../../functions/src/shared/render/foreign/localName.md)
- [decodeXmlText](../../../../../functions/src/shared/render/html/decodeXmlText.md)

# Called by

- [renderForeign](../../../../../functions/src/shared/render/foreign/renderForeign.md)