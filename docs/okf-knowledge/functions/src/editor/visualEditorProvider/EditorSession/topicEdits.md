---
type: TypeScript Method
title: topicEdits
resource: src/editor/visualEditorProvider.ts#L657-L668
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/editor/visualEditorProvider/isCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/entries
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/visualEditorProvider/EditorSession/quickFix
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private topicEdits(action: vscode.CodeAction | vscode.Command): TextEdit[] | undefined`

# Calls

- [isCommand](../../../../../functions/src/editor/visualEditorProvider/isCommand.md)
- [entries](../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/entries.md)

# Called by

- [quickFix](../../../../../functions/src/editor/visualEditorProvider/EditorSession/quickFix.md)