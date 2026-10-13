---
type: TypeScript Function
title: esc
resource: src/preview/pageHtml.ts#L32-L34
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/preview/pageHtml/buildPageHtml
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/properties/propertiesView/buildPropertiesHtml
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function esc(value: string): string`

# Called by

- [buildPageHtml](../../../../functions/src/preview/pageHtml/buildPageHtml.md)
- [buildPropertiesHtml](../../../../functions/src/properties/propertiesView/buildPropertiesHtml.md)