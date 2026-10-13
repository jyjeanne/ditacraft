---
type: TypeScript Function
title: propertiesOf
resource: src/shared/editor/properties.ts#L88-L123
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/grammar/types/elementAttributes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/properties/profilingAttributes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/entries
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/properties/groupOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/properties/rank
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/properties/propertiesView/PropertiesViewProvider/refresh
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/properties/propertiesView/PropertiesViewProvider/set
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function propertiesOf(grammar: Grammar | undefined, element: string, xml: AttributePairs): PropertyField[]`

# Calls

- [elementAttributes](../../../../../functions/src/shared/grammar/types/elementAttributes.md)
- [profilingAttributes](../../../../../functions/src/shared/editor/properties/profilingAttributes.md)
- [entries](../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/entries.md)
- [groupOf](../../../../../functions/src/shared/editor/properties/groupOf.md)
- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)
- [startsWith](../../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)
- [rank](../../../../../functions/src/shared/editor/properties/rank.md)

# Called by

- [refresh](../../../../../functions/src/properties/propertiesView/PropertiesViewProvider/refresh.md)
- [set](../../../../../functions/src/properties/propertiesView/PropertiesViewProvider/set.md)