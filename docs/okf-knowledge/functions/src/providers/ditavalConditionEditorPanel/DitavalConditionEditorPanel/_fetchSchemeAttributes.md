---
type: TypeScript Method
title: _fetchSchemeAttributes
resource: src/providers/ditavalConditionEditorPanel.ts#L190-L204
visibility: private
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/languageClient/getLanguageClient
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/providers/ditavalConditionEditorPanel/DitavalConditionEditorPanel/_refresh
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async _fetchSchemeAttributes(): Promise<SchemeAttributeInfo[]>`

# Calls

- [getLanguageClient](../../../../../functions/src/languageClient/getLanguageClient.md)

# Called by

- [_refresh](../../../../../functions/src/providers/ditavalConditionEditorPanel/DitavalConditionEditorPanel/_refresh.md)