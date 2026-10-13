---
type: TypeScript Function
title: propsSpecializations
resource: src/preview/ditaval.ts#L146-L161
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/html/decodeXmlText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/ditaval/declaredPropsSpecializations
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/ditaval/buildDitavalFilter
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function propsSpecializations(el: ElementNode): Set<string>`

# Calls

- [decodeXmlText](../../../../functions/src/shared/render/html/decodeXmlText.md)
- [declaredPropsSpecializations](../../../../functions/src/preview/ditaval/declaredPropsSpecializations.md)

# Called by

- [buildDitavalFilter](../../../../functions/src/preview/ditaval/buildDitavalFilter.md)