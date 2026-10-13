---
type: TypeScript Function
title: findReplaceInFilesCommand
resource: src/commands/findReplaceCommand.ts#L56-L170
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/languageClient/getLanguageClient
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/findReplaceCommand/parseFindOptions
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/findReplaceCommand/validateRegexQuery
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/constants/isDitaContentUri
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/findReplaceCommand/confirmWorkspaceEdit
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/findReplaceCommand/describeFileChanges
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/findReplaceCommand/describeSearchLabel
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

`async function findReplaceInFilesCommand(): Promise<void>`

# Calls

- [getLanguageClient](../../../../functions/src/languageClient/getLanguageClient.md)
- [parseFindOptions](../../../../functions/src/commands/findReplaceCommand/parseFindOptions.md)
- [validateRegexQuery](../../../../functions/src/commands/findReplaceCommand/validateRegexQuery.md)
- [isDitaContentUri](../../../../functions/src/utils/constants/isDitaContentUri.md)
- [confirmWorkspaceEdit](../../../../functions/src/commands/findReplaceCommand/confirmWorkspaceEdit.md)
- [describeFileChanges](../../../../functions/src/commands/findReplaceCommand/describeFileChanges.md)
- [describeSearchLabel](../../../../functions/src/commands/findReplaceCommand/describeSearchLabel.md)
- [buildWorkspaceEdit](../../../../functions/src/commands/findReplaceCommand/buildWorkspaceEdit.md)

# Called by

- [registerCommands](../../../../functions/src/extension/registerCommands.md)