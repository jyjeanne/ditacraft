---
type: TypeScript Function
title: conditionMarks
resource: src/preview/conditionMarks.ts#L40-L84
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/conditionMarks/rootStartTag
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/ditaval/declaredPropsSpecializations
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/conditionMarks/attrValue
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/xmlElementScanner/findProfiledElements
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/entries
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/html/decodeXmlText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/conditionMarks/flagKey
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/providers/ditavalDecorationProvider/recompute
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function conditionMarks(text: string, filter: DitavalFilter): ConditionMarks`

# Calls

- [rootStartTag](../../../../functions/src/preview/conditionMarks/rootStartTag.md)
- [declaredPropsSpecializations](../../../../functions/src/preview/ditaval/declaredPropsSpecializations.md)
- [attrValue](../../../../functions/src/preview/conditionMarks/attrValue.md)
- [findProfiledElements](../../../../functions/src/utils/xmlElementScanner/findProfiledElements.md)
- [entries](../../../../functions/src/preview/grammarRegistry/GrammarRegistry/entries.md)
- [has](../../../../functions/src/shared/render/toHtml/Renderer/has.md)
- [decodeXmlText](../../../../functions/src/shared/render/html/decodeXmlText.md)
- [flagKey](../../../../functions/src/preview/conditionMarks/flagKey.md)

# Called by

- [recompute](../../../../functions/src/providers/ditavalDecorationProvider/recompute.md)