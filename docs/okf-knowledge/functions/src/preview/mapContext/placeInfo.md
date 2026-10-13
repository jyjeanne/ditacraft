---
type: TypeScript Function
title: placeInfo
resource: src/preview/mapContext.ts#L197-L237
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/mapContext/navtitle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/html/decodeXmlText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/mapContext/findPlaces
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function placeInfo(chain: ElementNode[], tokensOf: TokensOf): PlaceInfo`

# Calls

- [navtitle](../../../../functions/src/preview/mapContext/navtitle.md)
- [decodeXmlText](../../../../functions/src/shared/render/html/decodeXmlText.md)
- [has](../../../../functions/src/shared/render/toHtml/Renderer/has.md)
- [startsWith](../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)

# Called by

- [findPlaces](../../../../functions/src/preview/mapContext/findPlaces.md)