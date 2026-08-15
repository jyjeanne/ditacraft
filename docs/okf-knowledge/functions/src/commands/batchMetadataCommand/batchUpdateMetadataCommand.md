---
type: TypeScript Function
title: batchUpdateMetadataCommand
resource: src/commands/batchMetadataCommand.ts#L43-L109
generated:
  by: okf-rs/0.4.0
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
  - target: functions/src/commands/batchMetadataCommand/describeBatchLabel
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/findReplaceCommand/buildConfirmableWorkspaceEdit
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/info
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/debug
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
- [describeBatchLabel](../../../../functions/src/commands/batchMetadataCommand/describeBatchLabel.md)
- [buildConfirmableWorkspaceEdit](../../../../functions/src/commands/findReplaceCommand/buildConfirmableWorkspaceEdit.md)
- [info](../../../../functions/src/utils/logger/Logger/info.md)
- [debug](../../../../functions/src/utils/logger/Logger/debug.md)

# Called by

- [registerCommands](../../../../functions/src/extension/registerCommands.md)