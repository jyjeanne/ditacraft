---
type: TypeScript Function
title: mergeAttributeState
resource: src/utils/ditavalConditionState.ts#L60-L119
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/utils/ditavalConditionState/conditionKey
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/entries
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/providers/ditavalConditionEditorPanel/DitavalConditionEditorPanel/_getHtmlContent
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function mergeAttributeState( schemeAttributes: readonly SchemeAttributeInfo[], valueRules: readonly DitavalRule[], defaultRules: readonly DitavalRule[] = [] ): ConditionAttributeState[]`

# Calls

- [conditionKey](../../../../functions/src/utils/ditavalConditionState/conditionKey.md)
- [has](../../../../functions/src/shared/render/toHtml/Renderer/has.md)
- [entries](../../../../functions/src/preview/grammarRegistry/GrammarRegistry/entries.md)

# Called by

- [_getHtmlContent](../../../../functions/src/providers/ditavalConditionEditorPanel/DitavalConditionEditorPanel/_getHtmlContent.md)