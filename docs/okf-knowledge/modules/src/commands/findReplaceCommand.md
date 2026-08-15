---
type: TypeScript Module
title: findReplaceCommand
resource: src/commands/findReplaceCommand.ts#L1-L199
generated:
  by: okf-rs/0.4.0
relationships:
  imports:
  - target: external/vscode
    resolved_by: tree-sitter
    confidence: exact
  - target: external/languageclient
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-logger
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-constants
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/ditacraft
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [LspTextEdit](../../../interfaces/src/commands/findReplaceCommand/LspTextEdit.md)
- [LspWorkspaceEdit](../../../interfaces/src/commands/findReplaceCommand/LspWorkspaceEdit.md)
- [FindReplaceResponse](../../../interfaces/src/commands/findReplaceCommand/FindReplaceResponse.md)
- [findReplaceInFilesCommand](../../../functions/src/commands/findReplaceCommand/findReplaceInFilesCommand.md)
- [parseFindOptions](../../../functions/src/commands/findReplaceCommand/parseFindOptions.md)
- [validateRegexQuery](../../../functions/src/commands/findReplaceCommand/validateRegexQuery.md)
- [describeSearchLabel](../../../functions/src/commands/findReplaceCommand/describeSearchLabel.md)
- [buildConfirmableWorkspaceEdit](../../../functions/src/commands/findReplaceCommand/buildConfirmableWorkspaceEdit.md)

# Imports

- `vscode`
- `../languageClient`
- `../utils/logger`
- `../utils/constants`

# Member of

- [ditacraft](../../../packages/ditacraft.md)