---
type: TypeScript Function
title: buildDitavalDocument
resource: src/utils/ditavalParser.ts#L103-L117
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/ditavalParser/escapeDitavalAttr
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/providers/ditavalConditionEditorPanel/DitavalConditionEditorPanel/_writeDocument
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function buildDitavalDocument(rules: readonly DitavalRule[]): string`

# Calls

- [escapeDitavalAttr](../../../../functions/src/utils/ditavalParser/escapeDitavalAttr.md)

# Called by

- [_writeDocument](../../../../functions/src/providers/ditavalConditionEditorPanel/DitavalConditionEditorPanel/_writeDocument.md)