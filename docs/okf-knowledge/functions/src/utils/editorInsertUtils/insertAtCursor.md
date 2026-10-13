---
type: TypeScript Function
title: insertAtCursor
resource: src/utils/editorInsertUtils.ts#L20-L25
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/mcp/src/resources/query/OptionalQueryTemplate/match
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/editorInsertUtils/indentContinuationLines
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editor/test/edit
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/images/ImageCommands/insert
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

- [match](../../../../functions/mcp/src/resources/query/OptionalQueryTemplate/match.md)
- [indentContinuationLines](../../../../functions/src/utils/editorInsertUtils/indentContinuationLines.md)
- [edit](../../../../functions/src/test/shared/editor/test/edit.md)
- [insert](../../../../functions/src/shared/editor/images/ImageCommands/insert.md)

# Called by

- [insertImageCommand](../../../../functions/src/commands/insertImageCommand/insertImageCommand.md)
- [insertTableCommand](../../../../functions/src/commands/insertTableCommand/insertTableCommand.md)