---
type: TypeScript Method
title: scheduleResolved
resource: src/editor/visualEditorProvider.ts#L282-L290
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/editor/visualEditorProvider/EditorSession/postResolved
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/visualEditorProvider/EditorSession/constructor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/handle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/refreshContext
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private scheduleResolved(delay = 500): void`

# Calls

- [postResolved](../../../../../functions/src/editor/visualEditorProvider/EditorSession/postResolved.md)

# Called by

- [constructor](../../../../../functions/src/editor/visualEditorProvider/EditorSession/constructor.md)
- [handle](../../../../../functions/src/editor/visualEditorProvider/EditorSession/handle.md)
- [refreshContext](../../../../../functions/src/editor/visualEditorProvider/EditorSession/refreshContext.md)