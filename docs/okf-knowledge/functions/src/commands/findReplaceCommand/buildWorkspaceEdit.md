---
type: TypeScript Function
title: buildWorkspaceEdit
resource: src/commands/findReplaceCommand.ts#L242-L260
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/entries
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/batchMetadataCommand/batchUpdateMetadataCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/findReplaceCommand/findReplaceInFilesCommand
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function buildWorkspaceEdit(lspEdit: LspWorkspaceEdit, label: string, needsConfirmation: boolean): vscode.WorkspaceEdit`

# Calls

- [entries](../../../../functions/src/preview/grammarRegistry/GrammarRegistry/entries.md)

# Called by

- [batchUpdateMetadataCommand](../../../../functions/src/commands/batchMetadataCommand/batchUpdateMetadataCommand.md)
- [findReplaceInFilesCommand](../../../../functions/src/commands/findReplaceCommand/findReplaceInFilesCommand.md)