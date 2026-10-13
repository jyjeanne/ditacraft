---
type: TypeScript Function
title: referenced
resource: src/preview/mapContext.ts#L70-L95
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/html/decodeXmlText
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/mapContext/referencesTo
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContext/submapsOf
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function referenced(el: ElementNode, mapPath: string, tokensOf: TokensOf): { file: string; map: boolean } | undefined`

# Calls

- [decodeXmlText](../../../../functions/src/shared/render/html/decodeXmlText.md)

# Called by

- [referencesTo](../../../../functions/src/preview/mapContext/referencesTo.md)
- [submapsOf](../../../../functions/src/preview/mapContext/submapsOf.md)