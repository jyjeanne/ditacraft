---
type: TypeScript Method
title: _renderChip
resource: src/providers/ditavalConditionEditorPanel.ts#L404-L419
visibility: private
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/ditavalConditionState/nextConditionAction
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditavalConditionEditorPanel/DitavalConditionEditorPanel/_esc
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/providers/ditavalConditionEditorPanel/DitavalConditionEditorPanel/_renderGroup
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private _renderChip( attribute: string, value: { value: string; hierarchyPath?: string; action: ConditionAction | null }, groupDefaultAction: ConditionAction | null ): string`

# Calls

- [nextConditionAction](../../../../../functions/src/utils/ditavalConditionState/nextConditionAction.md)
- [_esc](../../../../../functions/src/providers/ditavalConditionEditorPanel/DitavalConditionEditorPanel/_esc.md)

# Called by

- [_renderGroup](../../../../../functions/src/providers/ditavalConditionEditorPanel/DitavalConditionEditorPanel/_renderGroup.md)