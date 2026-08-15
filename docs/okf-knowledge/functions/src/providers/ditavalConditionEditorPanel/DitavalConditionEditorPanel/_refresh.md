---
type: TypeScript Method
title: _refresh
resource: src/providers/ditavalConditionEditorPanel.ts#L171-L188
visibility: private
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/ditavalParser/parseDitavalRules
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditavalConditionEditorPanel/DitavalConditionEditorPanel/_fetchSchemeAttributes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditavalConditionEditorPanel/DitavalConditionEditorPanel/_render
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/providers/ditavalConditionEditorPanel/DitavalConditionEditorPanel/constructor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditavalConditionEditorPanel/DitavalConditionEditorPanel/createOrShow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditavalConditionEditorPanel/DitavalConditionEditorPanel/_handleMessage
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async _refresh(): Promise<void>`

# Calls

- [parseDitavalRules](../../../../../functions/src/utils/ditavalParser/parseDitavalRules.md)
- [_fetchSchemeAttributes](../../../../../functions/src/providers/ditavalConditionEditorPanel/DitavalConditionEditorPanel/_fetchSchemeAttributes.md)
- [_render](../../../../../functions/src/providers/ditavalConditionEditorPanel/DitavalConditionEditorPanel/_render.md)

# Called by

- [constructor](../../../../../functions/src/providers/ditavalConditionEditorPanel/DitavalConditionEditorPanel/constructor.md)
- [createOrShow](../../../../../functions/src/providers/ditavalConditionEditorPanel/DitavalConditionEditorPanel/createOrShow.md)
- [_handleMessage](../../../../../functions/src/providers/ditavalConditionEditorPanel/DitavalConditionEditorPanel/_handleMessage.md)