---
type: TypeScript Function
title: realPathSync
resource: src/preview/paths.ts#L30-L36
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/editor/visualEditorProvider/EditorSession/webviewUri
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/webviewUri
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function realPathSync(file: string): string`

# Called by

- [webviewUri](../../../../functions/src/editor/visualEditorProvider/EditorSession/webviewUri.md)
- [webviewUri](../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/webviewUri.md)