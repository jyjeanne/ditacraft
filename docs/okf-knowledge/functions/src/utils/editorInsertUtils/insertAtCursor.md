---
type: TypeScript Function
title: insertAtCursor
resource: src/utils/editorInsertUtils.ts#L20-L25
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/editorInsertUtils/indentContinuationLines
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/insertImageCommand/insertImageCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/insertTableCommand/insertTableCommand
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function insertAtCursor(editor: vscode.TextEditor, snippet: string): Promise<boolean>`

# Calls

- [indentContinuationLines](../../../../functions/src/utils/editorInsertUtils/indentContinuationLines.md)

# Called by

- [insertImageCommand](../../../../functions/src/commands/insertImageCommand/insertImageCommand.md)
- [insertTableCommand](../../../../functions/src/commands/insertTableCommand/insertTableCommand.md)