---
type: TypeScript Method
title: textEditors
resource: src/editor/visualEditorProvider.ts#L356-L358
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/editor/visualEditorProvider/EditorSession/postSyncState
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/followPage
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private textEditors(): vscode.TextEditor[]`

# Called by

- [postSyncState](../../../../../functions/src/editor/visualEditorProvider/EditorSession/postSyncState.md)
- [followPage](../../../../../functions/src/editor/visualEditorProvider/EditorSession/followPage.md)