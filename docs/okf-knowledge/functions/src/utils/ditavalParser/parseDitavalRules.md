---
type: TypeScript Function
title: parseDitavalRules
resource: src/utils/ditavalParser.ts#L70-L86
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/ditavalParser/parseAttributes
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/providers/ditavalConditionEditorPanel/DitavalConditionEditorPanel/_refresh
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditavalDecorationProvider/loadActiveRules
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function parseDitavalRules(content: string): DitavalRule[]`

# Calls

- [parseAttributes](../../../../functions/src/utils/ditavalParser/parseAttributes.md)

# Called by

- [_refresh](../../../../functions/src/providers/ditavalConditionEditorPanel/DitavalConditionEditorPanel/_refresh.md)
- [loadActiveRules](../../../../functions/src/providers/ditavalDecorationProvider/loadActiveRules.md)