---
type: TypeScript Method
title: followsEditor
resource: src/editor/visualEditorProvider.ts#L361-L364
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/editor/visualEditorProvider/EditorSession/syncOn
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/visualEditorProvider/EditorSession/constructor
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private followsEditor(editor: vscode.TextEditor): boolean`

# Calls

- [syncOn](../../../../../functions/src/editor/visualEditorProvider/EditorSession/syncOn.md)

# Called by

- [constructor](../../../../../functions/src/editor/visualEditorProvider/EditorSession/constructor.md)