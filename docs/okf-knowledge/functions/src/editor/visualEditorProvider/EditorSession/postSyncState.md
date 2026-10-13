---
type: TypeScript Method
title: postSyncState
resource: src/editor/visualEditorProvider.ts#L366-L372
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
  - target: functions/src/editor/visualEditorProvider/EditorSession/constructor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/handle
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private postSyncState(): void`

# Calls

- [syncOn](../../../../../functions/src/editor/visualEditorProvider/EditorSession/syncOn.md)
- [textEditors](../../../../../functions/src/editor/visualEditorProvider/EditorSession/textEditors.md)

# Called by

- [constructor](../../../../../functions/src/editor/visualEditorProvider/EditorSession/constructor.md)
- [handle](../../../../../functions/src/editor/visualEditorProvider/EditorSession/handle.md)