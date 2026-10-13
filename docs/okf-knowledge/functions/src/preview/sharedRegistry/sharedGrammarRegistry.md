---
type: TypeScript Function
title: sharedGrammarRegistry
resource: src/preview/sharedRegistry.ts#L13-L22
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/utils/logger/Logger/warn
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/visualEditorProvider/EditorSession/sendInit
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContexts/MapContexts/loadMaps
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContexts/MapContexts/chooseFromMapRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/constructor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/properties/propertiesView/PropertiesViewProvider/parse
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function sharedGrammarRegistry(context: vscode.ExtensionContext): GrammarRegistry`

# Calls

- [warn](../../../../functions/src/utils/logger/Logger/warn.md)

# Called by

- [sendInit](../../../../functions/src/editor/visualEditorProvider/EditorSession/sendInit.md)
- [loadMaps](../../../../functions/src/preview/mapContexts/MapContexts/loadMaps.md)
- [chooseFromMapRow](../../../../functions/src/preview/mapContexts/MapContexts/chooseFromMapRow.md)
- [constructor](../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/constructor.md)
- [parse](../../../../functions/src/properties/propertiesView/PropertiesViewProvider/parse.md)