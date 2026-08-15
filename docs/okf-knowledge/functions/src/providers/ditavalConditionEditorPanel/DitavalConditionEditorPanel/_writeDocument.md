---
type: TypeScript Method
title: _writeDocument
resource: src/providers/ditavalConditionEditorPanel.ts#L151-L167
visibility: private
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/ditavalParser/buildDitavalDocument
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/providers/ditavalConditionEditorPanel/DitavalConditionEditorPanel/_toggleCondition
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async _writeDocument(): Promise<void>`

# Calls

- [buildDitavalDocument](../../../../../functions/src/utils/ditavalParser/buildDitavalDocument.md)

# Called by

- [_toggleCondition](../../../../../functions/src/providers/ditavalConditionEditorPanel/DitavalConditionEditorPanel/_toggleCondition.md)