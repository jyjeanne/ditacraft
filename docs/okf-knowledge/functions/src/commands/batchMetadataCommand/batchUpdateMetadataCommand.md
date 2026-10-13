---
type: TypeScript Function
title: batchUpdateMetadataCommand
resource: src/commands/batchMetadataCommand.ts#L42-L122
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/languageClient/getLanguageClient
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/batchMetadataCommand/resolveSelectedFileItems
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/batchMetadataCommand/promptForAttribute
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/batchMetadataCommand/summarizeSkipped
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/findReplaceCommand/confirmWorkspaceEdit
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/findReplaceCommand/describeFileChanges
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/batchMetadataCommand/describeBatchLabel
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/findReplaceCommand/buildWorkspaceEdit
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/extension/registerCommands
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function batchUpdateMetadataCommand( item?: DitaExplorerItem, allSelected?: DitaExplorerItem[] ): Promise<void>`

# Calls

- [getLanguageClient](../../../../functions/src/languageClient/getLanguageClient.md)
- [resolveSelectedFileItems](../../../../functions/src/commands/batchMetadataCommand/resolveSelectedFileItems.md)
- [promptForAttribute](../../../../functions/src/commands/batchMetadataCommand/promptForAttribute.md)
- [summarizeSkipped](../../../../functions/src/commands/batchMetadataCommand/summarizeSkipped.md)
- [confirmWorkspaceEdit](../../../../functions/src/commands/findReplaceCommand/confirmWorkspaceEdit.md)
- [describeFileChanges](../../../../functions/src/commands/findReplaceCommand/describeFileChanges.md)
- [describeBatchLabel](../../../../functions/src/commands/batchMetadataCommand/describeBatchLabel.md)
- [buildWorkspaceEdit](../../../../functions/src/commands/findReplaceCommand/buildWorkspaceEdit.md)

# Called by

- [registerCommands](../../../../functions/src/extension/registerCommands.md)