---
type: TypeScript Method
title: textTarget
resource: src/properties/propertiesView.ts#L226-L264
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/elementIndex/ElementIndex/chainAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/html/decodeXmlText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/decode
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/openTag/rewriteOpenTag
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/properties/idConflict
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/properties/propertiesView/PropertiesViewProvider/currentTarget
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private textTarget(editor: vscode.TextEditor): Target`

# Calls

- [chainAt](../../../../../functions/src/shared/cst/elementIndex/ElementIndex/chainAt.md)
- [decodeXmlText](../../../../../functions/src/shared/render/html/decodeXmlText.md)
- [decode](../../../../../functions/src/preview/resolver/decode.md)
- [rewriteOpenTag](../../../../../functions/src/shared/cst/openTag/rewriteOpenTag.md)
- [idConflict](../../../../../functions/src/shared/editor/properties/idConflict.md)

# Called by

- [currentTarget](../../../../../functions/src/properties/propertiesView/PropertiesViewProvider/currentTarget.md)