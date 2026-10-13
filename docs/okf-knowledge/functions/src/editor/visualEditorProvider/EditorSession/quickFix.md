---
type: TypeScript Method
title: quickFix
resource: src/editor/visualEditorProvider.ts#L623-L654
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/editor/visualEditorProvider/EditorSession/topicEdits
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/isCommand
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/visualEditorProvider/EditorSession/handle
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async quickFix(message: Extract<EditorToHost, { type: 'quickFix' }>): Promise<void>`

# Calls

- [topicEdits](../../../../../functions/src/editor/visualEditorProvider/EditorSession/topicEdits.md)
- [isCommand](../../../../../functions/src/editor/visualEditorProvider/isCommand.md)

# Called by

- [handle](../../../../../functions/src/editor/visualEditorProvider/EditorSession/handle.md)