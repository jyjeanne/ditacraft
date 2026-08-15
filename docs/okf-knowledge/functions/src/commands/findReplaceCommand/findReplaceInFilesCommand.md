---
type: TypeScript Function
title: findReplaceInFilesCommand
resource: src/commands/findReplaceCommand.ts#L45-L144
generated:
  by: okf-rs/0.4.0
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
  - target: functions/src/commands/findReplaceCommand/describeSearchLabel
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

`async function findReplaceInFilesCommand(): Promise<void>`

# Calls

- [getLanguageClient](../../../../functions/src/languageClient/getLanguageClient.md)
- [parseFindOptions](../../../../functions/src/commands/findReplaceCommand/parseFindOptions.md)
- [validateRegexQuery](../../../../functions/src/commands/findReplaceCommand/validateRegexQuery.md)
- [isDitaContentUri](../../../../functions/src/utils/constants/isDitaContentUri.md)
- [describeSearchLabel](../../../../functions/src/commands/findReplaceCommand/describeSearchLabel.md)
- [buildConfirmableWorkspaceEdit](../../../../functions/src/commands/findReplaceCommand/buildConfirmableWorkspaceEdit.md)
- [info](../../../../functions/src/utils/logger/Logger/info.md)
- [debug](../../../../functions/src/utils/logger/Logger/debug.md)

# Called by

- [registerCommands](../../../../functions/src/extension/registerCommands.md)