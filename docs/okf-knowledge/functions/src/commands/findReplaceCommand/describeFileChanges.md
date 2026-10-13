---
type: TypeScript Function
title: describeFileChanges
resource: src/commands/findReplaceCommand.ts#L196-L203
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

`function describeFileChanges(lspEdit: LspWorkspaceEdit, singular: string, plural: string, max = 10): string`

# Calls

- [entries](../../../../functions/src/preview/grammarRegistry/GrammarRegistry/entries.md)

# Called by

- [batchUpdateMetadataCommand](../../../../functions/src/commands/batchMetadataCommand/batchUpdateMetadataCommand.md)
- [findReplaceInFilesCommand](../../../../functions/src/commands/findReplaceCommand/findReplaceInFilesCommand.md)