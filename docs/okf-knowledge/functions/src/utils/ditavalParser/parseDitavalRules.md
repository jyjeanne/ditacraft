---
type: TypeScript Function
title: parseDitavalRules
resource: src/utils/ditavalParser.ts#L83-L99
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/utils/ditavalParser/parseAttributes
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/ditaval/buildDitavalFilter
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditavalConditionEditorPanel/DitavalConditionEditorPanel/_refresh
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function parseDitavalRules(content: string): DitavalRule[]`

# Calls

- [parseAttributes](../../../../functions/src/utils/ditavalParser/parseAttributes.md)

# Called by

- [buildDitavalFilter](../../../../functions/src/preview/ditaval/buildDitavalFilter.md)
- [_refresh](../../../../functions/src/providers/ditavalConditionEditorPanel/DitavalConditionEditorPanel/_refresh.md)