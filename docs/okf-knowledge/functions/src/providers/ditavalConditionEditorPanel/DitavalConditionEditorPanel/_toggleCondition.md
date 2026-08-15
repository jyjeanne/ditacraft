---
type: TypeScript Method
title: _toggleCondition
resource: src/providers/ditavalConditionEditorPanel.ts#L140-L149
visibility: private
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/ditavalConditionState/applyConditionToggle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditavalConditionEditorPanel/DitavalConditionEditorPanel/_writeDocument
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditavalConditionEditorPanel/DitavalConditionEditorPanel/_render
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/providers/ditavalConditionEditorPanel/DitavalConditionEditorPanel/_handleMessage
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async _toggleCondition(attribute: string, value: string, action: ConditionAction | null): Promise<void>`

# Calls

- [applyConditionToggle](../../../../../functions/src/utils/ditavalConditionState/applyConditionToggle.md)
- [_writeDocument](../../../../../functions/src/providers/ditavalConditionEditorPanel/DitavalConditionEditorPanel/_writeDocument.md)
- [_render](../../../../../functions/src/providers/ditavalConditionEditorPanel/DitavalConditionEditorPanel/_render.md)

# Called by

- [_handleMessage](../../../../../functions/src/providers/ditavalConditionEditorPanel/DitavalConditionEditorPanel/_handleMessage.md)