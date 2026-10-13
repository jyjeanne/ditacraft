---
type: TypeScript Function
title: confirmWorkspaceEdit
resource: src/commands/findReplaceCommand.ts#L178-L190
generated:
  by: okf-rs/0.7.0
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

`async function confirmWorkspaceEdit(message: string, files: string, applyLabel: string): Promise<'apply' | 'review' | undefined>`

# Called by

- [batchUpdateMetadataCommand](../../../../functions/src/commands/batchMetadataCommand/batchUpdateMetadataCommand.md)
- [findReplaceInFilesCommand](../../../../functions/src/commands/findReplaceCommand/findReplaceInFilesCommand.md)