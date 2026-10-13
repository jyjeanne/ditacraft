---
type: TypeScript Function
title: grammarSelectOptions
resource: src/preview/grammarOptions.ts#L11-L16
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/getConfiguration
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/visualEditorProvider/EditorSession/sendInit
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/properties/propertiesView/PropertiesViewProvider/parse
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function grammarSelectOptions(document: vscode.TextDocument): SelectOptions`

# Calls

- [getConfiguration](../../../../functions/src/utils/configurationManager/ConfigurationManager/getConfiguration.md)

# Called by

- [sendInit](../../../../functions/src/editor/visualEditorProvider/EditorSession/sendInit.md)
- [parse](../../../../functions/src/properties/propertiesView/PropertiesViewProvider/parse.md)