---
type: TypeScript Function
title: plain
resource: src/preview/mapContext.ts#L56-L58
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
  called_by:
  - target: functions/src/preview/mapContext/mapTitle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContext/navtitle
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function plain(el: ElementNode): string`

# Calls

- [decodeXmlText](../../../../functions/src/shared/render/html/decodeXmlText.md)
- [rawTextContent](../../../../functions/src/shared/cst/query/rawTextContent.md)

# Called by

- [mapTitle](../../../../functions/src/preview/mapContext/mapTitle.md)
- [navtitle](../../../../functions/src/preview/mapContext/navtitle.md)