---
type: TypeScript Function
title: storeDitavalPath
resource: src/commands/publishProfilesCommand.ts#L319-L331
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/publishProfilesCommand/followDitavalMoves
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/publishProfilesCommand/promptForDitaval
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function storeDitavalPath( uri: vscode.Uri, workspaceFolders: readonly vscode.WorkspaceFolder[] | undefined ): string`

# Calls

- [startsWith](../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)

# Called by

- [followDitavalMoves](../../../../functions/src/commands/publishProfilesCommand/followDitavalMoves.md)
- [promptForDitaval](../../../../functions/src/commands/publishProfilesCommand/promptForDitaval.md)