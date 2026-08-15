---
type: TypeScript Function
title: buildConfirmableWorkspaceEdit
resource: src/commands/findReplaceCommand.ts#L181-L199
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/src/commands/batchMetadataCommand/batchUpdateMetadataCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/findReplaceCommand/findReplaceInFilesCommand
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function buildConfirmableWorkspaceEdit(lspEdit: LspWorkspaceEdit, label: string): vscode.WorkspaceEdit`

# Called by

- [batchUpdateMetadataCommand](../../../../functions/src/commands/batchMetadataCommand/batchUpdateMetadataCommand.md)
- [findReplaceInFilesCommand](../../../../functions/src/commands/findReplaceCommand/findReplaceInFilesCommand.md)