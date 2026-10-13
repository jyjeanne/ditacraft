---
type: TypeScript Function
title: isInside
resource: src/preview/paths.ts#L16-L19
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/visualEditorProvider/EditorSession/webviewUri
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/webviewUri
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/workspaceText/readWorkspaceText
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function isInside(child: string, parent: string): boolean`

# Calls

- [startsWith](../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)

# Called by

- [webviewUri](../../../../functions/src/editor/visualEditorProvider/EditorSession/webviewUri.md)
- [webviewUri](../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/webviewUri.md)
- [readWorkspaceText](../../../../functions/src/preview/workspaceText/readWorkspaceText.md)