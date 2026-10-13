---
type: TypeScript Method
title: readText
resource: src/preview/visualPreviewPanel.ts#L427-L429
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/workspaceText/readWorkspaceText
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/visualEditorProvider/EditorSession/handle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/resolveCode
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/load
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/constructor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/loadDitaval
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private readText(filePath: string): Promise<string | null>`

# Calls

- [readWorkspaceText](../../../../../functions/src/preview/workspaceText/readWorkspaceText.md)

# Called by

- [handle](../../../../../functions/src/editor/visualEditorProvider/EditorSession/handle.md)
- [resolveCode](../../../../../functions/src/preview/resolver/ReferenceResolver/resolveCode.md)
- [load](../../../../../functions/src/preview/resolver/ReferenceResolver/load.md)
- [constructor](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/constructor.md)
- [loadDitaval](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/loadDitaval.md)