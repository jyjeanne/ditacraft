---
type: TypeScript Method
title: sessionChanged
resource: src/editor/visualEditorProvider.ts#L97-L106
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/editor/visualEditorProvider/VisualEditorProvider/resolveCustomTextEditor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/handle
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`static sessionChanged(session: EditorSession, active: boolean | undefined): void`

# Called by

- [resolveCustomTextEditor](../../../../../functions/src/editor/visualEditorProvider/VisualEditorProvider/resolveCustomTextEditor.md)
- [handle](../../../../../functions/src/editor/visualEditorProvider/EditorSession/handle.md)