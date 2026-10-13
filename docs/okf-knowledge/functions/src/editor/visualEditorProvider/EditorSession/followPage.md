---
type: TypeScript Method
title: followPage
resource: src/editor/visualEditorProvider.ts#L375-L390
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/editor/visualEditorProvider/EditorSession/syncOn
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/textEditors
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/visualEditorProvider/EditorSession/handle
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private followPage(message: Extract<EditorToHost, { type: 'sync' }>): void`

# Calls

- [syncOn](../../../../../functions/src/editor/visualEditorProvider/EditorSession/syncOn.md)
- [textEditors](../../../../../functions/src/editor/visualEditorProvider/EditorSession/textEditors.md)

# Called by

- [handle](../../../../../functions/src/editor/visualEditorProvider/EditorSession/handle.md)