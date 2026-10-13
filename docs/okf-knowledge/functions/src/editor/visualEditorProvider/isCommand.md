---
type: TypeScript Function
title: isCommand
resource: src/editor/visualEditorProvider.ts#L1049-L1051
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/editor/visualEditorProvider/EditorSession/quickFixes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/quickFix
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/topicEdits
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function isCommand(action: vscode.CodeAction | vscode.Command): action is vscode.Command`

# Called by

- [quickFixes](../../../../functions/src/editor/visualEditorProvider/EditorSession/quickFixes.md)
- [quickFix](../../../../functions/src/editor/visualEditorProvider/EditorSession/quickFix.md)
- [topicEdits](../../../../functions/src/editor/visualEditorProvider/EditorSession/topicEdits.md)