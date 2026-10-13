---
type: TypeScript Function
title: samePath
resource: src/preview/paths.ts#L10-L14
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/editor/reuseCopy/reuseCopy
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/reuseCopy/rebase
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/constructor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/readsFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/reuse
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/registerListeners
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/isDependency
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/workspaceText/readWorkspaceText
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function samePath(a: string, b: string): boolean`

# Called by

- [reuseCopy](../../../../functions/src/editor/reuseCopy/reuseCopy.md)
- [rebase](../../../../functions/src/editor/reuseCopy/rebase.md)
- [constructor](../../../../functions/src/editor/visualEditorProvider/EditorSession/constructor.md)
- [readsFile](../../../../functions/src/editor/visualEditorProvider/EditorSession/readsFile.md)
- [reuse](../../../../functions/src/editor/visualEditorProvider/EditorSession/reuse.md)
- [registerListeners](../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/registerListeners.md)
- [isDependency](../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/isDependency.md)
- [readWorkspaceText](../../../../functions/src/preview/workspaceText/readWorkspaceText.md)